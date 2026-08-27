import Link from "next/link";

import { FinancialProfileSessionSummary } from "@/components/financial-profile-session-summary";
import { ProductShell } from "@/components/product-shell";
import type { AuthenticatedIdentity } from "@/lib/identity";

import styles from "./dashboard-overview.module.css";

const SUMMARY_STATES = [
  {
    label: "Patrimônio total",
    state: "Dado indisponível",
    detail:
      "O dashboard ainda não recebe carteira compartilhada nem preços para calcular este resumo.",
  },
  {
    label: "Aporte do mês",
    state: "Ainda não calculado",
    detail:
      "O cálculo depende de carteira, baseline de aporte e demais fatos que ainda vivem na tela de carteira.",
  },
] as const;

const CONTEXT_RULES = [
  {
    label: "Perfil financeiro",
    state: "Snapshot validado no onboarding",
  },
  {
    label: "Objetivos",
    state: "Metas declaradas, sem progresso calculado",
  },
  {
    label: "Reserva",
    state: "Meta desejada, sem saldo atual inferido",
  },
] as const;

type DashboardOverviewProps = Readonly<{
  identity?: AuthenticatedIdentity;
}>;

export function DashboardOverview({ identity }: DashboardOverviewProps = {}) {
  return (
    <ProductShell activeRoute="/dashboard" identity={identity}>
      <FinancialProfileSessionSummary />

      <header className={styles.pageHeader}>
        <div>
          <h1>Dashboard</h1>
          <p>
            Uma visão geral que mostra apenas o que o produto realmente sabe hoje e deixa claro o
            que ainda não pode calcular.
          </p>
        </div>
        <span className={styles.dataMode}>Sessão local</span>
      </header>

      <section className={styles.overviewSurface} aria-labelledby="overview-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="overview-title">Visão geral</h2>
            <p>Contexto declarado não é confundido com patrimônio, saldo ou progresso.</p>
          </div>
          <span className={styles.sectionStatus}>Sem métricas patrimoniais calculáveis</span>
        </div>

        <dl className={styles.summaryGrid}>
          {SUMMARY_STATES.map((item) => (
            <div className={styles.summaryItem} key={item.label}>
              <dt>{item.label}</dt>
              <dd>
                <strong>{item.state}</strong>
                <span>{item.detail}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className={styles.detailGrid}>
          <section className={styles.detailRegion} aria-labelledby="portfolio-title">
            <div className={styles.detailHeading}>
              <div>
                <h2 id="portfolio-title">Carteira</h2>
                <p>Cadastro local disponível; posições continuam dependentes de transações.</p>
              </div>
              <span>Cadastro disponível</span>
            </div>

            <div className={styles.emptyState}>
              <span className={styles.emptyMark} aria-hidden="true" />
              <div>
                <strong>Carteira não disponível no dashboard</strong>
                <p>
                  Portfolio, ativos e ledger ainda vivem somente na tela de carteira e não são
                  compartilhados com esta visão geral.
                </p>
              </div>
            </div>

            <Link className={styles.secondaryAction} href="/portfolio">
              Abrir carteira
            </Link>
          </section>

          <section className={styles.detailRegion} aria-labelledby="context-rules-title">
            <div className={styles.detailHeading}>
              <div>
                <h2 id="context-rules-title">Como o contexto é usado</h2>
                <p>O snapshot compartilhado continua sendo contexto declarado, não resultado.</p>
              </div>
            </div>

            <dl className={styles.configurationList}>
              {CONTEXT_RULES.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.state}</dd>
                </div>
              ))}
            </dl>

            <Link className={styles.secondaryAction} href="/onboarding">
              Abrir onboarding
            </Link>
          </section>
        </div>
      </section>

      <section className={styles.nextSteps} aria-labelledby="next-steps-title">
        <div className={styles.nextStepsHeading}>
          <h2 id="next-steps-title">Próximos passos</h2>
          <p>A sequência preserva as dependências reais da jornada do MVP.</p>
        </div>

        <ol className={styles.stepsList}>
          <li>
            <span className={styles.stepNumber}>1</span>
            <div>
              <strong>Defina seu contexto financeiro</strong>
              <p>
                Perfil, reserva e objetivos validados passam a acompanhar a navegação desta sessão.
              </p>
              <Link href="/onboarding">Ir para o onboarding</Link>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>2</span>
            <div>
              <strong>Cadastre sua carteira</strong>
              <p>Crie localmente a identidade, o nome e a moeda de referência do Portfolio.</p>
              <Link href="/portfolio">Ir para a carteira</Link>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>3</span>
            <div>
              <strong>Registre transações</strong>
              <p>
                Posições só aparecem quando o Transaction Ledger possui fatos suficientes para
                projetá-las.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </ProductShell>
  );
}
