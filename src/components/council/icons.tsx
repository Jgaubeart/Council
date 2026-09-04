interface IconProps {
  className?: string;
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
    </svg>
  );
}

export function MuteIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 10.4 6.1" />
      <path d="M19 10v1a7 7 0 0 1-1.4 4.3" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

export function InterruptIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h6v6H9z" />
    </svg>
  );
}

export function SignalIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 18h.01" />
      <path d="M9 15h.01" />
      <path d="M13 12h.01" />
      <path d="M17 9h.01" />
    </svg>
  );
}
