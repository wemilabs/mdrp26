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
