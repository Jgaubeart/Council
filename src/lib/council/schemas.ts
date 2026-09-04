import {
  departments,
  type RoutableDepartmentId,
} from "@/config/council";

export type CouncilResponseMode = "single_department" | "council";

export interface CouncilRouteResult {
  objective: string;
  departments: RoutableDepartmentId[];
  responseMode: CouncilResponseMode;
}

const routableDepartmentIds = new Set<string>(
  departments
    .filter((department) => department.kind === "member")
    .map((department) => department.id),
);

export const councilRouteJsonSchema = {
  type: "object",
  properties: {
    objective: {
      type: "string",
      description:
        "A concise action-oriented summary of the user's business question.",
    },
    departments: {
      type: "array",
      description:
        "The specialist departments that should be consulted. Council is never included.",
      items: {
        type: "string",
        enum: [...routableDepartmentIds],
      },
      minItems: 1,
      maxItems: 3,
    },
    responseMode: {
      type: "string",
      enum: ["single_department", "council"],
    },
  },
  required: ["objective", "departments", "responseMode"],
  additionalProperties: false,
};

export class CouncilRouteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouncilRouteValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseCouncilRouteResult(
  value: unknown,
): CouncilRouteResult {
  if (!isRecord(value)) {
    throw new CouncilRouteValidationError("Malformed routing response.");
  }

  const objective =
    typeof value.objective === "string" ? value.objective.trim() : "";

  if (!objective) {
    throw new CouncilRouteValidationError(
      "Routing response is missing an objective.",
    );
  }

  if (!Array.isArray(value.departments) || value.departments.length === 0) {
    throw new CouncilRouteValidationError(
      "Routing response returned no departments.",
    );
  }

  if (value.departments.length > 3) {
    throw new CouncilRouteValidationError(
      "Routing response selected too many departments.",
    );
  }

  const departmentsValue = value.departments as unknown[];
  const selected = departmentsValue.map((department) => {
    if (
      typeof department !== "string" ||
      !routableDepartmentIds.has(department)
    ) {
      throw new CouncilRouteValidationError(
        "Routing response returned an unsupported department.",
      );
    }

    return department as RoutableDepartmentId;
  });

  if (new Set(selected).size !== selected.length) {
    throw new CouncilRouteValidationError(
      "Routing response returned duplicate departments.",
    );
  }

  if (
    value.responseMode !== "single_department" &&
    value.responseMode !== "council"
  ) {
    throw new CouncilRouteValidationError(
      "Routing response returned an invalid response mode.",
    );
  }

  return {
    objective,
    departments: selected,
    responseMode: value.responseMode,
  };
}
