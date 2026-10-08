import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/ysdesk/database";
import { toPublicUser, type UserRecord } from "@/lib/ysdesk/models";
import { assertSessionConfigured, createSession } from "@/lib/ysdesk/session";

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(72) });

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });

  assertSessionConfigured();
  const database = await getDatabase();
  const user = await database.collection<UserRecord>("users").findOne({
    email: input.data.email.trim().toLowerCase(),
  });

  if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  await createSession(user._id);
  return NextResponse.json({ user: toPublicUser(user) });
}