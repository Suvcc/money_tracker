"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/transactions/new", label: "Add" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-18px_60px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/transactions"
              ? pathname === item.href
              : pathname === item.href;

          return (
            <Link
              key={item.href}
              className={cn(
                "flex min-h-12 items-center justify-center rounded-2xl px-3 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
                  : "bg-slate-100 text-slate-600",
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
