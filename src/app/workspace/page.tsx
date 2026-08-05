import type { Metadata } from "next";

import { MissionControl } from "@/components/guard/mission-control";
import { requireOperatorSession } from "@/lib/auth/operator-session.server";

export const metadata: Metadata = {
  title: "Espacio de operador — ZELIC Guard by LogVox",
  description:
    "Acceso autenticado al laboratorio de simulación de ZELIC Guard. Prototipo funcional, sin operación real.",
};

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  await requireOperatorSession();

  return (
    <MissionControl
      access={{ kind: "operator", label: "Build Week Operator" }}
    />
  );
}
