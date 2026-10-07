"use server";

import { revalidatePath } from "next/cache";
import { ingestKnowledgeBase } from "@/lib/data/admin/ai-ingest";

export async function runKnowledgeBaseIngestAction(options?: {
  fullResync?: boolean;
}): Promise<{ error?: string; message?: string }> {
  try {
    const result = await ingestKnowledgeBase(options);
    revalidatePath("/admin/ai");
    return {
      message:
        result.chunksWritten === 0
          ? options?.fullResync
            ? "Kennisbank volledig herbouwd, maar er was nog geen data om te indexeren."
            : "Kennisbank bijgewerkt — geen wijzigingen sinds de vorige run."
          : options?.fullResync
            ? `Kennisbank volledig herbouwd: ${result.chunksWritten} fragmenten voor ${result.companiesTouched} klant(en).`
            : `Kennisbank bijgewerkt: ${result.chunksWritten} fragmenten voor ${result.companiesTouched} klant(en).`,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_AUTHORIZED") {
      return { error: "Geen toegang tot deze actie." };
    }
    if (err instanceof Error && err.message === "SERVICE_ROLE_NOT_CONFIGURED") {
      return { error: "Ingest is nog niet geconfigureerd (ontbrekende service role key)." };
    }
    if (err instanceof Error && err.message.includes("EMBEDDINGS_API_KEY")) {
      return { error: "Ingest is nog niet geconfigureerd (ontbrekende EMBEDDINGS_API_KEY)." };
    }
    return { error: err instanceof Error ? err.message : "Kennisbank-ingest is mislukt." };
  }
}
