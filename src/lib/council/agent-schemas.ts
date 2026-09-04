import type { RoutableDepartmentId } from "@/config/council";

export type DepartmentConfidence = "low" | "medium" | "high";

export interface DepartmentAgentResult {
  department: RoutableDepartmentId;
  position: string;
  keyPoints: string[];
  risks: string[];
  recommendation: string;
  confidence: DepartmentConfidence;
  spokenResponse: string;
}

export type DepartmentAgentOutcome =
  | {
      department: RoutableDepartmentId;
      status: "ok";
      result: DepartmentAgentResult;
    }
  | {
      department: RoutableDepartmentId;
      status: "error";
      error: string;
    };

export class DepartmentAgentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DepartmentAgentValidationError";
  }
}

export function buildDepartmentOutputSchema(departmentId: RoutableDepartmentId) {
  return {
    type: "object",
    properties: {
      department: {
        type: "string",
        enum: [departmentId],
        description: `Must be the literal value "${departmentId}".`,
      },
      position: {
        type: "string",
        description:
          "A one-sentence position statement for this department.",
      },
      keyPoints: {
        type: "array",
        description:
          "Two to four concise key points supporting the position.",
        items: { type: "string" },
      },
      risks: {
        type: "array",
        description: "Concise risks or watch-outs. May be empty.",
        items: { type: "string" },
      },
      recommendation: {
        type: "string",
        description: "The department's clear, actionable recommendation.",
      },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
      },
      spokenResponse: {
        type: "string",
        description:
          "A concise spoken response of 60 to 120 words for voice playback.",
      },
    },
    required: [
      "department",
      "position",
      "keyPoints",
      "risks",
      "recommendation",
      "confidence",
      "spokenResponse",
    ],
    additionalProperties: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function parseDepartmentAgentResult(
  value: unknown,
  expectedDepartmentId: RoutableDepartmentId,
): DepartmentAgentResult {
  if (!isRecord(value)) {
    throw new DepartmentAgentValidationError(
      "Malformed department response.",
    );
  }

  if (value.department !== expectedDepartmentId) {
    throw new DepartmentAgentValidationError(
      "Department response returned a mismatched department ID.",
    );
  }

  const position =
    typeof value.position === "string" ? value.position.trim() : "";
  const recommendation =
    typeof value.recommendation === "string"
      ? value.recommendation.trim()
      : "";
  const spokenResponse =
    typeof value.spokenResponse === "string"
      ? value.spokenResponse.trim()
      : "";

  if (!recommendation) {
    throw new DepartmentAgentValidationError(
      "Department response is missing a recommendation.",
    );
  }

  if (!spokenResponse) {
    throw new DepartmentAgentValidationError(
      "Department response is missing a spokenResponse.",
    );
  }

  if (typeof value.position !== "string") {
    throw new DepartmentAgentValidationError(
      "Department response has a malformed position.",
    );
  }

  if (!isStringArray(value.keyPoints)) {
    throw new DepartmentAgentValidationError(
      "Department keyPoints must be an array of strings.",
    );
  }

  if (!isStringArray(value.risks)) {
    throw new DepartmentAgentValidationError(
      "Department risks must be an array of strings.",
    );
  }

  const confidence = value.confidence;
  if (
    confidence !== "low" &&
    confidence !== "medium" &&
    confidence !== "high"
  ) {
    throw new DepartmentAgentValidationError(
      "Department confidence is invalid.",
    );
  }

  return {
    department: expectedDepartmentId,
    position,
    keyPoints: value.keyPoints as string[],
    risks: value.risks as string[],
    recommendation,
    confidence,
    spokenResponse,
  };
}
