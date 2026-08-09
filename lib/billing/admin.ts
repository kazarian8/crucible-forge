function getAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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
