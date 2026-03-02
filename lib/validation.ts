export const VALID_STATUSES = new Set([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const VALID_SEVERITIES = new Set(["minor", "major", "critical"]);

export const VALID_GROUPS = new Set([
  "incoming_control",
  "production",
  "client",
]);

export const VALID_WORKFLOW_STEP_STATUSES = new Set([
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

export const VALID_CURRENCIES = new Set(["EUR", "USD", "GBP", "SEK"]);