import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isProtectedProductPath } from "@/lib/identity";

export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const hasAuthenticatedIdentity =
    typeof request.auth?.user?.id === "string" && request.auth.user.id.trim().length > 0;

  if (!hasAuthenticatedIdentity && isProtectedProductPath(pathname)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/portfolio/:path*", "/onboarding/:path*"],
};
