"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { FileCheck2, ImagePlus, Loader2, ShieldCheck } from "lucide-react";

import { saveUploadedAsset } from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AssetKind = "profile" | "verification";

type AssetUploadProps = {
  userId: string;
  kind: AssetKind;
  onSaved?: () => void;
  initialImageUrl?: string | null;
};

export function AssetUpload({ userId, kind, onSaved, initialImageUrl }: AssetUploadProps) {
  const [isSaving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const isProfile = kind === "profile";
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? null);
  const folder = `trading-workspace/users/${userId}/${kind}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isProfile ? <ImagePlus className="size-4" /> : <ShieldCheck className="size-4" />}
          {isProfile ? "Profile image" : "Verification document"}
        </CardTitle>
        <CardDescription>
          {isProfile
            ? "Upload a JPG, PNG, or WebP image up to 5 MB."
            : "Securely upload a JPG, PNG, or PDF document up to 10 MB."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isProfile && imageUrl ? (
          <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3">
            <Image
              src={imageUrl}
              alt="Current profile"
              width={80}
              height={80}
              className="size-20 rounded-full border object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-medium">Current profile image</p>
              <p className="text-xs text-muted-foreground">Upload a new image to replace it.</p>
            </div>
          </div>
        ) : null}
        <CldUploadWidget
          signatureEndpoint="/api/cloudinary/signature"
          options={{
            folder,
            multiple: false,
            maxFiles: 1,
            maxFileSize: isProfile ? 5_000_000 : 10_000_000,
            resourceType: isProfile ? "image" : "auto",
            clientAllowedFormats: isProfile
              ? ["jpg", "jpeg", "png", "webp"]
              : ["jpg", "jpeg", "png", "pdf"],
            sources: isProfile ? ["local", "camera"] : ["local", "camera"],
            ...(isProfile ? {} : { type: "authenticated" }),
          }}
          onSuccess={(result) => {
            if (typeof result.info === "string" || !result.info) return;
            const info = result.info;
            setMessage(null);
            startSaving(async () => {
              try {
                await saveUploadedAsset({
                  kind,
                  publicId: info.public_id,
                  secureUrl: info.secure_url,
                  resourceType: info.resource_type,
                  originalFilename: info.original_filename,
                });
                if (isProfile) setImageUrl(info.secure_url);
                setMessage(isProfile ? "Profile image updated." : "Document submitted for verification.");
                onSaved?.();
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Could not save upload.");
              }
            });
          }}
        >
          {({ open, isLoading }) => (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || isSaving}
              onClick={() => open()}
            >
              {isLoading || isSaving ? <Loader2 className="animate-spin" /> : <FileCheck2 />}
              {isSaving ? "Saving…" : "Choose file"}
            </Button>
          )}
        </CldUploadWidget>
        {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ProfileImageUpload(props: Omit<AssetUploadProps, "kind">) {
  return <AssetUpload {...props} kind="profile" />;
}

export function VerificationDocumentUpload(props: Omit<AssetUploadProps, "kind">) {
  return <AssetUpload {...props} kind="verification" />;
}
