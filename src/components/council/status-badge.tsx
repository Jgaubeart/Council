import type { VisualState } from "@/config/council";
import { visualStateMeta } from "./visual-state";

interface StatusBadgeProps {
  state: VisualState;
}

export function StatusBadge({ state }: StatusBadgeProps) {
  const meta = visualStateMeta[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.badgeDot}`} />
      {meta.label}
    </span>
  );
}
