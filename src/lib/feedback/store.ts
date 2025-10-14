/**
 * Feedback Store
 * 
 * In-memory + localStorage persistence for user feedback.
 */

import { toCSV, downloadCSV, downloadJSON } from '@/lib/export/download';
import type { FeedbackItem, NewFeedback, FeedbackStatus } from './types';

const KEY = 'yallsai_feedback_items';
type Listener = (items: FeedbackItem[]) => void;
const listeners = new Set<Listener>();

const uuid = () =>
  (globalThis.crypto as any)?.randomUUID?.() ?? `fb_${Date.now()}_${Math.random()}`;

function load(): FeedbackItem[] {
  try { 
    const raw = localStorage.getItem(KEY); 
    return raw ? JSON.parse(raw) : []; 
  } catch { 
    return []; 
  }
}

function save(items: FeedbackItem[]) {
  try { 
    localStorage.setItem(KEY, JSON.stringify(items)); 
  } catch {}
  for (const l of listeners) l(items);
}

export function listFeedback(): FeedbackItem[] {
  return load().sort((a, b) => b.ts.localeCompare(a.ts));
}

export function addFeedback(input: NewFeedback): FeedbackItem {
  const item: FeedbackItem = {
    id: uuid(),
    ts: new Date().toISOString(),
    status: input.status ?? 'new',
    ...input,
  };
  const items = load();
  items.push(item);
  save(items);
  return item;
}

export function markStatus(id: string, status: FeedbackStatus): FeedbackItem | null {
  const items = load();
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return null;
  items[idx] = { ...items[idx], status };
  save(items);
  return items[idx];
}

export function clearFeedback(): void {
  save([]);
}

export function onFeedbackChange(cb: Listener): () => void {
  listeners.add(cb);
  cb(listFeedback());
  return () => { listeners.delete(cb); };
}

export function exportFeedbackJSON(): void {
  downloadJSON(`feedback-${Date.now()}.json`, listFeedback());
}

export function exportFeedbackCSV(): void {
  const rows = listFeedback().map(i => ({
    id: i.id, ts: i.ts, path: i.path, severity: i.severity, status: i.status,
    role: i.role ?? '', email: i.email ?? '', userAgent: i.userAgent ?? '', message: i.message,
  }));
  downloadCSV(`feedback-${Date.now()}.csv`, rows as Record<string, unknown>[]);
}
