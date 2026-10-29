"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import {
  uploadAgencyLogoAction,
  removeAgencyLogoAction,
  uploadAgencyFaviconAction,
  removeAgencyFaviconAction,
} from "./actions";

type Kind = "logo" | "favicon";

// Logo en favicon delen dezelfde upload-flow; enkel de teksten, het
// toegelaten bestandstype en de preview verschillen.
const CONFIG = {
  logo: {
    upload: uploadAgencyLogoAction,
    remove: removeAgencyLogoAction,
    accept: "image/*",
    noun: "Logo",
    hint: null,
  },
  favicon: {
    upload: uploadAgencyFaviconAction,
    remove: removeAgencyFaviconAction,
    accept: "image/png,image/svg+xml,image/x-icon,.ico",
    noun: "Favicon",
    hint: "Het icoon in het browsertabblad en op het beginscherm. Vierkant, PNG (minstens 512 × 512 px), SVG of ICO, hoogstens 512 KB. Zonder favicon gebruiken we het logo.",
  },
} as const;

export function AgencyLogoUpload({
  agencyName,
  logoUrl,
  kind = "logo",
}: {
  agencyName: string;
  logoUrl: string | null;
  kind?: Kind;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[kind];

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await config.upload(formData);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`${config.noun} bijgewerkt.`);
    router.refresh();
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await config.remove();
    setRemoving(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`${config.noun} verwijderd.`);
    router.refresh();
  }

  const preview =
    kind === "favicon" ? (
      // Op ware grootte (32px) in een tabblad-achtig vak, zodat je ziet of
      // het icoon klein nog leesbaar is.
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-sunken dark:border-border-dark dark:bg-surface-sunken-dark">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <span className="text-xs text-ink-muted dark:text-ink-dark-muted">geen</span>
        )}
      </div>
    ) : logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={agencyName} className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover dark:border-border-dark" />
    ) : (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-canvas text-xl font-semibold text-ink-muted dark:bg-canvas-dark dark:text-ink-dark-muted">
        {agencyName.charAt(0).toUpperCase()}
      </div>
    );

  return (
    <div className="flex items-center gap-4">
      {preview}
      <div className="min-w-0 space-y-2">
        {config.hint && <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{config.hint}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInputRef} type="file" accept={config.accept} className="hidden" onChange={handleChange} />
          <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            {!uploading && <Upload size={14} strokeWidth={1.75} />}
            {logoUrl ? `${config.noun} vervangen` : `${config.noun} uploaden`}
          </Button>
          {logoUrl && (
            <Button type="button" variant="secondary" size="sm" loading={removing} onClick={handleRemove}>
              {!removing && <X size={14} strokeWidth={1.75} />}
              Verwijderen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
