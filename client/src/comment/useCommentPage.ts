import { useEffect, useState } from 'react';
import type { ToastItem } from '../ui/ToastContainer';
import type { Comment, CommentLevel, ActiveTab, UserRole } from '../types';
import { uid, stripHtml, formatDisplayName } from './commentUtils';
import { fetchComments, saveComment, deleteComment, cacheComments, buildFilterStr, buildFilterValuesStr, summarizeCommentsAPI, rephraseCommentAPI, fetchCurrentUserEmail, saveUserRole } from './commentApi';

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

  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [lockedCommentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_locked_comment_ids') || '[]');
    } catch {
      return [];
    }
  });

  const toggleLockComment = async (id: string) => {
    const comment = comments.find(c => c.id === id);
    if (!comment) return;

    const updatedComment = { ...comment, is_locked: !comment.is_locked };
    try {
      await saveComment(updatedComment, true);
      setComments(prev => prev.map(c => c.id === id ? updatedComment : c));
      addToast('ok', `Comment ${updatedComment.is_locked ? 'locked' : 'unlocked'}.`);
    } catch (err) {
      addToast('err', 'Failed to update lock status.');
    }
  };


  useEffect(() => {
    fetchCurrentUserEmail().then(({ email, role }) => {
      setUserEmail(email);
      const defaultName = email.split('@')[0];
      if (!user) setUser(formatDisplayName(defaultName));
      if (role) {
        setUserRole(role);
      } else {
        // Fallback or request role
        setUserRole('Contributor'); 
      }
    });
  }, []);

  const handleSelectRole = async (role: UserRole) => {
    if (userEmail) {
      await saveUserRole(userEmail, role);
    }
    setUserRole(role);
    setShowRoleModal(false);
    addToast('ok', `Logged in with role: ${role}`);
  };

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

  const [aiHtml, setAiHtml] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [dashboard, setDashboard] = useState('common');


  /* ── SAC postMessage listener ────────────────────────────── */
  const handleTestFilter = () => {
    const mockSACMessage = "Entity:APAC?Year:2025?Month:January?Custom1:Budget|UserID:u123?UserName:John Doe?Story:s1?Page: LandingPage";

    const newFilters: Record<string, string> = {};
    mockSACMessage.split(/[?|]+/).filter(Boolean).forEach(seg => {
      const i = seg.indexOf(':');
      if (i === -1) return;
      const k = seg.substring(0, i).trim();
      const v = seg.substring(i + 1).trim();
      const kLower = k.toLowerCase();
      if (kLower === 'username' || kLower === 'userid') {
        if (kLower === 'username') {
          setUser(formatDisplayName(v));
          if (v.toLowerCase().includes('john')) {
            setUserRole('Admin');
          }
        }
      } else if (kLower === 'page') {
        if (v) {
          newFilters['Dashboard'] = v;
          setDashboard(v);
        }
      } else if (k && !META_KEYS.has(kLower)) {
        newFilters[k] = v;
      }
    });

    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
    addToast('info', 'Test SAC filters applied directly');
  };
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
          if (kLower === 'username') {
            setUser(formatDisplayName(v));
            if (v.toLowerCase().includes('john')) {
              setUserRole('Admin');
            }
          }
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
    const isOnlyDashboard = Object.keys(filters).length === 1 && !!filters['Dashboard'];

    setIsLoading(true);

    if (isOnlyDashboard) {
      // If only Dashboard is active (e.g. after "Clear Rows"), fetch all comments 
      // and filter locally to ensure we see all row-level comments for this dashboard.
      fetchComments('')
        .then(data => {
          const dashboardVal = filters['Dashboard'];
          setComments(data.filter(c => c.dashboard === dashboardVal));
        })
        .finally(() => setTimeout(() => setIsLoading(false), 600));
    } else {
      fetchComments(fs)
        .then(setComments)
        .finally(() => setTimeout(() => setIsLoading(false), 600));
    }
  }, [filters]);

  /* ── Computed ─────────────────────────────────────────────── */
  const filterStr = buildFilterStr(filters) ?? 'DefaultContext';
  const wb_keysStr = buildFilterValuesStr(filters) ?? 'DefaultContext';
  const isValidSACSelection = Object.keys(filters).filter(k => k !== 'Dashboard').length > 0;
  const isCommentVisible = (c: Comment) => {
    if (!c.is_private) return true;
    return formatDisplayName(c.user) === formatDisplayName(user);
  };
  const filteredComments = comments.filter(isCommentVisible);
  const visibleComments = filteredComments.filter(c => c.level === level);
  const newCommentCount = filteredComments.filter(c => new Date(c.created_at?.value) > lastOpened).length;

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
      wb_keys: wb_keysStr,
      dashboard: dashboard,
      created_at: { value: new Date().toISOString() },
      is_private: isPrivate,
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
    setAiHtml('');
    setIsPrivate(false);
  };

  const handleEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditorHtml(c.content);
    setEditorKey(k => k + 1);
    setAiMode(false);
    setIsPrivate(!!c.is_private);
    setActiveTab('post');
  };

  const handlePublishPrivate = async (c: Comment) => {
    const updatedComment: Comment = { ...c, is_private: false };
    try {
      await saveComment(updatedComment, true);
      const updated = comments.map(item => (item.id === c.id ? updatedComment : item));
      setComments(updated);
      cacheComments(filterStr, updated);
      addToast('ok', 'Comment published for wider audience.');
    } catch (err) {
      addToast('err', `Failed to publish: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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

  const handleClearRowFilters = () => {
    setFilters(prev => {
      const next: Record<string, string> = {};
      if (prev['Dashboard']) next['Dashboard'] = prev['Dashboard'];
      return next;
    });
    addToast('info', 'Row-level filters cleared');
  };

  /* ── Summary ─────────────────────────────────────────────── */
  const openSummary = async () => {
    setSumLoading(true);
    setDrawerOpen(true);
    try {
      const summary = await summarizeCommentsAPI(filteredComments, level);
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
        setAiHtml(data.comment);
        setAiMode(true);
      }
    } catch {
      addToast('err', 'Failed to generate AI rewrite.');
    } finally {
      setAiLoading(false);
    }
  };

  const acceptAllAi = () => {
    setEditorHtml(`<p>${aiHtml}</p>`);
    setEditorKey(k => k + 1);
    setAiMode(false);
    setAiHtml('');
  };

  const [lockDate, setLockDate] = useState(() => localStorage.getItem('admin_lock_date') || '');
  const [allowPrivateConfig, setAllowPrivateConfig] = useState(() => (localStorage.getItem('admin_allow_private') ?? 'true') === 'true');
  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem('admin_notify_email') || 'sac-alerts@datalinksoftware.com');
  const [defaultLevelConfig, setDefaultLevelConfig] = useState<CommentLevel>(() => (localStorage.getItem('admin_default_level') as CommentLevel) || 'page');

  const handleSaveAdminConfig = () => {
    localStorage.setItem('admin_lock_date', lockDate);
    localStorage.setItem('admin_allow_private', String(allowPrivateConfig));
    localStorage.setItem('admin_notify_email', notifyEmail);
    localStorage.setItem('admin_default_level', defaultLevelConfig);
    addToast('ok', 'Admin configuration saved successfully!');
  };

  return {
    activeTab, setActiveTab, level, setLevel, comments, user,
    editorHtml, setEditorHtml, editorKey, editingId,
    filters, isLoading, lastOpened, toasts, removeToast,
    drawerOpen, setDrawerOpen, summaryText, sumLoading,
    aiMode, aiHtml, aiLoading,
    visibleComments, newCommentCount,
    userEmail, userRole, showRoleModal, setShowRoleModal, handleSelectRole,
    isPrivate, setIsPrivate, handlePublishPrivate, isValidSACSelection,
    lockDate, setLockDate, allowPrivateConfig, setAllowPrivateConfig,
    notifyEmail, setNotifyEmail, defaultLevelConfig, setDefaultLevelConfig,
    handleSaveAdminConfig,
    handleSave, handleEdit, handleDelete, resetPost,
    openSummary, handleAiRewrite, acceptAllAi, addToast,
    handleTestFilter, handleClearRowFilters,
    lockedCommentIds, toggleLockComment,
  };
}