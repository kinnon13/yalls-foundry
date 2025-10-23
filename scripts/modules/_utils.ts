// Shared utilities for all audit modules
// DO NOT modify without reviewing all dependent modules

export const CONFIG_PATH = "supabase/config.toml";
export const FUNCS_DIR = "supabase/functions";
export const AUDIT_DIR = "scripts/audit";
export const QUAR_DIR = "scripts/quarantine";

export async function exists(p: string): Promise<boolean> {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(p: string): Promise<void> {
  const { ensureDir: ensure } = await import("https://deno.land/std@0.223.0/fs/mod.ts");
  await ensure(p);
}

export async function readText(p: string): Promise<string> {
  return await Deno.readTextFile(p);
}

export async function writeText(p: string, t: string): Promise<void> {
  await Deno.writeTextFile(p, t);
}

export async function writeJSON(p: string, d: any): Promise<void> {
  await writeText(p, JSON.stringify(d, null, 2));
}

export function getFix(): boolean {
  return Deno.args.includes("--fix");
}

export function now(): string {
  return new Date().toISOString();
}
