import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NUTRIE — AI Nutrition & Calorie Tracker for India | Hindi + English",
  description:
    "NUTRIE is a voice-first AI nutrition coach built for Indian food. Log meals in Hindi or English, get instant calorie and macro estimates, and real insights — not just numbers.",
};

const FEATURES = [
  {
    emoji: "🎤",
    title: "Voice-first logging",
    body: "Just say what you ate — in Hindi, English, or Hinglish.",
  },
  {
    emoji: "🍛",
    title: "Built for Indian food",
    body: "Dal chawal, idli-sambhar, thali — real portions, not generic guesses.",
  },
  {
    emoji: "🤖",
    title: "Real AI insights",
    body: "Weekly briefs that spot patterns in your eating, not just totals.",
  },
  {
    emoji: "⚡",
    title: "Zero manual logging",
    body: "Snap a photo or speak — no scrolling through food databases.",
  },
];

export default async function RootPage() {
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

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-heading text-4xl font-extrabold text-accent">NUTRIE</h1>
        <p className="mt-2 font-heading text-lg font-bold text-text">Know what you eat</p>
        <p className="mt-1 text-sm text-muted">Your smart nutrition coach</p>

        <Link
          href="/login"
          className="mt-8 rounded-button bg-accent px-8 py-3 font-heading text-sm font-bold text-black"
        >
          Start free →
        </Link>
        <Link href="/login" className="mt-3 text-sm text-muted underline">
          Already have an account? Log in
        </Link>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 rounded-card border border-border bg-surface p-4"
          >
            <span className="text-2xl">{feature.emoji}</span>
            <div>
              <p className="font-body text-sm font-semibold text-text">{feature.title}</p>
              <p className="text-xs text-muted">{feature.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
