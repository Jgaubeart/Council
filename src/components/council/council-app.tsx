"use client";

import { useMemo, useState } from "react";
import {
  departments,
  type VisualState,
} from "@/config/council";
import { ConversationBar } from "./conversation-bar";
import { CouncilView } from "./council-view";
import { DevStateSwitcher } from "./dev-state-switcher";
import { CouncilHeader } from "./header";
import { RightSidebar } from "./right-sidebar";

export function CouncilApp() {
  const [overrideState, setOverrideState] = useState<VisualState | null>(null);

  const states = useMemo(
    () =>
      Object.fromEntries(
        departments.map((department) => [
          department.id,
          overrideState ?? department.defaultVisualState,
        ]),
      ) as Record<string, VisualState>,
    [overrideState],
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#f6f6f4] text-zinc-900">
      <CouncilHeader />

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <CouncilView states={states} />
          {process.env.NODE_ENV === "development" ? (
            <DevStateSwitcher value={overrideState} onChange={setOverrideState} />
          ) : null}
        </main>
        <RightSidebar />
      </div>

      <ConversationBar />
    </div>
  );
}
