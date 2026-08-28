import { TradingWorkspace } from "@/components/trading/TradingWorkspace";
import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export default async function TradingPage() {
  const user = await requireCurrentUser();
  const portfolios = await prisma.portfolio.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, cashBalance: true } });
  return <TradingWorkspace portfolios={portfolios} />;
}
