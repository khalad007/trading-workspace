import { create } from "zustand";

export type MarketExchange = "binance" | "coinbase";
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type OrderBookLevel = {
  price: number;
  quantity: number;
};

export type PriceUpdate = {
  exchange: MarketExchange;
  symbol: string;
  price: number;
  bestBid?: number;
  bestAsk?: number;
  change24hPercent?: number;
  timestamp: number;
};

export type OrderBook = {
  exchange: MarketExchange;
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
};

export type ConnectionState = {
  status: ConnectionStatus;
  error: string | null;
  updatedAt: number;
};

type TradingState = {
  prices: Record<string, PriceUpdate>;
  orderBooks: Record<string, OrderBook>;
  connections: Record<string, ConnectionState>;
  queuePrice: (key: string, update: PriceUpdate) => void;
  queueOrderBook: (key: string, update: OrderBook) => void;
  setConnection: (
    key: string,
    status: ConnectionStatus,
    error?: string | null,
  ) => void;
  clearMarket: (key: string) => void;
};

const pendingPrices = new Map<string, PriceUpdate>();
const pendingOrderBooks = new Map<string, OrderBook>();
let scheduledFrame: number | ReturnType<typeof setTimeout> | null = null;

const scheduleFlush = (flush: () => void) => {
  if (scheduledFrame !== null) return;

  if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
    scheduledFrame = window.requestAnimationFrame(() => {
      scheduledFrame = null;
      flush();
    });
    return;
  }

  scheduledFrame = setTimeout(() => {
    scheduledFrame = null;
    flush();
  }, 16);
};

export const marketKey = (exchange: MarketExchange, symbol: string) =>
  `${exchange}:${symbol.toUpperCase()}`;

export const useTradingStore = create<TradingState>((set) => {
  const flushBufferedUpdates = () => {
    if (pendingPrices.size === 0 && pendingOrderBooks.size === 0) return;

    const prices = Object.fromEntries(pendingPrices);
    const orderBooks = Object.fromEntries(pendingOrderBooks);
    pendingPrices.clear();
    pendingOrderBooks.clear();

    set((state) => ({
      prices:
        Object.keys(prices).length > 0
          ? { ...state.prices, ...prices }
          : state.prices,
      orderBooks:
        Object.keys(orderBooks).length > 0
          ? { ...state.orderBooks, ...orderBooks }
          : state.orderBooks,
    }));
  };

  return {
    prices: {},
    orderBooks: {},
    connections: {},
    queuePrice: (key, update) => {
      pendingPrices.set(key, update);
      scheduleFlush(flushBufferedUpdates);
    },
    queueOrderBook: (key, update) => {
      pendingOrderBooks.set(key, update);
      scheduleFlush(flushBufferedUpdates);
    },
    setConnection: (key, status, error = null) =>
      set((state) => ({
        connections: {
          ...state.connections,
          [key]: { status, error, updatedAt: Date.now() },
        },
      })),
    clearMarket: (key) =>
      set((state) => {
        pendingPrices.delete(key);
        pendingOrderBooks.delete(key);
        const prices = { ...state.prices };
        const orderBooks = { ...state.orderBooks };
        const connections = { ...state.connections };
        delete prices[key];
        delete orderBooks[key];
        delete connections[key];
        return { prices, orderBooks, connections };
      }),
  };
});
