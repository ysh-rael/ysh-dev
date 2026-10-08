import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/ysdesk/database";
import { toPublicUser, type UserRecord } from "@/lib/ysdesk/models";
import { assertSessionConfigured, createSession } from "@/lib/ysdesk/session";

const schema = z.object({ email: z.email().max(254), password: z.string().min(8).max(72) });

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "Informe um e-mail válido e uma senha de 8 a 72 caracteres." }, { status: 400 });
  }
  if (Buffer.byteLength(input.data.password, "utf8") > 72) {
    return NextResponse.json({ error: "A senha deve ter no máximo 72 bytes." }, { status: 400 });
  }

  assertSessionConfigured();
  const database = await getDatabase();
  const user: UserRecord = {
    _id: new ObjectId(),
    email: input.data.email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(input.data.password, 12),
    master: false,
    createdAt: new Date(),
    deviceRevision: 0,
  };

  try {
    await database.collection<UserRecord>("users").insertOne(user);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "Este e-mail já possui uma conta." }, { status: 409 });
    }
    throw error;
  }

  await createSession(user._id);
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}