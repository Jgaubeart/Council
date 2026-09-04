import OpenAI from "openai";
import { NextResponse } from "next/server";
import { departments } from "@/config/council";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedVoices = new Set(departments.map((department) => department.voice));
const maxInputLength = 4096;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { text?: unknown; voice?: unknown };
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const voice = typeof payload.voice === "string" ? payload.voice : "";

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  if (text.length > maxInputLength) {
    return NextResponse.json(
      { error: `Text must be ${maxInputLength} characters or fewer.` },
      { status: 400 },
    );
  }

  if (!allowedVoices.has(voice)) {
    return NextResponse.json({ error: "Unknown voice." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey });
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Speech generation failed:", error);

    return NextResponse.json(
      { error: "Speech generation failed." },
      { status: 502 },
    );
  }
}
