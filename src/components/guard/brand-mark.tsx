/**
 * Monograma LogVox — geometría del SVG maestro
 * (01-logotipo/svg/logvox-monograma-color.svg y logvox-monograma-grafito.svg).
 *
 * Manual de marca §3.1: el monograma no se redibuja. Los paths se reproducen
 * sin cambios; sólo el cuerpo de la V alterna entre las dos versiones
 * cromáticas oficiales — blanco sobre fondo oscuro, grafito sobre fondo claro —
 * a través de --marca-monograma-cuerpo. El canal de señal y el nodo de voz
 * conservan Signal Orange en ambas.
 */
export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 1000 1000"
      role="img"
      aria-label="LogVox"
    >
      <path
        className="brand-mark-body"
        d="M 123.29,90.00 L 271.73,90.00 L 312.06,114.47 L 488.42,453.26 L 511.58,453.26 L 687.94,114.47 L 728.27,90.00 L 876.71,90.00 L 903.71,134.49 L 519.69,872.18 L 480.31,872.18 L 96.29,134.49 Z"
      />
      <path
        className="brand-mark-signal"
        d="M 695.78,321.56 L 505.75,686.59 L 471.45,695.46 L 459.04,662.28 L 649.06,297.24 L 683.36,288.38 Z"
      />
      <circle
        className="brand-mark-node"
        cx="761.46"
        cy="190.50"
        r="48.34"
        fill="none"
        strokeWidth="12.85"
      />
      <rect className="brand-mark-signal" x="736.22" y="183.78" width="6.06" height="13.43" rx="3.03" />
      <rect className="brand-mark-signal" x="747.32" y="177.77" width="6.06" height="25.44" rx="3.03" />
      <rect className="brand-mark-signal" x="758.43" y="172.83" width="6.06" height="35.34" rx="3.03" />
      <rect className="brand-mark-signal" x="769.54" y="179.89" width="6.06" height="21.20" rx="3.03" />
      <rect className="brand-mark-signal" x="780.64" y="184.84" width="6.06" height="11.31" rx="3.03" />
    </svg>
  );
}
