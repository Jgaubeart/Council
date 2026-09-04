import { salesAgent } from "./sales";
import { financeAgent } from "./finance";
import { operationsAgent } from "./operations";
import type { DepartmentAgentDefinition } from "./types";

export const departmentAgents: DepartmentAgentDefinition[] = [
  salesAgent,
  financeAgent,
  operationsAgent,
];

export const departmentAgentById = new Map(
  departmentAgents.map((agent) => [agent.id, agent]),
);

export type { DepartmentAgentDefinition } from "./types";
