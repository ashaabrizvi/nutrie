"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { getTodayIST } from "@/lib/date";

export default function WeightModal({
  open,
  onClose,
  userId,
  lastWeight,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  lastWeight: number | null;
  onSaved: (weightKg: number) => void;
}) {
  const supabase = createClient();
  const [weight, setWeight] = useState(lastWeight ?? 70);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const today = getTodayIST();

    const { data: existing } = await supabase
      .from("body_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("log_date", today)
      .maybeSingle();

    if (existing) {
      await supabase.from("body_logs").update({ weight_kg: weight }).eq("id", existing.id);
    } else {
      await supabase
        .from("body_logs")
        .insert({ user_id: userId, weight_kg: weight, log_date: today });
    }

    await supabase.from("users").update({ weight_kg: weight }).eq("id", userId);

    setSaving(false);
    onSaved(weight);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-[24px] border-t border-border bg-surface p-6"
          >
            <p className="mb-4 font-heading text-lg font-bold text-text">Log today&apos;s weight</p>
            <div className="mb-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setWeight((w) => Math.max(30, w - 0.5))}
                className="h-10 w-10 rounded-pill border border-border text-lg text-text"
              >
                −
              </button>
              <span className="font-mono text-3xl text-accent">{weight.toFixed(1)}</span>
              <span className="text-sm text-muted">kg</span>
              <button
                type="button"
                onClick={() => setWeight((w) => Math.min(250, w + 0.5))}
                className="h-10 w-10 rounded-pill border border-border text-lg text-text"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full rounded-button bg-accent py-3 font-heading text-sm font-bold text-black disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save weight"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
