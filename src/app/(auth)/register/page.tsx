import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegisterPage() {
  if (await auth()) redirect("/dashboard");
  return <Card><CardHeader><CardTitle>Create your workspace</CardTitle><CardDescription>You’ll start with a $100,000 simulated portfolio.</CardDescription></CardHeader><CardContent><AuthForm mode="register" /></CardContent></Card>;
}
