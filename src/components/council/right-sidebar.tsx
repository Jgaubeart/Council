import {
  departments,
  type RoutableDepartmentId,
} from "@/config/council";
import type { CouncilRoutingStatus } from "@/hooks/use-council-routing";
import type { DepartmentRunStatus } from "@/hooks/use-council-departments";
import type { DepartmentAgentResult } from "@/lib/council/agent-schemas";

interface RightSidebarProps {
  objective: string;
  departments: RoutableDepartmentId[];
  routingStatus: CouncilRoutingStatus;
  routingError: string | null;
  responses: DepartmentAgentResult[];
  departmentErrors: Partial<Record<RoutableDepartmentId, string>>;
  departmentStatus: DepartmentRunStatus;
  councilError: string | null;
}

interface SidebarSectionProps {
  label: string;
  value: string;
  muted?: boolean;
}

const departmentNameById = new Map(
  departments.map((department) => [department.id, department.name]),
);

const confidenceClasses: Record<DepartmentAgentResult["confidence"], string> = {
  low: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200/70",
  high: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
};

function SidebarSection({ label, value, muted = false }: SidebarSectionProps) {
  return (
    <section className="border-b border-zinc-200/70 px-6 py-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </h2>
      <p
        className={`mt-2 text-sm leading-6 ${
          muted ? "text-zinc-400" : "text-zinc-700"
        }`}
      >
        {value}
      </p>
    </section>
  );
}

export function RightSidebar({
  objective,
  departments: selectedDepartments,
  routingStatus,
  routingError,
  responses,
  departmentErrors,
  departmentStatus,
  councilError,
}: RightSidebarProps) {
  const consultedNames = selectedDepartments
    .map((departmentId) => departmentNameById.get(departmentId) ?? departmentId)
    .join(", ");

  const objectiveValue =
    routingStatus === "thinking"
      ? "Thinking…"
      : objective || "No active objective";

  const hasDepartmentActivity =
    responses.length > 0 || Object.keys(departmentErrors).length > 0;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-zinc-200/80 bg-[#fbfbfa] md:flex xl:w-80">
      <div className="flex items-center justify-between border-b border-zinc-200/80 px-6 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
          Session Brief
        </h2>
        <span className="font-mono text-xs text-zinc-400">02</span>
      </div>

      {routingError ? (
        <section className="border-b border-rose-100 bg-rose-50/60 px-6 py-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-400">
            Routing Error
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-600">{routingError}</p>
        </section>
      ) : null}

      <SidebarSection
        label="Current Objective"
        value={objectiveValue}
        muted={!objective && routingStatus !== "thinking"}
      />
      <SidebarSection
        label="Departments Consulted"
        value={consultedNames || "None"}
        muted={!consultedNames}
      />

      <section className="border-b border-zinc-200/70 px-6 py-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Department Responses
        </h2>

        {councilError ? (
          <p className="mt-2 text-sm leading-6 text-rose-600">{councilError}</p>
        ) : departmentStatus === "thinking" ? (
          <p className="mt-2 text-sm leading-6 text-zinc-400">Thinking…</p>
        ) : departmentStatus === "intro" ? (
          <p className="mt-2 text-sm leading-6 text-zinc-400">Waiting…</p>
        ) : !hasDepartmentActivity ? (
          <p className="mt-2 text-sm leading-6 text-zinc-400">None yet</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {responses.map((response) => {
              const name =
                departmentNameById.get(response.department) ??
                response.department;

              return (
                <li key={response.department} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-zinc-800">{name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${confidenceClasses[response.confidence]}`}
                    >
                      {response.confidence}
                    </span>
                  </div>
                  <p className="mt-1 leading-5 text-zinc-500">
                    {response.recommendation}
                  </p>
                </li>
              );
            })}

            {Object.entries(departmentErrors).map(([departmentId, message]) => {
              const name =
                departmentNameById.get(departmentId as RoutableDepartmentId) ??
                departmentId;

              return (
                <li key={departmentId} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-zinc-800">{name}</span>
                    <span className="text-[11px] font-medium text-rose-500">
                      Error
                    </span>
                  </div>
                  <p className="mt-1 leading-5 text-rose-500">{message}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SidebarSection label="Sources" value="0 sources" muted />
      <SidebarSection
        label="Proposed Actions"
        value="No proposed actions"
        muted
      />

      <div className="mt-auto px-6 py-5 text-xs leading-5 text-zinc-400">
        Council will summarize context here as the session progresses.
      </div>
    </aside>
  );
}
