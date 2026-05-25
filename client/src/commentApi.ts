import type { Comment, CommentLevel } from './types';

const API_BASE = '/api/comment';
const CACHE_KEY = (filter: string, level?: CommentLevel) =>
  level ? `c_${filter}_${level}` : `c_${filter}`;

/* ─── Fetch comments from backend ───────────────────────── */
export async function fetchComments(
  filterStr: string,
  level?: CommentLevel,
): Promise<Comment[]> {
  const params = new URLSearchParams({ filter: filterStr });
  if (level) params.set('level', level);
  const cacheKey = CACHE_KEY(filterStr, level);
  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Comment[] = await res.json();
    if (data?.length) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
    return data ?? [];
  } catch {
    // Fall back to locally cached data when backend is unavailable
    const cached = localStorage.getItem(cacheKey);
    return cached ? (JSON.parse(cached) as Comment[]) : [];
  }
}

/* ─── Save (create or update) a comment ────────────────── */
export async function saveComment(
  comment: Comment,
  isEdit: boolean,
): Promise<void> {
  const method = isEdit ? 'PUT' : 'POST';
  const url    = isEdit ? `${API_BASE}/${comment.id}` : API_BASE;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // Silently fall back — caller updates local state optimistically
  }
}

/* ─── Persist comment list to localStorage cache ────────── */
export function cacheComments(filterStr: string, comments: Comment[]): void {
  localStorage.setItem(CACHE_KEY(filterStr), JSON.stringify(comments));
}

/* ─── Build filter string from the SAC filter map ──────── */
export function buildFilterStr(filters: Record<string, string>): string | null {
  const keys = Object.keys(filters).sort();
  return keys.length ? keys.map(k => `${k}:${filters[k]}`).join(';') : null;
}
