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
import { useCouncilDepartments } from "@/hooks/use-council-departments";
import { ConversationBar } from "./conversation-bar";
import { CouncilView } from "./council-view";
import { DevStateSwitcher } from "./dev-state-switcher";
import { CouncilHeader } from "./header";
import { RightSidebar } from "./right-sidebar";

export function CouncilApp() {
  const [overrideState, setOverrideState] = useState<VisualState | null>(null);
  const speech = useCouncilSpeech();
  const transcription = useCouncilTranscription();
  const routing = useCouncilRouting(transcription.finalTranscript);
  const departmentRun = useCouncilDepartments(
    routing,
    transcription.finalTranscript,
    speech,
  );

  const states = useMemo(
    () => {
      const selectedDepartmentIds = new Set<RoutableDepartmentId>(
        routing.departments,
      );
      const failedDepartmentIds = new Set<RoutableDepartmentId>(
        Object.keys(departmentRun.errors) as RoutableDepartmentId[],
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
          const departmentId = department.id as RoutableDepartmentId;

          if (failedDepartmentIds.has(departmentId)) {
            state = "warning";
          } else if (selectedDepartmentIds.has(departmentId)) {
            if (departmentRun.status === "thinking") {
              state = "thinking";
            } else if (departmentRun.status === "speaking") {
              if (speech.activeDepartmentId === department.id) {
                if (speech.phase === "loading") {
                  state = "thinking";
                } else if (speech.phase === "speaking") {
                  state = "speaking";
                } else if (speech.phase === "error") {
                  state = "warning";
                } else {
                  state = "waiting";
                }
              } else {
                state = "waiting";
              }
            } else if (departmentRun.status === "complete") {
              state = "available";
            } else if (departmentRun.status === "error") {
              state = "warning";
            } else {
              state = "waiting";
            }
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
      departmentRun.status,
      departmentRun.errors,
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
          responses={departmentRun.results}
          departmentErrors={departmentRun.errors}
          departmentStatus={departmentRun.status}
          councilError={departmentRun.councilError}
        />
      </div>

      <ConversationBar
        speech={speech}
        transcription={transcription}
        departmentStatus={departmentRun.status}
        departmentCouncilError={departmentRun.councilError}
      />
    </div>
  );
}
