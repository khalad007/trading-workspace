"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { createWatchlist, deleteWatchlist, updateWatchlist } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Watchlist = { id: string; name: string; symbols: string[]; createdAt: string; updatedAt: string };

export function WatchlistManager({ initialWatchlists }: { initialWatchlists: Watchlist[] }) {
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (job: () => Promise<void>) => startTransition(async () => { setError(null); try { await job(); } catch (value) { setError(value instanceof Error ? value.message : "Something went wrong"); } });

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Watchlists</h1><p className="text-sm text-muted-foreground">Organize the markets you follow.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button />}><Plus /> New watchlist</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create watchlist</DialogTitle><DialogDescription>Add comma-separated market symbols.</DialogDescription></DialogHeader><form className="space-y-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); run(async () => { const item = await createWatchlist({ name: String(data.get("name") ?? ""), symbols: String(data.get("symbols") ?? "").split(",") }); setWatchlists((items) => [item, ...items]); setOpen(false); }); }}><Input name="name" placeholder="Tech leaders" required /><Input name="symbols" placeholder="BTCUSDT, ETHUSDT, SOLUSDT" /><Button type="submit" className="w-full" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : null}Create</Button></form></DialogContent></Dialog></div>
    {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
    <div className="grid gap-4 lg:grid-cols-2">{watchlists.map((watchlist) => <WatchlistCard key={watchlist.id} watchlist={watchlist} pending={pending} onSave={(name, symbols) => run(async () => { const item = await updateWatchlist(watchlist.id, { name, symbols }); setWatchlists((items) => items.map((entry) => entry.id === item.id ? item : entry)); })} onDelete={() => run(async () => { await deleteWatchlist(watchlist.id); setWatchlists((items) => items.filter((entry) => entry.id !== watchlist.id)); })} />)}</div>
    {watchlists.length === 0 ? <div className="grid min-h-56 place-items-center rounded-xl border border-dashed text-muted-foreground">Create your first watchlist.</div> : null}
  </div>;
}

function WatchlistCard({ watchlist, pending, onSave, onDelete }: { watchlist: Watchlist; pending: boolean; onSave: (name: string, symbols: string[]) => void; onDelete: () => void }) {
  const [name, setName] = useState(watchlist.name);
  const [symbols, setSymbols] = useState(watchlist.symbols.join(", "));
  return <Card><CardHeader><CardTitle><Input value={name} onChange={(event) => setName(event.target.value)} /></CardTitle></CardHeader><CardContent className="space-y-3"><Input value={symbols} onChange={(event) => setSymbols(event.target.value)} placeholder="BTCUSDT, ETHUSDT" /><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={pending} onClick={onDelete}><Trash2 /> Delete</Button><Button size="sm" disabled={pending} onClick={() => onSave(name, symbols.split(","))}><Save /> Save</Button></div></CardContent></Card>;
}
