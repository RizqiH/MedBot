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
    <div className="border-t px-4 py-4">
      <form onSubmit={onSubmit} className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={onInputChange}
          placeholder="Ceritakan gejala yang kamu rasakan..."
          rows={2}
          className="resize-none flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "Memproses..." : "Kirim"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        MedBot INA bukan pengganti konsultasi dokter. Selalu konfirmasi ke
        tenaga medis profesional.
      </p>
    </div>
  );
}

