import { useEffect, useState } from 'react';
import type { ToastItem } from '../ui/ToastContainer';
import type { Comment, CommentLevel, ActiveTab, WordSug, SentSug } from '../types';
import {
  uid, stripHtml, formatDisplayName,
  buildAiPreviewHtml,
} from './commentUtils';
import { fetchComments, saveComment, deleteComment, cacheComments, buildFilterStr, buildFilterValuesStr, summarizeCommentsAPI, rephraseCommentAPI } from './commentApi';

export function useCommentPage() {
  /* ── Core state ──────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');
  const [level, setLevel] = useState<CommentLevel>('page');
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [lastOpened] = useState<Date>(() => {
    const stored = localStorage.getItem('sac-last-opened');
    localStorage.setItem('sac-last-opened', new Date().toISOString());
    return stored ? new Date(stored) : new Date(0);
  });

  /* ── Toast state ─────────────────────────────────────────── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (type: ToastItem['type'], msg: string) => {
    const id = uid();
    setToasts(p => [...p, { id, type, msg }]);
  };
  const removeToast = (id: string) => setToasts(p => p.filter(t => t.id !== id));

  /* ── Summary / AI state ──────────────────────────────────── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [sumLoading, setSumLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [wordSugs, setWordSugs] = useState<WordSug[]>([]);
  const [sentSugs, setSentSugs] = useState<SentSug[]>([]);
  const [aiHtml, setAiHtml] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [dashboard, setDashboard] = useState('common');


  /* ── SAC postMessage listener ────────────────────────────── */
  // Real SAC message format:
  // "Entity:X?Year:Y?Month:Z?Custom1:W|UserID:uid?UserName:uname?Story:sid?Page: PageName"
  // Segments are delimited by `?` or `|`; user/meta fields are excluded from filter chips.
  const META_KEYS = new Set(['userid', 'username', 'story', 'storyid']);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'string') return;
      const newFilters: Record<string, string> = {};
      // Split on `?` or `|` — the two delimiters used in the SAC message string
      data.split(/[?|]+/).filter(Boolean).forEach(seg => {
        const i = seg.indexOf(':');
        if (i === -1) return;
        const k = seg.substring(0, i).trim();
        const v = seg.substring(i + 1).trim();
        const kLower = k.toLowerCase();
        if (kLower === 'username' || kLower === 'userid') {
          setUser(formatDisplayName(v));
        } else if (kLower === 'page') {
          // SAC's "Page" field carries the dashboard name — store it as "Dashboard"
          if (v) {
            newFilters['Dashboard'] = v;
            setDashboard(v);
          }
        } else if (k && !META_KEYS.has(kLower)) {
          // Only add genuine dimension filters (Entity, Year, Month, Custom1, etc.)
          newFilters[k] = v;
        }
      });
      if (Object.keys(newFilters).length > 0)
        setFilters(prev => ({ ...prev, ...newFilters }));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /* ── Fetch on context change ─────────────────────────────── */
  useEffect(() => {
    const fs = buildFilterStr(filters) ?? 'DefaultContext';
    setIsLoading(true);
    fetchComments(fs)
      .then(setComments)
      .finally(() => setTimeout(() => setIsLoading(false), 600));
  }, [filters]);

  /* ── Computed ─────────────────────────────────────────────── */
  const filterStr       = buildFilterStr(filters)       ?? 'DefaultContext';
  const filterValuesStr = buildFilterValuesStr(filters)  ?? 'DefaultContext';
  const visibleComments = comments.filter(c => c.level === level);
  const newCommentCount = comments.filter(c => new Date(c.created_at?.value) > lastOpened).length;

  /* ── Comment handlers ────────────────────────────────────── */
  const handleSave = async () => {
    if (!editorHtml.trim() || stripHtml(editorHtml).length < 2) {
      addToast('err', 'Comment cannot be empty.');
      return;
    }
    const payload: Comment = {
      id: editingId ?? uid(),
      user: user || 'Anonymous',
      content: editorHtml,
      level,
      filter: filterStr,
      wb_keys: filterValuesStr,
      dashboard: dashboard,
      created_at: { value: new Date().toISOString() },
    };
    try {
      await saveComment(payload, !!editingId);
      const updated = editingId
        ? comments.map(c => (c.id === editingId ? payload : c))
        : [payload, ...comments];
      setComments(updated);
      cacheComments(filterStr, updated);
      addToast('ok', editingId ? 'Comment updated!' : 'Comment posted!');
      resetPost();
      setActiveTab('comments');
    } catch (err) {
      addToast('err', `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resetPost = () => {
    setEditorHtml('');
    setEditorKey(k => k + 1);
    setEditingId(null);
    setAiMode(false);
    setWordSugs([]);
    setSentSugs([]);
  };

  const handleEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditorHtml(c.content);
    setEditorKey(k => k + 1);
    setAiMode(false);
    setActiveTab('post');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id);
      const updated = comments.filter(c => c.id !== id);
      setComments(updated);
      cacheComments(filterStr, updated);
      addToast('ok', 'Comment deleted.');
      if (editingId === id) resetPost();
    } catch {
      addToast('err', 'Failed to delete comment.');
    }
  };

  /* ── Summary ─────────────────────────────────────────────── */
  const openSummary = async () => {
    setSumLoading(true);
    setDrawerOpen(true);
    try {
      const summary = await summarizeCommentsAPI(comments, level);
      setSummaryText(summary);
    } catch (err) {
      addToast('err', 'Failed to generate summary.');
      setSummaryText('Failed to generate summary. Please try again.');
    } finally {
      setSumLoading(false);
    }
  };

  /* ── AI rewrite ──────────────────────────────────────────── */
  const handleAiRewrite = async () => {
    setAiLoading(true);
    try {
      const data = await rephraseCommentAPI(editorHtml);
      if (typeof data.comment === 'string') {
        // Handle full string rewrite from the current backend
        setAiHtml(data.comment);
        setWordSugs([]);
      } else {
        const ws = data.comment || [];
        setWordSugs(ws);
        setAiHtml(buildAiPreviewHtml(editorHtml, ws));
      }
      setAiMode(true);
    } catch (err) {
      addToast('err', 'Failed to generate AI rewrite.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyWordChoice = (idx: number, chosen: string) => {
    const updated = wordSugs.map((w, i) => (i === idx ? { ...w, chosen } : w));
    setWordSugs(updated);
    setAiHtml(buildAiPreviewHtml(editorHtml, updated));
  };

  const acceptAllAi = () => {
    let result = '';
    if (wordSugs.length === 0 && aiHtml) {
      result = aiHtml;
    } else {
      const tokens = stripHtml(editorHtml).split(/\s+/);
      const sugMap = new Map(wordSugs.map(w => [w.wordIdx, w]));
      result = tokens.map((tok, i) => { const s = sugMap.get(i); return s ? (s.chosen ?? s.alts[0]) : tok; }).join(' ');
    }
    setEditorHtml(`<p>${result}</p>`);
    setEditorKey(k => k + 1);
    setAiMode(false);
  };

  const applySentence = (s: SentSug) => {
    setEditorHtml(editorHtml.replace(s.original, s.rewritten));
    setEditorKey(k => k + 1);
    setAiMode(false);
  };

  return {
    activeTab, setActiveTab, level, setLevel, comments, user,
    editorHtml, setEditorHtml, editorKey, editingId,
    filters, isLoading, lastOpened, toasts, removeToast,
    drawerOpen, setDrawerOpen, summaryText, sumLoading,
    aiMode, wordSugs, sentSugs, aiHtml, aiLoading,
    visibleComments, newCommentCount,
    handleSave, handleEdit, handleDelete, resetPost,
    openSummary, handleAiRewrite, applyWordChoice, acceptAllAi, applySentence, addToast,
  };
}
