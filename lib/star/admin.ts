import type { User } from "@supabase/supabase-js";

// Only server-controlled app metadata or an explicit server allowlist grants access.
export function isStarAdmin(user: Pick<User, "id" | "app_metadata"> | null) {
  if (!user) return false;
  const ids = (process.env.CRUCIBLE_STAR_ADMIN_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  return ids.includes(user.id) || user.app_metadata?.role === "admin";
}
