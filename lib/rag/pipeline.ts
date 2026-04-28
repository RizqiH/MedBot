import { retrieveDocuments, type RetrievedDocument } from "./retriever";
import { SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";

export interface RAGContext {
  systemPrompt: string;
  sources: RetrievedDocument[];
}

export async function buildRAGContext(query: string): Promise<RAGContext> {
  const sources = await retrieveDocuments(query);

  const contextText =
    sources.length > 0
      ? sources.map((doc, i) => `[${i + 1}] ${doc.content}`).join("\n\n")
      : "Tidak ada dokumen relevan yang ditemukan dalam basis pengetahuan.";

  const systemPrompt = SYSTEM_PROMPT.replace("{context}", contextText);

  return { systemPrompt, sources };
}

