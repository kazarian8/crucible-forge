function getAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = (
    process.env.CRUCIBLE_SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY
  )?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase billing administration is not configured.");
  }

  return { supabaseUrl, serviceRoleKey };
}

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { supabaseUrl, serviceRoleKey } = getAdminConfig();
  const headers = new Headers(init?.headers);
  headers.set("apikey", serviceRoleKey);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Modern sb_secret_* keys are opaque API keys, not JWTs. Supabase's API
  // gateway maps them to service_role from the apikey header. Legacy
  // service_role JWT keys still need the Bearer header for PostgREST.
  if (!serviceRoleKey.startsWith("sb_secret_")) {
    headers.set("Authorization", `Bearer ${serviceRoleKey}`);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase billing request failed with ${response.status}: ${text}`,
    );
  }

  return (text ? JSON.parse(text) : null) as T;
}
