"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { createPortfolio } from "@/app/actions/portfolios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreatePortfolioForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button />}><Plus /> New portfolio</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create paper portfolio</DialogTitle><DialogDescription>Choose a name and simulated starting cash balance.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setError(null); startTransition(async () => { try { await createPortfolio({ name: String(data.get("name") ?? ""), cashBalance: Number(data.get("cashBalance")) }); setOpen(false); } catch (value) { setError(value instanceof Error ? value.message : "Could not create portfolio"); } }); }}><label className="grid gap-1.5 text-sm">Name<Input name="name" placeholder="Growth Portfolio" required /></label><label className="grid gap-1.5 text-sm">Starting cash<Input name="cashBalance" type="number" min="0" step="0.01" defaultValue="100000" required /></label>{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : null}Create portfolio</Button></form></DialogContent></Dialog>;
}
