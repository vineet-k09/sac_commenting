import { useEffect, useState } from 'react';
import type { ToastItem } from './ToastContainer';
import type { Comment, CommentLevel, ActiveTab, WordSug, SentSug } from '../types';
import { SAMPLE_COMMENTS } from '../mockData';
import {
  uid, stripHtml, buildSummary,
  generateAi, buildAiPreviewHtml,
} from '../commentUtils';
import { fetchComments, saveComment, cacheComments, buildFilterStr } from '../commentApi';



export function useCommentPage() {
  /* ── Core state ──────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');
  const [level, setLevel] = useState<CommentLevel>('page');
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS);
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

  /* ── Summary drawer state ────────────────────────────────── */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [sumLoading, setSumLoading] = useState(false);

  /* ── AI rewrite state ────────────────────────────────────── */
  const [aiMode, setAiMode] = useState(false);
  const [wordSugs, setWordSugs] = useState<WordSug[]>([]);
  const [sentSugs, setSentSugs] = useState<SentSug[]>([]);
  const [aiHtml, setAiHtml] = useState('');

  /* ── SAC postMessage listener ────────────────────────────── */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      e.data.split(';').forEach((part: string) => {
        const sep = part.indexOf(':');
        if (sep === -1) return;
        const k = part.substring(0, sep).trim();
        const v = part.substring(sep + 1).trim();
        if (!k || !v) return;
        if (k.toLowerCase() === 'username') setUser(v);
        else setFilters(prev => ({ ...prev, [k]: v }));
      });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /* ── Fetch ALL comments for this page context on context change ── */
  useEffect(() => {
    const fs = buildFilterStr(filters);
    if (!fs) return;
    setIsLoading(true);
    fetchComments(fs).then(data => {
      if (data.length) setComments(data);
    }).finally(() => {
      setTimeout(() => setIsLoading(false), 600);
    });
  }, [filters]); // level excluded intentionally — toggle is client-side only

  /* ── Computed ────────────────────────────────────────────── */
  const filterStr = buildFilterStr(filters) ?? 'DefaultContext';
  const visibleComments = comments.filter(c => c.level === level);
  const newCommentCount = comments.filter(c => new Date(c.timestamp) > lastOpened).length;

  /* ── Handlers ────────────────────────────────────────────── */
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
      timestamp: new Date().toISOString(),
    };

    await saveComment(payload, !!editingId);

    const updated = editingId
      ? comments.map(c => (c.id === editingId ? payload : c))
      : [payload, ...comments];

    setComments(updated);
    cacheComments(filterStr, updated);
    addToast('ok', editingId ? 'Comment updated!' : 'Comment posted!');
    resetPost();
    setActiveTab('comments');
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


  /* ── Summary drawer ──────────────────────────────────────── */
  const openSummary = () => {
    setSumLoading(true);
    setDrawerOpen(true);
    setTimeout(() => {
      setSummaryText(buildSummary(comments, level));
      setSumLoading(false);
    }, 1200);
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
    const result = tokens.map((tok, i) => {
      const s = sugMap.get(i);
      return s ? (s.chosen ?? s.alts[0]) : tok;
    }).join(' ');
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
    /* state */
    activeTab, setActiveTab,
    level, setLevel,
    comments,
    user,
    editorHtml, setEditorHtml,
    editorKey,
    editingId,
    filters,
    isLoading,
    lastOpened,
    toasts, removeToast,
    drawerOpen, setDrawerOpen,
    summaryText,
    sumLoading,
    aiMode,
    wordSugs,
    sentSugs,
    aiHtml,
    /* computed */
    visibleComments,
    newCommentCount,
    /* handlers */
    handleSave,
    handleEdit,
    resetPost,
    openSummary,
    handleAiRewrite,
    applyWordChoice,
    acceptAllAi,
    applySentence,
    addToast,
  };
}
