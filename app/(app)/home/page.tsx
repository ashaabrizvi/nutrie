import { createClient } from "@/lib/supabase-server";
import { getTodayIST } from "@/lib/date";
import HomeScreen from "@/components/HomeScreen";
import type { FoodLog } from "@/types";
import type { QuickAddItem } from "@/components/QuickAdd";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;
  const today = getTodayIST();

  const [{ data: profile }, { data: todayLogs }, { data: waterRow }, { data: recentLogs }, { data: allLogDates }, { data: bodyLogs }] =
    await Promise.all([
      supabase
        .from("users")
        .select("name, language, streak, calorie_target, protein_target, carb_target, fat_target, water_target, weight_kg")
        .eq("id", userId)
        .single(),
      supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", today)
        .eq("is_deleted", false)
        .order("logged_at", { ascending: false }),
      supabase
        .from("water_logs")
        .select("glasses")
        .eq("user_id", userId)
        .eq("log_date", today)
        .maybeSingle(),
      supabase
        .from("food_logs")
        .select("food_name, raw_input, meal_type, calories, protein_g, carbs_g, fat_g, fiber_g, confidence")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("logged_at", { ascending: false })
        .limit(100),
      supabase.from("food_logs").select("log_date").eq("user_id", userId).eq("is_deleted", false),
      supabase
        .from("body_logs")
        .select("weight_kg, log_date")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(7),
    ]);

  const daysLogged = new Set((allLogDates ?? []).map((r) => r.log_date)).size;

  const counts = new Map<string, { item: QuickAddItem; count: number }>();
  for (const log of recentLogs ?? []) {
    if (!log.food_name) continue;
    const existing = counts.get(log.food_name);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(log.food_name, {
        count: 1,
        item: {
          food_name: log.food_name,
          raw_input: log.raw_input,
          meal_type: log.meal_type,
          calories: log.calories,
          protein_g: log.protein_g,
          carbs_g: log.carbs_g,
          fat_g: log.fat_g,
          fiber_g: log.fiber_g,
          confidence: log.confidence,
        },
      });
    }
  }
  const quickAddItems = Array.from(counts.values())
    .filter((c) => c.count >= 3)
    .slice(0, 6)
    .map((c) => c.item);

  const weightPoints = (bodyLogs ?? []).slice().reverse();
  const lastWeight = bodyLogs?.[0]?.weight_kg ?? profile?.weight_kg ?? null;

  return (
    <HomeScreen
      userId={userId}
      name={profile?.name ?? "there"}
      language={(profile?.language as "en" | "hi") ?? "en"}
      streak={profile?.streak ?? 0}
      daysLogged={daysLogged}
      targets={{
        calories: profile?.calorie_target ?? 2050,
        protein: profile?.protein_target ?? 150,
        carbs: profile?.carb_target ?? 250,
        fat: profile?.fat_target ?? 70,
      }}
      waterTarget={profile?.water_target ?? 8}
      initialLogs={(todayLogs ?? []) as FoodLog[]}
      initialWaterGlasses={waterRow?.glasses ?? 0}
      quickAddItems={quickAddItems}
      weightPoints={weightPoints}
      lastWeight={lastWeight}
    />
  );
}
