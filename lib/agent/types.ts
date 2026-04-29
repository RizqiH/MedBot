export interface SessionMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface ToolResult {
  type: "rag" | "web_search" | "session_history" | "long_term_memory";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  sessionId: string;
  query: string;
  sessionHistory: SessionMessage[];
  toolResults: ToolResult[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}
