import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function requireCurrentUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) throw new Error("Unauthorized");
  return user;
}
