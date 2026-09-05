import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { getApplicationHealth } from "@/lib/application-health";
import { Container, PageHeader, Stack, Status, Surface } from "@/components/ui";

import styles from "./health.module.css";

export const metadata: Metadata = {
  title: `Status da aplicação | ${APP_NAME}`,
  description:
    "Consulte o estado operacional básico desta instância sem expor detalhes internos ou credenciais.",
};

export default function HealthPage() {
  const health = getApplicationHealth();

  return (
    <main className={styles.main}>
      <Container size="narrow">
        <Stack space="lg">
          <PageHeader
            title="Status da aplicação"
            description="Estado operacional básico desta instância, sem expor detalhes internos ou credenciais."
          />

          <Surface padding="lg">
            <Stack space="lg">
              <Status tone="success">Aplicação respondendo</Status>

              <dl className={styles.details}>
                <div>
                  <dt>Serviço</dt>
                  <dd>{health.service}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{health.status.toUpperCase()}</dd>
                </div>
              </dl>

              <p className={styles.note}>
                Este status confirma somente que a aplicação está respondendo. Verificações
                automáticas de dependências usam os endpoints dedicados de liveness e readiness.
              </p>
            </Stack>
          </Surface>
        </Stack>
      </Container>
    </main>
  );
}
