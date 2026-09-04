"use client";

import { useMemo, useState } from "react";
import {
  departments,
  type RoutableDepartmentId,
  type VisualState,
} from "@/config/council";
import { useCouncilSpeech } from "@/hooks/use-council-speech";
import { useCouncilTranscription } from "@/hooks/use-council-transcription";
import { useCouncilRouting } from "@/hooks/use-council-routing";
import { ConversationBar } from "./conversation-bar";
import { CouncilView } from "./council-view";
import { DevStateSwitcher } from "./dev-state-switcher";
import { CouncilHeader } from "./header";
import { RightSidebar } from "./right-sidebar";

export function CouncilApp() {
  const [overrideState, setOverrideState] = useState<VisualState | null>(null);
  const speech = useCouncilSpeech();
  const transcription = useCouncilTranscription();
  const routing = useCouncilRouting(transcription.finalTranscript, speech);

  const states = useMemo(
    () => {
      const selectedDepartmentIds = new Set<RoutableDepartmentId>(
        routing.departments,
      );
      const entries = departments.map((department) => {
        let state = overrideState ?? department.defaultVisualState;

        if (department.kind === "orchestrator") {
          if (transcription.isListening) {
            state = "listening";
          } else if (routing.status === "thinking") {
            state = "thinking";
          } else if (speech.activeDepartmentId === department.id) {
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
        } else {
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
          } else if (
            selectedDepartmentIds.has(department.id as RoutableDepartmentId)
          ) {
            state = "waiting";
          }
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
      routing.status,
      routing.departments,
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
        <RightSidebar
          objective={routing.objective}
          departments={routing.departments}
          routingStatus={routing.status}
          routingError={routing.error}
        />
      </div>

      <ConversationBar speech={speech} transcription={transcription} />
    </div>
  );
}
