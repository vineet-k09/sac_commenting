/* ─── Domain Types ───────────────────────────────────────── */
export type CommentLevel = 'page' | 'row';
export type ActiveTab    = 'comments' | 'post' | 'ai';

export interface Comment {
  id: string;
  user: string;
  content: string;   // rich-text HTML
  level: CommentLevel;
  filter: string;
  timestamp: string; // ISO 8601
}

export interface WordSug {
  wordIdx: number;
  original: string;
  alts: string[];
  chosen: string | null;
}

export interface SentSug {
  original: string;
  rewritten: string;
}

export interface DateGroup {
  label: string;
  items: Comment[];
}
