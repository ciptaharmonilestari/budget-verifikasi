import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dasbor", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets|logo).*)"],
};
