import type { DepartmentDefinition, VisualState } from "@/config/council";
import { CouncilAvatar } from "./council-avatar";
import { StatusBadge } from "./status-badge";

interface DepartmentNodeProps {
  department: DepartmentDefinition;
  state: VisualState;
  featured?: boolean;
}

export function DepartmentNode({
  department,
  state,
  featured = false,
}: DepartmentNodeProps) {
  return (
    <article
      className={`flex flex-col items-center gap-3 text-center ${
        featured ? "max-w-xs" : "max-w-[190px]"
      }`}
    >
      <CouncilAvatar
        name={department.name}
        initials={department.initials}
        state={state}
        size={featured ? "lg" : "md"}
      />
      <div className="flex flex-col items-center gap-1">
        <h2
          className={`font-semibold tracking-tight text-zinc-900 ${
            featured ? "text-2xl" : "text-base"
          }`}
        >
          {department.name}
        </h2>
        <p
          className={`text-zinc-500 ${
            featured
              ? "text-xs font-medium uppercase tracking-[0.16em]"
              : "max-w-[180px] text-sm leading-5"
          }`}
        >
          {department.role}
        </p>
        <StatusBadge state={state} />
      </div>
    </article>
  );
}
