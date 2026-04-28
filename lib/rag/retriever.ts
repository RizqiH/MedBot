import { getSupabaseAdmin } from "@/lib/supabase/client";
import { type MatchDocumentsRow } from "@/lib/supabase/types";
import { generateEmbedding } from "./embeddings";

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: Record<string, string>;
  similarity: number;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function retrieveDocuments(
  query: string,
  matchCount?: number,
  matchThreshold?: number
): Promise<RetrievedDocument[]> {
  const count = Math.min(
    50,
    Math.max(1, matchCount ?? envInt("RAG_MATCH_COUNT", 8))
  );
  const threshold = Math.min(
    1,
    Math.max(
      0,
      matchThreshold ??
        envFloat("RAG_MATCH_THRESHOLD", 0.42)
    )
  );

  const embedding = await generateEmbedding(query);
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.rpc("match_documents", {
    query_embedding: embedding,
    match_count: count,
    match_threshold: threshold,
  });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as MatchDocumentsRow[];

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata ?? {},
    similarity: row.similarity,
  }));
}

