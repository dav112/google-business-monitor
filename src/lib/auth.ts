import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me-32-chars-long!!!");
const COOKIE_NAME = "token";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signToken(payload: { userId: string; email: string; role?: string }) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { userId: string; email: string; role?: string; iat?: number };
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
export function isAdminEmail(email: string){ return ADMIN_EMAILS.includes(email.toLowerCase()); }
export function isAdminUser(user: { role?: string; email: string } | null | undefined){
  if(!user) return false;
  if((user as any).role === "ADMIN") return true;
  return isAdminEmail(user.email);
}
export async function requireAdmin(){
  const u = await getCurrentUser();
  if(!u) return { error: "Unauthorized", status: 401 as const, user: null };
  if(!isAdminUser(u)) return { error: "Forbidden — admin only", status: 403 as const, user: u };
  return { error: null, status: 200 as const, user: u };
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;
    if (user.status === "suspended") return null; // ponytail: suspend = block login
    // Session invalidation: if token issued before invalidBefore, reject
    if (user.sessionInvalidBefore && payload.iat) {
      const iatMs = payload.iat * 1000;
      if (iatMs < user.sessionInvalidBefore.getTime()) return null;
    }
    // touch lastActiveAt — ponytail: fire-and-forget, throttle 60s via updatedAt
    if (!user.lastActiveAt || Date.now() - new Date(user.lastActiveAt).getTime() > 60_000) {
      void prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } }).catch(()=>{});
    }
    return user;
  } catch {
    return null;
  }
}

export async function invalidateAllSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { sessionInvalidBefore: new Date() } });
}
