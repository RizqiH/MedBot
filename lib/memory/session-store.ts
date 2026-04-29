import { getSupabaseAdmin } from "@/lib/supabase/client";
import { type SessionMessage, type ChatSession } from "@/lib/agent/types";

const MAX_HISTORY_MESSAGES = 20;
const SESSION_EXPIRY_HOURS = 24;

export async function getOrCreateSession(sessionId?: string): Promise<ChatSession> {
  const supabase = getSupabaseAdmin();

  if (sessionId) {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (data) {
      const lastActive = new Date(data.last_active_at);
      const hoursAgo = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);

      if (hoursAgo < SESSION_EXPIRY_HOURS) {
        await supabase
          .from("chat_sessions")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", sessionId);

        return {
          id: data.id,
          createdAt: data.created_at,
          lastActiveAt: new Date().toISOString(),
        };
      }
    }
  }

  const { data: newSession, error } = await supabase
    .from("chat_sessions")
    .insert({ last_active_at: new Date().toISOString() })
    .select()
    .single();

  if (error || !newSession) throw new Error("Failed to create session");

  return {
    id: newSession.id,
    createdAt: newSession.created_at,
    lastActiveAt: newSession.last_active_at,
  };
}

export async function getSessionHistory(sessionId: string): Promise<SessionMessage[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
  });

  if (error) throw new Error(error.message);
}
