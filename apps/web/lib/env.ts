const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/** Set on Vercel to your public URL (e.g. https://app.vercel.app) so auth redirects and magic links never use the wrong host. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || undefined;

if (!supabaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabasePublishableKey) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export const env = {
  supabaseUrl,
  supabasePublishableKey,
  siteUrl
};
