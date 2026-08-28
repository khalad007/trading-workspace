import Link from "next/link";
import { ArrowRight, CandlestickChart, LineChart, ShieldCheck, Zap } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Zap, title: "Live market streams", text: "Binance and Coinbase prices with smooth frame-buffered updates." },
  { icon: LineChart, title: "Trading workspace", text: "Candlesticks, order-book depth, and simulated execution in one view." },
  { icon: ShieldCheck, title: "Secure workspace", text: "Private portfolios, watchlists, profile assets, and verification uploads." },
];

export default async function Home() {
  const session = await auth();
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_28%)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-emerald-500 text-slate-950"><CandlestickChart className="size-5" /></span>MarketFlow</Link>
        <div className="flex gap-2">{session ? <Button nativeButton={false} render={<Link href="/dashboard" />}>Open dashboard <ArrowRight /></Button> : <><Button nativeButton={false} variant="ghost" render={<Link href="/login" />}>Sign in</Button><Button nativeButton={false} render={<Link href="/register" />}>Get started</Button></>}</div>
      </nav>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full border bg-background/60 px-3 py-1 text-xs text-emerald-500 backdrop-blur">Real-time paper trading workspace</p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">Read the market. Test your edge. <span className="text-emerald-500">Trade with clarity.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">A focused financial cockpit for live crypto prices, order-book analysis, watchlists, portfolios, and risk-free simulated execution.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button nativeButton={false} size="lg" render={<Link href={session ? "/dashboard" : "/register"} />}>{session ? "Open workspace" : "Create free workspace"}<ArrowRight /></Button><Button nativeButton={false} size="lg" variant="outline" render={<Link href={session ? "/trading" : "/login"} />}>Explore trading view</Button></div>
        </div>
        <div className="grid gap-4">{features.map(({ icon: Icon, title, text }, index) => <Card key={title} className={index === 1 ? "lg:translate-x-8" : ""}><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-4 text-emerald-500" />{title}</CardTitle><CardDescription>{text}</CardDescription></CardHeader></Card>)}</div>
      </section>
    </main>
  );
}
