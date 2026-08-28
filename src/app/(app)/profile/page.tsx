import { ProfileImageUpload, VerificationDocumentUpload } from "@/components/profile/AssetUpload";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/current-user";
import prisma from "@/lib/prisma";

export default async function ProfilePage() {
  const current = await requireCurrentUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: current.id }, include: { verificationDocuments: { orderBy: { createdAt: "desc" } } } });
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">Profile & verification</h1><p className="text-sm text-muted-foreground">Manage your identity and Cloudinary assets.</p></div><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Personal details</CardTitle><CardDescription>Your account identity.</CardDescription></CardHeader><CardContent><ProfileForm name={user.name ?? ""} email={user.email} /></CardContent></Card><ProfileImageUpload userId={user.id} /><VerificationDocumentUpload userId={user.id} /><Card><CardHeader><CardTitle>Verification history</CardTitle><CardDescription>Documents submitted for review.</CardDescription></CardHeader><CardContent className="space-y-2">{user.verificationDocuments.map((document) => <div key={document.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{document.originalFilename ?? "Verification document"}</p><p className="text-xs text-muted-foreground">{document.createdAt.toLocaleDateString()}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs">{document.status}</span></div>)}{user.verificationDocuments.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No documents submitted.</p> : null}</CardContent></Card></div></div>;
}
