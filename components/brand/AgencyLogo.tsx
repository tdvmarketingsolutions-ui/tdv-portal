import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Logo bovenaan de app (huisstijl v1.1, sectie 0.4): het logo van de agency
 * als dat er is (max. 32px hoog, object-contain); anders hun naam in
 * Epilogue 600, kleine letters en zónder punt (de punt is van TDV); en
 * zonder eigen branding het TDV-woordmerk.
 */
export function AgencyLogo({
  logoUrl,
  brandName,
  className,
}: {
  logoUrl?: string | null;
  brandName?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={brandName || ""} className={cn("h-7 max-h-8 w-auto max-w-[9rem] object-contain", className)} />
    );
  }
  if (brandName) {
    return (
      <span className={cn("block truncate font-display text-lg font-semibold lowercase", className)}>{brandName}</span>
    );
  }
  return <Wordmark className={cn("text-ink dark:text-ink-dark", className)} />;
}
