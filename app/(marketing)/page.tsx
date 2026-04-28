"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [isLeaving, setIsLeaving] = useState(false);
  const router = useRouter();

  const handleStart = () => {
    setIsLeaving(true);
    setTimeout(() => {
      router.push("/chat");
    }, 600);
  };

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 text-center bg-slate-50 font-sans transition-all duration-[600ms] ease-in-out ${
        isLeaving ? "-translate-y-full opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100"
      }`}
    >
      <Image
        src="/logo.png"
        alt="MedBot INA Logo"
        width={120}
        height={120}
        className="mb-6 rounded-2xl shadow-md w-20 h-20 sm:w-[120px] sm:h-[120px]"
      />
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 text-blue-800">
        MedBot INA
      </h1>
      <p className="text-slate-600 text-base sm:text-lg max-w-md mb-6 sm:mb-8">
        Asisten kesehatan AI berbahasa Indonesia, bersumber dari Pedoman resmi
        Kementerian Kesehatan RI.
      </p>
      <Button
        size="lg"
        className="bg-teal-600 hover:bg-teal-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-lg transition-all cursor-pointer"
        onClick={handleStart}
      >
        Mulai Konsultasi
      </Button>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-6 sm:mt-8 max-w-sm">
        Bukan pengganti dokter. Selalu konfirmasi ke tenaga medis untuk diagnosis dan
        pengobatan.
      </p>
    </main>
  );
}
