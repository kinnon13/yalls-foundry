import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";

export async function listFiles(dir: string, exts: string[]) {
  const files: string[] = [];
  try {
    for await (const e of walk(dir, { exts, includeDirs: false })) {
      files.push(e.path);
    }
  } catch (e) {
    // Directory might not exist, return empty array
  }
  return files;
}
