"use client";

import { type Source } from "@/types/chat";
import { useState } from "react";

interface SourceCitationProps {
  sources: Source[];
}

export function SourceCitation({ sources }: SourceCitationProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="hover:text-foreground transition-colors"
      >
        {sources.length} sumber Kemenkes RI — {open ? "sembunyikan" : "lihat"}
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((source, i) => (
            <li
              key={source.id}
              className="rounded-lg bg-muted/50 px-3 py-2 leading-relaxed"
            >
              <span className="font-medium">[{i + 1}]</span>{" "}
              {source.content.slice(0, 200)}...
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

