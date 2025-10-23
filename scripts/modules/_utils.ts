// Shared utils for audit modules
export const CONFIG_PATH = "supabase/config.toml";
export const FUNCS_DIR  = "supabase/functions";
export const AUDIT_DIR  = "scripts/audit";
export const QUAR_DIR   = "scripts/quarantine";

export async function readText(path: string) { return await Deno.readTextFile(path); }
export async function writeText(path: string, s: string) { await Deno.writeTextFile(path, s); }

export async function ensureDir(path: string) {
  await import("https://deno.land/std@0.223.0/fs/mod.ts").then(m => m.ensureDir(path));
}

export async function exists(path: string) {
  try { await Deno.stat(path); return true; } catch { return false; }
}

export async function writeJSON(path: string, data: unknown) {
  await writeText(path, JSON.stringify(data, null, 2));
}

export function flagFix(): boolean {
  return (globalThis as any).Deno?.args?.includes?.("--fix") ?? false;
}

export function nowISO() { return new Date().toISOString(); }
