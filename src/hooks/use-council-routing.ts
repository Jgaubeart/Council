"use client";

import { useEffect, useRef, useState } from "react";
import type { RoutableDepartmentId } from "@/config/council";
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
  sessionId: number;
  transcript: string;
}

export function useCouncilRouting(
  finalTranscript: string,
): CouncilRoutingController {
  const [status, setStatus] = useState<CouncilRoutingStatus>("idle");
  const [objective, setObjective] = useState("");
  const [departments, setDepartments] = useState<RoutableDepartmentId[]>([]);
  const [responseMode, setResponseMode] =
    useState<CouncilResponseMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(0);
  const [transcript, setTranscript] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    const value = finalTranscript.trim();

    if (!value) {
      return;
    }

    const requestId = ++requestIdRef.current;

    const route = async () => {
      setStatus("thinking");
      setObjective("");
      setDepartments([]);
      setResponseMode(null);
      setTranscript("");
      setError(null);

      try {
        const response = await fetch("/api/council/route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript: value }),
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
        setTranscript(value);
        setSessionId((current) => current + 1);
        setStatus("ready");
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
    sessionId,
    transcript,
  };
}
