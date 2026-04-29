"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Berbasis Pedoman Kemenkes",
    desc: "Jawaban diambil langsung dari dokumen resmi Kementerian Kesehatan RI.",
  },
  {
    title: "Risk Timeline",
    desc: "Estimasi risiko jika gejala tidak ditangani dalam waktu tertentu.",
  },
  {
    title: "11.800+ Database Obat",
    desc: "Rekomendasi obat lengkap dengan komposisi, efek samping, dan alternatif.",
  },
  {
    title: "Sumber Transparan",
    desc: "Setiap jawaban menampilkan dokumen sumber beserta skor relevansinya.",
  },
];

export default function LandingPage() {
  const [isLeaving, setIsLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    setIsLeaving(true);
    setTimeout(() => router.push("/chat"), 600);
  };

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden relative transition-all duration-[600ms] ease-in-out ${
        isLeaving
          ? "-translate-y-full opacity-0 scale-95"
          : "translate-y-0 opacity-100 scale-100"
      }`}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-teal-50/40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[600px] rounded-full bg-teal-100/30 blur-[120px]" />

      <div
        className={`flex flex-col items-center text-center max-w-2xl transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-3xl bg-teal-400/20 blur-2xl scale-150" />
          <Image
            src="/logo.png"
            alt="MedBot INA"
            width={100}
            height={100}
            className="relative rounded-2xl shadow-xl w-20 h-20 sm:w-[100px] sm:h-[100px]"
            priority
          />
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
          Med<span className="text-teal-600">Bot</span>{" "}
          <span className="text-blue-800">INA</span>
        </h1>

        <p className="text-slate-500 text-base sm:text-lg max-w-md mb-10 leading-relaxed">
          Asisten kesehatan AI berbahasa Indonesia yang bersumber dari Pedoman
          resmi Kementerian Kesehatan RI.
        </p>

        <Button
          size="lg"
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer mb-16"
          onClick={handleStart}
        >
          Mulai Konsultasi
        </Button>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-2xl px-2 transition-all duration-700 delay-200 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm p-5 shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-300 hover:-translate-y-1"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <h3 className="font-semibold text-sm text-slate-800 mb-1.5 group-hover:text-teal-700 transition-colors">
              {f.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <p
        className={`text-[10px] sm:text-xs text-slate-400 mt-10 sm:mt-12 max-w-sm text-center transition-all duration-700 delay-500 ease-out ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        Bukan pengganti dokter. Selalu konfirmasi ke tenaga medis untuk
        diagnosis dan pengobatan.
      </p>
    </main>
  );
}
