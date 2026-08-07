# Code Furnace Guardrails

Included:
- Hard per-job dollar, token, runtime, retry, and tool-call limits
- Default-deny action policy
- Workspace path restrictions
- External side effects disabled by default
- Mission-boundary prompt construction
- Basic prompt-injection flagging
- Archive path-traversal protection
- Audit event structure
- Protected API-route starter

This is a foundation, not a complete production sandbox. Production still needs isolated disposable containers, denied network egress, no production credentials, CPU/memory/process/disk limits, immutable audit storage, real-time provider metering, authentication, rate limits, dependency approval, and deterministic validation.

Copy the folders into the repository root. The starter endpoint becomes `POST /api/code-furnace`.
