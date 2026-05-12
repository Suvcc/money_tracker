import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/transactions/new", label: "Add transaction" },
] as const;

type AppHeaderProps = {
  title: string;
  description: string;
  activeHref: (typeof navItems)[number]["href"];
};

export function AppHeader({
  title,
  description,
  activeHref,
}: AppHeaderProps) {
  return (
    <>
      <header className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,64,175,0.95)_52%,_rgba(5,150,105,0.9)_100%)] px-4 py-5 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:px-6 sm:py-6 lg:rounded-[2rem] lg:px-8 lg:py-7">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-white/70 sm:text-sm">
                Money Finance
              </p>
              <div className="space-y-2">
                <h1 className="font-serif text-2xl leading-tight sm:text-3xl lg:text-4xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <form action={signOut} className="w-full lg:w-auto">
              <Button
                className="w-full border-white/20 bg-white/12 text-white hover:bg-white/20 lg:w-auto"
                type="submit"
                variant="secondary"
              >
                Sign out
              </Button>
            </form>
          </div>

          <nav className="hidden flex-wrap gap-3 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold",
                  item.href === activeHref
                    ? "border-white/30 bg-white/18 text-white"
                    : "border-white/12 bg-white/8 text-white/78 hover:bg-white/14",
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <MobileBottomNav />
    </>
  );
}
