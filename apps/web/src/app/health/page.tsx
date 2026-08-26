import { getApplicationHealth } from "@/lib/application-health";

export default function HealthPage() {
  const health = getApplicationHealth();

  return (
    <main className="shell">
      <section className="card" aria-labelledby="health-title">
        <p className="eyebrow">Health</p>
        <h1 id="health-title">Aplicação operacional</h1>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{health.status}</dd>
          </div>
          <div>
            <dt>Serviço</dt>
            <dd>{health.service}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
