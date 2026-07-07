"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Mode = "login" | "signup";
type Method = "email" | "phone";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [method, setMethod] = useState<Method>("email");
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account, then log in.");
        setMode("login");
      }
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOtpSent(true);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full rounded-card border border-border bg-surface p-6"
      >
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-extrabold text-accent">NUTRIE</h1>
          <p className="mt-1 font-body text-sm text-muted">Know what you eat</p>
        </div>

        <div className="mb-5 flex rounded-pill border border-border bg-surface2 p-1">
          <button
            type="button"
            onClick={() => {
              setMethod("email");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-pill py-2 text-sm font-medium transition-colors ${
              method === "email" ? "bg-accent text-black" : "text-muted"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("phone");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-pill py-2 text-sm font-medium transition-colors ${
              method === "phone" ? "bg-accent text-black" : "text-muted"
            }`}
          >
            Phone
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-input border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
            {error}
          </p>
        )}
        {info && (
          <p className="mb-4 rounded-input border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {info}
          </p>
        )}

        {method === "email" ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-input border border-border bg-surface2 px-4 py-3 text-sm text-text outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-input border border-border bg-surface2 px-4 py-3 text-sm text-text outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-button bg-accent py-3 font-heading text-sm font-bold text-black disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
            className="flex flex-col gap-3"
          >
            <input
              type="tel"
              required
              disabled={otpSent}
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-input border border-border bg-surface2 px-4 py-3 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
            />
            {otpSent && (
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="rounded-input border border-border bg-surface2 px-4 py-3 text-sm text-text outline-none focus:border-accent"
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-button bg-accent py-3 font-heading text-sm font-bold text-black disabled:opacity-60"
            >
              {loading ? "Please wait..." : otpSent ? "Verify code" : "Send OTP"}
            </button>
            {otpSent && (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                className="text-xs text-muted underline"
              >
                Change number
              </button>
            )}
          </form>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-button border border-border bg-surface2 py-3 text-sm font-medium text-text"
        >
          Continue with Google
        </button>

        {method === "email" && (
          <p className="mt-5 text-center text-sm text-muted">
            {mode === "login" ? (
              <>
                New to Nutrie?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  className="font-medium text-accent"
                >
                  Start free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfo(null);
                  }}
                  className="font-medium text-accent"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        )}
      </motion.div>
    </div>
  );
}
