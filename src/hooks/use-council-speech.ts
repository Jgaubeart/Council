"use client";

import { useEffect, useRef, useState } from "react";
import {
  departments,
  type DepartmentId,
} from "@/config/council";
import {
  councilScript,
  type CouncilScriptLine,
} from "@/config/council-script";

export type SpeechPhase = "idle" | "loading" | "speaking" | "error";

export class SpeechSupersededError extends Error {
  constructor() {
    super("Speech was superseded.");
    this.name = "SpeechSupersededError";
  }
}

interface SpeechTranscript {
  departmentId: DepartmentId;
  text: string;
}

export interface CouncilSpeechController {
  activeDepartmentId: string | null;
  phase: SpeechPhase;
  transcript: SpeechTranscript | null;
  error: string | null;
  isMuted: boolean;
  isBusy: boolean;
  playDemo: () => void;
  speak: (line: CouncilScriptLine) => Promise<void>;
  stop: () => void;
  replay: () => void;
  toggleMute: () => void;
}

const voiceByDepartment = new Map(
  departments.map((department) => [department.id, department.voice]),
);

function waitForAudioEnd(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("pause", handlePause);
    };

    const handleEnded = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Audio playback failed."));
    };

    const handlePause = () => {
      cleanup();
      resolve();
    };

    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    audio.addEventListener("pause", handlePause, { once: true });
  });
}

export function useCouncilSpeech(): CouncilSpeechController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<CouncilScriptLine[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(
    null,
  );
  const [phase, setPhase] = useState<SpeechPhase>("idle");
  const [transcript, setTranscript] = useState<SpeechTranscript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const getAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.muted = isMuted;
      audioRef.current = audio;
    }

    return audioRef.current;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      abortRef.current?.abort();
      audioRef.current?.pause();
    };
  }, []);

  const fetchSpeech = async (
    line: CouncilScriptLine,
    signal: AbortSignal,
  ) => {
    const voice = voiceByDepartment.get(line.departmentId);

    const response = await fetch("/api/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: line.text,
        voice,
      }),
      signal,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      throw new Error(payload?.error ?? "Speech generation failed.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const playLine = async (line: CouncilScriptLine, runId: number) => {
    const audio = getAudio();

    audio.pause();

    if (audio.src) {
      URL.revokeObjectURL(audio.src);
      audio.removeAttribute("src");
    }

    setActiveDepartmentId(line.departmentId);
    setTranscript({ departmentId: line.departmentId, text: line.text });
    setError(null);
    setPhase("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    let objectUrl: string | null = null;

    try {
      objectUrl = await fetchSpeech(line, controller.signal);

      if (runId !== runIdRef.current) {
        throw new SpeechSupersededError();
      }

      audio.src = objectUrl;
      await audio.play();

      if (runId !== runIdRef.current) {
        throw new SpeechSupersededError();
      }

      setPhase("speaking");
      await waitForAudioEnd(audio);

      if (runId !== runIdRef.current) {
        throw new SpeechSupersededError();
      }
    } catch (error) {
      if (
        runId !== runIdRef.current ||
        error instanceof SpeechSupersededError
      ) {
        throw new SpeechSupersededError();
      }

      throw error;
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const runQueue = async (runId: number) => {
    while (queueRef.current.length > 0 && runId === runIdRef.current) {
      const line = queueRef.current[0];

      try {
        await playLine(line, runId);
      } catch (playbackError) {
        if (
          runId !== runIdRef.current ||
          playbackError instanceof SpeechSupersededError
        ) {
          return;
        }

        setPhase("error");
        setError(
          playbackError instanceof Error
            ? playbackError.message
            : "Speech generation failed.",
        );
        return;
      }

      if (runId !== runIdRef.current) {
        return;
      }

      queueRef.current.shift();
    }

    if (runId === runIdRef.current) {
      setActiveDepartmentId(null);
      setTranscript(null);
      setPhase("idle");
    }
  };

  const start = (lines: CouncilScriptLine[]) => {
    runIdRef.current += 1;
    abortRef.current?.abort();

    const audio = getAudio();
    audio.pause();

    if (audio.src) {
      URL.revokeObjectURL(audio.src);
      audio.removeAttribute("src");
    }

    queueRef.current = [...lines];
    setActiveDepartmentId(null);
    setTranscript(null);
    setError(null);
    setPhase("idle");

    const runId = runIdRef.current;
    void runQueue(runId);
  };

  const speak = async (line: CouncilScriptLine): Promise<void> => {
    runIdRef.current += 1;
    const runId = runIdRef.current;
    abortRef.current?.abort();

    const audio = getAudio();
    audio.pause();

    if (audio.src) {
      URL.revokeObjectURL(audio.src);
      audio.removeAttribute("src");
    }

    queueRef.current = [];
    setActiveDepartmentId(null);
    setTranscript(null);
    setError(null);
    setPhase("idle");

    try {
      await playLine(line, runId);
    } catch (speechError) {
      if (speechError instanceof SpeechSupersededError) {
        throw speechError;
      }

      setPhase("error");
      setError(
        speechError instanceof Error
          ? speechError.message
          : "Speech generation failed.",
      );
      throw speechError;
    }

    if (runId === runIdRef.current) {
      setActiveDepartmentId(null);
      setTranscript(null);
      setPhase("idle");
    }
  };

  const stop = () => {
    runIdRef.current += 1;
    abortRef.current?.abort();
    queueRef.current = [];

    const audio = audioRef.current;

    if (audio) {
      audio.pause();

      if (audio.src) {
        URL.revokeObjectURL(audio.src);
        audio.removeAttribute("src");
      }
    }

    setActiveDepartmentId(null);
    setTranscript(null);
    setError(null);
    setPhase("idle");
  };

  return {
    activeDepartmentId,
    phase,
    transcript,
    error,
    isMuted,
    isBusy: phase === "loading" || phase === "speaking",
    playDemo: () => start(councilScript),
    speak,
    stop,
    replay: () => start(councilScript),
    toggleMute: () => setIsMuted((current) => !current),
  };
}
