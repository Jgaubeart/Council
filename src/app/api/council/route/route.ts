import { NextResponse } from "next/server";
import {
  CouncilRouteError,
  DEFAULT_COUNCIL_MODEL,
  routeCouncilTranscript,
} from "@/lib/council/router";
import { CouncilRouteValidationError } from "@/lib/council/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { transcript?: unknown };
  const transcript =
    typeof payload.transcript === "string" ? payload.transcript.trim() : "";

  if (!transcript) {
    return NextResponse.json(
      { error: "A transcript is required." },
      { status: 400 },
    );
  }

  if (transcript.length > 4000) {
    return NextResponse.json(
      { error: "Transcript must be 4000 characters or fewer." },
      { status: 400 },
    );
  }

  const model = process.env.COUNCIL_MODEL?.trim() || DEFAULT_COUNCIL_MODEL;

  try {
    const result = await routeCouncilTranscript(transcript, model);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CouncilRouteValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    if (error instanceof CouncilRouteError) {
      const status = error.message.includes("OPENAI_API_KEY") ? 500 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Council routing failed." },
      { status: 502 },
    );
  }
}
