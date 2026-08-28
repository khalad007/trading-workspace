"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export async function updateProfile(input: { name: string }) {
  const user = await requireCurrentUser();
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) throw new Error("Name must be 2–60 characters");
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { name };
}
