import { type AgentContext, type ToolResult } from "./types";
import { retrieveDocuments, type RetrievedDocument } from "@/lib/rag/retriever";
import { getOrCreateSession, getSessionHistory, saveMessage } from "@/lib/memory/session-store";
import { retrieveLongTermMemory } from "@/lib/memory/long-term-store";
import { searchWeb, shouldSearchWeb } from "@/lib/search/web-search";
import { SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";

export interface OrchestratorResult {
  systemPrompt: string;
  sources: RetrievedDocument[];
  sessionId: string;
  webResults: Array<{ title: string; url: string; content: string }>;
}

export async function orchestrate(
  query: string,
  sessionId?: string
): Promise<OrchestratorResult> {
  const session = await getOrCreateSession(sessionId);

  const [sessionHistory, ragSources, longTermMemories] = await Promise.all([
    getSessionHistory(session.id),
    retrieveDocuments(query),
    retrieveLongTermMemory(query, 3).catch(() => [] as string[]),
  ]);

  const toolResults: ToolResult[] = [];

  if (ragSources.length > 0) {
    const ragText = ragSources
      .map((doc, i) => `[${i + 1}] ${doc.content}`)
      .join("\n\n");
    toolResults.push({ type: "rag", content: ragText });
  }

  if (longTermMemories.length > 0) {
    toolResults.push({
      type: "long_term_memory",
      content: longTermMemories.join("\n---\n"),
    });
  }

  if (sessionHistory.length > 0) {
    const historyText = sessionHistory
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Bot"}: ${m.content.slice(0, 200)}`)
      .join("\n");
    toolResults.push({ type: "session_history", content: historyText });
  }

  let webResults: Array<{ title: string; url: string; content: string }> = [];

  if (shouldSearchWeb(query, ragSources.length > 0)) {
    const results = await searchWeb(query);
    if (results.length > 0) {
      webResults = results;
      const webText = results
        .map((r) => `[Web: ${r.title}] ${r.content} (${r.url})`)
        .join("\n\n");
      toolResults.push({ type: "web_search", content: webText });
    }
  }

  await saveMessage(session.id, "user", query);

  const systemPrompt = buildSystemPrompt(toolResults);

  return {
    systemPrompt,
    sources: ragSources,
    sessionId: session.id,
    webResults,
  };
}

export async function saveAssistantResponse(
  sessionId: string,
  content: string
): Promise<void> {
  await saveMessage(sessionId, "assistant", content);
}

function buildSystemPrompt(toolResults: ToolResult[]): string {
  const sections: string[] = [];

  const sessionHistory = toolResults.find((r) => r.type === "session_history");
  if (sessionHistory) {
    sections.push(`RIWAYAT PERCAKAPAN SESI INI:\n${sessionHistory.content}`);
  }

  const longTerm = toolResults.find((r) => r.type === "long_term_memory");
  if (longTerm) {
    sections.push(`MEMORI JANGKA PANJANG (dari sesi sebelumnya):\n${longTerm.content}`);
  }

  const rag = toolResults.find((r) => r.type === "rag");
  const ragContent = rag?.content ?? "Tidak ada dokumen relevan yang ditemukan dalam basis pengetahuan.";

  const webSearch = toolResults.find((r) => r.type === "web_search");
  if (webSearch) {
    sections.push(`HASIL PENCARIAN WEB (informasi terkini):\n${webSearch.content}`);
  }

  const contextBlock = [
    ...sections,
    `DOKUMEN BASIS PENGETAHUAN:\n${ragContent}`,
  ].join("\n\n---\n\n");

  return SYSTEM_PROMPT.replace("{context}", contextBlock);
}
