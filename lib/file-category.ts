import type { LucideIcon } from "lucide-react";
import { Image as ImageIcon, Palette, Video, Receipt, FileSignature, FolderOpen } from "lucide-react";

export const FILE_CATEGORIES = ["logo", "brand", "photo", "video", "invoice", "contract", "other"] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const FILE_CATEGORY_LABEL: Record<FileCategory, string> = {
  logo: "Logo",
  brand: "Huisstijl",
  photo: "Foto",
  video: "Video",
  invoice: "Factuur",
  contract: "Contract",
  other: "Overig",
};

// One icon per map/folder on /files — category doubles as the folder name,
// see app/(portal)/files/[category]/page.tsx.
export const FILE_CATEGORY_ICON: Record<FileCategory, LucideIcon> = {
  logo: ImageIcon,
  brand: Palette,
  photo: ImageIcon,
  video: Video,
  invoice: Receipt,
  contract: FileSignature,
  other: FolderOpen,
};
