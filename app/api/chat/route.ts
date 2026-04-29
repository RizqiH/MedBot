import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { orchestrate, saveAssistantResponse } from "@/lib/agent/orchestrator";
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
  const sessionId = (body as { sessionId?: string }).sessionId;

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

  const {
    systemPrompt,
    sources,
    sessionId: activeSessionId,
    webResults,
  } = await orchestrate(lastUserMessage, sessionId);

  const result = streamText({
    model: groq.chat("llama-3.1-8b-instant"),
    system: systemPrompt,
    messages,
    onFinish: async ({ text }) => {
      await saveAssistantResponse(activeSessionId, text).catch(() => {});
    },
  });

  const response = result.toTextStreamResponse();

  response.headers.set(
    "x-sources",
    Buffer.from(JSON.stringify(sources)).toString("base64")
  );
  response.headers.set("x-session-id", activeSessionId);

  if (webResults.length > 0) {
    response.headers.set(
      "x-web-sources",
      Buffer.from(JSON.stringify(webResults)).toString("base64")
    );
  }

  return response;
}
