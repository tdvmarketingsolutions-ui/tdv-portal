import type { ContentChannel, ContentStatus } from "@/types/domain";
import type { BadgeTone } from "@/components/ui/Badge";

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Concept",
  pending_approval: "Wacht op goedkeuring",
  approved: "Goedgekeurd",
  scheduled: "Ingepland",
  published: "Gepubliceerd",
};

export const CONTENT_STATUS_TONE: Record<ContentStatus, BadgeTone> = {
  draft: "gray",
  pending_approval: "amber",
  approved: "green",
  scheduled: "blue",
  published: "violet",
};

export const CONTENT_CHANNEL_LABEL: Record<ContentChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  blog: "Blog",
  email: "E-mail",
  ads: "Advertenties",
  other: "Overig",
};
