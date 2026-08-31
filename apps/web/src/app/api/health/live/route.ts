import { NextResponse } from "next/server";

import { getApplicationHealth } from "@/lib/application-health";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getApplicationHealth(), {
    headers: { "Cache-Control": "no-store" },
  });
}
