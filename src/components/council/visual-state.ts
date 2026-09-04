import type { VisualState } from "@/config/council";

export interface VisualStateMeta {
  label: string;
  dot: string;
  avatarRing: string;
  badge: string;
  badgeDot: string;
}

export const visualStateMeta: Record<VisualState, VisualStateMeta> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    avatarRing: "ring-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    badgeDot: "bg-emerald-500",
  },
  listening: {
    label: "Listening",
    dot: "bg-sky-500",
    avatarRing: "ring-sky-200",
    badge: "bg-sky-50 text-sky-700 ring-sky-200/70",
    badgeDot: "bg-sky-500",
  },
  thinking: {
    label: "Thinking",
    dot: "bg-amber-500",
    avatarRing: "ring-amber-200",
    badge: "bg-amber-50 text-amber-700 ring-amber-200/70",
    badgeDot: "bg-amber-500",
  },
  speaking: {
    label: "Speaking",
    dot: "bg-indigo-500",
    avatarRing: "ring-indigo-200",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    badgeDot: "bg-indigo-500",
  },
  waiting: {
    label: "Waiting",
    dot: "bg-zinc-400",
    avatarRing: "ring-zinc-200",
    badge: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    badgeDot: "bg-zinc-400",
  },
  warning: {
    label: "Attention",
    dot: "bg-orange-500",
    avatarRing: "ring-orange-200",
    badge: "bg-orange-50 text-orange-700 ring-orange-200/70",
    badgeDot: "bg-orange-500",
  },
  unavailable: {
    label: "Unavailable",
    dot: "bg-zinc-300",
    avatarRing: "ring-zinc-100",
    badge: "bg-zinc-50 text-zinc-500 ring-zinc-200",
    badgeDot: "bg-zinc-300",
  },
};
