import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
