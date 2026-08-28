import Link from "next/link";
import { CandlestickChart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_42%)] px-4 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold"><span className="grid size-9 place-items-center rounded-lg bg-emerald-500 text-slate-950"><CandlestickChart className="size-5" /></span>MarketFlow</Link>{children}</div></main>;
}
