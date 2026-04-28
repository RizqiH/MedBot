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
  const levels = ["SEGERA", "DALAM_24_JAM", "DALAM 24 JAM", "DAPAT_DITUNGGU", "DAPAT DITUNGGU", "MANDIRI", "PERAWATAN MANDIRI"] as const;
  for (const level of levels) {
    if (content.includes(level)) {
      if (level === "DALAM 24 JAM") return "DALAM_24_JAM";
      if (level === "DAPAT DITUNGGU") return "DAPAT_DITUNGGU";
      if (level === "PERAWATAN MANDIRI") return "MANDIRI";
      return level as "SEGERA" | "DALAM_24_JAM" | "DAPAT_DITUNGGU" | "MANDIRI";
    }
  }
  return null;
}

export function MessageBubble({ message, sources }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const triageLevel = !isUser ? extractTriageLevel(message.content) : null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("space-y-2", isUser ? "max-w-[85%] sm:max-w-[75%]" : "max-w-[95%] sm:max-w-[85%]")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed [&_a]:underline [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            isUser
              ? "bg-teal-600 text-white rounded-br-sm"
              : "bg-slate-100 text-slate-800 rounded-bl-sm [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_h2]:text-blue-800"
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
