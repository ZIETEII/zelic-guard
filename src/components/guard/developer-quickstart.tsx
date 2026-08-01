import { INVOICE_INTENT } from "@/lib/guard/demo-seed";

const ENDPOINTS = [
  {
    path: "POST /api/compile",
    detail: "Lenguaje natural → contrato de intención validado",
  },
  {
    path: "POST /api/approve",
    detail: "Contrato propuesto → autoridad con huella",
  },
  {
    path: "POST /api/evaluate",
    detail: "Intento + historial → evidencia ALLOW o DENY",
  },
] as const;

const QUICKSTART = `curl -X POST \\
  https://zelic-guard-build-week.vercel.app/api/compile \\
  -H 'content-type: application/json' \\
  -d '${JSON.stringify({ intent: INVOICE_INTENT, mode: "auto" })}'`;

export function DeveloperQuickstart() {
  return (
    <section className="developer-panel" aria-labelledby="developer-title">
      <div className="developer-heading">
        <div>
          <span className="section-kicker">INTEGRACIÓN</span>
          <h2 id="developer-title">Conéctalo en tres peticiones</h2>
        </div>
        <div className="developer-signals" aria-label="Garantías de la API">
          <span>VALIDADO CON ZOD</span>
          <span>APLICADO EN SERVIDOR</span>
          <span>CIERRA ANTE FALLA</span>
        </div>
      </div>

      <div className="developer-grid">
        <ol className="endpoint-list">
          {ENDPOINTS.map((endpoint, index) => (
            <li key={endpoint.path}>
              <span>0{index + 1}</span>
              <div>
                <code>{endpoint.path}</code>
                <small>{endpoint.detail}</small>
              </div>
            </li>
          ))}
        </ol>

        <div className="quickstart-code">
          <div>
            <span>INICIO RÁPIDO / API EN VIVO</span>
            <a
              href="https://github.com/ZIETEII/zelic-guard"
              target="_blank"
              rel="noreferrer"
            >
              Ver código
            </a>
          </div>
          <pre><code>{QUICKSTART}</code></pre>
        </div>
      </div>
    </section>
  );
}
