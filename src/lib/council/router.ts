import OpenAI from "openai";
import { departments } from "@/config/council";
import {
  councilRouteJsonSchema,
  CouncilRouteValidationError,
  parseCouncilRouteResult,
  type CouncilRouteResult,
} from "./schemas";

export const DEFAULT_COUNCIL_MODEL = "gpt-4o-mini";

export class CouncilRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouncilRouteError";
  }
}

function buildRouterInstructions(): string {
  const specialistDepartments = departments
    .filter((department) => department.kind === "member")
    .map((department) => `${department.name}: ${department.role}`)
    .join("\n");

  return `You are the Cabinet Genies Council router.

Available specialist departments:
${specialistDepartments}

Routing rules:
- Council is the orchestrator and is never selected as a department.
- A direct department request selects only that department and uses responseMode "single_department".
- A council request selects only the departments materially relevant to the business question. Do not select all departments by default.
- Explicitly named departments must be selected.
- Select at most three departments.
- Prefer the smallest number of departments that can address the request.
- Create a concise objective that captures the actual business question, not greetings or filler.`;
}

export async function routeCouncilTranscript(
  transcript: string,
  model = DEFAULT_COUNCIL_MODEL,
): Promise<CouncilRouteResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new CouncilRouteError("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.responses.parse({
      model,
      input: transcript,
      instructions: buildRouterInstructions(),
      text: {
        format: {
          type: "json_schema",
          name: "council_route",
          schema: councilRouteJsonSchema,
          strict: true,
        },
        verbosity: "medium",
      },
    });

    return parseCouncilRouteResult(response.output_parsed);
  } catch (error) {
    if (error instanceof CouncilRouteValidationError) {
      throw error;
    }

    console.error("Council routing failed:", error);
    throw new CouncilRouteError("Council routing failed.");
  }
}
