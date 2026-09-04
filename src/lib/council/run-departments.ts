import OpenAI from "openai";
import type { RoutableDepartmentId } from "@/config/council";
import {
  buildDepartmentOutputSchema,
  DepartmentAgentValidationError,
  parseDepartmentAgentResult,
  type DepartmentAgentOutcome,
} from "./agent-schemas";
import { departmentAgentById } from "./agents";

export const DEFAULT_COUNCIL_AGENT_MODEL = "gpt-4o-mini";

export interface DepartmentRunInput {
  transcript: string;
  objective: string;
  departmentIds: RoutableDepartmentId[];
  model?: string;
}

function buildDepartmentInput(
  transcript: string,
  objective: string,
): string {
  return [
    "You are being consulted on the following business question.",
    `Objective: ${objective}`,
    `User transcript: ${transcript}`,
    "Provide your department's position, key points, risks, recommendation, and a concise spoken response.",
  ].join("\n\n");
}

export async function runDepartmentAgents({
  transcript,
  objective,
  departmentIds,
  model = DEFAULT_COUNCIL_AGENT_MODEL,
}: DepartmentRunInput): Promise<DepartmentAgentOutcome[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey });

  const tasks = departmentIds.map(
    async (departmentId): Promise<DepartmentAgentOutcome> => {
      const agent = departmentAgentById.get(departmentId);

      if (!agent) {
        return {
          department: departmentId,
          status: "error",
          error: `Unsupported department: ${departmentId}`,
        };
      }

      try {
        const response = await client.responses.parse({
          model,
          instructions: agent.systemInstructions,
          input: buildDepartmentInput(transcript, objective),
          text: {
            format: {
              type: "json_schema",
              name: `department_${departmentId}`,
              schema: buildDepartmentOutputSchema(departmentId),
              strict: true,
            },
            verbosity: "medium",
          },
        });

        const result = parseDepartmentAgentResult(
          response.output_parsed,
          departmentId,
        );

        return { department: departmentId, status: "ok", result };
      } catch (error) {
        console.error(`Department agent failed (${departmentId}):`, error);

        const message =
          error instanceof DepartmentAgentValidationError
            ? error.message
            : `Failed to generate a ${agent.name} response.`;

        return { department: departmentId, status: "error", error: message };
      }
    },
  );

  return Promise.all(tasks);
}
