import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type Message, type Source } from "@/types/chat";
import { TRIAGE_CONFIG } from "@/types/triage";
import { cn } from "@/lib/utils";
import { SourceCitation } from "./source-citation";
import { TriageCard } from "./triage-card";

interface MessageBubbleProps {
  message: Message;
  sources?: Source[];
}

function extractTriageLevel(content: string) {
  const levels = ["SEGERA", "DALAM_24_JAM", "DAPAT_DITUNGGU", "MANDIRI"] as const;
  for (const level of levels) {
    if (content.includes(level)) return level;
  }
  return null;
}

export function MessageBubble({ message, sources }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const triageLevel = !isUser ? extractTriageLevel(message.content) : null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[80%] space-y-2">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed [&_a]:underline [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0"
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          )}
        </div>
        {triageLevel && TRIAGE_CONFIG[triageLevel] && (
          <TriageCard result={TRIAGE_CONFIG[triageLevel]} />
        )}
        {sources && sources.length > 0 && <SourceCitation sources={sources} />}
      </div>
    </div>
  );
}

