import { createHash } from "node:crypto";
import { adminRequest } from "../billing/admin";

export type PartnerClient = {
  id: string;
  name: string;
  scopes: string[];
  active: boolean;
  rate_limit_per_minute: number;
};

type RateResult = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

export class PartnerApiError extends Error {
  status: number;
  headers: Record<string, string>;

  constructor(message: string, status: number, headers: Record<string, string> = {}) {
    super(message);
    this.name = "PartnerApiError";
    this.status = status;
    this.headers = headers;
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function readApiKey(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (/^Bearer\s+/i.test(authorization)) return authorization.replace(/^Bearer\s+/i, "").trim();
  return request.headers.get("x-crucible-api-key")?.trim() ?? "";
}

export async function authenticatePartner(request: Request, requiredScope: string) {
  const key = readApiKey(request);
  if (!key || !key.startsWith("cvp_live_")) {
    throw new PartnerApiError("A valid Crucible partner API key is required.", 401);
  }

  const rows = await adminRequest<PartnerClient[]>(
    `partner_api_clients?key_hash=eq.${sha256(key)}&active=eq.true&select=id,name,scopes,active,rate_limit_per_minute&limit=1`,
  );
  const client = rows[0];
  if (!client) throw new PartnerApiError("Invalid partner API key.", 401);
  if (!client.scopes?.includes(requiredScope)) {
    throw new PartnerApiError(`This API key does not have the ${requiredScope} scope.`, 403);
  }

  const rateRows = await adminRequest<RateResult[]>("rpc/consume_partner_api_request", {
    method: "POST",
    body: JSON.stringify({ p_client_id: client.id }),
  });
  const rate = rateRows[0];
  if (!rate?.allowed) {
    throw new PartnerApiError("Partner API rate limit exceeded.", 429, {
      "Retry-After": "60",
      "X-RateLimit-Remaining": "0",
      ...(rate?.reset_at ? { "X-RateLimit-Reset": rate.reset_at } : {}),
    });
  }

  return {
    client,
    rateHeaders: {
      "X-RateLimit-Limit": String(client.rate_limit_per_minute),
      "X-RateLimit-Remaining": String(rate.remaining),
      "X-RateLimit-Reset": rate.reset_at,
    },
  };
}

export function hashPartnerSecret(value: string) {
  return sha256(value);
}
