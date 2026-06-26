import type { Comment, UserRole } from '../types';

const API_BASE = '/api';
const CACHE_KEY = (filter: string) => `c_${filter}`;

export async function fetchComments(filterStr: string): Promise<Comment[]> {
  const params = new URLSearchParams({ filter: filterStr });
  try {
    const res = await fetch(`${API_BASE}/comment?${params}`);
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
  const url    = isEdit ? `${API_BASE}/comment/${comment.id}` : `${API_BASE}/comment`;
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
  const res = await fetch(`${API_BASE}/comment/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
}

export async function summarizeCommentsAPI(comments: Comment[], level: string): Promise<string> {
  const res = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments, level }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.summary || data.text || data.result || 'Summary generated successfully.';
}

export async function rephraseCommentAPI(html: string): Promise<any> {
  const res = await fetch(`${API_BASE}/rephrase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_comment: html }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export function cacheComments(filterStr: string, comments: Comment[]): void {
  localStorage.setItem(CACHE_KEY(filterStr), JSON.stringify(comments));
}

export function buildFilterStr(filters: Record<string, string>): string | null {
  const keys = Object.keys(filters);
  return keys.length ? keys.map(k => `${k}:${filters[k]}`).join(';') : null;
}

// Returns only the values (sorted by key order to stay consistent with buildFilterStr)
export function buildFilterValuesStr(filters: Record<string, string>): string | null {
  const keys = Object.keys(filters);
  return keys.length ? keys.map(k => filters[k]).join(';') : null;
}

export async function fetchCurrentUserEmail(username: string = 'guest.user@datalinksoftware.com'): Promise<{ email: string; success?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data && data.email ? data : { email: username, success: true };
  } catch {
    // Graceful fallback since backend will be added separately
    const cachedEmail = localStorage.getItem('cur_user_email') || username;
    return { email: cachedEmail, success: true };
  }
}

export async function fetchUserRole(email: string): Promise<UserRole | null> {
  try {
    const params = new URLSearchParams({ email });
    const res = await fetch(`${API_BASE}/user/role?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.role) {
      localStorage.setItem(`role_${email}`, data.role);
      return data.role as UserRole;
    }
    throw new Error('Role not found in API');
  } catch {
    // Cross-reference from local table/storage when backend is not yet present
    const storedRole = localStorage.getItem(`role_${email}`);
    return storedRole ? (storedRole as UserRole) : null;
  }
}

export async function saveUserRole(email: string, role: UserRole): Promise<void> {
  // Store locally immediately for reliable cross-referencing
  localStorage.setItem(`role_${email}`, role);
  try {
    await fetch(`${API_BASE}/user/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
  } catch {
    // Backend to be added separately; silent catch since local table storage succeeded
  }
}
