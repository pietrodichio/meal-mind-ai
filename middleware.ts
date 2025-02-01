import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  const isHomePage = request.nextUrl.pathname === "/";

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && (isAuthPage || isHomePage)) {
    return NextResponse.redirect(new URL("/plans", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon).*)"],
};
