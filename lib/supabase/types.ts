export interface DocumentRow {
  id: string;
  content: string;
  metadata: Record<string, string> | null;
}

export interface MatchDocumentsRow {
  id: string;
  content: string;
  metadata: Record<string, string> | null;
  similarity: number;
}

