import { type NextRequest } from "next/server";
import { env } from "./env";

/**
 * Public origin for redirects (OAuth/magic link callback, etc.).
 * Prefer NEXT_PUBLIC_SITE_URL on the deployed host; otherwise use proxy headers
 * so we don't redirect to localhost when the route handler sees an internal URL.
 */
export function getPublicSiteUrl(request: NextRequest): string {
  if (env.siteUrl) {
    return env.siteUrl;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim() ?? "";
    if (host) {
      return `${forwardedProto}://${host}`;
    }
  }
  return new URL(request.url).origin;
}
