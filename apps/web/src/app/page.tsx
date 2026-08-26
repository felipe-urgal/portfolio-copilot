import Link from "next/link";

import { APP_NAME } from "@portfolio-copilot/shared";

export default function Home() {
  return (
    <main className="shell">
      <section className="card" aria-labelledby="page-title">
        <p className="eyebrow">Fundação técnica</p>
        <h1 id="page-title">{APP_NAME}</h1>
        <p>
          Base técnica pronta para evoluir o motor de carteira com regras financeiras
          determinísticas, auditáveis e testáveis.
        </p>
        <Link href="/health">Verificar saúde da aplicação</Link>
      </section>
    </main>
  );
}
