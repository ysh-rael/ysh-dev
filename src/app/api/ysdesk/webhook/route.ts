import { createHmac, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/ysdesk/database";
import type { LicenseRecord, PaymentRecord } from "@/lib/ysdesk/models";
import { addLicenseTerm } from "@/lib/ysdesk/plans";

interface MercadoPagoNotification {
  type?: string;
  action?: string;
  data?: { id?: string | number };
}

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  date_approved?: string;
}

function hasValidSignature(request: Request, paymentId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!secret || !signature || !requestId) return false;

  const values = Object.fromEntries(signature.split(",").map((part) => {
    const [key, value] = part.trim().split("=");
    return [key, value];
  }));
  if (!values.ts || !values.v1) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${values.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(values.v1);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as MercadoPagoNotification | null;
  const query = new URL(request.url).searchParams;
  const paymentId = String(body?.data?.id || query.get("data.id") || "");
  if (!paymentId || !hasValidSignature(request, paymentId)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (body?.type && body.type !== "payment" && !body.action?.startsWith("payment.")) {
    return NextResponse.json({ received: true });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Integração não configurada." }, { status: 503 });

  const mercadoPagoResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!mercadoPagoResponse.ok) return NextResponse.json({ error: "Não foi possível verificar o pagamento." }, { status: 502 });

  const mercadoPagoPayment = await mercadoPagoResponse.json() as MercadoPagoPayment;
  if (String(mercadoPagoPayment.id) !== paymentId) {
    return NextResponse.json({ error: "Pagamento divergente." }, { status: 409 });
  }
  if (!mercadoPagoPayment.external_reference || !ObjectId.isValid(mercadoPagoPayment.external_reference)) {
    return NextResponse.json({ received: true });
  }

  const purchaseId = new ObjectId(mercadoPagoPayment.external_reference);
  const database = await getDatabase();
  const payments = database.collection<PaymentRecord>("payments");
  const purchase = await payments.findOne({ _id: purchaseId });
  if (!purchase) return NextResponse.json({ received: true });

  if (mercadoPagoPayment.status !== "approved") {
    await payments.updateOne({ _id: purchaseId }, {
      $set: { status: mercadoPagoPayment.status, statusDetail: mercadoPagoPayment.status_detail || "" },
    });
    return NextResponse.json({ received: true });
  }

  const paidAmount = Math.round((mercadoPagoPayment.transaction_amount || 0) * 100);
  if (paidAmount !== purchase.amountCents || mercadoPagoPayment.currency_id !== "BRL") {
    await payments.updateOne({ _id: purchaseId }, {
      $set: { status: "needs_review", statusDetail: "Valor ou moeda divergente." },
    });
    return NextResponse.json({ error: "Valor divergente." }, { status: 409 });
  }

  const paidAt = mercadoPagoPayment.date_approved ? new Date(mercadoPagoPayment.date_approved) : new Date();
  await payments.updateOne({ _id: purchaseId }, {
    $set: { status: "approved", statusDetail: mercadoPagoPayment.status_detail || "accredited", mercadoPagoId: paymentId, paidAt },
  });

  const expiresAt = addLicenseTerm(paidAt);
  await database.collection<LicenseRecord>("licenses").updateOne(
    { paymentId: purchaseId.toHexString() },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        userId: purchase.userId,
        paymentId: purchaseId.toHexString(),
        machineCount: purchase.machineCount,
        amountCents: purchase.amountCents,
        purchasedAt: paidAt,
        expiresAt,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ received: true });
}