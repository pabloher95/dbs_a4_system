import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "./env";

type CookieMutation = {
  name: string;
  value: string;
  options?: Parameters<(typeof cookies extends never ? never : Awaited<ReturnType<typeof cookies>>)["set"]>[2];
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies during render.
        }
      }
    }
  });
}
