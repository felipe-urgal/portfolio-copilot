import { NextResponse } from "next/server";

import { getApplicationReadiness } from "@/lib/application-readiness";
import { checkPostgresReadiness } from "@/lib/persistence-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getApplicationReadiness(checkPostgresReadiness);

  return NextResponse.json(readiness, {
    status: readiness.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
