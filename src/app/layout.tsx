import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// LogVox Manual de marca §5 — Space Grotesk (display e interfaz),
// Space Mono (dato, traza, estado) e Inter (texto extenso).
// Archivos maestros del paquete de marca, SIL Open Font License 1.1.
const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.woff2",
  weight: "300 700",
  variable: "--font-display",
  display: "swap",
});

const spaceMono = localFont({
  src: [
    { path: "./fonts/SpaceMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/SpaceMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  weight: "300 700",
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZELIC Guard by LogVox — Contratos de intención para agentes",
  description:
    "Capa de autoridad en tiempo de ejecución: un agente solo actúa dentro del contrato que una persona aprobó. Prototipo funcional, sin operación real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // El servidor declara el tema por defecto para que `data-theme` exista ya
    // en el HTML inicial. El toggle lo reescribe sobre este mismo <html>, que
    // es el elemento que React hidrata, de ahí suppressHydrationWarning: sin
    // él la reescritura se reporta como desajuste de hidratación.
    <html
      lang="es-CO"
      data-theme="dark"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
