"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

const normalizeName = (name: string) => {
  const value = name.trim();
  if (value.length < 1 || value.length > 60) {
    throw new Error("Watchlist name must be between 1 and 60 characters");
  }
  return value;
};

const normalizeSymbols = (symbols: string[]) => {
  const normalized = [
    ...new Set(
      symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean),
    ),
  ];
  if (normalized.length > 100) {
    throw new Error("A watchlist can contain at most 100 symbols");
  }
  if (normalized.some((symbol) => !/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(symbol))) {
    throw new Error("One or more symbols are invalid");
  }
  return normalized;
};

const refreshWatchlists = () => {
  revalidatePath("/watchlists");
  revalidatePath("/dashboard");
};

export async function getWatchlists() {
  const user = await requireCurrentUser();
  const watchlists = await prisma.watchlist.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return watchlists.map((watchlist) => ({
    ...watchlist,
    createdAt: watchlist.createdAt.toISOString(),
    updatedAt: watchlist.updatedAt.toISOString(),
  }));
}

export async function createWatchlist(input: {
  name: string;
  symbols?: string[];
}) {
  const user = await requireCurrentUser();
  const watchlist = await prisma.watchlist.create({
    data: {
      userId: user.id,
      name: normalizeName(input.name),
      symbols: normalizeSymbols(input.symbols ?? []),
    },
  });
  refreshWatchlists();
  return { ...watchlist, createdAt: watchlist.createdAt.toISOString(), updatedAt: watchlist.updatedAt.toISOString() };
}

export async function updateWatchlist(
  id: string,
  input: { name?: string; symbols?: string[] },
) {
  const user = await requireCurrentUser();
  const existing = await prisma.watchlist.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Watchlist not found");

  const watchlist = await prisma.watchlist.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: normalizeName(input.name) }),
      ...(input.symbols !== undefined && { symbols: normalizeSymbols(input.symbols) }),
    },
  });
  refreshWatchlists();
  return { ...watchlist, createdAt: watchlist.createdAt.toISOString(), updatedAt: watchlist.updatedAt.toISOString() };
}

export async function deleteWatchlist(id: string) {
  const user = await requireCurrentUser();
  const result = await prisma.watchlist.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) throw new Error("Watchlist not found");
  refreshWatchlists();
  return { id };
}
