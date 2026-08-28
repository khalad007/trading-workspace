"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Activity, CheckCircle2, ChevronDown, Wifi, WifiOff } from "lucide-react";

import { useMarketData } from "@/hooks/useMarketData";
import type {
  MarketExchange,
  OrderBook,
  OrderBookLevel,
} from "@/store/useTradingStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type Candle = CandlestickData<UTCTimestamp>;

export type OrderExecution = {
  id: string;
  side: "buy" | "sell";
  symbol: string;
  quantity: number;
  price: number;
  status: "pending" | "filled" | "rejected";
};

type TradingChartProps = {
  exchange?: MarketExchange;
  symbol?: string;
  initialCandles?: Candle[];
  execution?: OrderExecution | null;
  className?: string;
  onOrderSubmit?: (order: {
    side: "buy" | "sell";
    quantity: number;
    price?: number;
  }) => void;
};

const TIMEFRAME_SECONDS = 60;

const formatPrice = (value?: number) =>
  value === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", {
        minimumFractionDigits: value < 1 ? 4 : 2,
        maximumFractionDigits: value < 1 ? 6 : 2,
      }).format(value);

function CandlestickPanel({
  candles,
  livePrice,
}: {
  candles: Candle[];
  livePrice?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const activeCandleRef = useRef<Candle | null>(candles.at(-1) ?? null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      height: 440,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.18)" },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // The chart instance is intentionally created once.

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    seriesRef.current.setData(candles);
    activeCandleRef.current = candles.at(-1) ?? null;
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || livePrice === undefined) return;

    const time = (Math.floor(Date.now() / 1000 / TIMEFRAME_SECONDS) *
      TIMEFRAME_SECONDS) as UTCTimestamp;
    const current = activeCandleRef.current;
    const candle: Candle =
      current?.time === time
        ? {
            ...current,
            high: Math.max(current.high, livePrice),
            low: Math.min(current.low, livePrice),
            close: livePrice,
          }
        : {
            time,
            open: current?.close ?? livePrice,
            high: livePrice,
            low: livePrice,
            close: livePrice,
          };

    activeCandleRef.current = candle;
    series.update(candle);
  }, [livePrice]);

  return <div ref={containerRef} className="h-[360px] w-full sm:h-[440px]" />;
}

