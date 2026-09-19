import { NextResponse } from "next/server";
import { nextAgentReply } from "@/lib/scenarios/live";
import type { ChatTurn } from "@/lib/pipeline/facts";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    scenarioId?: string;
    messages?: ChatTurn[];
  };
  if (!body.scenarioId || !body.messages) {
    return NextResponse.json({ error: "scenarioId and messages are required" }, { status: 400 });
  }
  return NextResponse.json({
    text: nextAgentReply(body.scenarioId, body.messages),
  });
}
