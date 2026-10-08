import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/ysdesk/database";
import { plans, planIdSchema } from "@/lib/ysdesk/plans";
import { getSessionUser } from "@/lib/ysdesk/session";
import type { PaymentRecord } from "@/lib/ysdesk/models";

const schema = z.object({ planId: planIdSchema });

interface MercadoPagoPixResponse {
  id: number;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para comprar uma licença." }, { status: 401 });

  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Selecione um plano válido." }, { status: 400 });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "O pagamento PIX ainda não está configurado." }, { status: 503 });
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "A confirmação segura do PIX ainda não está configurada." }, { status: 503 });
  }
  if (process.env.NODE_ENV === "production" && !process.env.YS_DESK_APP_URL) {
    return NextResponse.json({ error: "A URL pública do YSdesk ainda não está configurada." }, { status: 503 });
  }

  const plan = plans[input.data.planId];
  const database = await getDatabase();
  const purchaseId = new ObjectId();
  const purchase: PaymentRecord = {
    _id: purchaseId,
    externalReference: purchaseId.toHexString(),
    userId: user._id,
    planId: plan.id,
    machineCount: plan.machines,
    amountCents: plan.amountCents,
    status: "creating",
    createdAt: new Date(),
  };
  await database.collection<PaymentRecord>("payments").insertOne(purchase);

  const appUrl = (process.env.YS_DESK_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  try {
    const mercadoPagoResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": purchaseId.toHexString(),
      },
      body: JSON.stringify({
        transaction_amount: plan.amountCents / 100,
        description: `YSdesk ${plan.name} - licença de ${plan.machines} máquinas por 3 meses`,
        payment_method_id: "pix",
        external_reference: purchase.externalReference,
        notification_url: `${appUrl}/api/ysdesk/webhook`,
        date_of_expiration: expiration,
        payer: { email: user.email },
      }),
      cache: "no-store",
    });

    const result = await mercadoPagoResponse.json() as MercadoPagoPixResponse & { message?: string };
    if (!mercadoPagoResponse.ok || !result.id) {
      await database.collection<PaymentRecord>("payments").updateOne(
        { _id: purchaseId },
        { $set: { status: "error", statusDetail: "Mercado Pago não criou a cobrança." } },
      );
      return NextResponse.json({ error: "Não foi possível criar a cobrança PIX. Tente novamente." }, { status: 502 });
    }

    const transaction = result.point_of_interaction?.transaction_data;
    await database.collection<PaymentRecord>("payments").updateOne(
      { _id: purchaseId },
      {
        $set: {
          status: result.status || "pending",
          mercadoPagoId: String(result.id),
          ...(transaction?.qr_code ? { pixCode: transaction.qr_code } : {}),
          ...(transaction?.qr_code_base64 ? { pixQrCodeBase64: transaction.qr_code_base64 } : {}),
          ...(transaction?.ticket_url ? { ticketUrl: transaction.ticket_url } : {}),
        },
      },
    );

    return NextResponse.json({
      id: purchaseId.toHexString(),
      planName: plan.name,
      machineCount: plan.machines,
      amountCents: plan.amountCents,
      status: result.status || "pending",
      pixCode: transaction?.qr_code || null,
      pixQrCodeBase64: transaction?.qr_code_base64 || null,
      ticketUrl: transaction?.ticket_url || null,
    }, { status: 201 });
  } catch {
    await database.collection<PaymentRecord>("payments").updateOne(
      { _id: purchaseId },
      { $set: { status: "error", statusDetail: "Falha de comunicação com Mercado Pago." } },
    );
    return NextResponse.json({ error: "Não foi possível conectar ao Mercado Pago." }, { status: 502 });
  }
}