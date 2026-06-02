import type { Comment, CommentLevel, WordSug, SentSug, DateGroup } from '../types';

export const uid = (): string => crypto.randomUUID();

export const stripHtml = (h: string): string =>
  h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Convert email or dotted name → Proper Display Name.
 *  "mathew.andres@sth.com" → "Mathew Andres"
 *  "john_doe"              → "John Doe"
 */
export function formatDisplayName(raw: string): string {
  if (!raw) return raw;
  const local = raw.includes('@') ? raw.split('@')[0] : raw;
  return local
    .replace(/[._\-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function formatTs(iso: string): { relative: string; absolute: string } {
  const d    = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  const relative =
    mins  < 1  ? 'just now'
    : mins  < 60 ? `${mins}m ago`
    : hours < 24 ? `${hours}h ago`
    : days === 1 ? 'yesterday'
    :              `${days}d ago`;

  const absolute = d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return { relative, absolute };
}

export function groupByDate(comments: Comment[]): DateGroup[] {
  const map      = new Map<string, Comment[]>();
  const todayStr = new Date().toDateString();
  const yestStr  = new Date(Date.now() - 86_400_000).toDateString();

  [...comments]
    .sort((a, b) => new Date(b.created_at?.value).getTime() - new Date(a.created_at?.value).getTime())
    .forEach(c => {
      const ds = new Date(c.created_at?.value).toDateString();
      const label =
        ds === todayStr ? 'Today'
        : ds === yestStr ? 'Yesterday'
        : new Date(c.created_at?.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(c);
    });

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export function getInitials(name: string): string {
  return formatDisplayName(name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── AI helpers (mock) ─────────────────────────────────── */
function rewriteSentence(s: string): string {
  return s
    .replace(/\bI think\b/gi,      'It is our assessment that')
    .replace(/\bwe need to\b/gi,   'it is imperative that we')
    .replace(/\bthe numbers\b/gi,  'the reported figures')
    .replace(/\bdue to\b/gi,       'attributable to')
    .replace(/\bbecause of\b/gi,   'as a direct result of')
    .replace(/\bshowed\b/gi,       'demonstrated')
    .replace(/\bwent up\b/gi,      'experienced an upward trajectory')
    .replace(/\bwent down\b/gi,    'underwent a decline')
    .replace(/\bgood results\b/gi, 'favourable outcomes')
    .replace(/\bbad results\b/gi,  'suboptimal outcomes')
    .replace(/\bvery\b/gi,         'notably');
}

export function generateAi(html: string): { wordSugs: WordSug[]; sentSugs: SentSug[] } {
  const text = stripHtml(html);
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const sentSugs: SentSug[] = sentences
    .slice(0, 3)
    .map(s => ({ original: s.trim(), rewritten: rewriteSentence(s.trim()) }))
    .filter(s => s.original !== s.rewritten);
  return { wordSugs: [], sentSugs };
}

export function buildAiPreviewHtml(html: string, wordSugs: WordSug[]): string {
  const tokens = stripHtml(html).split(/\s+/);
  const sugMap = new Map(wordSugs.map(w => [w.wordIdx, w]));
  return tokens.map((tok, i) => {
    const s = sugMap.get(i);
    if (!s) return tok;
    return `<span class="ai-del">${tok}</span> <span class="ai-ins">${s.chosen ?? s.alts[0]}</span>`;
  }).join(' ');
}

export function buildSummary(comments: Comment[], level: CommentLevel): string {
  const filtered = comments.filter(c => c.level === level);
  if (!filtered.length) return 'No comments found for this level.';
  const names = [...new Set(filtered.map(c => c.user))];
  const words = filtered.map(c => stripHtml(c.content)).join(' ').split(/\s+/).length;
  return (
    `${filtered.length} ${level}-level comment${filtered.length > 1 ? 's' : ''} ` +
    `from ${names.slice(0, 3).map(formatDisplayName).join(', ')}${names.length > 3 ? ` and ${names.length - 3} others` : ''}. ` +
    `Spanning ~${words} words. Key takeaway: contributors broadly align on the ` +
    `${level === 'page' ? 'overall dashboard narrative' : 'row-level data interpretation'}, ` +
    `with some diverging views on attribution. Recommended action: review flagged variances before the next reporting cycle.`
  );
}
