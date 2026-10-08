import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/ysdesk/database";
import { getSessionUser } from "@/lib/ysdesk/session";
import type { PaymentRecord } from "@/lib/ysdesk/models";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para continuar." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "Pagamento inválido." }, { status: 400 });

  const database = await getDatabase();
  const payment = await database.collection<PaymentRecord>("payments").findOne({ _id: new ObjectId(id), userId: user._id });
  if (!payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });

  return NextResponse.json({
    id: payment._id.toHexString(),
    status: payment.status,
    amountCents: payment.amountCents,
    machineCount: payment.machineCount,
    pixCode: payment.pixCode || null,
    pixQrCodeBase64: payment.pixQrCodeBase64 || null,
    ticketUrl: payment.ticketUrl || null,
  });
}