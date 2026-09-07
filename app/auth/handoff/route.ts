import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const TARGETS = {
  star: "https://www.cruciblestar.com",
  forge: "https://www.crucibleforge.org",
} as const;

type TargetName = keyof typeof TARGETS;

function safeNext(value: string | null, target: TargetName) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return target === "star" ? "/star" : "/sound-furnace";
}

function currentHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
}

function hostnameMatchesTarget(hostname: string, target: TargetName) {
  if (target === "star") return hostname === "cruciblestar.com" || hostname === "www.cruciblestar.com";
  return hostname === "crucibleforge.org" || hostname === "www.crucibleforge.org";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const targetParam = request.nextUrl.searchParams.get("target");
  if (targetParam !== "star" && targetParam !== "forge") {
    return noStore(NextResponse.json({ error: "invalid-target" }, { status: 400 }));
  }

  const target = targetParam as TargetName;
  const next = safeNext(request.nextUrl.searchParams.get("next"), target);
  const hostname = currentHostname(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      const resume = `/auth/handoff?target=${encodeURIComponent(target)}&next=${encodeURIComponent(next)}`;
      loginUrl.searchParams.set("next", resume);
      return noStore(NextResponse.redirect(loginUrl, 303));
    }

    if (hostnameMatchesTarget(hostname, target)) {
      const localUrl = request.nextUrl.clone();
      localUrl.pathname = next;
      localUrl.search = "";
      return noStore(NextResponse.redirect(localUrl, 303));
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });

    if (error || !data.properties?.action_link) {
      throw error ?? new Error("Crucible could not create a one-time handoff.");
    }

    // Parse the exact token Supabase placed in the generated verify URL. The
    // one-time token is transferred to the other Crucible domain in a POST body,
    // never in our browser URL or history.
    const actionUrl = new URL(data.properties.action_link);
    const tokenHash = actionUrl.searchParams.get("token");
    const verificationType = data.properties.verification_type;

    if (!tokenHash || verificationType !== "magiclink") {
      throw new Error("Crucible received an invalid one-time handoff token.");
    }

    const targetOrigin = TARGETS[target];
    const targetAction = `${targetOrigin}/auth/handoff/complete`;
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Opening Crucible…</title>
</head>
<body style="margin:0;background:#070605;color:white;font-family:system-ui,sans-serif;display:grid;min-height:100vh;place-items:center">
  <main style="text-align:center;padding:24px">
    <strong>Opening ${target === "star" ? "CrucibleStar" : "Crucible Forge"}…</strong>
    <p style="opacity:.55;font-size:13px">Using your existing Crucible sign-in.</p>
  </main>
  <form method="post" action="${targetAction}">
    <input type="hidden" name="token_hash" value="${escapeHtml(tokenHash)}" />
    <input type="hidden" name="type" value="magiclink" />
    <input type="hidden" name="next" value="${escapeHtml(next)}" />
  </form>
  <script nonce="${nonce}">document.forms[0].submit();</script>
</body>
</html>`;

    const response = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": `default-src 'none'; form-action ${targetOrigin}; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'`,
        "X-Content-Type-Options": "nosniff",
      },
    });
    return noStore(response);
  } catch (error) {
    console.error("Cross-domain auth handoff failed", {
      message: error instanceof Error ? error.message : "unknown",
      target,
    });

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "session");
    return noStore(NextResponse.redirect(loginUrl, 303));
  }
}
