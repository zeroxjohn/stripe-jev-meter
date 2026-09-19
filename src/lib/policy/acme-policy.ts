import {
  asMeterName,
  asPolicyVersion,
  hours,
  type BillingPolicy,
} from "@/lib/domain";

export const ACME_POLICY: BillingPolicy = {
  policyVersion: asPolicyVersion("policy-poc-1"),
  silenceWindow: hours(24),
  autoBillConfidence: 0.9,
  reviewConfidenceFloor: 0.7,
  gradeMeters: {
    full: asMeterName("support_resolution_full"),
    partial: asMeterName("support_resolution_partial"),
  },
};
