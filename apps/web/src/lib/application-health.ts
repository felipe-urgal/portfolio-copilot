import { APP_NAME } from "@portfolio-copilot/shared";

export type ApplicationHealth = Readonly<{
  service: string;
  status: "ok";
}>;

export function getApplicationHealth(): ApplicationHealth {
  return {
    service: APP_NAME,
    status: "ok",
  };
}
