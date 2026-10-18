import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  // Only apply to /api/* but skip /api/auth/* because NextAuth handles that
  if (req.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const requestHeaders = new Headers(req.headers);
  if (token?.accessToken) {
    const rawCookies = requestHeaders.get('cookie') || '';
    const otherCookies = rawCookies
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c && !c.startsWith('access_token='))
      .join('; ');

    const cookieHeader = otherCookies
      ? `access_token=${token.accessToken}; ${otherCookies}`
      : `access_token=${token.accessToken}`;

    requestHeaders.set('cookie', cookieHeader);
    requestHeaders.set('authorization', `Bearer ${token.accessToken}`);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
