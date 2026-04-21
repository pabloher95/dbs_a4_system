import { redirect } from "next/navigation";
import { LoginForm } from "../../../components/login-form";
import { createClient } from "../../../lib/supabase-server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell py-6 md:py-10">
      <LoginForm />
    </main>
  );
}
