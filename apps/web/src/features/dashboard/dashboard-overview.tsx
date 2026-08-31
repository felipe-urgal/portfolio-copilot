"use client";

import {
  Money,
  type FinancialHorizonCode,
  type MoneySnapshot,
  type RiskToleranceCode,
} from "@portfolio-copilot/domain";

import { FinancialProfileAccountMigration } from "@/components/financial-profile-account-migration";
import { useFinancialSession } from "@/components/financial-session";
import {
  Disclosure,
  EmptyState,
  Grid,
  LinkButton,
  Metric,
  PageHeader,
  Status,
  Surface,
} from "@/components/ui";

import styles from "./dashboard-overview.module.css";

const RISK_LABELS: Record<RiskToleranceCode, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

const HORIZON_LABELS: Record<FinancialHorizonCode, string> = {
  SHORT: "Curto prazo",
  MEDIUM: "Médio prazo",
  LONG: "Longo prazo",
};

type DashboardOverviewProps = Readonly<{
  displayName: string;
}>;

function formatMoney(snapshot: MoneySnapshot): string {
  const [whole = "0", fraction = "00"] = Money.fromSnapshot(snapshot).toDecimalString().split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ".");
  return `${snapshot.currency} ${groupedWhole},${fraction}`;
}

function persistenceLabel(status: "memory-only" | "persisted" | "unavailable"): string {
  if (status === "persisted") return "Salvo neste dispositivo";
  if (status === "unavailable") return "Armazenamento local indisponível";
  return "Somente nesta sessão";
}

