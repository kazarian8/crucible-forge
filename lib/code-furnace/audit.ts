export type AuditEvent = {
  at: string;
  jobId: string;
  action: string;
  target?: string;
  result: "allowed" | "blocked" | "completed" | "failed";
  reason?: string;
};

export function createAuditEvent(event: Omit<AuditEvent, "at">): AuditEvent {
  return { at: new Date().toISOString(), ...event };
}
