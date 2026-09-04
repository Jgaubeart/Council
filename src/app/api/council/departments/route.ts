import { NextResponse } from "next/server";
import {
  departments,
  type RoutableDepartmentId,
} from "@/config/council";
import {
  DEFAULT_COUNCIL_AGENT_MODEL,
  runDepartmentAgents,
} from "@/lib/council/run-departments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const routableDepartmentIds = new Set<RoutableDepartmentId>(
  departments
    .filter((department) => department.kind === "member")
    .map((department) => department.id as RoutableDepartmentId),
);

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as {
    transcript?: unknown;
    objective?: unknown;
    departments?: unknown;
  };

  const transcript =
    typeof payload.transcript === "string" ? payload.transcript.trim() : "";
  const objective =
    typeof payload.objective === "string" ? payload.objective.trim() : "";
  const rawDepartments = Array.isArray(payload.departments)
    ? payload.departments
    : [];

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

  if (!objective) {
    return NextResponse.json(
      { error: "An objective is required." },
      { status: 400 },
    );
  }

  if (objective.length > 1000) {
    return NextResponse.json(
      { error: "Objective must be 1000 characters or fewer." },
      { status: 400 },
    );
  }

  const departmentIds: RoutableDepartmentId[] = [];

  for (const rawDepartment of rawDepartments) {
    if (
      typeof rawDepartment !== "string" ||
      !routableDepartmentIds.has(rawDepartment as RoutableDepartmentId)
    ) {
      return NextResponse.json(
        { error: "Unsupported department ID." },
        { status: 400 },
      );
    }

    departmentIds.push(rawDepartment as RoutableDepartmentId);
  }

  if (departmentIds.length === 0) {
    return NextResponse.json(
      { error: "At least one department is required." },
      { status: 400 },
    );
  }

  if (departmentIds.length > 3) {
    return NextResponse.json(
      { error: "At most three departments may be selected." },
      { status: 400 },
    );
  }

  if (new Set(departmentIds).size !== departmentIds.length) {
    return NextResponse.json(
      { error: "Duplicate department IDs are not allowed." },
      { status: 400 },
    );
  }

  const model =
    process.env.COUNCIL_AGENT_MODEL?.trim() || DEFAULT_COUNCIL_AGENT_MODEL;

  try {
    const results = await runDepartmentAgents({
      transcript,
      objective,
      departmentIds,
      model,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Department agent run failed:", error);

    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Department agents failed." },
      { status: 502 },
    );
  }
}
