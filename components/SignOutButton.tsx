"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="mt-4 rounded-button border border-border px-5 py-2.5 text-sm text-muted"
    >
      Sign out
    </button>
  );
}
