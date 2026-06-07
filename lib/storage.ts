import type { HistoryEntry, SavedRequest } from "./types";

const HISTORY_KEY = "testmyapi.history.v1";
const SAVED_KEY = "testmyapi.saved.v1";
const MAX_ENTRIES = 25;
const MAX_SAVED = 100;

function safeParse<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota); persistence is best-effort.
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<HistoryEntry>(window.localStorage.getItem(HISTORY_KEY));
}

export function saveHistory(entries: HistoryEntry[]): void {
  write(HISTORY_KEY, entries.slice(0, MAX_ENTRIES));
}

export function addHistoryEntry(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...entries].slice(0, MAX_ENTRIES);
}

export function loadSaved(): SavedRequest[] {
  if (typeof window === "undefined") return [];
  return safeParse<SavedRequest>(window.localStorage.getItem(SAVED_KEY));
}

export function saveSaved(items: SavedRequest[]): void {
  write(SAVED_KEY, items.slice(0, MAX_SAVED));
}
