"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); startTransition(async () => { try { await updateProfile({ name: value }); setMessage("Profile saved."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save profile."); } }); }}><label className="grid gap-1.5 text-sm">Name<Input value={value} onChange={(event) => setValue(event.target.value)} /></label><label className="grid gap-1.5 text-sm">Email<Input value={email} disabled /></label>{message ? <p className="text-sm text-muted-foreground">{message}</p> : null}<Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : null}Save changes</Button></form>;
}
