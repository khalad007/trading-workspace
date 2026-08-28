"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import prisma from "@/lib/prisma";

export type AuthFormState = { error?: string } | undefined;

const credentials = (formData: FormData) => ({
  email: String(formData.get("email") ?? "").trim().toLowerCase(),
  password: String(formData.get("password") ?? ""),
});

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = credentials(formData);
  if (!values.email || !values.password) return { error: "Email and password are required." };

  try {
    await signIn("credentials", { ...values, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }
}

export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const values = credentials(formData);

  if (name.length < 2 || name.length > 60) return { error: "Name must be 2–60 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: "Enter a valid email." };
  if (values.password.length < 8) return { error: "Password must contain at least 8 characters." };
  if (await prisma.user.findUnique({ where: { email: values.email }, select: { id: true } })) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(values.password, 12);
  await prisma.user.create({
    data: {
      name,
      email: values.email,
      passwordHash,
      portfolios: {
        create: { name: "Primary Portfolio", baseCurrency: "USD", cashBalance: 100_000 },
      },
      watchlists: {
        create: { name: "Crypto Majors", symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"] },
      },
    },
  });

  try {
    await signIn("credentials", { ...values, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created. Please sign in." };
    throw error;
  }
}
