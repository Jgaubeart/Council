"use client";

import { useEffect, useRef, useState } from "react";
import {
  departments,
  type RoutableDepartmentId,
} from "@/config/council";
import {
  SpeechSupersededError,
  type CouncilSpeechController,
} from "./use-council-speech";
import type { CouncilRoutingController } from "./use-council-routing";
import {
  parseDepartmentAgentResult,
  type DepartmentAgentOutcome,
  type DepartmentAgentResult,
} from "@/lib/council/agent-schemas";

export type DepartmentRunStatus =
  | "idle"
  | "intro"
  | "thinking"
  | "speaking"
  | "complete"
  | "error";

export interface DepartmentRunController {
  status: DepartmentRunStatus;
  results: DepartmentAgentResult[];
  errors: Partial<Record<RoutableDepartmentId, string>>;
  councilError: string | null;
}

const departmentNameById = new Map(
  departments.map((department) => [department.id, department.name]),
);

function buildCouncilIntro(ids: RoutableDepartmentId[]): string {
  const names = ids.map((id) => departmentNameById.get(id) ?? id);

  if (names.length === 1) {
    return `I'm bringing in ${names[0]}.`;
  }

  if (names.length === 2) {
    return `I'm bringing in ${names[0]} and ${names[1]}.`;
  }

  return `I'm bringing in ${names[0]}, ${names[1]}, and ${names[2]}.`;
}

function parseOutcomes(value: unknown): DepartmentAgentOutcome[] {
  if (!Array.isArray(value)) {
    throw new Error("Department agents returned an invalid response.");
  }

  return value.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Department agents returned an invalid response.");
    }

    const outcome = item as Record<string, unknown>;
    const department = outcome.department;

    if (typeof department !== "string") {
      throw new Error("Department agents returned an invalid response.");
    }

    const departmentId = department as RoutableDepartmentId;

    if (outcome.status === "error") {
      return {
        department: departmentId,
        status: "error",
        error:
          typeof outcome.error === "string"
            ? outcome.error
            : "Department agent failed.",
      } satisfies DepartmentAgentOutcome;
    }

    if (outcome.status === "ok") {
      return {
        department: departmentId,
        status: "ok",
        result: parseDepartmentAgentResult(outcome.result, departmentId),
      } satisfies DepartmentAgentOutcome;
    }

    throw new Error("Department agents returned an invalid response.");
  });
}

export function useCouncilDepartments(
  routing: CouncilRoutingController,
  finalTranscript: string,
  speech: CouncilSpeechController,
): DepartmentRunController {
  const [status, setStatus] = useState<DepartmentRunStatus>("idle");
  const [results, setResults] = useState<DepartmentAgentResult[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<RoutableDepartmentId, string>>
  >({});
  const [councilError, setCouncilError] = useState<string | null>(null);

  const runTokenRef = useRef(0);
  const speechRef = useRef(speech);

  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  useEffect(() => {
    const transcript = finalTranscript.trim();

    if (
      routing.status !== "ready" ||
      !transcript ||
      !routing.objective ||
      routing.departments.length === 0 ||
      routing.transcript !== transcript
    ) {
      return;
    }

    const token = ++runTokenRef.current;
    const isCurrent = () => token === runTokenRef.current;

    const run = async () => {
      setStatus("intro");
      setResults([]);
      setErrors({});
      setCouncilError(null);

      try {
        await speechRef.current.speak({
          departmentId: "council",
          text: buildCouncilIntro(routing.departments),
        });
      } catch (introError) {
        if (introError instanceof SpeechSupersededError) {
          return;
        }

        // The introduction is non-fatal; continue to department reasoning.
      }

      if (!isCurrent()) {
        return;
      }

      setStatus("thinking");

      let outcomes: DepartmentAgentOutcome[];

      try {
        const response = await fetch("/api/council/departments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript,
            objective: routing.objective,
            departments: routing.departments,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(payload?.error ?? "Department agents failed.");
        }

        const payload = (await response.json()) as { results?: unknown };
        outcomes = parseOutcomes(payload.results);
      } catch (agentError) {
        if (!isCurrent()) {
          return;
        }

        setCouncilError(
          agentError instanceof Error
            ? agentError.message
            : "Department agents failed.",
        );
        setStatus("error");
        return;
      }

      if (!isCurrent()) {
        return;
      }

      const succeeded: DepartmentAgentResult[] = [];
      const failed: Partial<Record<RoutableDepartmentId, string>> = {};

      for (const outcome of outcomes) {
        if (outcome.status === "ok") {
          succeeded.push(outcome.result);
        } else {
          failed[outcome.department] = outcome.error;
        }
      }

      setResults(succeeded);
      setErrors(failed);

      if (succeeded.length === 0) {
        setCouncilError("No departments were able to respond.");
        setStatus("error");
        return;
      }

      setStatus("speaking");

      for (const outcome of outcomes) {
        if (outcome.status !== "ok") {
          continue;
        }

        if (!isCurrent()) {
          return;
        }

        try {
          await speechRef.current.speak({
            departmentId: outcome.result.department,
            text: outcome.result.spokenResponse,
          });
        } catch (speechError) {
          if (speechError instanceof SpeechSupersededError) {
            return;
          }

          if (!isCurrent()) {
            return;
          }

          setErrors((current) => ({
            ...current,
            [outcome.result.department]: "Speech playback failed.",
          }));
        }
      }

      if (!isCurrent()) {
        return;
      }

      setStatus("complete");
    };

    void run();

    return () => {
      if (token === runTokenRef.current) {
        runTokenRef.current += 1;
      }
    };
  }, [
    finalTranscript,
    routing.status,
    routing.objective,
    routing.departments,
    routing.transcript,
    routing.sessionId,
  ]);

  return {
    status,
    results,
    errors,
    councilError,
  };
}
