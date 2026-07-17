import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, isAccessTokenValid } from "@/lib/access";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/access" ||
    pathname.startsWith("/access/") ||
    pathname === "/api/access"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (isAccessTokenValid(token)) {
    return NextResponse.next();
  }

  const accessUrl = new URL("/access", request.url);
  const returnPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  accessUrl.searchParams.set("next", returnPath);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
