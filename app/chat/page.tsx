import { ChatInterface } from "@/components/chat/chat-interface";
import Image from "next/image";

export default function ChatPage() {
  return (
    <main className="h-screen flex flex-col max-w-3xl mx-auto">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <Image src="/logo.png" alt="MedBot INA Logo" width={40} height={40} className="rounded-md" />
        <div>
          <h1 className="font-semibold text-lg leading-tight">MedBot INA</h1>
          <p className="text-xs text-muted-foreground">Berbasis Pedoman Kemenkes RI</p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </main>
  );
}