export function DashboardOverview({ displayName }: DashboardOverviewProps) {
  const { financialProfile, persistenceStatus } = useFinancialSession();
  const hasProfile = financialProfile !== null;

  const nextActionTitle = hasProfile
    ? "Estruture os fatos da carteira"
    : "Complete seu perfil financeiro";
  const nextActionDescription = hasProfile
    ? "Abra a Carteira para cadastrar a estrutura e registrar transações. O Dashboard só mostrará patrimônio, composição ou posições quando esses fatos puderem ser compartilhados de forma confiável."
    : "Risco, horizonte, moeda, reserva e objetivos precisam vir de um snapshot validado antes de contextualizar o restante da experiência.";

  return (
    <div className={styles.dashboard}>
      <PageHeader
        title={`Olá, ${displayName}`}
        description={
          hasProfile
            ? "Seu contexto financeiro está disponível. Agora o foco é construir uma base factual de carteira antes de qualquer análise patrimonial."
            : "Comece pelo contexto financeiro. O Dashboard não preenche lacunas com patrimônio, retorno ou recomendações fictícias."
        }
        actions={
          <Status tone={hasProfile ? "success" : "warning"}>
            {hasProfile ? "Perfil configurado" : "Perfil pendente"}
          </Status>
        }
      />

      {financialProfile === null ? null : (
        <section className={styles.metricsSection} aria-labelledby="dashboard-metrics-title">
          <div className={styles.sectionIntro}>
            <div>
              <span className={styles.eyebrow}>Contexto validado</span>
              <h2 id="dashboard-metrics-title">O que já é possível afirmar</h2>
            </div>
            <Status tone="neutral">{persistenceLabel(persistenceStatus)}</Status>
          </div>

          <Grid minimum="sm" space="sm" className={styles.metricsGrid}>
            <Metric
              label="Objetivos declarados"
              value={financialProfile.goals.length.toString()}
              detail="Quantidade registrada no perfil financeiro."
            />
            {financialProfile.emergencyReserveTarget === null ? null : (
              <Metric
                label="Meta de reserva"
                value={formatMoney(financialProfile.emergencyReserveTarget)}
                detail="Meta declarada; não representa saldo atual."
                valueSize="sm"
              />
            )}
          </Grid>
        </section>
      )}

      <div className={styles.workspaceGrid}>
        <div className={styles.primaryColumn}>
          <Surface
            tone="elevated"
            padding="lg"
            className={styles.portfolioSurface}
            aria-labelledby="portfolio-panorama-title"
          >
            <div className={styles.surfaceHeading}>
              <div>
                <span className={styles.eyebrow}>Panorama</span>
                <h2 id="portfolio-panorama-title">Carteira</h2>
                <p>
                  A região principal fica reservada para patrimônio, composição, posições e gaps
                  somente quando houver fatos compartilhados suficientes.
                </p>
              </div>
              <Status tone="info">Aguardando base compartilhada</Status>
            </div>

            <EmptyState
              className={styles.portfolioEmptyState}
              title="Construa a base factual da sua carteira"
              description="Cadastre a carteira e registre transações na superfície de Carteira. Enquanto esse estado permanecer local àquela tela, o Dashboard não infere patrimônio, composição, retorno ou alocação."
              action={<LinkButton href="/portfolio">Abrir carteira</LinkButton>}
            />
          </Surface>

          <Surface padding="lg" aria-labelledby="attention-title">
            <div className={styles.surfaceHeading}>
              <div>
                <span className={styles.eyebrow}>Atenção agora</span>
                <h2 id="attention-title">{nextActionTitle}</h2>
                <p>{nextActionDescription}</p>
              </div>
            </div>

            <div className={styles.actionRow}>
              <LinkButton href={hasProfile ? "/portfolio" : "/onboarding"}>
                {hasProfile ? "Ir para a carteira" : "Configurar perfil"}
              </LinkButton>
              {hasProfile ? (
                <LinkButton href="/onboarding" variant="secondary">
                  Revisar perfil
                </LinkButton>
              ) : null}
            </div>
          </Surface>
        </div>

        <aside className={styles.contextRail} aria-label="Contexto financeiro">
          <Surface padding="lg" className={styles.contextSurface}>
            <div className={styles.surfaceHeading}>
              <div>
                <span className={styles.eyebrow}>Seu contexto</span>
                <h2>Perfil financeiro</h2>
                <p>
                  Fatos declarados ajudam a orientar a experiência sem virar resultado financeiro.
                </p>
              </div>
            </div>

            {financialProfile === null ? (
              <EmptyState
                className={styles.contextEmptyState}
                title="Contexto ainda não configurado"
                description="Conclua o onboarding para compartilhar um snapshot validado com Dashboard e Carteira."
                action={
                  <LinkButton href="/onboarding" variant="secondary">
                    Abrir onboarding
                  </LinkButton>
                }
              />
            ) : (
              <dl className={styles.contextList}>
                <div>
                  <dt>Moeda de referência</dt>
                  <dd>{financialProfile.referenceCurrency}</dd>
                </div>
                <div>
                  <dt>Tolerância a risco</dt>
                  <dd>{RISK_LABELS[financialProfile.riskTolerance]}</dd>
                </div>
                <div>
                  <dt>Horizonte</dt>
                  <dd>{HORIZON_LABELS[financialProfile.horizon]}</dd>
                </div>
                <div>
                  <dt>Objetivos</dt>
                  <dd>{financialProfile.goals.length}</dd>
                </div>
                <div>
                  <dt>Persistência</dt>
                  <dd>{persistenceLabel(persistenceStatus)}</dd>
                </div>
              </dl>
            )}
          </Surface>
        </aside>
      </div>

      <FinancialProfileAccountMigration />

      <Disclosure className={styles.disclosure} summary="O que ainda não aparece neste Dashboard">
        <div className={styles.disclosureBody}>
          <p>
            Patrimônio, retorno, composição, posições, target versus atual, gaps, Market Data e
            recomendações ficam ausentes enquanto não existir uma fonte real e determinística
            disponível para esta superfície.
          </p>
          <p>
            O estado atual da Carteira ainda vive somente na própria tela. IDs, provenance e reason
            codes continuam em segunda ordem e não são usados para preencher a hierarquia principal.
          </p>
        </div>
      </Disclosure>
    </div>
  );
}
