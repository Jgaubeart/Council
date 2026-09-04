"use client";

import { useState, type ReactNode } from "react";
import {
  conversationModes,
  departments,
  type ConversationMode,
} from "@/config/council";
import type { CouncilSpeechController } from "@/hooks/use-council-speech";
import type { CouncilTranscriptionController } from "@/hooks/use-council-transcription";
import type { DepartmentRunStatus } from "@/hooks/use-council-departments";
import {
  CancelIcon,
  MicIcon,
  MuteIcon,
  ReplayIcon,
  StopIcon,
} from "./icons";

interface ConversationBarProps {
  speech: CouncilSpeechController;
  transcription: CouncilTranscriptionController;
  departmentStatus: DepartmentRunStatus;
  departmentCouncilError: string | null;
}

const departmentNameById = new Map(
  departments.map((department) => [department.id, department.name]),
);

function ControlButton({
  label,
  children,
  onClick,
  disabled = false,
  active = false,
  variant = "default",
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const variantClasses =
    variant === "primary"
      ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
      : variant === "danger"
        ? "text-zinc-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        : "text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-200/80 bg-white px-3.5 text-sm font-medium text-zinc-600 transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : variantClasses
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function ConversationBar({
  speech,
  transcription,
  departmentStatus,
  departmentCouncilError,
}: ConversationBarProps) {
  const [mode, setMode] = useState<ConversationMode>("council");
  const speakerName = speech.transcript
    ? (departmentNameById.get(speech.transcript.departmentId) ?? "Council")
    : null;

  const micText =
    transcription.partialTranscript || transcription.finalTranscript;
  const micActive =
    transcription.status === "listening" ||
    transcription.status === "finalizing";
  const micBlocked =
    transcription.status === "requesting_permission" ||
    transcription.status === "connecting";
  const talkDisabled =
    micBlocked ||
    transcription.status === "listening" ||
    transcription.status === "finalizing";

  const handleTalk = () => {
    speech.stop();
    transcription.startListening();
  };

  return (
    <section className="shrink-0 border-t border-zinc-200/80 bg-white/95 px-6 py-4 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <ControlButton
            label="Talk to Council"
            variant="primary"
            onClick={handleTalk}
            disabled={talkDisabled}
            active={micActive}
          >
            <MicIcon className="h-5 w-5" />
          </ControlButton>
          <ControlButton
            label="Stop Listening"
            onClick={transcription.stopListening}
            disabled={
              transcription.status !== "listening" &&
              transcription.status !== "finalizing"
            }
          >
            <StopIcon className="h-5 w-5" />
          </ControlButton>
          <ControlButton
            label="Cancel"
            onClick={transcription.cancel}
            disabled={transcription.status === "idle"}
          >
            <CancelIcon className="h-5 w-5" />
          </ControlButton>
          <ControlButton
            label={speech.isMuted ? "Unmute" : "Mute"}
            onClick={speech.toggleMute}
            active={speech.isMuted}
          >
            <MuteIcon className="h-5 w-5" />
          </ControlButton>
          <ControlButton
            label="Replay Demo"
            onClick={speech.replay}
            disabled={speech.isBusy || transcription.isListening}
          >
            <ReplayIcon className="h-5 w-5" />
          </ControlButton>
        </div>

        <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3">
          {transcription.error ? (
            <p className="truncate text-sm text-rose-600">
              {transcription.error}
            </p>
          ) : transcription.status === "requesting_permission" ? (
            <p className="truncate text-sm text-zinc-500">
              Requesting microphone permission…
            </p>
          ) : transcription.status === "connecting" ? (
            <p className="truncate text-sm text-zinc-500">
              Connecting to transcription…
            </p>
          ) : micActive || transcription.finalTranscript ? (
            <div className="min-w-0 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 font-medium text-zinc-700">You</span>
                <span className="truncate text-zinc-500">
                  {micText || "Listening…"}
                </span>
              </div>
              {transcription.status === "finalizing" ? (
                <p className="mt-1 text-xs text-zinc-400">
                  Finalizing transcript…
                </p>
              ) : null}
            </div>
          ) : departmentCouncilError ? (
            <p className="truncate text-sm text-rose-600">
              {departmentCouncilError}
            </p>
          ) : departmentStatus === "thinking" ? (
            <p className="truncate text-sm text-zinc-500">
              Departments are thinking…
            </p>
          ) : speech.error ? (
            <p className="truncate text-sm text-rose-600">{speech.error}</p>
          ) : speech.transcript && speakerName ? (
            <div className="min-w-0 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 font-medium text-zinc-700">
                  {speakerName}
                </span>
                <span className="truncate text-zinc-500">
                  {speech.transcript.text}
                </span>
              </div>
              {speech.phase === "loading" ? (
                <p className="mt-1 text-xs text-zinc-400">
                  Preparing speech…
                </p>
              ) : null}
            </div>
          ) : (
            <p className="truncate text-sm text-zinc-400">
              Ask Council anything about the business...
            </p>
          )}
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
