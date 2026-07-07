"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", icon: "🏠", label: "Home" },
  { href: "/log", icon: "📋", label: "Log" },
  { href: "/weekly", icon: "📊", label: "Weekly" },
  { href: "/profile", icon: "👤", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] items-center justify-between border-t border-border bg-surface/80 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}

      <button
        type="button"
        onClick={() => router.push("/home#log-input")}
        className="-mt-6 flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-2xl text-black shadow-lg"
        aria-label="Log food"
      >
        +
      </button>

      {NAV_ITEMS.slice(2).map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
