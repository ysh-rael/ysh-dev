import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/ysdesk/database";
import { type DeviceRecord, type LicenseRecord } from "@/lib/ysdesk/models";
import { getSessionUser, toPublicUser } from "@/lib/ysdesk/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const database = await getDatabase();
  const now = new Date();
  const [devices, licenses] = await Promise.all([
    database.collection<DeviceRecord>("devices").find({ userId: user._id, status: "active" }).sort({ createdAt: -1 }).toArray(),
    database.collection<LicenseRecord>("licenses").find({ userId: user._id, expiresAt: { $gt: now } }).sort({ expiresAt: 1 }).toArray(),
  ]);

  const totalSeats = licenses.reduce((total, license) => total + license.machineCount, 0);
  return NextResponse.json({
    user: toPublicUser(user),
    devices: devices.map((device) => ({
      id: device._id.toHexString(),
      name: device.name,
      activationCode: device.activationCode,
      createdAt: device.createdAt.toISOString(),
    })),
    licenses: licenses.map((license) => ({
      id: license._id.toHexString(),
      machineCount: license.machineCount,
      amountCents: license.amountCents,
      purchasedAt: license.purchasedAt.toISOString(),
      expiresAt: license.expiresAt.toISOString(),
    })),
    seats: { total: totalSeats, used: devices.length, available: Math.max(0, totalSeats - devices.length) },
  });
}