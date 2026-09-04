"use client";

import { visualStates, type VisualState } from "@/config/council";
import { visualStateMeta } from "./visual-state";

interface DevStateSwitcherProps {
  value: VisualState | null;
  onChange: (state: VisualState | null) => void;
}

export function DevStateSwitcher({
  value,
  onChange,
}: DevStateSwitcherProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-xs rounded-xl border border-zinc-200/90 bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          State preview
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            Reset
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visualStates.map((state) => {
          const selected = state === value;

          return (
            <button
              key={state}
              type="button"
              onClick={() => onChange(state)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {visualStateMeta[state].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
