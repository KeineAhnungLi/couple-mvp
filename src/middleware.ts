import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TRAVEL_HOST = "travel.shanjideutsch.site";
const LEGACY_HOST = "liebe.shanjideutsch.site";

const hostnameOf = (request: NextRequest) =>
  (request.headers.get("host") || "").split(":")[0].toLowerCase();

export function middleware(request: NextRequest) {
  const hostname = hostnameOf(request);
  const pathname = request.nextUrl.pathname;

  // Keep the footprint journal canonical on its dedicated domain.
  if (hostname === LEGACY_HOST && pathname.startsWith("/footprints")) {
    const target = new URL(`${pathname}${request.nextUrl.search}`, `https://${TRAVEL_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  if (hostname !== TRAVEL_HOST) {
    return NextResponse.next();
  }

  // Opening the dedicated domain should land directly in the journal.
  if (pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = "/footprints";
    return NextResponse.redirect(target);
  }

  // A direct visit to /login on the travel domain should return to the journal.
  if (pathname === "/login" && !request.nextUrl.searchParams.has("next")) {
    const target = request.nextUrl.clone();
    target.searchParams.set("next", "/footprints");
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/footprints/:path*"],
};
