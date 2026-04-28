import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-slate-50 font-sans">
      <Image 
        src="/logo.png" 
        alt="MedBot INA Logo" 
        width={120} 
        height={120} 
        className="mb-6 rounded-2xl shadow-md" 
      />
      <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-black">
        MedBot INA
      </h1>
      <p className="text-slate-600 text-lg max-w-md mb-8">
        Asisten kesehatan AI berbahasa Indonesia, bersumber dari Pedoman resmi
        Kementerian Kesehatan RI.
      </p>
      <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg rounded-full shadow-lg transition-all">
        <Link href="/chat">Mulai Konsultasi</Link>
      </Button>
      <p className="text-xs text-slate-500 mt-8 max-w-sm">
        Bukan pengganti dokter. Selalu konfirmasi ke tenaga medis untuk diagnosis dan
        pengobatan.
      </p>
    </main>
  );
}

