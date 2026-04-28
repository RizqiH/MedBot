export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  triageLevel?: TriageLevel;
  createdAt?: Date;
}

export interface Source {
  id: string;
  content: string;
  metadata: Record<string, string>;
  similarity: number;
}

export type TriageLevel = "SEGERA" | "DALAM_24_JAM" | "DAPAT_DITUNGGU" | "MANDIRI";

