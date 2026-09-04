import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    const session = await client.beta.realtime.transcriptionSessions.create({
      input_audio_format: "pcm16",
      input_audio_transcription: {
        model: "gpt-4o-mini-transcribe",
        language: "en",
      },
      turn_detection: {
        type: "server_vad",
      },
      client_secret: {
        expires_at: {
          anchor: "created_at",
          seconds: 300,
        },
      },
    });

    return NextResponse.json({
      client_secret: session.client_secret.value,
      expires_at: session.client_secret.expires_at,
    });
  } catch (error) {
    console.error("Failed to create transcription session:", error);

    return NextResponse.json(
      { error: "Unable to create transcription session." },
      { status: 502 },
    );
  }
}
