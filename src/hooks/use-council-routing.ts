"use client";

import { useEffect, useRef, useState } from "react";
import {
  departments,
  type RoutableDepartmentId,
} from "@/config/council";
import type { CouncilSpeechController } from "./use-council-speech";
import {
  parseCouncilRouteResult,
  type CouncilResponseMode,
} from "@/lib/council/schemas";

export type CouncilRoutingStatus = "idle" | "thinking" | "ready" | "error";

export interface CouncilRoutingController {
  status: CouncilRoutingStatus;
  objective: string;
  departments: RoutableDepartmentId[];
  responseMode: CouncilResponseMode | null;
  error: string | null;
}

const departmentNameById = new Map(
  departments.map((department) => [department.id, department.name]),
);

function buildCouncilIntro(departmentIds: RoutableDepartmentId[]): string {
  const names = departmentIds.map(
    (departmentId) => departmentNameById.get(departmentId) ?? departmentId,
  );

  if (names.length === 1) {
    return `I'm bringing in ${names[0]}.`;
  }

  if (names.length === 2) {
    return `I'm bringing in ${names[0]} and ${names[1]}.`;
  }

  return `I'm bringing in ${names[0]}, ${names[1]}, and ${names[2]}.`;
}

export function useCouncilRouting(
  finalTranscript: string,
  speech: CouncilSpeechController,
): CouncilRoutingController {
  const [status, setStatus] = useState<CouncilRoutingStatus>("idle");
  const [objective, setObjective] = useState("");
  const [departments, setDepartments] = useState<RoutableDepartmentId[]>([]);
  const [responseMode, setResponseMode] =
    useState<CouncilResponseMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const speechRef = useRef(speech);

  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  useEffect(() => {
    const transcript = finalTranscript.trim();

    if (!transcript) {
      return;
    }

    const requestId = ++requestIdRef.current;
    speechRef.current.stop();

    const route = async () => {
      setStatus("thinking");
      setObjective("");
      setDepartments([]);
      setResponseMode(null);
      setError(null);

      try {
        const response = await fetch("/api/council/route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(payload?.error ?? "Council routing failed.");
        }

        const result = parseCouncilRouteResult(await response.json());

        if (requestId !== requestIdRef.current) {
          return;
        }

        setObjective(result.objective);
        setDepartments(result.departments);
        setResponseMode(result.responseMode);
        setStatus("ready");

        speechRef.current.speakLine({
          departmentId: "council",
          text: buildCouncilIntro(result.departments),
        });
      } catch (routingError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          routingError instanceof Error
            ? routingError.message
            : "Council routing failed.",
        );
        setStatus("error");
        setObjective("");
        setDepartments([]);
      }
    };

    void route();

    return () => {
      if (requestId === requestIdRef.current) {
        requestIdRef.current += 1;
      }
    };
  }, [finalTranscript]);

  return {
    status,
    objective,
    departments,
    responseMode,
    error,
  };
}
