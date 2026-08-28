"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

type SimulatedTradeInput = {
  portfolioId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees?: number;
};

const positiveNumber = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive`);
  return value;
};

export async function executeSimulatedTrade(input: SimulatedTradeInput) {
  const user = await requireCurrentUser();
  const symbol = input.symbol.trim().toUpperCase();
  const quantity = positiveNumber(input.quantity, "Quantity");
  const price = positiveNumber(input.price, "Price");
  const fees = input.fees ?? 0;

  if (!/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(symbol)) throw new Error("Invalid symbol");
  if (!Number.isFinite(fees) || fees < 0) throw new Error("Fees cannot be negative");

  const result = await prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.findFirst({
      where: { id: input.portfolioId, userId: user.id },
    });
    if (!portfolio) throw new Error("Portfolio not found");

    const grossAmount = quantity * price;
    const cashChange = input.side === "BUY" ? -(grossAmount + fees) : grossAmount - fees;

    if (input.side === "BUY" && portfolio.cashBalance + cashChange < 0) {
      throw new Error("Insufficient simulated cash balance");
    }

    if (input.side === "SELL") {
      const history = await tx.transaction.findMany({
        where: { portfolioId: portfolio.id, symbol, type: { in: ["BUY", "SELL"] } },
        select: { type: true, quantity: true },
      });
      const position = history.reduce(
        (total, trade) => total + (trade.type === "BUY" ? trade.quantity ?? 0 : -(trade.quantity ?? 0)),
        0,
      );
      if (position < quantity) throw new Error("Insufficient simulated position");
    }

    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        portfolioId: portfolio.id,
        symbol,
        type: input.side,
        quantity,
        price,
        amount: grossAmount,
        fees,
        currency: portfolio.baseCurrency,
      },
    });
    const updatedPortfolio = await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cashBalance: { increment: cashChange } },
    });

    return { transaction, cashBalance: updatedPortfolio.cashBalance };
  });

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  return {
    ...result,
    transaction: {
      ...result.transaction,
      occurredAt: result.transaction.occurredAt.toISOString(),
      createdAt: result.transaction.createdAt.toISOString(),
    },
  };
}
