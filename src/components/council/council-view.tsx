import {
  departments,
  type VisualState,
} from "@/config/council";
import { DepartmentNode } from "./department-node";

interface CouncilViewProps {
  states: Record<string, VisualState>;
  activeDepartmentId?: string | null;
}

const orchestrator =
  departments.find((department) => department.kind === "orchestrator") ??
  departments[0];

const members = departments.filter(
  (department) => department.kind === "member",
);

const memberPositions: Record<string, string> = {
  sales: "lg:col-start-1 lg:row-start-1 lg:justify-self-end lg:self-end",
  finance: "lg:col-start-3 lg:row-start-1 lg:justify-self-start lg:self-end",
  operations:
    "lg:col-start-2 lg:row-start-3 lg:justify-self-center lg:self-start",
};

export function CouncilView({
  states,
  activeDepartmentId = null,
}: CouncilViewProps) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center p-6 sm:p-8 xl:p-12">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(180px,1fr)_minmax(300px,1.35fr)_minmax(180px,1fr)] lg:grid-rows-[1fr_auto_1fr] lg:gap-x-10 lg:gap-y-8">
        <div className="relative flex items-center justify-center lg:col-start-2 lg:row-start-2">
          <div
            aria-hidden="true"
            className="absolute h-44 w-44 rounded-full border border-zinc-200/90"
          />
          <div
            aria-hidden="true"
            className="absolute h-60 w-60 rounded-full border border-zinc-200/60"
          />
          <DepartmentNode
            department={orchestrator}
            state={states[orchestrator.id] ?? orchestrator.defaultVisualState}
            featured
            active={orchestrator.id === activeDepartmentId}
          />
        </div>

        {members.map((department) => (
          <div
            key={department.id}
            className={`flex justify-center ${memberPositions[department.id] ?? ""}`}
          >
            <DepartmentNode
              department={department}
              state={states[department.id] ?? department.defaultVisualState}
              active={department.id === activeDepartmentId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
