"use client";

import { useState, type ReactNode } from "react";
import {
  conversationModes,
  type ConversationMode,
} from "@/config/council";
import { InterruptIcon, MicIcon, MuteIcon } from "./icons";

function ControlButton({
  label,
  children,
  variant = "default",
}: {
  label: string;
  children: ReactNode;
  variant?: "default" | "danger";
}) {
  const styles =
    variant === "danger"
      ? "text-zinc-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      : "text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-500 transition-colors ${styles}`}
    >
      {children}
    </button>
  );
}

export function ConversationBar() {
  const [mode, setMode] = useState<ConversationMode>("council");

  return (
    <section className="shrink-0 border-t border-zinc-200/80 bg-white/95 px-6 py-4 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <ControlButton label="Microphone">
            <MicIcon className="h-5 w-5" />
          </ControlButton>
          <ControlButton label="Mute">
            <MuteIcon className="h-5 w-5" />
          </ControlButton>
          <ControlButton label="Interrupt" variant="danger">
            <InterruptIcon className="h-5 w-5" />
          </ControlButton>
        </div>

        <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3">
          <p className="truncate text-sm text-zinc-400">
            Ask Council anything about the business...
          </p>
        </div>

        <div
          role="group"
          aria-label="Conversation mode"
          className="flex items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-50 p-1"
        >
          {conversationModes.map((option) => {
            const selected = option.id === mode;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setMode(option.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
