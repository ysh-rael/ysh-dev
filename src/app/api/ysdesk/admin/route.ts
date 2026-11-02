import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/ysdesk/database";
import { getSessionUser } from "@/lib/ysdesk/session";
import { addLicenseTerm } from "@/lib/ysdesk/plans";
import type { LicenseRecord, PaymentRecord, UserRecord } from "@/lib/ysdesk/models";

const createLicenseSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  machineCount: z.number().int().min(1).max(100),
  amountCents: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  if (user.master !== true) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const input = createLicenseSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const database = await getDatabase();
  const targetUser = await database.collection<UserRecord>("users").findOne({ _id: new ObjectId(input.data.userId) });
  if (!targetUser) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const now = new Date();
  const expiresAt = addLicenseTerm(now);
  const purchaseId = new ObjectId();

  // Create a payment record (marked as approved/free for master-created licenses)
  const payment: PaymentRecord = {
    _id: purchaseId,
    externalReference: purchaseId.toHexString(),
    userId: targetUser._id,
    planId: "master",
    machineCount: input.data.machineCount,
    amountCents: input.data.amountCents || 0,
    status: "approved",
    createdAt: now,
    paidAt: now,
    statusDetail: "Criado pelo administrador",
  };
  await database.collection<PaymentRecord>("payments").insertOne(payment);

  // Create the license
  const license: LicenseRecord = {
    _id: new ObjectId(),
    userId: targetUser._id,
    paymentId: purchaseId.toHexString(),
    machineCount: input.data.machineCount,
    amountCents: input.data.amountCents || 0,
    purchasedAt: now,
    expiresAt,
  };
  await database.collection<LicenseRecord>("licenses").insertOne(license);

  return NextResponse.json({
    license: {
      id: license._id.toHexString(),
      userId: license.userId.toHexString(),
      machineCount: license.machineCount,
      amountCents: license.amountCents,
      purchasedAt: license.purchasedAt.toISOString(),
      expiresAt: license.expiresAt.toISOString(),
      active: true,
    },
  }, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  if (user.master !== true) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const database = await getDatabase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [allUsers, licenses, sales, active] = await Promise.all([
    database.collection<UserRecord>("users").find({}, {
      projection: { passwordHash: 0 },
    }).sort({ createdAt: -1 }).toArray(),
    database.collection<LicenseRecord>("licenses").find().sort({ purchasedAt: -1 }).limit(500).toArray(),
    database.collection<PaymentRecord>("payments").aggregate<{
      sales: number;
      revenueCents: number;
      monthRevenueCents: number;
    }>([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          sales: { $sum: 1 },
          revenueCents: { $sum: "$amountCents" },
          monthRevenueCents: {
            $sum: { $cond: [{ $gte: ["$paidAt", monthStart] }, "$amountCents", 0] },
          },
        },
      },
    ]).toArray(),
    database.collection<LicenseRecord>("licenses").aggregate<{
      activeLicenses: number;
      activeMachines: number;
    }>([
      { $match: { expiresAt: { $gt: now } } },
      { $group: { _id: null, activeLicenses: { $sum: 1 }, activeMachines: { $sum: "$machineCount" } } },
    ]).toArray(),
  ]);

  const usersById = new Map(allUsers.map((account) => [account._id.toHexString(), account]));
  const saleTotals = sales[0] || { sales: 0, revenueCents: 0, monthRevenueCents: 0 };
  const licenseTotals = active[0] || { activeLicenses: 0, activeMachines: 0 };

  return NextResponse.json({
    stats: {
      users: allUsers.length,
      activeLicenses: licenseTotals.activeLicenses,
      activeMachines: licenseTotals.activeMachines,
      sales: saleTotals.sales,
      revenueCents: saleTotals.revenueCents,
      monthRevenueCents: saleTotals.monthRevenueCents,
    },
    users: allUsers.map((account) => ({
      id: account._id.toHexString(),
      email: account.email,
      master: account.master === true,
      createdAt: account.createdAt.toISOString(),
    })),
    licenses: licenses.map((license) => ({
      id: license._id.toHexString(),
      email: usersById.get(license.userId.toHexString())?.email || "Conta removida",
      machineCount: license.machineCount,
      amountCents: license.amountCents,
      purchasedAt: license.purchasedAt.toISOString(),
      expiresAt: license.expiresAt.toISOString(),
      active: license.expiresAt > now,
    })),
  });
}