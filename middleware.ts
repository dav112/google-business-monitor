import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const isAuth = !!token;
  const pathname = req.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot") || pathname.startsWith("/reset");
  const isPublicApi = pathname.startsWith("/api/auth") || pathname.startsWith("/api/google/pubsub") || pathname.startsWith("/api/cron") || pathname.startsWith("/api/user");
  const isPublic = isAuthPage || isPublicApi || pathname === "/" || pathname.startsWith("/privacy") || pathname.startsWith("/terms") || pathname.startsWith("/menu");

  let res: NextResponse;
  if (!isAuth && !isPublic) {
    res = NextResponse.redirect(new URL("/login", req.url));
  } else if (isAuth && isAuthPage) {
    res = NextResponse.redirect(new URL("/menu", req.url));
  } else {
    res = NextResponse.next();
  }

  // Security headers (25. SECURITY HEADERS)
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-Frame-Options", "DENY");
  // CSP minimal — allow self + needed for Next.js
  res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"] };
