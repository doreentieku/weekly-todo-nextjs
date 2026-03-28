import { NextResponse } from "next/server";

export function middleware(request) {
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};