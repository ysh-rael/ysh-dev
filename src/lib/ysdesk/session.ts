import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { ObjectId } from "mongodb";
import { getDatabase } from "./database";
import { toPublicUser, type UserRecord } from "./models";

const cookieName = "ysdesk_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.YS_DESK_AUTH_SECRET;
  if (!secret || secret.length < 32 || /^(replace-with|change-me|your-secret)/i.test(secret.trim())) {
    throw new Error("YS_DESK_AUTH_SECRET deve ter pelo menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export function assertSessionConfigured() {
  getSecret();
}

export async function createSession(userId: ObjectId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId.toHexString())
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDurationSeconds,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSessionUser(): Promise<UserRecord | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || !ObjectId.isValid(payload.sub)) return null;

    const database = await getDatabase();
    return database.collection<UserRecord>("users").findOne({ _id: new ObjectId(payload.sub) });
  } catch {
    return null;
  }
}

export { toPublicUser };