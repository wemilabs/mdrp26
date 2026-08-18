import type { SavedAssessment } from "../types";

const STORAGE_KEY = "prism.history.v1";
const MAX_ENTRIES = 50;

export function loadHistory(): SavedAssessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAssessment(entry: SavedAssessment): SavedAssessment[] {
  const history = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function deleteAssessment(id: string): SavedAssessment[] {
  const history = loadHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function exportHistory(): void {
  const history = loadHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prism-history.json";
  a.click();
  URL.revokeObjectURL(url);
}

function isValidEntry(value: unknown): value is SavedAssessment {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.savedAt === "number" &&
    typeof e.label === "string" &&
    typeof e.probability === "number" &&
    Array.isArray(e.ranked) &&
    typeof e.tierLabel === "string" &&
    typeof e.form === "object" &&
    e.form !== null
  );
}

export function importHistory(jsonText: string): SavedAssessment[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Expected an array of assessments.");
  }
  const incoming = parsed.filter(isValidEntry);
  if (incoming.length === 0) {
    throw new Error("No valid assessments found in the file.");
  }
  const existing = loadHistory();
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const entry of incoming) {
    byId.set(entry.id, entry);
  }
  // New entries first (most recent savedAt), deduped by id, capped.
  const merged = [...byId.values()]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}
