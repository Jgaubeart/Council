export type VisualState =
  | "available"
  | "listening"
  | "thinking"
  | "speaking"
  | "waiting"
  | "warning"
  | "unavailable";

export type DepartmentKind = "orchestrator" | "member";

export type ConversationMode = "council" | "direct" | "summary";

export interface DepartmentDefinition {
  id: string;
  name: string;
  role: string;
  initials: string;
  voice: string;
  kind: DepartmentKind;
  defaultVisualState: VisualState;
}

export const departments: DepartmentDefinition[] = [
  {
    id: "council",
    name: "Council",
    role: "Orchestrator",
    initials: "CG",
    voice: "onyx",
    kind: "orchestrator",
    defaultVisualState: "available",
  },
  {
    id: "sales",
    name: "Sales",
    role: "Sales & Client Strategy",
    initials: "SA",
    voice: "nova",
    kind: "member",
    defaultVisualState: "available",
  },
  {
    id: "finance",
    name: "Finance",
    role: "Financial Analysis",
    initials: "FI",
    voice: "alloy",
    kind: "member",
    defaultVisualState: "available",
  },
  {
    id: "operations",
    name: "Operations",
    role: "Operations & Production",
    initials: "OP",
    voice: "echo",
    kind: "member",
    defaultVisualState: "available",
  },
];

export const visualStates: VisualState[] = [
  "available",
  "listening",
  "thinking",
  "speaking",
  "waiting",
  "warning",
  "unavailable",
];

export const conversationModes: Array<{
  id: ConversationMode;
  label: string;
}> = [
  { id: "council", label: "Council" },
  { id: "direct", label: "Direct" },
  { id: "summary", label: "Executive Summary" },
];
