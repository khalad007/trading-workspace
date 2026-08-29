"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CandlestickChart,
  LayoutDashboard,
  LogOut,
  Menu,
  BookOpen,
  Settings,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trading", label: "Trade", icon: CandlestickChart },
  { href: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/watchlists", label: "Watchlists", icon: Star },
  { href: "/transactions", label: "Transactions", icon: BarChart3 },
  { href: "/documentation", label: "Documentation", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navigation = (
    <>
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="grid size-8 place-items-center rounded-lg bg-emerald-500 text-slate-950">
          <CandlestickChart className="size-5" />
        </div>
        <span className="font-semibold tracking-tight"><Link href="/">MarketFlow</Link></span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-emerald-500/12 text-emerald-400" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <p className="truncate px-3 text-sm font-medium">{user.name ?? "Trader"}</p>
        <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{user.email}</p>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          <LogOut /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-card lg:flex lg:flex-col">{navigation}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-card shadow-2xl">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10" onClick={() => setOpen(false)}><X /></Button>
            {navigation}
          </aside>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}><Menu /></Button>
          <span className="ml-2 font-semibold">MarketFlow</span>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
