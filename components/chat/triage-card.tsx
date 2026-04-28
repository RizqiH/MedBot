import { type TriageResult } from "@/types/triage";
import { cn } from "@/lib/utils";

interface TriageCardProps {
  result: TriageResult;
}

const colorMap: Record<string, string> = {
  red: "border-red-200 bg-red-50 text-red-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-green-200 bg-green-50 text-green-800",
};

export function TriageCard({ result }: TriageCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-xs font-medium",
        colorMap[result.color]
      )}
    >
      <span className="font-semibold">{result.label}</span>
      <span className="mx-1">—</span>
      <span>{result.description}</span>
    </div>
  );
}

