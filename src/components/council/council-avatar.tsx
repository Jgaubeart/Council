import type { VisualState } from "@/config/council";
import { visualStateMeta } from "./visual-state";

export type AvatarSize = "sm" | "md" | "lg";

interface CouncilAvatarProps {
  name: string;
  initials: string;
  state: VisualState;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-12 w-12 text-sm",
  md: "h-20 w-20 text-xl",
  lg: "h-28 w-28 text-3xl",
};

const dotClasses: Record<AvatarSize, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function CouncilAvatar({
  name,
  initials,
  state,
  size = "md",
}: CouncilAvatarProps) {
  const meta = visualStateMeta[state];

  return (
    <div
      className="relative"
      role="img"
      aria-label={`${name} avatar, ${meta.label}`}
    >
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-700 shadow-sm ring-1 ring-inset ${meta.avatarRing}`}
      >
        <span className="font-mono font-medium tracking-tight">{initials}</span>
      </div>
      <span
        aria-hidden="true"
        className={`${dotClasses[size]} ${meta.dot} absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white`}
      />
    </div>
  );
}
