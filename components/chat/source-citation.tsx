"use client";

import { type Source } from "@/types/chat";
import { useState } from "react";

interface SourceCitationProps {
  sources: Source[];
}

function extractSourceLabel(source: Source): string {
  const raw = source.metadata?.source ?? "";
  if (raw.includes("|")) return raw.split("|")[0].trim();
  if (raw.includes("medicine-database")) return "Database Obat";
  if (raw.includes("kemenkes")) return "Pedoman Kemenkes RI";
  return raw || "Dokumen Medis";
}

function similarityBadge(score: number): { label: string; className: string } {
  const pct = Math.round(score * 100);
  if (pct >= 80) return { label: `${pct}%`, className: "bg-teal-100 text-teal-800" };
  if (pct >= 60) return { label: `${pct}%`, className: "bg-blue-100 text-blue-800" };
  return { label: `${pct}%`, className: "bg-slate-100 text-slate-600" };
}

export function SourceCitation({ sources }: SourceCitationProps) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        {sources.length} sumber referensi
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((source, i) => {
            const label = extractSourceLabel(source);
            const badge = similarityBadge(source.similarity);
            return (
              <div
                key={source.id}
                className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed shadow-sm"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">
                    [{i + 1}] {label}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                    Relevansi {badge.label}
                  </span>
                </div>
                <p className="text-slate-500 line-clamp-3">
                  {source.content.slice(0, 300)}
                  {source.content.length > 300 ? "..." : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
