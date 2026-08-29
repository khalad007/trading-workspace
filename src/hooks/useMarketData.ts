"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  marketKey,
  type MarketExchange,
  type OrderBook,
  type OrderBookLevel,
  useTradingStore,
} from "@/store/useTradingStore";

type UseMarketDataOptions = {
  exchange?: MarketExchange;
  symbol?: string;
  depth?: 5 | 10 | 20;
  enabled?: boolean;
};

type BinanceEnvelope = {
  stream?: string;
  data?: Record<string, unknown>;
};

type CoinbaseLevel = {
  side?: "bid" | "offer";
  price_level?: string;
  new_quantity?: string;
};

type CoinbaseMessage = {
  channel?: string;
  timestamp?: string;
  events?: Array<{
    type?: "snapshot" | "update";
    product_id?: string;
    tickers?: Array<{
      product_id?: string;
      price?: string;
      best_bid?: string;
      best_ask?: string;
      price_percent_chg_24_h?: string;
    }>;
    updates?: CoinbaseLevel[];
  }>;
};

const BINANCE_WS = "wss://stream.binance.com:9443/stream";
const COINBASE_WS = "wss://advanced-trade-ws.coinbase.com";
const MAX_RECONNECT_DELAY_MS = 30_000;

const asNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeSymbol = (exchange: MarketExchange, symbol: string) => {
  const cleaned = symbol.trim().replace(/[\s/_]/g, "-").toUpperCase();
  if (exchange === "coinbase") {
    if (cleaned.includes("-")) return cleaned;
    if (cleaned.endsWith("USDT")) return `${cleaned.slice(0, -4)}-USDT`;
    if (cleaned.endsWith("USD")) return `${cleaned.slice(0, -3)}-USD`;
    return `${cleaned}-USD`;
  }
  return cleaned.replaceAll("-", "");
};

const parseLevels = (levels: unknown): OrderBookLevel[] => {
  if (!Array.isArray(levels)) return [];
  return levels.flatMap((level) => {
    if (!Array.isArray(level) || level.length < 2) return [];
    const price = asNumber(level[0]);
    const quantity = asNumber(level[1]);
    return price === undefined || quantity === undefined
      ? []
      : [{ price, quantity }];
  });
};

const sortedLevels = (
  levels: Map<number, number>,
  side: "bids" | "asks",
  depth: number,
): OrderBookLevel[] =>
  [...levels]
    .sort(([left], [right]) => (side === "bids" ? right - left : left - right))
    .slice(0, depth)
    .map(([price, quantity]) => ({ price, quantity }));

