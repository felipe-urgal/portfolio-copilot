import { APP_NAME } from "@portfolio-copilot/shared";

export type ApplicationReadiness = Readonly<{
  service: string;
  status: "ok" | "unavailable";
  dependencies: Readonly<{
    postgres: "ok" | "unavailable";
  }>;
}>;

export async function getApplicationReadiness(
  checkPostgres: () => Promise<void>,
): Promise<ApplicationReadiness> {
  try {
    await checkPostgres();

    return {
      service: APP_NAME,
      status: "ok",
      dependencies: { postgres: "ok" },
    };
  } catch {
    return {
      service: APP_NAME,
      status: "unavailable",
      dependencies: { postgres: "unavailable" },
    };
  }
}
