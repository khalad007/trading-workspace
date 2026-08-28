import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/current-user";

type SignatureBody = {
  paramsToSign?: Record<string, string | number | boolean | string[]>;
};

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as SignatureBody;
    const params = body.paramsToSign;
    const secret = process.env.CLOUDINARY_API_SECRET;
    const folder = typeof params?.folder === "string" ? params.folder : "";
    const allowedFolders = new Set([
      `trading-workspace/users/${user.id}/profile`,
      `trading-workspace/users/${user.id}/verification`,
    ]);

    if (!params || !secret) {
      return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 500 });
    }
    if (!allowedFolders.has(folder)) {
      return NextResponse.json({ error: "Upload folder is not allowed" }, { status: 403 });
    }

    const signature = cloudinary.utils.api_sign_request(params, secret);
    return NextResponse.json({ signature });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
