import { NextResponse } from "next/server";
import { evaluateConversation } from "@/lib/pipeline/evaluate";
import type { TerminalAction } from "@/lib/pipeline/facts";

const TERMINALS: readonly TerminalAction[] = [
  "left",
  "confirmed",
  "self_fixed",
  "requested_human",
  "reopen",
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    conversationId?: string;
    scenarioId?: string;
    messages?: Array<{ role: "customer" | "agent"; text: string }>;
    terminal?: TerminalAction;
  };

  if (!body.conversationId || !body.messages || !body.terminal) {
    return NextResponse.json({ error: "conversationId, messages, and terminal are required" }, { status: 400 });
  }
  if (!TERMINALS.includes(body.terminal)) {
    return NextResponse.json({ error: "unknown terminal" }, { status: 400 });
  }

  const result = await evaluateConversation({
    conversationId: body.conversationId,
    messages: body.messages,
    terminal: body.terminal,
    scenarioId: body.scenarioId,
  });

  return NextResponse.json(result);
}
