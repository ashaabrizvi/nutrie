import { createClient } from "@/lib/supabase-server";
import SignOutButton from "@/components/SignOutButton";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name, goal, calorie_target")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-heading text-2xl font-extrabold text-accent">
        Welcome, {profile?.name ?? "there"} 👋
      </h1>
      <p className="text-sm text-muted">
        Onboarding complete. Goal: {profile?.goal} · Target: {profile?.calorie_target} kcal
      </p>
      <p className="text-xs text-muted">
        The real home screen (calorie ring, food logging, etc.) lands in Phase 2.
      </p>
      <SignOutButton />
    </div>
  );
}
