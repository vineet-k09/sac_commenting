import { useEffect, useState } from 'react';
import type { ToastItem } from '../ui/ToastContainer';
import type { Comment, CommentLevel, ActiveTab, UserRole } from '../types';
import { uid, stripHtml, formatDisplayName } from './commentUtils';
import { 
  fetchComments, 
  saveComment, 
  deleteComment, 
  cacheComments, 
  buildFilterStr, 
  buildFilterValuesStr, 
  summarizeCommentsAPI, 
  rephraseCommentAPI, 
  fetchCurrentUserEmail, 
  fetchUserRole,
  fetchAppConfig
} from './commentApi';

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

  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDev, setIsDev] = useState(true);

  const [lockedCommentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_locked_comment_ids') || '[]');
    } catch {
      return [];
    }
  });

  const toggleLockComment = async (id: string) => {
    if (!userEmail && !user) {
      addToast('err', 'Authentication required: Valid user email not found.');
      return;
    }
    if (userRole !== 'Admin') {
      addToast('err', 'Only Admins can lock or unlock comments.');
      return;
    }

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

  /* ── Initial Load: App Config & Auth User ────────────────── */
  useEffect(() => {
    fetchAppConfig()
      .then(cfg => setIsDev(cfg.isDev))
      .catch(() => setIsDev(true));

    setIsUserLoading(true);
    fetchCurrentUserEmail()
      .then(({ email, role }) => {
        if (email) {
          setUserEmail(email);
          setUser(prev => prev || formatDisplayName(email));
          if (role) setUserRole(role);
        } else {
          setUserEmail('');
          setUser('');
          setUserRole(null);
        }
      })
      .catch(err => {
        console.error("Failed to fetch user info:", err);
        setUserEmail('');
        setUser('');
        setUserRole(null);
      })
      .finally(() => {
        setIsUserLoading(false);
      });
  }, []);

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

  const [page, setPage] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('page') || urlParams.get('Page') || urlParams.get('dashboard') || '';
    } catch {
      return '';
    }
  });

  const [storyId, setStoryId] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('story') || urlParams.get('storyId') || urlParams.get('story_id') || '';
    } catch {
      return '';
    }
  });

  /* ── SAC postMessage listener ────────────────────────────── */
  const handleTestFilter = () => {
    const mockSACMessage = "Entity:APAC?Year:2025?Month:January?Custom1:Budget|StoryID:s1?UserName:TestUser?Page: LandingPage";

    const newFilters: Record<string, string> = {};
    mockSACMessage.split(/[?|]+/).filter(Boolean).forEach(seg => {
      const i = seg.indexOf(':');
      if (i === -1) return;
      const k = seg.substring(0, i).trim();
      const v = seg.substring(i + 1).trim();
      const kLower = k.toLowerCase();
      if (kLower === 'page' || kLower === 'dashboard') {
        if (v) {
          newFilters['Page'] = v;
          setPage(v);
        }
      } else if (kLower === 'story' || kLower === 'storyid') {
        if (v) setStoryId(v);
      } else if (kLower === 'username' || kLower === 'user') {
        if (v) setUser(formatDisplayName(v));
      } else if (k && !META_KEYS.has(kLower)) {
        newFilters[k] = v;
      }
    });

    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
    addToast('info', 'Test SAC filters applied');
  };

  const META_KEYS = new Set(['userid', 'username', 'useremail', 'email', 'role', 'userrole', 'story', 'storyid']);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'string') return;
      const newFilters: Record<string, string> = {};
      
      data.split(/[?|]+/).filter(Boolean).forEach(seg => {
        const i = seg.indexOf(':');
        if (i === -1) return;
        const k = seg.substring(0, i).trim();
        const v = seg.substring(i + 1).trim();
        const kLower = k.toLowerCase();
        
        if (kLower === 'page' || kLower === 'dashboard') {
          if (v) {
            newFilters['Page'] = v;
            setPage(v);
          }
        } else if (kLower === 'story' || kLower === 'storyid') {
          if (v) setStoryId(v);
        } else if (kLower === 'userid') {
          if (v) setUserId(v);
        } else if (kLower === 'username' || kLower === 'user') {
          if (v) setUser(formatDisplayName(v));
        } else if (kLower === 'useremail' || kLower === 'email') {
          if (v) {
            setUserEmail(v);
            fetchUserRole(v).then(r => {
              if (r) setUserRole(r);
            });
          }
        } else if (kLower === 'role' || kLower === 'userrole') {
          if (v) {
            const formattedRole = (v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()) as UserRole;
            setUserRole(formattedRole);
          }
        } else if (k && !META_KEYS.has(kLower)) {
          newFilters[k] = v;
        }
      });
      if (Object.keys(newFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...newFilters }));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /* ── Fetch on context change ─────────────────────────────── */
  useEffect(() => {
    const fs = buildFilterStr(filters);
    const isOnlyPage = Object.keys(filters).length === 1 && (!!filters['Page'] || !!filters['Dashboard']);

    setIsLoading(true);

    if (isOnlyPage) {
      fetchComments('')
        .then(data => {
          const pageVal = filters['Page'] || filters['Dashboard'] || page;
          setComments(data.filter(c => {
            const cPage = c.page || c.dashboard;
            return !pageVal || !cPage || cPage === 'common' || cPage.toLowerCase() === pageVal.toLowerCase();
          }));
        })
        .catch(err => {
          console.error("Failed to fetch comments for page:", err);
        })
        .finally(() => setTimeout(() => setIsLoading(false), 300));
    } else if (fs) {
      fetchComments(fs)
        .then(data => {
          setComments(data);
        })
        .catch(err => {
          console.error("Failed to fetch filtered comments:", err);
        })
        .finally(() => setTimeout(() => setIsLoading(false), 300));
    } else {
      fetchComments('')
        .then(data => {
          setComments(data);
        })
        .catch(err => {
          console.error("Failed to fetch initial comments:", err);
        })
        .finally(() => setTimeout(() => setIsLoading(false), 300));
    }
  }, [filters, page, storyId]);

  /* ── Computed ─────────────────────────────────────────────── */
  const filterStr = buildFilterStr(filters) ?? 'DefaultContext';
  const wb_keysStr = buildFilterValuesStr(filters) ?? 'DefaultContext';
  
  // Requirement 7: In dev mode, allow posting outside SAC dashboard. In prod, require valid SAC dimension context.
  const isValidSACSelection = isDev
    ? true
    : Object.keys(filters).filter(k => k !== 'Dashboard' && k !== 'Page').length > 0;

  const isSameUser = (commentUser?: string) => {
    if (!commentUser) return false;
    const cUser = commentUser.toLowerCase().trim();
    const activeUser = (user || '').toLowerCase().trim();
    const activeUserFormatted = formatDisplayName(user || '').toLowerCase().trim();
    const activeEmail = (userEmail || '').toLowerCase().trim();
    const activeId = (userId || '').toLowerCase().trim();

    return (
      (activeUser && (cUser === activeUser || cUser === activeUserFormatted)) ||
      (activeId && (cUser === activeId || cUser.includes(activeId))) ||
      (activeEmail && (cUser === activeEmail || cUser.includes(activeEmail.split('@')[0])))
    );
  };

  const isCommentForCurrentContext = (c: Comment) => {
    if (storyId && c.story && c.story !== storyId) {
      return false;
    }
    const commentPage = c.page || c.dashboard;
    if (page && commentPage && commentPage !== 'common') {
      const normalizedCommentPage = commentPage.toLowerCase().replace(/[\s_-]+/g, '');
      const normalizedCurrentPage = page.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalizedCommentPage !== normalizedCurrentPage) {
        return false;
      }
    }
    if (c.is_private) {
      return userRole === 'Admin' || isSameUser(c.user);
    }
    return true;
  };

  const filteredComments = comments.filter(isCommentForCurrentContext);
  const visibleComments = filteredComments.filter(c => c.level === level);
  const newCommentCount = filteredComments.filter(c => new Date(c.created_at?.value) > lastOpened).length;

  /* ── Comment handlers ────────────────────────────────────── */
  const handleSave = async () => {
    if (!userEmail && !user) {
      addToast('err', 'Authentication required: Valid user email not found.');
      return;
    }
    if (userRole === 'Viewer') {
      addToast('err', 'Your current role (Viewer) does not permit posting comments.');
      return;
    }
    if (!editorHtml.trim() || stripHtml(editorHtml).length < 2) {
      addToast('err', 'Comment cannot be empty.');
      return;
    }

    const existingComment = editingId ? comments.find(c => c.id === editingId) : null;
    const author = user || userEmail || (userId ? `User_${userId}` : '');

    if (!author) {
      addToast('err', 'Authentication required: User identity missing.');
      return;
    }

    const payload: Comment = {
      id: editingId ?? uid(),
      user: existingComment ? existingComment.user : author,
      content: editorHtml,
      level,
      filter: filterStr,
      wb_keys: wb_keysStr,
      page: page || '',
      dashboard: page || '',
      story: storyId || '',
      created_at: existingComment?.created_at ?? { value: new Date().toISOString() },
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
    if (!userEmail && !user) {
      addToast('err', 'Authentication required: Valid user email not found.');
      return;
    }
    if (userRole === 'Viewer') {
      addToast('err', 'Your current role (Viewer) does not permit editing comments.');
      return;
    }
    setEditingId(c.id);
    setEditorHtml(c.content);
    setEditorKey(k => k + 1);
    setAiMode(false);
    setIsPrivate(!!c.is_private);
    setActiveTab('post');
  };

  const handlePublishPrivate = async (c: Comment) => {
    if (!userEmail && !user) {
      addToast('err', 'Authentication required: Valid user email not found.');
      return;
    }
    if (userRole === 'Viewer') {
      addToast('err', 'Your current role (Viewer) does not permit publishing private comments.');
      return;
    }
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
    if (!userEmail && !user) {
      addToast('err', 'Authentication required: Valid user email not found.');
      return;
    }
    if (userRole === 'Viewer') {
      addToast('err', 'Your current role (Viewer) does not permit deleting comments.');
      return;
    }
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
      if (prev['Page']) next['Page'] = prev['Page'];
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
    userEmail, userRole, userId, setUserId, isSameUser, isUserLoading, isDev,
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