import { type WebSearchResult } from "@/lib/agent/types";

const TAVILY_API_URL = "https://api.tavily.com/search";

export async function searchWeb(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${query} site:kemkes.go.id OR kesehatan Indonesia`,
      search_depth: "basic",
      max_results: 5,
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    results?: Array<{
      title: string;
      url: string;
      content: string;
      score: number;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));
}

export function shouldSearchWeb(query: string, ragHasResults: boolean): boolean {
  const timePatterns = [
    /terbaru/i,
    /hari ini/i,
    /minggu ini/i,
    /bulan ini/i,
    /tahun \d{4}/i,
    /update/i,
    /berita/i,
    /kasus/i,
    /wabah/i,
    /pandemi/i,
    /outbreak/i,
    /vaksin terbaru/i,
    /peraturan baru/i,
    /regulasi/i,
  ];

  const needsWebSearch = timePatterns.some((p) => p.test(query));
  if (needsWebSearch) return true;
  if (!ragHasResults && query.length > 15) return true;

  return false;
}
