"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
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

export function ChatInterface() {
  const [sources, setSources] = useState<Source[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const encodedSources = response.headers.get("x-sources");
        if (encodedSources) setSources(decodeSourcesHeader(encodedSources));
        return response;
      },
    }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <p className="text-lg font-medium">Selamat datang di MedBot INA</p>
            <p className="text-sm mt-1">Ceritakan gejala yang kamu rasakan</p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={{
              id: message.id,
              role: message.role === "user" ? "user" : "assistant",
              content: message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
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

