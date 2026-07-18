export interface AuditItem {
  readonly sequence: number;
  readonly timestamp: string;
  readonly label: string;
  readonly outcome: "neutral" | "allow" | "deny";
}

interface AuditTimelineProps {
  readonly items: readonly AuditItem[];
}

export function AuditTimeline({ items }: AuditTimelineProps) {
  return (
    <section className="audit-panel" aria-labelledby="audit-title">
      <div className="panel-heading audit-heading">
        <div>
          <span className="section-kicker">DETERMINISTIC EVIDENCE</span>
          <h2 id="audit-title">Deterministic audit timeline</h2>
        </div>
        <span className="event-count">{items.length} events</span>
      </div>

      {items.length ? (
        <ol className="audit-list">
          {items.map((item) => (
            <li className={`audit-${item.outcome}`} key={`${item.sequence}-${item.label}`}>
              <span className="audit-node" aria-hidden="true" />
              <code>AUD-{String(item.sequence + 1).padStart(4, "0")}</code>
              <time dateTime={item.timestamp}>{item.timestamp}</time>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <div className="audit-empty">
          <span aria-hidden="true" />
          <p>No audit events yet.</p>
        </div>
      )}
    </section>
  );
}
