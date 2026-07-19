const ENDPOINTS = [
  {
    path: "POST /api/compile",
    detail: "Natural language → validated intent contract",
  },
  {
    path: "POST /api/approve",
    detail: "Proposed contract → fingerprinted authority",
  },
  {
    path: "POST /api/evaluate",
    detail: "Attempt + history → ALLOW or DENY evidence",
  },
] as const;

const QUICKSTART = `curl -X POST \\
  https://zelic-guard-build-week.vercel.app/api/compile \\
  -H 'content-type: application/json' \\
  -d '{"intent":"Send invoice INV-2048…","mode":"auto"}'`;

export function DeveloperQuickstart() {
  return (
    <section className="developer-panel" aria-labelledby="developer-title">
      <div className="developer-heading">
        <div>
          <span className="section-kicker">DEVELOPER INTEGRATION</span>
          <h2 id="developer-title">Integrate in three requests</h2>
        </div>
        <div className="developer-signals" aria-label="API guarantees">
          <span>ZOD VALIDATED</span>
          <span>SERVER ENFORCED</span>
          <span>FAIL CLOSED</span>
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
            <span>QUICKSTART / LIVE API</span>
            <a
              href="https://github.com/ZIETEII/zelic-guard"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </div>
          <pre><code>{QUICKSTART}</code></pre>
        </div>
      </div>
    </section>
  );
}
