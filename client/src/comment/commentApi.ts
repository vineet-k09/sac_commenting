import type { Comment } from '../types';

const API_BASE = '/api/comment';
const CACHE_KEY = (filter: string) => `c_${filter}`;

export async function fetchComments(filterStr: string): Promise<Comment[]> {
  const params = new URLSearchParams({ filter: filterStr });
  try {
    const res = await fetch(`${API_BASE}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Comment[] = await res.json();
    if (data?.length) localStorage.setItem(CACHE_KEY(filterStr), JSON.stringify(data));
    return data ?? [];
  } catch {
    const cached = localStorage.getItem(CACHE_KEY(filterStr));
    return cached ? (JSON.parse(cached) as Comment[]) : [];
  }
}

export async function saveComment(comment: Comment, isEdit: boolean): Promise<void> {
  const method = isEdit ? 'PUT' : 'POST';
  const url    = isEdit ? `${API_BASE}/${comment.id}` : API_BASE;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
}

export async function deleteComment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
}

export function cacheComments(filterStr: string, comments: Comment[]): void {
  localStorage.setItem(CACHE_KEY(filterStr), JSON.stringify(comments));
}

export function buildFilterStr(filters: Record<string, string>): string | null {
  const keys = Object.keys(filters).sort();
  return keys.length ? keys.map(k => `${k}:${filters[k]}`).join(';') : null;
}
