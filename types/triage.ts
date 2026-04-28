export interface TriageResult {
  level: "SEGERA" | "DALAM_24_JAM" | "DAPAT_DITUNGGU" | "MANDIRI";
  label: string;
  description: string;
  color: string;
}

export const TRIAGE_CONFIG: Record<string, TriageResult> = {
  SEGERA: {
    level: "SEGERA",
    label: "Darurat",
    description: "Segera ke UGD atau hubungi 119",
    color: "red",
  },
  DALAM_24_JAM: {
    level: "DALAM_24_JAM",
    label: "Perlu Dokter",
    description: "Kunjungi dokter dalam 24 jam ke depan",
    color: "amber",
  },
  DAPAT_DITUNGGU: {
    level: "DAPAT_DITUNGGU",
    label: "Puskesmas",
    description: "Bisa ke puskesmas dalam beberapa hari",
    color: "blue",
  },
  MANDIRI: {
    level: "MANDIRI",
    label: "Mandiri",
    description: "Dapat ditangani di rumah",
    color: "green",
  },
};

