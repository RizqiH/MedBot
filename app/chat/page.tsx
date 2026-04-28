"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      className={`h-screen flex flex-col max-w-3xl mx-auto transition-all duration-[600ms] ease-out ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <header className="border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 bg-white">
        <Image src="/logo.png" alt="MedBot INA Logo" width={36} height={36} className="rounded-md shrink-0" />
        <div className="min-w-0">
          <h1 className="font-semibold text-base sm:text-lg leading-tight text-blue-800">MedBot INA</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate">Berbasis Pedoman Kemenkes RI</p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </main>
  );
}
