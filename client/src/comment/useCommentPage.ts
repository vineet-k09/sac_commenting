import { useEffect, useState } from 'react';
import type { ToastItem } from '../ui/ToastContainer';
import type { Comment, CommentLevel, ActiveTab, WordSug, SentSug } from '../types';
import {
  uid, stripHtml, buildSummary, formatDisplayName,
  generateAi, buildAiPreviewHtml,
} from './commentUtils';
import { fetchComments, saveComment, deleteComment, cacheComments, buildFilterStr } from './commentApi';

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

  /* ── SAC postMessage listener ────────────────────────────── */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'string') return;
      const newFilters: Record<string, string> = {};
      data.split(/[;,?\/\s]+/).filter(Boolean).forEach(seg => {
        const i = seg.indexOf(':');
        if (i === -1) return;
        const k = seg.substring(0, i).trim();
        const v = seg.substring(i + 1).trim();
        if (k.toLowerCase() === 'username' || k.toLowerCase() === 'userid') {
          setUser(formatDisplayName(v));
        } else if (k) {
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

  /* ── Computed ────────────────────────────────────────────── */
  const filterStr = buildFilterStr(filters) ?? 'DefaultContext';
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
  const openSummary = () => {
    setSumLoading(true);
    setDrawerOpen(true);
    setTimeout(() => { setSummaryText(buildSummary(comments, level)); setSumLoading(false); }, 1200);
  };

  /* ── AI rewrite ──────────────────────────────────────────── */
  const handleAiRewrite = () => {
    const { wordSugs: ws, sentSugs: ss } = generateAi(editorHtml);
    setWordSugs(ws);
    setSentSugs(ss);
    setAiHtml(buildAiPreviewHtml(editorHtml, ws));
    setAiMode(true);
  };

  const applyWordChoice = (idx: number, chosen: string) => {
    const updated = wordSugs.map((w, i) => (i === idx ? { ...w, chosen } : w));
    setWordSugs(updated);
    setAiHtml(buildAiPreviewHtml(editorHtml, updated));
  };

  const acceptAllAi = () => {
    const tokens = stripHtml(editorHtml).split(/\s+/);
    const sugMap = new Map(wordSugs.map(w => [w.wordIdx, w]));
    const result = tokens.map((tok, i) => { const s = sugMap.get(i); return s ? (s.chosen ?? s.alts[0]) : tok; }).join(' ');
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
    aiMode, wordSugs, sentSugs, aiHtml,
    visibleComments, newCommentCount,
    handleSave, handleEdit, handleDelete, resetPost,
    openSummary, handleAiRewrite, applyWordChoice, acceptAllAi, applySentence, addToast,
  };
}
