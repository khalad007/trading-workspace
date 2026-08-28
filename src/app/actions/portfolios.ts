"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export async function createPortfolio(input: { name: string; cashBalance: number }) {
  const user = await requireCurrentUser();
  const name = input.name.trim();
  if (name.length < 1 || name.length > 60) throw new Error("Portfolio name must be 1–60 characters");
  if (!Number.isFinite(input.cashBalance) || input.cashBalance < 0 || input.cashBalance > 100_000_000) throw new Error("Invalid starting balance");
  const portfolio = await prisma.portfolio.create({ data: { userId: user.id, name, cashBalance: input.cashBalance, baseCurrency: "USD" } });
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  return { id: portfolio.id, name: portfolio.name };
}
