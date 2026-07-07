"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { calculateBMI, calculateTargets } from "@/lib/nutrition";
import type { Goal, Language, MealType } from "@/types";

const TOTAL_STEPS = 5;

const GOAL_CARDS: { goal: Goal; emoji: string; title: string; blurb: string }[] = [
  { goal: "lose_fat", emoji: "🔥", title: "Lose Fat", blurb: "Calorie deficit" },
  { goal: "build_muscle", emoji: "💪", title: "Build Muscle", blurb: "Calorie surplus" },
  { goal: "recomposition", emoji: "⚖️", title: "Both", blurb: "Lose fat, build muscle" },
  { goal: "maintenance", emoji: "🧘", title: "Stay Healthy", blurb: "Maintain weight" },
];

interface ReminderState {
  enabled: boolean;
  time: string;
}

export default function OnboardingFlow({
  userId,
  email,
}: {
  userId: string;
  email: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState<Language>("en");

  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);

  const [goal, setGoal] = useState<Goal>("recomposition");

  const computedTargets = useMemo(() => {
    if (typeof age === "number" && gender) {
      return calculateTargets({ weightKg, heightCm, age, gender }, goal);
    }
    return { calories: 2050, protein: 150, carbs: 250, fat: 70 };
  }, [age, gender, heightCm, weightKg, goal]);

  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [proteinTarget, setProteinTarget] = useState<number | null>(null);
  const [carbTarget, setCarbTarget] = useState<number | null>(null);
  const [fatTarget, setFatTarget] = useState<number | null>(null);

  const targets = {
    calories: calorieTarget ?? computedTargets.calories,
    protein: proteinTarget ?? computedTargets.protein,
    carbs: carbTarget ?? computedTargets.carbs,
    fat: fatTarget ?? computedTargets.fat,
  };

  const [reminders, setReminders] = useState<Record<MealType, ReminderState>>({
    breakfast: { enabled: true, time: "08:00" },
    lunch: { enabled: true, time: "13:00" },
    dinner: { enabled: true, time: "20:00" },
    snack: { enabled: false, time: "16:00" },
  });
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  const bmi = calculateBMI(weightKg, heightCm);

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission);
  }

  async function finish() {
    setSaving(true);
    setError(null);

    const { error: userError } = await supabase.from("users").upsert({
      id: userId,
      email,
      name: name.trim() || "Friend",
      language,
      age: typeof age === "number" ? age : null,
      gender,
      weight_kg: weightKg,
      height_cm: heightCm,
      goal,
      calorie_target: targets.calories,
      protein_target: targets.protein,
      carb_target: targets.carbs,
      fat_target: targets.fat,
      onboarded: true,
    });

    if (userError) {
      setSaving(false);
      setError(userError.message);
      return;
    }

    const reminderRows = (Object.keys(reminders) as MealType[])
      .filter((meal) => meal !== "snack" && reminders[meal].enabled)
      .map((meal) => ({
        user_id: userId,
        meal_type: meal,
        reminder_time: reminders[meal].time,
        enabled: true,
      }));

    if (reminderRows.length > 0) {
      await supabase.from("reminders").insert(reminderRows);
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <div className="mb-8 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-pill ${i <= step ? "bg-accent" : "bg-muted2"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <h1 className="font-heading text-2xl font-extrabold">
                What should I call you?
              </h1>
              <input
                autoFocus
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-input border border-border bg-surface2 px-4 py-3 text-text outline-none focus:border-accent"
              />
              <div>
                <p className="mb-2 text-sm text-muted">Language</p>
                <div className="flex gap-2">
                  {(["en", "hi"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`flex-1 rounded-button border py-3 text-sm font-medium ${
                        language === lang
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted"
                      }`}
                    >
                      {lang === "en" ? "English" : "हिंदी"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h1 className="font-heading text-2xl font-extrabold">Your body stats</h1>

              <div>
                <p className="mb-2 text-sm text-muted">Age</p>
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-input border border-border bg-surface2 px-4 py-3 text-text outline-none focus:border-accent"
                />
              </div>

              <div>
                <p className="mb-2 text-sm text-muted">Gender</p>
                <div className="flex gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 rounded-button border py-2.5 text-sm capitalize font-medium ${
                        gender === g
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="text-muted">Height</span>
                  <span className="font-mono text-text">{heightCm} cm</span>
                </div>
                <input
                  type="range"
                  min={120}
                  max={220}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="text-muted">Weight</span>
                  <span className="font-mono text-text">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={180}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="rounded-card border border-border bg-surface p-4 text-center">
                <p className="text-xs text-muted">Your BMI</p>
                <p className="font-mono text-2xl text-accent">{bmi.toFixed(1)}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h1 className="font-heading text-2xl font-extrabold">Your goal</h1>
              <div className="grid grid-cols-2 gap-3">
                {GOAL_CARDS.map((card) => (
                  <button
                    key={card.goal}
                    type="button"
                    onClick={() => setGoal(card.goal)}
                    className={`flex flex-col items-center gap-1 rounded-card border p-4 text-center ${
                      goal === card.goal
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <span className="text-2xl">{card.emoji}</span>
                    <span className="font-heading text-sm font-bold">{card.title}</span>
                    <span className="text-xs text-muted">{card.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h1 className="font-heading text-2xl font-extrabold">Your targets</h1>
              <p className="text-sm text-muted">
                Calculated from your stats and goal. You can change any number.
              </p>

              <TargetInput
                label="Calories"
                unit="kcal"
                explain="Total energy you eat each day"
                value={targets.calories}
                onChange={setCalorieTarget}
              />
              <TargetInput
                label="Protein"
                unit="g"
                explain="Builds and protects your muscle"
                value={targets.protein}
                onChange={setProteinTarget}
              />
              <TargetInput
                label="Carbs"
                unit="g"
                explain="Your main energy source"
                value={targets.carbs}
                onChange={setCarbTarget}
              />
              <TargetInput
                label="Fat"
                unit="g"
                explain="Supports hormones, keeps you full"
                value={targets.fat}
                onChange={setFatTarget}
              />
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h1 className="font-heading text-2xl font-extrabold">Reminders</h1>
              <p className="text-sm text-muted">
                We&apos;ll nudge you to log each meal. You can change this anytime.
              </p>

              {(["breakfast", "lunch", "dinner"] as MealType[]).map((meal) => (
                <div
                  key={meal}
                  className="flex items-center justify-between rounded-card border border-border bg-surface p-4"
                >
                  <div>
                    <p className="font-body text-sm font-semibold capitalize">{meal}</p>
                    <input
                      type="time"
                      value={reminders[meal].time}
                      onChange={(e) =>
                        setReminders((r) => ({
                          ...r,
                          [meal]: { ...r[meal], time: e.target.value },
                        }))
                      }
                      className="mt-1 rounded-input border border-border bg-surface2 px-2 py-1 font-mono text-xs text-text"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setReminders((r) => ({
                        ...r,
                        [meal]: { ...r[meal], enabled: !r[meal].enabled },
                      }))
                    }
                    className={`h-7 w-12 rounded-pill transition-colors ${
                      reminders[meal].enabled ? "bg-accent" : "bg-muted2"
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-pill bg-bg transition-transform ${
                        reminders[meal].enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}

              {notifStatus !== "granted" && notifStatus !== "unsupported" && (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="rounded-button border border-border bg-surface2 py-3 text-sm font-medium text-text"
                >
                  Enable notifications
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="rounded-button border border-border px-5 py-3 text-sm font-medium text-muted"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={step === TOTAL_STEPS - 1 ? finish : next}
          disabled={saving}
          className="flex-1 rounded-button bg-accent py-3 font-heading text-sm font-bold text-black disabled:opacity-60"
        >
          {saving ? "Saving..." : step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
        </button>
        {step < TOTAL_STEPS - 1 && (
          <button
            type="button"
            onClick={next}
            className="rounded-button px-4 py-3 text-sm text-muted underline"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function TargetInput({
  label,
  unit,
  explain,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  explain: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted">{explain}</p>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 rounded-input border border-border bg-surface2 px-2 py-1.5 text-right font-mono text-text outline-none focus:border-accent"
          />
          <span className="text-xs text-muted">{unit}</span>
        </div>
      </div>
    </div>
  );
}
