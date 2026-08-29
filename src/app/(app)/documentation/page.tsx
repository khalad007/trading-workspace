import Link from "next/link";
import { ArrowRight, BookOpen, CandlestickChart, CircleDollarSign, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  ["1", "Create a portfolio", "A portfolio holds your simulated cash and your trade history. No real money or cryptocurrency is used."],
  ["2", "Open Trade", "Choose a portfolio, watch the live Coinbase price and order book, then open the Order tab."],
  ["3", "Choose Buy or Sell", "Enter the BTC quantity. Leave limit price empty to use the current displayed market price, or enter a price for the simulation."],
  ["4", "Review the result", "A filled or rejected message appears for three seconds. Transactions and updated cash are available in their sidebar pages."],
];

export default function DocumentationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-500"><BookOpen className="size-5" /><span className="text-sm font-medium">MarketFlow guide</span></div>
        <h1 className="text-3xl font-semibold tracking-tight">How to use this trading workspace</h1>
        <p className="max-w-3xl text-muted-foreground">Learn what the live data means, how simulated orders work, and why a position can gain or lose value.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Start here</CardTitle><CardDescription>The complete paper-trading flow.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {steps.map(([number, title, text]) => <div key={number} className="rounded-xl border p-4"><div className="mb-2 grid size-7 place-items-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-500">{number}</div><h2 className="font-medium">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>)}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CandlestickChart className="size-5 text-emerald-500" />Reading the chart</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>Each candle represents one minute. A green candle closed above its opening price; a red candle closed below it. The thin wicks show the highest and lowest prices reached during that minute.</p><p>The right axis shows price and the bottom axis shows time. A single candle is only a snapshot—look at a sequence of candles to understand direction and volatility.</p><p>The live price is built into the current candle. Coinbase is the default feed; your last selected exchange is remembered on this browser.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CircleDollarSign className="size-5 text-emerald-500" />Bids, asks, and spread</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p><strong className="text-foreground">Bids</strong> are prices buyers currently offer. <strong className="text-foreground">Asks</strong> are prices sellers currently request. Size is the available quantity shown at that price.</p><p>The spread is the difference between the best ask and best bid. A smaller spread often means a more liquid market; a larger spread can make execution less favorable.</p><p>Order-book levels can change very quickly. They show current interest, not a promise that price will move in either direction.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>How buying and selling affect cash</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>A buy deducts <strong className="text-foreground">quantity × price</strong> from the selected portfolio. A sell adds that amount. An order is rejected when its values are invalid, when a buy costs more cash than the portfolio has, or when a sell exceeds the BTC quantity previously bought in that portfolio.</p><p>Your transaction history records each filled simulated trade. Portfolio cash alone does not represent total value because purchased BTC also has value.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Why you gain or lose</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>After buying, you have an unrealized gain when the current price is above your purchase price and an unrealized loss when it is below. Approximate position result: <strong className="text-foreground">(current price − average buy price) × quantity held</strong>.</p><p>A gain or loss becomes realized when you sell. Market movement, timing, spread, and position size all affect the outcome. This site is a learning simulation and does not promise profit.</p></CardContent></Card>
      </div>

      <Card className="border-amber-500/30"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-amber-500" />When is a good time to buy?</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>There is no guaranteed good time. Avoid deciding from one green or red candle. A safer learning process is to define how much you can risk, identify a price level that invalidates your idea, use a small position, and compare the possible loss with the possible gain before placing an order.</p><p>Look for confirmation across trend, recent support and resistance, volatility, and liquidity. Do not chase a sudden move or invest money you cannot afford to lose. MarketFlow provides simulated execution and educational market data—not financial advice.</p></CardContent></Card>

      <div className="flex flex-wrap gap-3"><Button nativeButton={false} render={<Link href="/trading" />}>Open trading <ArrowRight /></Button><Button variant="outline" nativeButton={false} render={<Link href="/portfolio" />}>View portfolios</Button></div>
    </div>
  );
}
