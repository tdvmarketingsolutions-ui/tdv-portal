"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { uploadCompanyLogoAction, removeCompanyLogoAction } from "../actions";

export function CompanyLogoUpload({
  companyId,
  companyName,
  logoUrl,
}: {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadCompanyLogoAction(companyId, formData);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Logo bijgewerkt.");
    router.refresh();
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await removeCompanyLogoAction(companyId);
    setRemoving(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Logo verwijderd.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={companyName} className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover dark:border-border-dark" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-canvas text-xl font-semibold text-ink-muted dark:bg-canvas-dark dark:text-ink-dark-muted">
          {companyName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
          {!uploading && <Upload size={14} strokeWidth={1.75} />}
          {logoUrl ? "Logo vervangen" : "Logo uploaden"}
        </Button>
        {logoUrl && (
          <Button type="button" variant="secondary" size="sm" loading={removing} onClick={handleRemove}>
            {!removing && <X size={14} strokeWidth={1.75} />}
            Verwijderen
          </Button>
        )}
      </div>
    </div>
  );
}
