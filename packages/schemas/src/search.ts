import { z } from "zod";

export const SearchRequest = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  language: z.string().optional(),
  region: z.string().optional(),
});

export type SearchRequest = z.infer<typeof SearchRequest>;

export const SearchResultItem = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  source: z.string().nullable(),
  rank: z.number().int(),
});

export type SearchResultItem = z.infer<typeof SearchResultItem>;

export const SearchResponse = z.object({
  query: z.string(),
  results: z.array(SearchResultItem),
  cached: z.boolean(),
  tookMs: z.number(),
});

export type SearchResponse = z.infer<typeof SearchResponse>;
