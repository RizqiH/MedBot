"use client";

import { type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <div className="border-t px-3 sm:px-4 py-3 sm:py-4 bg-white">
      <form onSubmit={onSubmit} className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={onInputChange}
          placeholder="Ceritakan gejala atau tanyakan obat..."
          rows={2}
          className="resize-none flex-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
        >
          {isLoading ? "..." : "Kirim"}
        </Button>
      </form>
      <p className="text-[10px] sm:text-xs text-slate-400 mt-2 text-center">
        Bukan pengganti konsultasi dokter. Selalu konfirmasi ke tenaga medis.
      </p>
    </div>
  );
}
