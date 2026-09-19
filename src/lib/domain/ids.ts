export type ConversationId = string & { readonly brand: "ConversationId" };
export type CustomerId = string & { readonly brand: "CustomerId" };
export type SnapshotId = string & { readonly brand: "SnapshotId" };
export type EvaluationId = string & { readonly brand: "EvaluationId" };
export type BillingEventId = string & { readonly brand: "BillingEventId" };
export type PolicyVersion = string & { readonly brand: "PolicyVersion" };
export type RubricVersion = string & { readonly brand: "RubricVersion" };
export type MeterName = string & { readonly brand: "MeterName" };
export type Timestamp = string & { readonly brand: "Timestamp" };

export type Duration = {
  readonly ms: number;
};

export function asConversationId(value: string): ConversationId {
  return value as ConversationId;
}

export function asCustomerId(value: string): CustomerId {
  return value as CustomerId;
}

export function asSnapshotId(value: string): SnapshotId {
  return value as SnapshotId;
}

export function asEvaluationId(value: string): EvaluationId {
  return value as EvaluationId;
}

export function asBillingEventId(value: string): BillingEventId {
  return value as BillingEventId;
}

export function asPolicyVersion(value: string): PolicyVersion {
  return value as PolicyVersion;
}

export function asRubricVersion(value: string): RubricVersion {
  return value as RubricVersion;
}

export function asMeterName(value: string): MeterName {
  return value as MeterName;
}

export function asTimestamp(value: string): Timestamp {
  return value as Timestamp;
}

export function nowTimestamp(now = new Date()): Timestamp {
  return asTimestamp(now.toISOString());
}

export function durationMs(ms: number): Duration {
  return { ms };
}

export function hours(count: number): Duration {
  return durationMs(count * 60 * 60 * 1000);
}

export function timestampMs(value: Timestamp): number {
  return Date.parse(value);
}

export function elapsedSince(from: Timestamp, now: Timestamp): Duration {
  return durationMs(timestampMs(now) - timestampMs(from));
}

export function isAtLeast(left: Duration, right: Duration): boolean {
  return left.ms >= right.ms;
}

export function subtractDuration(now: Timestamp, duration: Duration): Timestamp {
  return asTimestamp(new Date(timestampMs(now) - duration.ms).toISOString());
}
