"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

type UploadedAsset = {
  kind: "profile" | "verification";
  publicId: string;
  secureUrl: string;
  resourceType: string;
  originalFilename?: string;
};

export async function saveUploadedAsset(asset: UploadedAsset) {
  const user = await requireCurrentUser();
  const expectedPrefix = `trading-workspace/users/${user.id}/${asset.kind}`;
  let url: URL;

  try {
    url = new URL(asset.secureUrl);
  } catch {
    throw new Error("Invalid asset URL");
  }

  if (url.protocol !== "https:" || !url.hostname.endsWith("res.cloudinary.com")) {
    throw new Error("Asset must be hosted by Cloudinary");
  }
  if (!asset.publicId.startsWith(expectedPrefix)) throw new Error("Invalid asset location");

  if (asset.kind === "profile") {
    await prisma.user.update({
      where: { id: user.id },
      data: { image: asset.secureUrl, imagePublicId: asset.publicId },
    });
    revalidatePath("/profile");
    return { kind: asset.kind, secureUrl: asset.secureUrl };
  }

  const document = await prisma.verificationDocument.create({
    data: {
      userId: user.id,
      publicId: asset.publicId,
      secureUrl: asset.secureUrl,
      resourceType: asset.resourceType,
      originalFilename: asset.originalFilename,
    },
  });
  revalidatePath("/profile");
  return { kind: asset.kind, id: document.id, status: document.status };
}
