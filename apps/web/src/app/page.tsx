import Link from "next/link";

import { APP_NAME } from "@portfolio-copilot/shared";

export default function Home() {
  return (
    <main className="shell">
      <section className="card" aria-labelledby="page-title">
        <h1 id="page-title">{APP_NAME}</h1>
        <p>
          Organize seu contexto financeiro em um fluxo simples e gere um perfil validado antes de
          avançar para carteira e recomendações.
        </p>
        <div className="card-actions">
          <Link className="primary-link" href="/onboarding">
            Começar onboarding financeiro
          </Link>
          <Link className="secondary-link" href="/health">
            Verificar saúde da aplicação
          </Link>
        </div>
      </section>
    </main>
  );
}
