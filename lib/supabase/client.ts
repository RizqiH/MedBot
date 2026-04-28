import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  adminClient = createClient(url, serviceRoleKey);
  return adminClient;
}

export function getSupabaseClient() {
  if (anonClient) return anonClient;
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  anonClient = createClient(url, anonKey);
  return anonClient;
}

