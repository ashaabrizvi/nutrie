"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getISTHour, getTodayIST, formatDisplayDate } from "@/lib/date";
import { useNutrieStore } from "@/stores/useNutrieStore";
import CalorieRing from "@/components/ui/CalorieRing";
import MacroBars from "@/components/ui/MacroBars";
import LogItem from "@/components/ui/LogItem";
import StreakBadge from "@/components/ui/StreakBadge";
import WaterTracker from "@/components/ui/WaterTracker";
import WeightSparkline from "@/components/ui/WeightSparkline";
import FoodInput from "@/components/FoodInput";
import QuickAdd, { type QuickAddItem } from "@/components/QuickAdd";
import WeightModal from "@/components/modals/WeightModal";
import type { FoodLog } from "@/types";

interface HomeScreenProps {
  userId: string;
  name: string;
  language: "en" | "hi";
  streak: number;
  daysLogged: number;
  targets: { calories: number; protein: number; carbs: number; fat: number };
  waterTarget: number;
  initialLogs: FoodLog[];
  initialWaterGlasses: number;
  quickAddItems: QuickAddItem[];
  weightPoints: { weight_kg: number; log_date: string }[];
  lastWeight: number | null;
}

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 11) return "Good morning!";
  if (hour >= 11 && hour < 17) return "Good afternoon!";
  if (hour >= 17 && hour < 21) return "Good evening!";
  return "Still eating? Log it!";
}

export default function HomeScreen({
  userId,
  name,
  language,
  streak,
  daysLogged,
  targets,
  waterTarget,
  initialLogs,
  initialWaterGlasses,
  quickAddItems,
  weightPoints,
  lastWeight,
}: HomeScreenProps) {
  const supabase = createClient();
  const router = useRouter();

  const { todayLogs, waterGlasses, setTodayLogs, addLog, setWaterGlasses } = useNutrieStore();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weight, setWeight] = useState(lastWeight);

  useEffect(() => {
    setTodayLogs(initialLogs);
    setWaterGlasses(initialWaterGlasses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumed = {
    calories: todayLogs.reduce((s, l) => s + l.calories, 0),
    protein: todayLogs.reduce((s, l) => s + l.protein_g, 0),
    carbs: todayLogs.reduce((s, l) => s + l.carbs_g, 0),
    fat: todayLogs.reduce((s, l) => s + l.fat_g, 0),
  };

  const remaining = Math.max(0, targets.calories - consumed.calories);
  const proteinRemaining = Math.max(0, targets.protein - consumed.protein);

  const subtitles = [
    `${remaining} kcal left for today`,
    `Protein goal: ${proteinRemaining}g to go`,
    `${streak} day streak — don't break it!`,
    `You've logged ${daysLogged} days total`,
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const subtitle = subtitles[dayOfYear % subtitles.length];

  async function handleWaterChange(glasses: number) {
    setWaterGlasses(glasses);
    const today = getTodayIST();

    const { data: existing } = await supabase
      .from("water_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("log_date", today)
      .maybeSingle();

    if (existing) {
      await supabase.from("water_logs").update({ glasses }).eq("id", existing.id);
    } else {
      await supabase.from("water_logs").insert({ user_id: userId, glasses, log_date: today });
    }
  }

  async function toggleLanguage() {
    const next = currentLanguage === "en" ? "hi" : "en";
    setCurrentLanguage(next);
    await supabase.from("users").update({ language: next }).eq("id", userId);
  }

  function handleLogged(log: FoodLog) {
    addLog(log);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <header className="flex items-center justify-between">
        <span className="font-heading text-xl font-extrabold text-accent">NUTRIE</span>
        <span className="text-sm text-muted">{formatDisplayDate()}</span>
        <div className="flex items-center gap-2">
          <StreakBadge streak={streak} />
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-pill border border-border px-2 py-1 text-xs text-muted"
          >
            {currentLanguage === "en" ? "EN" : "हि"}
          </button>
        </div>
      </header>

      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm text-muted">Hi {name}</p>
        <p className="mt-0.5 font-heading text-lg font-bold text-text">{greetingFor(getISTHour())}</p>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      <div className="flex justify-center rounded-card border border-border bg-surface p-5">
        <CalorieRing
          consumed={consumed.calories}
          target={targets.calories}
          carbs={{ consumed: consumed.carbs, target: targets.carbs }}
          protein={{ consumed: consumed.protein, target: targets.protein }}
          fat={{ consumed: consumed.fat, target: targets.fat }}
        />
      </div>

      <MacroBars
        carbs={{ consumed: consumed.carbs, target: targets.carbs }}
        protein={{ consumed: consumed.protein, target: targets.protein }}
        fat={{ consumed: consumed.fat, target: targets.fat }}
      />

      <div id="log-input">
        <FoodInput userId={userId} onLogged={handleLogged} />
      </div>

      <WaterTracker glasses={waterGlasses} target={waterTarget} onChange={handleWaterChange} />

      <QuickAdd userId={userId} items={quickAddItems} onLogged={handleLogged} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Today&apos;s log</p>
          <Link href="/log" className="text-xs text-accent">
            See all →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {todayLogs.length === 0 ? (
            <p className="text-sm text-muted">Nothing logged yet today.</p>
          ) : (
            todayLogs.slice(0, 3).map((log) => <LogItem key={log.id} log={log} />)
          )}
        </div>
      </div>

      <div className="mb-4">
        {weightPoints.length > 1 && (
          <div className="mb-2">
            <WeightSparkline points={weightPoints} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setWeightModalOpen(true)}
          className="w-full rounded-button border border-border bg-surface2 py-3 text-sm font-medium text-text"
        >
          Log today&apos;s weight → {weight ? `(last: ${weight}kg)` : ""}
        </button>
      </div>

      <WeightModal
        open={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        userId={userId}
        lastWeight={weight}
        onSaved={(w) => {
          setWeight(w);
          router.refresh();
        }}
      />
    </div>
  );
}
