import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/ysdesk/database";
import { getSessionUser } from "@/lib/ysdesk/session";
import type { LicenseRecord } from "@/lib/ysdesk/models";
import { ObjectId } from "mongodb";

const validateSchema = z.object({
  licenseCode: z.string().min(1),
});

export async function POST(request: Request) {
  const input = validateSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Código de licença inválido." }, { status: 400 });

  const database = await getDatabase();
  const now = new Date();

  // Try to find license by ID (ObjectId) or by activation code
  let license: LicenseRecord | null = null;

  // First try as ObjectId
  if (ObjectId.isValid(input.data.licenseCode)) {
    license = await database.collection<LicenseRecord>("licenses").findOne({ _id: new ObjectId(input.data.licenseCode) });
  }

  // If not found, try as activation code on devices
  if (!license) {
    // Search for a device with this activation code that has an associated license
    const device = await database.collection("devices").findOne({
      activationCode: input.data.licenseCode,
      status: "active",
      activationExpiresAt: { $gt: now }
    });

    if (device && device.userId) {
      // Find the user's active license
      license = await database.collection<LicenseRecord>("licenses").findOne({
        userId: device.userId,
        expiresAt: { $gt: now }
      });
    }
  }

  if (!license) {
    return NextResponse.json({
      valid: false,
      error: "Licença não encontrada ou expirada."
    }, { status: 404 });
  }

  // Check if license is still valid (not expired)
  if (license.expiresAt <= now) {
    return NextResponse.json({
      valid: false,
      error: "Licença expirada."
    }, { status: 400 });
  }

  // Get user info
  const user = await database.collection("users").findOne({ _id: license.userId });

  return NextResponse.json({
    valid: true,
    license: {
      id: license._id.toHexString(),
      machineCount: license.machineCount,
      amountCents: license.amountCents,
      purchasedAt: license.purchasedAt.toISOString(),
      expiresAt: license.expiresAt.toISOString(),
      userEmail: user?.email,
      active: true,
    },
  });
}