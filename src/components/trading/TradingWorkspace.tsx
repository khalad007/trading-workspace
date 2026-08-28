"use client";

import { useState } from "react";
import TradingChart, { type OrderExecution } from "@/components/trading/Chart";
import { executeSimulatedTrade } from "@/app/actions/trades";
import { Card, CardContent } from "@/components/ui/card";

export function TradingWorkspace({ portfolios }: { portfolios: Array<{ id: string; name: string; cashBalance: number }> }) {
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id ?? "");
  const [execution, setExecution] = useState<OrderExecution | null>(null);
  return <div className="space-y-4"><div><h1 className="text-2xl font-semibold">Trading workspace</h1><p className="text-sm text-muted-foreground">Live BTC market data with risk-free simulated execution.</p></div>{portfolios.length ? <><Card><CardContent className="flex items-center gap-3 py-3"><label className="text-sm text-muted-foreground" htmlFor="portfolio">Execute in</label><select id="portfolio" value={portfolioId} onChange={(event) => setPortfolioId(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">{portfolios.map((portfolio) => <option key={portfolio.id} value={portfolio.id}>{portfolio.name} · ${portfolio.cashBalance.toLocaleString()}</option>)}</select></CardContent></Card><TradingChart execution={execution} onOrderSubmit={async (order) => { const price = order.price; if (!price) { setExecution({ id: crypto.randomUUID(), side: order.side, symbol: "BTCUSDT", quantity: order.quantity, price: 0, status: "rejected" }); return; } const pending: OrderExecution = { id: crypto.randomUUID(), side: order.side, symbol: "BTCUSDT", quantity: order.quantity, price, status: "pending" }; setExecution(pending); try { await executeSimulatedTrade({ portfolioId, symbol: "BTCUSDT", side: order.side.toUpperCase() as "BUY" | "SELL", quantity: order.quantity, price }); setExecution({ ...pending, status: "filled" }); } catch { setExecution({ ...pending, status: "rejected" }); } }} /></> : <div className="grid min-h-64 place-items-center rounded-xl border border-dashed text-muted-foreground">Create a portfolio before placing simulated trades.</div>}</div>;
}
