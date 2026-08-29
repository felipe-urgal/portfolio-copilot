import { NextResponse } from "next/server";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import {
  canonicalFinancialProfileSnapshot,
  planFinancialProfileMigration,
} from "@/lib/financial-profile-account-migration";
import { getOwnedPersistence } from "@/lib/persistence-server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidRequest() {
  return NextResponse.json(
    { code: "invalid_financial_profile", error: "Perfil financeiro inválido." },
    { status: 400 },
  );
}

function conflict(accountProfile: FinancialProfileSnapshot | null) {
  return NextResponse.json(
    {
      code: "financial_profile_conflict",
      error: "O perfil local é diferente do perfil salvo na conta.",
      accountProfile,
    },
    { status: 409 },
  );
}

function unavailable() {
  return NextResponse.json(
    { code: "persistence_unavailable", error: "Persistência da conta indisponível." },
    { status: 503 },
  );
}

export async function GET() {
  try {
    const persistence = await getOwnedPersistence();
    if (persistence === null) {
      return NextResponse.json(
        { code: "unauthenticated", error: "Sessão autenticada necessária." },
        { status: 401 },
      );
    }

    return NextResponse.json({ profile: await persistence.getFinancialProfile() });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return invalidRequest();
  }

  if (!isRecord(payload) || !("snapshot" in payload)) return invalidRequest();
  if ("replace" in payload && typeof payload.replace !== "boolean") return invalidRequest();

  let localProfile: FinancialProfileSnapshot;
  let expectedAccountProfile: FinancialProfileSnapshot | null = null;

  try {
    localProfile = canonicalFinancialProfileSnapshot(payload.snapshot as FinancialProfileSnapshot);

    if (payload.replace === true) {
      if (!("accountProfile" in payload) || payload.accountProfile === null) {
        return invalidRequest();
      }
      expectedAccountProfile = canonicalFinancialProfileSnapshot(
        payload.accountProfile as FinancialProfileSnapshot,
      );
    }
  } catch {
    return invalidRequest();
  }

  try {
    const persistence = await getOwnedPersistence();
    if (persistence === null) {
      return NextResponse.json(
        { code: "unauthenticated", error: "Sessão autenticada necessária." },
        { status: 401 },
      );
    }

    const accountProfile = await persistence.getFinancialProfile();
    const plan = planFinancialProfileMigration(
      localProfile,
      accountProfile,
      payload.replace === true,
    );

    if (plan.outcome === "conflict") return conflict(accountProfile);

    if (plan.outcome === "unchanged") {
      return NextResponse.json({ outcome: "unchanged", profile: accountProfile });
    }

    if (plan.outcome === "create") {
      const created = await persistence.createFinancialProfileIfAbsent(
        plan.snapshot,
        "LOCAL_MIGRATION",
      );
      if (created !== null) return NextResponse.json({ outcome: "create", profile: created });

      const latestAccountProfile = await persistence.getFinancialProfile();
      const latestPlan = planFinancialProfileMigration(localProfile, latestAccountProfile);
      if (latestPlan.outcome === "unchanged") {
        return NextResponse.json({ outcome: "unchanged", profile: latestAccountProfile });
      }

      return conflict(latestAccountProfile);
    }

    if (expectedAccountProfile === null) return invalidRequest();

    const replaced = await persistence.replaceFinancialProfileIfMatches(
      expectedAccountProfile,
      plan.snapshot,
      "LOCAL_MIGRATION",
    );
    if (replaced !== null) return NextResponse.json({ outcome: "replace", profile: replaced });

    return conflict(await persistence.getFinancialProfile());
  } catch {
    return unavailable();
  }
}
