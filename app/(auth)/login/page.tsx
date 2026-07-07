import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle();

    redirect(profile?.onboarded ? "/home" : "/onboarding");
  }

  return <LoginForm />;
}
