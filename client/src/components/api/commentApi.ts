import type { Comment } from '../../types';

const API_BASE = '/api/comment';
const CACHE_KEY = (filter: string) => `c_${filter}`;

/* ─── Fetch comments from backend (both page + row levels) ── */
export async function fetchComments(filterStr: string): Promise<Comment[]> {
  const params = new URLSearchParams({ filter: filterStr });
  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Comment[] = await res.json();
    if (data?.length) {
      localStorage.setItem(CACHE_KEY(filterStr), JSON.stringify(data));
    }
    return data ?? [];
  } catch {
    // Fall back to locally cached data when backend is unavailable
    const cached = localStorage.getItem(CACHE_KEY(filterStr));
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Save error:", err);
    throw err;
  }
}

/* ─── Delete a comment ─────────────────────────────────── */
export async function deleteComment(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    throw err;
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
