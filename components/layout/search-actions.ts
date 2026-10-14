"use server";

import { globalSearch, type SearchResult } from "@/lib/data/search";

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  return globalSearch(query);
}