export function useMarketData({
  exchange = "coinbase",
  symbol = "BTCUSDT",
  depth = 20,
  enabled = true,
}: UseMarketDataOptions = {}) {
  const normalizedSymbol = useMemo(
    () => normalizeSymbol(exchange, symbol),
    [exchange, symbol],
  );
  const key = marketKey(exchange, normalizedSymbol);
  const price = useTradingStore((state) => state.prices[key]);
  const orderBook = useTradingStore((state) => state.orderBooks[key]);
  const connection = useTradingStore((state) => state.connections[key]);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  const reconnect = useCallback(() => {
    socketRef.current?.close(1000, "Manual reconnect");
    setConnectionVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const store = useTradingStore.getState();
    if (!enabled || typeof WebSocket === "undefined") {
      store.setConnection(key, "idle");
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let attempt = 0;
    const bids = new Map<number, number>();
    const asks = new Map<number, number>();

    const publishCoinbaseBook = (timestamp: number) => {
      store.queueOrderBook(key, {
        exchange,
        symbol: normalizedSymbol,
        bids: sortedLevels(bids, "bids", depth),
        asks: sortedLevels(asks, "asks", depth),
        timestamp,
      });
    };

    const handleBinance = (message: BinanceEnvelope) => {
      const data = message.data;
      if (!data) return;
      const timestamp = asNumber(data.E) ?? Date.now();

      if (message.stream?.includes("@bookTicker")) {
        const bestBid = asNumber(data.b);
        const bestAsk = asNumber(data.a);
        if (bestBid === undefined || bestAsk === undefined) return;
        store.queuePrice(key, {
          exchange,
          symbol: normalizedSymbol,
          price: (bestBid + bestAsk) / 2,
          bestBid,
          bestAsk,
          timestamp,
        });
        return;
      }

      if (message.stream?.includes("@depth")) {
        const update: OrderBook = {
          exchange,
          symbol: normalizedSymbol,
          bids: parseLevels(data.bids),
          asks: parseLevels(data.asks),
          timestamp,
        };
        store.queueOrderBook(key, update);
      }
    };

    const handleCoinbase = (message: CoinbaseMessage) => {
      const timestamp = message.timestamp
        ? Date.parse(message.timestamp)
        : Date.now();

      if (message.channel === "ticker") {
        for (const event of message.events ?? []) {
          for (const ticker of event.tickers ?? []) {
            const lastPrice = asNumber(ticker.price);
            if (ticker.product_id !== normalizedSymbol || lastPrice === undefined)
              continue;
            store.queuePrice(key, {
              exchange,
              symbol: normalizedSymbol,
              price: lastPrice,
              bestBid: asNumber(ticker.best_bid),
              bestAsk: asNumber(ticker.best_ask),
              change24hPercent: asNumber(ticker.price_percent_chg_24_h),
              timestamp,
            });
          }
        }
        return;
      }

      if (message.channel !== "l2_data") return;
      for (const event of message.events ?? []) {
        if (event.product_id !== normalizedSymbol) continue;
        if (event.type === "snapshot") {
          bids.clear();
          asks.clear();
        }
        for (const update of event.updates ?? []) {
          const priceLevel = asNumber(update.price_level);
          const quantity = asNumber(update.new_quantity);
          if (priceLevel === undefined || quantity === undefined) continue;
          const side = update.side === "bid" ? bids : asks;
          if (quantity === 0) side.delete(priceLevel);
          else side.set(priceLevel, quantity);
        }
      }
      publishCoinbaseBook(timestamp);
    };

    const connect = () => {
      if (disposed) return;
      store.setConnection(key, attempt === 0 ? "connecting" : "reconnecting");

      const url =
        exchange === "binance"
          ? `${BINANCE_WS}?streams=${normalizedSymbol.toLowerCase()}@bookTicker/${normalizedSymbol.toLowerCase()}@depth${depth}@100ms`
          : COINBASE_WS;
      socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        store.setConnection(key, "connected");
        if (exchange !== "coinbase") return;

        for (const channel of ["ticker", "level2", "heartbeats"]) {
          socket?.send(
            JSON.stringify({
              type: "subscribe",
              product_ids:
                channel === "heartbeats" ? undefined : [normalizedSymbol],
              channel,
            }),
          );
        }
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as
            | BinanceEnvelope
            | CoinbaseMessage;
          if (exchange === "binance") handleBinance(message as BinanceEnvelope);
          else handleCoinbase(message as CoinbaseMessage);
        } catch {
          // Public feeds may add message types; malformed/unknown payloads are ignored.
        }
      };

      socket.onerror = () => {
        store.setConnection(key, "error", "Market data WebSocket error");
      };

      socket.onclose = (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed || event.code === 1000) return;
        attempt += 1;
        const delay = Math.min(
          MAX_RECONNECT_DELAY_MS,
          1_000 * 2 ** Math.min(attempt - 1, 5),
        );
        store.setConnection(key, "reconnecting", `Retrying in ${delay / 1000}s`);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close(1000, "Subscription changed");
      if (socketRef.current === socket) socketRef.current = null;
      store.setConnection(key, "idle");
    };
  }, [connectionVersion, depth, enabled, exchange, key, normalizedSymbol]);

  return {
    key,
    symbol: normalizedSymbol,
    exchange,
    price,
    orderBook,
    status: connection?.status ?? "idle",
    error: connection?.error ?? null,
    reconnect,
  };
}
