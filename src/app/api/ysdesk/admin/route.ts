import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/ysdesk/database";
import { getSessionUser } from "@/lib/ysdesk/session";
import type { LicenseRecord, PaymentRecord, UserRecord } from "@/lib/ysdesk/models";

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