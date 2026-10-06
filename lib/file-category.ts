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
