import type { Metadata } from "next";

import { MissionControl } from "@/components/guard/mission-control";
import { requireOperatorSession } from "@/lib/auth/operator-session.server";

export const metadata: Metadata = {
  title: "Operator Workspace — ZELIC Guard",
  description: "Authenticated operator access to the ZELIC Guard simulation lab.",
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
