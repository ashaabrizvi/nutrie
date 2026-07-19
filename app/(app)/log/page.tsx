import { createClient } from "@/lib/supabase-server";
import { getTodayIST } from "@/lib/date";
import LogScreen from "@/components/LogScreen";
import type { FoodLog } from "@/types";

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;
  const today = getTodayIST();

  const [{ data: profile }, { data: logs }] = await Promise.all([
    supabase.from("users").select("language").eq("id", userId).single(),
    supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", today)
      .eq("is_deleted", false)
      .order("logged_at", { ascending: true }),
  ]);

  return (
    <LogScreen
      userId={userId}
      language={(profile?.language as "en" | "hi") ?? "en"}
      initialDate={today}
      initialLogs={(logs ?? []) as FoodLog[]}
    />
  );
}
