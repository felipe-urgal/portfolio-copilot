import Link from "next/link";

import { ProductShell } from "@/components/product-shell";

import styles from "./dashboard-overview.module.css";

const SUMMARY_STATES = [
  {
    label: "Patrimônio total",
    state: "Dado indisponível",
    detail:
      "O dashboard ainda não recebe carteira persistida nem preços para calcular este resumo.",
  },
  {
    label: "Aporte do mês",
    state: "Ainda não calculado",
    detail: "O cálculo depende de carteira e de um valor de aporte informado pelo usuário.",
  },
  {
    label: "Reserva de emergência",
    state: "Sem dado persistido",
    detail:
      "Uma meta pode ser definida no onboarding, mas ainda não é salva nem lida pelo dashboard.",
  },
] as const;

const CONFIGURATION_STATES = [
  {
    label: "Perfil financeiro",
    state: "Disponível no onboarding",
  },
  {
    label: "Objetivos",
    state: "Não persistidos",
  },
  {
    label: "Meta da reserva",
    state: "Não persistida",
  },
] as const;

export function DashboardOverview() {
  return (
    <ProductShell activeRoute="/dashboard">
      <header className={styles.pageHeader}>
        <div>
          <h1>Dashboard</h1>
          <p>
            Uma visão geral que mostra apenas o que o produto realmente sabe hoje e deixa claro o
            que ainda precisa ser configurado.
          </p>
        </div>
        <span className={styles.dataMode}>Sem fonte persistida</span>
      </header>

      <section className={styles.persistenceBanner} aria-labelledby="persistence-title">
        <div>
          <h2 id="persistence-title">Sem persistência nesta versão</h2>
          <p>
            Onboarding e carteira já possuem fluxos locais, mas cada estado vive somente na própria
            página. Por isso, o dashboard ainda não recebe perfil, reserva, objetivos ou portfolio
            configurados.
          </p>
        </div>
        <Link className={styles.primaryAction} href="/onboarding">
          Configurar perfil no onboarding
        </Link>
      </section>

      <section className={styles.overviewSurface} aria-labelledby="overview-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="overview-title">Visão geral</h2>
            <p>Ausência de dado não é tratada como valor zero.</p>
          </div>
          <span className={styles.sectionStatus}>Sem métricas financeiras disponíveis</span>
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
                  O cadastro local existe na tela de carteira, mas ainda não é persistido nem
                  compartilhado com esta visão geral.
                </p>
              </div>
            </div>

            <Link className={styles.secondaryAction} href="/portfolio">
              Abrir carteira
            </Link>
          </section>

          <section className={styles.detailRegion} aria-labelledby="configuration-title">
            <div className={styles.detailHeading}>
              <div>
                <h2 id="configuration-title">Objetivos e configuração</h2>
                <p>O dashboard só exibirá configuração que consiga recuperar de forma confiável.</p>
              </div>
            </div>

            <dl className={styles.configurationList}>
              {CONFIGURATION_STATES.map((item) => (
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
                Perfil, reserva e objetivos já podem ser validados no fluxo local de onboarding.
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
                Posições só poderão aparecer quando o Transaction Ledger tiver fatos suficientes
                para projetá-las.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </ProductShell>
  );
}
