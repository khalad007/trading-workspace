"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  loginAction,
  registerAction,
  type AuthFormState,
} from "@/app/actions/authentication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" ? (
        <label className="grid gap-1.5 text-sm">
          Full name
          <Input name="name" autoComplete="name" placeholder="Alex Morgan" required />
        </label>
      ) : null}
      <label className="grid gap-1.5 text-sm">
        Email
        <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </label>
      <label className="grid gap-1.5 text-sm">
        Password
        <Input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          required
        />
      </label>
      {state?.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to MarketFlow? " : "Already have an account? "}
        <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
