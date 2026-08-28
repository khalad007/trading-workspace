import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  if (await auth()) redirect("/dashboard");
  return <Card><CardHeader><CardTitle>Welcome back</CardTitle><CardDescription>Sign in to open your trading workspace.</CardDescription></CardHeader><CardContent><AuthForm mode="login" /></CardContent></Card>;
}
