import { createHash } from "node:crypto";
import {
  asSnapshotId,
  nowTimestamp,
  type ConversationId,
  type EvidenceSnapshot,
  type Timestamp,
} from "@/lib/domain";
import type { ChatTurn } from "./facts";

export function captureSnapshot(input: {
  conversationId: ConversationId;
  messages: ChatTurn[];
  now?: Timestamp;
}): EvidenceSnapshot {
  const redacted = input.messages
    .map((turn) => `${turn.role}: ${turn.text}`)
    .join("\n");
  const contentHash = createHash("sha256").update(redacted).digest("hex");
  const capturedAt = input.now ?? nowTimestamp();
  return {
    snapshotId: asSnapshotId(`snap_${contentHash.slice(0, 16)}`),
    conversationId: input.conversationId,
    contentHash,
    capturedAt,
    redactedTranscriptRef: `memory:${input.conversationId}`,
    policyExcerptRef: "policy:refunds-require-receipt",
    references: [],
  };
}
