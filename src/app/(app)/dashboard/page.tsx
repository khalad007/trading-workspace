import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, ListChecks, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [portfolios, watchlistCount, recentTransactions] = await Promise.all([
    prisma.portfolio.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.watchlist.count({ where: { userId: user.id } }),
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { occurredAt: "desc" }, take: 5, include: { portfolio: { select: { name: true } } } }),
  ]);
  const cash = portfolios.reduce((sum, portfolio) => sum + portfolio.cashBalance, 0);
  const stats = [
    { label: "Paper cash", value: `$${cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: CircleDollarSign },
    { label: "Portfolios", value: portfolios.length.toString(), icon: BriefcaseBusiness },
    { label: "Watchlists", value: watchlistCount.toString(), icon: Star },
    { label: "Recent trades", value: recentTransactions.length.toString(), icon: ListChecks },
  ];
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-emerald-500">Your workspace</p><h1 className="text-3xl font-semibold tracking-tight">Market overview</h1><p className="mt-1 text-muted-foreground">Monitor paper capital and move into the live market workspace.</p></div><Button nativeButton={false} render={<Link href="/trading" />}>Open trading <ArrowRight /></Button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader><CardDescription className="flex items-center gap-2"><Icon className="size-4 text-emerald-500" />{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>)}</div><div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Your latest simulated executions.</CardDescription></CardHeader><CardContent className="space-y-2">{recentTransactions.length ? recentTransactions.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{item.type} {item.quantity} {item.symbol}</p><p className="text-xs text-muted-foreground">{item.portfolio.name} · {item.occurredAt.toLocaleString()}</p></div><p className={item.type === "BUY" ? "text-rose-500" : "text-emerald-500"}>${item.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>) : <p className="py-12 text-center text-muted-foreground">No trades yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Portfolios</CardTitle><CardDescription>Available simulated cash.</CardDescription></CardHeader><CardContent className="space-y-2">{portfolios.map((portfolio) => <div key={portfolio.id} className="flex justify-between rounded-lg bg-muted/60 p-3"><span>{portfolio.name}</span><span className="font-mono">${portfolio.cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>)}</CardContent></Card></div></div>;
}
