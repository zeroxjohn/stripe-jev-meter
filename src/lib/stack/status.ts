import { existsSync } from "node:fs";
import { join } from "node:path";

export type StripeKeyKind = "missing" | "claimable" | "secret";
export type BillingAdapter = "memory" | "stripe";
export type EvaluatorAdapter = "recorded" | "jev";
export type LedgerAdapter = "memory" | "file" | "postgres";
export type ProjectsState = "missing" | "initialized";

export type StackStatus = {
  billingAdapter: BillingAdapter;
  stripeKeyKind: StripeKeyKind;
  evaluatorAdapter: EvaluatorAdapter;
  ledgerAdapter: LedgerAdapter;
  projects: ProjectsState;
  blockers: string[];
};

export function classifyStripeKey(key: string | undefined): StripeKeyKind {
  if (!key) return "missing";
  if (key.startsWith("rkcs_")) return "claimable";
  return "secret";
}

export function classifyBillingAdapter(
  kind: StripeKeyKind,
  backend = process.env.STRIPE_BILLING_BACKEND,
): BillingAdapter {
  if (kind === "secret" || backend === "cli") return "stripe";
  return "memory";
}

export function classifyEvaluatorAdapter(
  typesafeKey?: string,
  openrouterKey?: string,
): EvaluatorAdapter {
  return typesafeKey || openrouterKey ? "jev" : "recorded";
}

export function classifyProjectsState(cwd = process.cwd()): ProjectsState {
  const projectFile = join(cwd, ".projects", "project.json");
  return existsSync(projectFile) ? "initialized" : "missing";
}

export function persistEnabled(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
): boolean {
  const merged = { ...process.env, ...env } as Record<string, string | undefined>;
  if (merged.VITEST === "true" || merged.NODE_ENV === "test") return false;
  if (merged.DATABASE_URL?.trim()) return true;
  if (merged.VERCEL === "1") return false;
  return true;
}

export function classifyLedgerAdapter(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
): LedgerAdapter {
  const merged = { ...process.env, ...env } as Record<string, string | undefined>;
  if (merged.DATABASE_URL?.trim()) return "postgres";
  if (persistEnabled(env)) return "file";
  return "memory";
}

export function readStackStatus(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >,
): StackStatus {
  const stripeKeyKind = classifyStripeKey(env.STRIPE_SECRET_KEY);
  const billingAdapter = classifyBillingAdapter(
    stripeKeyKind,
    env.STRIPE_BILLING_BACKEND,
  );
  const evaluatorAdapter = classifyEvaluatorAdapter(
    env.TYPESAFE_API_KEY,
    env.OPENROUTER_API_KEY,
  );
  const ledgerAdapter = classifyLedgerAdapter(env);
  const projects = classifyProjectsState();
  const blockers: string[] = [];

  if (projects === "missing") {
    blockers.push(
      "Stripe Projects init needs a live-mode Stripe account. Test-mode meters and the local demo do not.",
    );
  }
  if (billingAdapter !== "stripe") {
    blockers.push("A claimed test secret key or STRIPE_BILLING_BACKEND=cli is required before live meter events");
  }

  return {
    billingAdapter,
    stripeKeyKind,
    evaluatorAdapter,
    ledgerAdapter,
    projects,
    blockers,
  };
}
