"use client";

import { useEffect, useRef, useState } from "react";

export type TranscriptionStatus =
  | "idle"
  | "requesting_permission"
  | "connecting"
  | "listening"
  | "finalizing"
  | "error";

export interface CouncilTranscriptionController {
  status: TranscriptionStatus;
  error: string | null;
  partialTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
}

interface TranscriptionDeltaEvent {
  type: "conversation.item.input_audio_transcription.delta";
  delta?: string;
}

interface TranscriptionCompletedEvent {
  type: "conversation.item.input_audio_transcription.completed";
  transcript: string;
}

interface RealtimeErrorEvent {
  type: "error";
  error?: {
    message?: string;
  };
}

type RealtimeServerMessage =
  | TranscriptionDeltaEvent
  | TranscriptionCompletedEvent
  | RealtimeErrorEvent
  | { type: string };

function friendlyError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Microphone permission was denied. Allow microphone access and try again.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone was found on this device.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The microphone is already in use by another application.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Microphone access failed.";
}

export function useCouncilTranscription(): CouncilTranscriptionController {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const activeRef = useRef(false);
  const finalizingRef = useRef(false);
  const partialRef = useRef("");
  const finalRef = useRef("");
  const runIdRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const finalizeTimeoutRef = useRef<number | null>(null);

  const clearFinalizeTimeout = () => {
    if (finalizeTimeoutRef.current !== null) {
      window.clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
  };

  const resetResources = () => {
    runIdRef.current += 1;
    activeRef.current = false;
    finalizingRef.current = false;
    clearFinalizeTimeout();

    dataChannelRef.current?.close();
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    dataChannelRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
  };

  const handleMessage = (
    event: MessageEvent<string>,
    runId: number,
  ) => {
    if (runId !== runIdRef.current) {
      return;
    }

    let message: RealtimeServerMessage;

    try {
      message = JSON.parse(event.data) as RealtimeServerMessage;
    } catch {
      return;
    }

    if (
      message.type ===
      "conversation.item.input_audio_transcription.delta"
    ) {
      const deltaEvent = message as TranscriptionDeltaEvent;
      const delta = deltaEvent.delta ?? "";
      partialRef.current += delta;
      setPartialTranscript(partialRef.current);
      return;
    }

    if (
      message.type ===
      "conversation.item.input_audio_transcription.completed"
    ) {
      const completedEvent = message as TranscriptionCompletedEvent;
      const transcript = completedEvent.transcript.trim();

      if (transcript) {
        finalRef.current = finalRef.current
          ? `${finalRef.current} ${transcript}`
          : transcript;
        setFinalTranscript(finalRef.current);
      }

      partialRef.current = "";
      setPartialTranscript("");

      if (finalizingRef.current) {
        clearFinalizeTimeout();
        resetResources();
        setStatus("idle");
      }

      return;
    }

    if (message.type === "error") {
      const errorEvent = message as RealtimeErrorEvent;
      setError(errorEvent.error?.message ?? "Realtime transcription failed.");
      setStatus("error");
      resetResources();
    }
  };

  const startListening = async () => {
    if (activeRef.current) {
      return;
    }

    activeRef.current = true;
    runIdRef.current += 1;
    const runId = runIdRef.current;

    partialRef.current = "";
    finalRef.current = "";
    setPartialTranscript("");
    setFinalTranscript("");
    setError(null);
    setStatus("requesting_permission");

    if (!window.isSecureContext) {
      setError(
        "Microphone access requires HTTPS or localhost in this browser.",
      );
      setStatus("error");
      resetResources();
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof RTCPeerConnection === "undefined"
    ) {
      setError("This browser does not support microphone WebRTC capture.");
      setStatus("error");
      resetResources();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (runId !== runIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setStatus("connecting");

      const sessionResponse = await fetch(
        "/api/realtime/transcription-session",
        {
          method: "POST",
        },
      );

      if (!sessionResponse.ok) {
        throw new Error("Unable to create a transcription session.");
      }

      const sessionPayload = (await sessionResponse.json()) as {
        client_secret?: string;
      };

      if (!sessionPayload.client_secret) {
        throw new Error("No transcription credential was returned.");
      }

      if (runId !== runIdRef.current) {
        return;
      }

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      const dataChannel = peer.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.addEventListener("message", (event) =>
        handleMessage(event as MessageEvent<string>, runId),
      );

      stream.getAudioTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime/transcription_sessions?model=gpt-4o-mini-transcribe",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionPayload.client_secret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );

      if (!sdpResponse.ok) {
        throw new Error("Could not establish a realtime transcription connection.");
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      await peer.setRemoteDescription(answer);

      if (runId !== runIdRef.current) {
        return;
      }

      setStatus("listening");
    } catch (listeningError) {
      if (runId !== runIdRef.current) {
        return;
      }

      setError(friendlyError(listeningError));
      setStatus("error");
      resetResources();
    }
  };

  const stopListening = () => {
    if (!activeRef.current) {
      return;
    }

    finalizingRef.current = true;
    setStatus("finalizing");

    streamRef.current?.getAudioTracks().forEach((track) => track.stop());

    clearFinalizeTimeout();
    finalizeTimeoutRef.current = window.setTimeout(() => {
      if (!activeRef.current) {
        return;
      }

      const partial = partialRef.current.trim();

      if (!finalRef.current && partial) {
        finalRef.current = partial;
        setFinalTranscript(partial);
      }

      partialRef.current = "";
      setPartialTranscript("");
      resetResources();
      setStatus("idle");
    }, 1800);
  };

  const cancel = () => {
    clearFinalizeTimeout();
    resetResources();
    partialRef.current = "";
    finalRef.current = "";
    setPartialTranscript("");
    setFinalTranscript("");
    setError(null);
    setStatus("idle");
  };

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      activeRef.current = false;
      finalizingRef.current = false;

      if (finalizeTimeoutRef.current !== null) {
        window.clearTimeout(finalizeTimeoutRef.current);
        finalizeTimeoutRef.current = null;
      }

      dataChannelRef.current?.close();
      peerRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      dataChannelRef.current = null;
      peerRef.current = null;
      streamRef.current = null;
    };
  }, []);

  return {
    status,
    error,
    partialTranscript,
    finalTranscript,
    isListening: status === "listening" || status === "finalizing",
    startListening,
    stopListening,
    cancel,
  };
}
