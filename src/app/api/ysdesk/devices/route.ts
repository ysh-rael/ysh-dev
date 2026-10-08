import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/ysdesk/database";
import { type DeviceRecord, type LicenseRecord, type UserRecord } from "@/lib/ysdesk/models";
import { getSessionUser } from "@/lib/ysdesk/session";

const nameSchema = z.object({ name: z.string().trim().min(2).max(48) });

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para continuar." }, { status: 401 });

  const input = nameSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "O nome deve ter entre 2 e 48 caracteres." }, { status: 400 });

  const database = await getDatabase();
  const session = database.client.startSession();
  const device: DeviceRecord = {
    _id: new ObjectId(),
    userId: user._id,
    name: input.data.name,
    activationCode: randomBytes(6).toString("hex").toUpperCase(),
    status: "active",
    createdAt: new Date(),
  };

  try {
    await session.withTransaction(async () => {
      await database.collection<UserRecord>("users").updateOne(
        { _id: user._id },
        { $inc: { deviceRevision: 1 } },
        { session },
      );

      const now = new Date();
      const licenses = await database.collection<LicenseRecord>("licenses")
        .find({ userId: user._id, expiresAt: { $gt: now } }, { session })
        .toArray();
      const seats = licenses.reduce((total, license) => total + license.machineCount, 0);
      const used = await database.collection<DeviceRecord>("devices")
        .countDocuments({ userId: user._id, status: "active" }, { session });

      if (used >= seats) throw new Error("NO_AVAILABLE_SEATS");
      await database.collection<DeviceRecord>("devices").insertOne(device, { session });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_AVAILABLE_SEATS") {
      return NextResponse.json({ error: "Não há máquinas disponíveis. Escolha um plano para adicionar licenças." }, { status: 409 });
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return NextResponse.json({
    device: { id: device._id.toHexString(), name: device.name, activationCode: device.activationCode, createdAt: device.createdAt.toISOString() },
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para continuar." }, { status: 401 });

  const input = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Dispositivo inválido." }, { status: 400 });

  const database = await getDatabase();
  const result = await database.collection<DeviceRecord>("devices").updateOne(
    { _id: new ObjectId(input.data.id), userId: user._id, status: "active" },
    { $set: { status: "removed", removedAt: new Date() } },
  );

  if (!result.modifiedCount) return NextResponse.json({ error: "Dispositivo não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}