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
    const result = await client.realtime.clientSecrets.create({
      expires_after: {
        anchor: "created_at",
        seconds: 300,
      },
      session: {
        type: "transcription",
        audio: {
          input: {
            transcription: {
              model: "gpt-realtime-whisper",
              language: "en",
            },
            turn_detection: null,
          },
        },
      },
    });

    return NextResponse.json({
      client_secret: result.value,
      expires_at: result.expires_at,
    });
  } catch (error) {
    console.error("Failed to create transcription session:", error);

    return NextResponse.json(
      { error: "Unable to create transcription session." },
      { status: 502 },
    );
  }
}
