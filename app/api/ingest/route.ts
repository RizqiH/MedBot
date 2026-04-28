import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { generateEmbedding } from "@/lib/rag/embeddings";

export const runtime = "nodejs";

function getIngestSecret(req: NextRequest) {
  return req.headers.get("x-ingest-secret") ?? req.headers.get("authorization");
}

function normalizeProvidedSecret(value: string | null) {
  if (!value) return null;
  if (value.startsWith("Bearer ")) return value.slice("Bearer ".length);
  return value;
}

export async function POST(req: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing INGEST_SECRET" },
      { status: 500 }
    );
  }

  const provided = normalizeProvidedSecret(getIngestSecret(req));
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const text = (body as { text?: unknown }).text;
  const source = (body as { source?: unknown }).source;

  if (typeof text !== "string" || typeof source !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(text);

  const rows = await Promise.all(
    chunks.map(async (chunk) => ({
      content: chunk,
      metadata: { source },
      embedding: await generateEmbedding(chunk),
    }))
  );

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("documents").insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}

