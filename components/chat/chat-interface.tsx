"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { TextStreamChatTransport } from "ai";
import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import { type Source } from "@/types/chat";

function decodeSourcesHeader(encoded: string): Source[] {
  const json = atob(encoded);
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return [];
  return parsed as Source[];
}

const SUGGESTIONS = [
  "Apa gejala demam berdarah?",
  "Obat untuk batuk berdahak",
  "Cara mengatasi diare pada dewasa",
  "Apa itu hipertensi dan risikonya?",
];

export function ChatInterface() {
  const [sources, setSources] = useState<Source[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      headers: sessionId ? { "x-session-id": sessionId } : {},
      body: sessionId ? { sessionId } : {},
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const encodedSources = response.headers.get("x-sources");
        if (encodedSources) setSources(decodeSourcesHeader(encodedSources));
        const sid = response.headers.get("x-session-id");
        if (sid) setSessionId(sid);
        return response;
      },
    }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestionClick = useCallback((text: string) => {
    void sendMessage({ text });
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="bg-red-50 text-red-800 text-xs sm:text-sm px-4 py-2 sm:py-3 text-center border-b border-red-200 shrink-0 z-10 sticky top-0 shadow-sm">
        <strong>Peringatan Medis:</strong> Aplikasi ini memberikan informasi berbasis AI dan BUKAN pengganti saran medis profesional, diagnosis, atau pengobatan. <strong>Selalu konsultasikan dengan dokter</strong> untuk masalah kesehatan Anda.
      </div>
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-lg sm:text-xl font-semibold text-blue-800">Selamat datang di MedBot</p>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Ceritakan gejala atau tanyakan informasi obat
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={{
              id: message.id,
              role: message.role === "user" ? "user" : "assistant",
              content: message.parts
                .map((part) => (part.type === "text" ? (part as { type: "text"; text: string }).text : ""))
                .join(""),
            }}
            sources={message.role === "assistant" ? sources : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput
        input={input}
        isLoading={status !== "ready"}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || status !== "ready") return;
          void sendMessage({ text: input });
          setInput("");
        }}
      />
    </div>
  );
}
