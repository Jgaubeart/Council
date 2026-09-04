"use client";

import { useMemo, useState } from "react";
import {
  departments,
  type VisualState,
} from "@/config/council";
import { useCouncilSpeech } from "@/hooks/use-council-speech";
import { useCouncilTranscription } from "@/hooks/use-council-transcription";
import { ConversationBar } from "./conversation-bar";
import { CouncilView } from "./council-view";
import { DevStateSwitcher } from "./dev-state-switcher";
import { CouncilHeader } from "./header";
import { RightSidebar } from "./right-sidebar";

export function CouncilApp() {
  const [overrideState, setOverrideState] = useState<VisualState | null>(null);
  const speech = useCouncilSpeech();
  const transcription = useCouncilTranscription();

  const states = useMemo(
    () => {
      const entries = departments.map((department) => {
        let state = overrideState ?? department.defaultVisualState;

        if (speech.activeDepartmentId === department.id) {
          if (speech.phase === "loading") {
            state = "thinking";
          }

          if (speech.phase === "speaking") {
            state = "speaking";
          }

          if (speech.phase === "error") {
            state = "warning";
          }
        }

        if (
          department.kind === "orchestrator" &&
          transcription.isListening
        ) {
          state = "listening";
        }

        return [department.id, state] as const;
      });

      return Object.fromEntries(entries) as Record<string, VisualState>;
    },
    [
      overrideState,
      speech.activeDepartmentId,
      speech.phase,
      transcription.isListening,
    ],
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#f6f6f4] text-zinc-900">
      <CouncilHeader />

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <CouncilView
            states={states}
            activeDepartmentId={speech.activeDepartmentId}
          />
          {process.env.NODE_ENV === "development" ? (
            <DevStateSwitcher value={overrideState} onChange={setOverrideState} />
          ) : null}
        </main>
        <RightSidebar />
      </div>

      <ConversationBar speech={speech} transcription={transcription} />
    </div>
  );
}
