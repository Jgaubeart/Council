import type { RoutableDepartmentId } from "@/config/council";

export interface DepartmentAgentDefinition {
  id: RoutableDepartmentId;
  name: string;
  role: string;
  systemInstructions: string;
}
