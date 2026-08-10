/* ─── Domain Types ───────────────────────────────────────── */
export type CommentLevel = 'page' | 'row';
export type ActiveTab = 'comments' | 'post' | 'ai' | 'admin';

export type UserRole = 'Admin' | 'Editor' | 'Contributor' | 'Viewer';

export interface Comment {
  id: string; // from backend
  user: string;
  content: string;   // rich-text HTML
  level: CommentLevel;
  filter: string;        // "Key1:Val1;Key2:Val2" — full key+value context
  wb_keys: string;  // "Val1;Val2" — values only
  dashboard: string;
  story?: string;
  created_at: { value: string }; // ISO 8601 
  is_private?: boolean;
  is_locked?: boolean;
}


export interface DateGroup {
  label: string;
  items: Comment[];
}
