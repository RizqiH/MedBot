import { getSupabaseAdmin } from "@/lib/supabase/client";
import { generateEmbedding } from "@/lib/rag/embeddings";

export async function storeLongTermMemory(
  sessionId: string,
  summary: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const embedding = await generateEmbedding(summary);

  const { error } = await supabase.from("documents").insert({
    content: summary,
    metadata: {
      source: `session-memory-${sessionId}`,
      type: "conversation_summary",
    },
    embedding,
  });

  if (error) throw new Error(error.message);
}

export async function retrieveLongTermMemory(
  query: string,
  limit: number = 3
): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: limit,
    match_threshold: 0.5,
  });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row: { metadata: Record<string, string> | null }) =>
      row.metadata?.type === "conversation_summary"
    )
    .map((row: { content: string }) => row.content);
}
