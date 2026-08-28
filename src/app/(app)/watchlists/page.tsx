import { WatchlistManager } from "@/components/watchlists/WatchlistManager";
import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export default async function WatchlistsPage() {
  const user = await requireCurrentUser();
  const data = await prisma.watchlist.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return <WatchlistManager initialWatchlists={data.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }))} />;
}
