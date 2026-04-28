import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildRAGContext } from "@/lib/rag/pipeline";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY");
}

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UIMessageTextPart {
  type: "text";
  text: string;
}

interface UIMessage {
  role: "user" | "assistant" | "system";
  parts: Array<UIMessageTextPart | { type: string }>;
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { role?: unknown }).role === "string" &&
    typeof (value as { content?: unknown }).content === "string"
  );
}

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.every((m) => isChatMessage(m));
}

function isUIMessage(value: unknown): value is UIMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { role?: unknown }).role === "string" &&
    Array.isArray((value as { parts?: unknown }).parts)
  );
}

function isUIMessageArray(value: unknown): value is UIMessage[] {
  return Array.isArray(value) && value.every((m) => isUIMessage(m));
}

function textFromUIMessage(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? (part as UIMessageTextPart).text : ""))
    .join("");
}

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  const maybeMessages = (body as { messages?: unknown }).messages;
  const maybeMessage = (body as { message?: unknown }).message;

  const messages: ChatMessage[] = isChatMessageArray(maybeMessages)
    ? maybeMessages
    : isUIMessageArray(maybeMessages)
      ? maybeMessages.map((m) => ({ role: m.role, content: textFromUIMessage(m) }))
      : isUIMessage(maybeMessage)
        ? [{ role: maybeMessage.role, content: textFromUIMessage(maybeMessage) }]
        : [];

  if (messages.length === 0) {
    return new Response("Invalid request body", { status: 400 });
  }

  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const { systemPrompt, sources } = await buildRAGContext(lastUserMessage);

  if (sources.length === 0) {
    const fallbackText =
      "Maaf, aku belum punya informasi yang relevan di basis pengetahuan Pedoman Kemenkes RI untuk menjawab pertanyaan itu.\n\n" +
      "Silakan lakukan ingest dokumen Kemenkes ke sistem terlebih dahulu, lalu coba ulang pertanyaannya.\n\n" +
      "Respons ini bukan pengganti konsultasi dokter. Jika gejala berat (sesak napas, nyeri dada hebat, penurunan kesadaran, kejang, atau dehidrasi berat), segera ke IGD.";

    const response = new Response(fallbackText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-sources": Buffer.from(JSON.stringify([])).toString("base64"),
      },
    });

    return response;
  }

  const result = streamText({
    model: groq.chat("llama-3.1-8b-instant"),
    system: systemPrompt,
    messages,
  });

  const response = result.toTextStreamResponse();
  response.headers.set(
    "x-sources",
    Buffer.from(JSON.stringify(sources)).toString("base64")
  );

  return response;
}

