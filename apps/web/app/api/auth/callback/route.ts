import { type NextRequest, NextResponse } from "next/server";
import { getPublicSiteUrl } from "../../../../lib/app-url";
import { createClient } from "../../../../lib/supabase-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = getPublicSiteUrl(request);

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