function DepthSide({
  title,
  levels,
  side,
}: {
  title: string;
  levels: OrderBookLevel[];
  side: "bid" | "ask";
}) {
  const maxQuantity = Math.max(1, ...levels.map((level) => level.quantity));

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>{title}</span>
        <span>Size</span>
      </div>
      <div className="space-y-0.5">
        {levels.map((level) => (
          <div
            key={level.price}
            className="relative grid h-7 grid-cols-[1fr_auto] items-center overflow-hidden rounded px-2 font-mono text-xs"
          >
            <motion.div
              className={cn(
                "absolute inset-y-0 right-0 opacity-15",
                side === "bid" ? "bg-emerald-500" : "bg-rose-500",
              )}
              initial={false}
              animate={{ width: `${(level.quantity / maxQuantity) * 100}%` }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
            <span
              className={side === "bid" ? "text-emerald-500" : "text-rose-500"}
            >
              {formatPrice(level.price)}
            </span>
            <span className="relative text-muted-foreground">
              {level.quantity.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DepthVisualizer({ orderBook }: { orderBook?: OrderBook }) {
  const bids = orderBook?.bids.slice(0, 10) ?? [];
  const asks = orderBook?.asks.slice(0, 10) ?? [];
  const spread =
    bids[0] && asks[0] ? Math.max(0, asks[0].price - bids[0].price) : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Live market depth</span>
        <span className="font-mono text-xs">Spread {formatPrice(spread)}</span>
      </div>
      {bids.length || asks.length ? (
        <div className="flex gap-3">
          <DepthSide title="Bids" levels={bids} side="bid" />
          <DepthSide title="Asks" levels={asks} side="ask" />
        </div>
      ) : (
        <div className="grid h-56 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Waiting for order-book data…
        </div>
      )}
    </div>
  );
}

function OrderTicket({
  price,
  onSubmit,
}: {
  price?: number;
  onSubmit?: TradingChartProps["onOrderSubmit"];
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  return (
    <motion.div layout className="space-y-4">
      <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
        {(["buy", "sell"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={side === value ? "default" : "ghost"}
            className={cn(
              side === value &&
                (value === "buy"
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-rose-600 hover:bg-rose-600"),
            )}
            onClick={() => setSide(value)}
          >
            {value === "buy" ? "Buy" : "Sell"}
          </Button>
        ))}
      </div>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        Quantity
        <Input
          inputMode="decimal"
          placeholder="0.00"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        Limit price
        <Input
          inputMode="decimal"
          placeholder={formatPrice(price)}
          value={limitPrice}
          onChange={(event) => setLimitPrice(event.target.value)}
        />
      </label>
      <Button
        className={cn(
          "w-full",
          side === "buy"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-rose-600 hover:bg-rose-700",
        )}
        disabled={!quantity || Number(quantity) <= 0}
        onClick={() =>
          onSubmit?.({
            side,
            quantity: Number(quantity),
            price: limitPrice ? Number(limitPrice) : undefined,
          })
        }
      >
        Review {side} order
      </Button>
    </motion.div>
  );
}

function ExecutionOverlay({ execution }: { execution?: OrderExecution | null }) {
  return (
    <AnimatePresence mode="popLayout">
      {execution ? (
        <motion.div
          key={`${execution.id}:${execution.status}`}
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={cn(
            "absolute inset-x-4 top-4 z-20 flex items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur",
            execution.status === "filled" && "border-emerald-500/40",
            execution.status === "rejected" && "border-rose-500/40",
          )}
        >
          {execution.status === "filled" ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : (
            <Activity className="size-5 animate-pulse text-primary" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium capitalize">
              {execution.side} order {execution.status}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {execution.quantity} {execution.symbol} at {formatPrice(execution.price)}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function TradingChart({
  exchange = "binance",
  symbol = "BTCUSDT",
  initialCandles = [],
  execution,
  className,
  onOrderSubmit,
}: TradingChartProps) {
  const [activeExchange, setActiveExchange] = useState(exchange);
  const market = useMarketData({ exchange: activeExchange, symbol, depth: 20 });
  const isConnected = market.status === "connected";
  const change = market.price?.change24hPercent;
  const candles = useMemo(() => [...initialCandles].sort((a, b) => Number(a.time) - Number(b.time)), [initialCandles]);

  return (
    <motion.section
      layout
      transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
      className={cn("relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]", className)}
    >
      <ExecutionOverlay execution={execution} />

      <motion.div layout="position" className="min-w-0">
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              {market.symbol}
              <span className="font-mono text-xl">{formatPrice(market.price?.price)}</span>
              {change !== undefined ? (
                <span className={cn("text-xs", change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </span>
              ) : null}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              {isConnected ? <Wifi className="size-3.5 text-emerald-500" /> : <WifiOff className="size-3.5 text-amber-500" />}
              {market.status}
            </CardDescription>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                  {activeExchange === "binance" ? "Binance" : "Coinbase"}
                  <ChevronDown data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setActiveExchange("binance")}>Binance</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveExchange("coinbase")}>Coinbase</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <CandlestickPanel candles={candles} livePrice={market.price?.price} />
            <p className="px-4 pt-2 text-right text-[10px] text-muted-foreground">
              Charts by{" "}
              <a className="underline" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.aside layout className="min-w-0">
        <Card className="h-full">
          <Tabs defaultValue="depth" className="h-full">
            <CardHeader className="border-b">
              <TabsList className="w-full">
                <TabsTrigger value="depth">Depth</TabsTrigger>
                <TabsTrigger value="order">Order</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="min-h-[410px]">
              <AnimatePresence mode="wait" initial={false}>
                <TabsContent key="depth" value="depth">
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <DepthVisualizer orderBook={market.orderBook} />
                  </motion.div>
                </TabsContent>
                <TabsContent key="order" value="order">
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <OrderTicket price={market.price?.price} onSubmit={onOrderSubmit} />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </CardContent>
          </Tabs>
        </Card>
      </motion.aside>
    </motion.section>
  );
}
