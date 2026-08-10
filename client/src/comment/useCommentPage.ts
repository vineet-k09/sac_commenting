import { useEffect, useState } from 'react';
import type { ToastItem } from '../ui/ToastContainer';
import type { Comment, CommentLevel, ActiveTab, UserRole } from '../types';
import { uid, stripHtml, formatDisplayName } from './commentUtils';
import { fetchComments, saveComment, deleteComment, cacheComments, buildFilterStr, buildFilterValuesStr, summarizeCommentsAPI, rephraseCommentAPI, fetchCurrentUserEmail, fetchUserRole } from './commentApi';

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
    fetchCurrentUserEmail()
      .then(({ email, role }) => {
        const resolvedEmail = email || 'guest.user@datalinksoftware.com';
        setUserEmail(resolvedEmail);
        setUser(prev => prev || formatDisplayName(resolvedEmail));
        if (role) {
          setUserRole(role);
        } else if (resolvedEmail === 'guest.user@datalinksoftware.com') {
          setUserRole('Admin');
        }
      })
      .catch(err => {
        console.error("Failed to fetch user role from backend:", err);
        const fallbackEmail = 'guest.user@datalinksoftware.com';
        setUserEmail(fallbackEmail);
        setUser(prev => prev || formatDisplayName(fallbackEmail));
        setUserRole('Admin');
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
    const mockSACMessage = "Entity:APAC?Year:2025?Month:January?Custom1:Budget|StoryID:s1?UserName:John Doe?Role:Admin?Page: LandingPage";

    const newFilters: Record<string, string> = {};
    mockSACMessage.split(/[?|]+/).filter(Boolean).forEach(seg => {
      const i = seg.indexOf(':');
      if (i === -1) return;
      const k = seg.substring(0, i).trim();
      const v = seg.substring(i + 1).trim();
      const kLower = k.toLowerCase();
      if (kLower === 'story' || kLower === 'storyid') {
        if (v) setStoryId(v);
      } else if (kLower === 'page' || kLower === 'pagename' || kLower === 'dashboard') {
        if (v) {
          newFilters['Page'] = v;
          setPage(v);
        }
      } else if (kLower === 'username') {
        if (v) setUser(formatDisplayName(v));
      } else if (kLower === 'userid') {
        if (v && v.includes('@') && !userEmail) setUserEmail(v);
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
    addToast('info', 'Test SAC filters applied directly');
  };
  // Real SAC message format:
  // "Entity:X?Year:Y?Month:Z?Custom1:W|UserID:uid?UserName:uname?StoryID:sid?Page: PageName"
  // Segments are delimited by `?` or `|`; user/meta fields are excluded from filter chips.
  const META_KEYS = new Set(['userid', 'username', 'useremail', 'email', 'role', 'userrole', 'story', 'storyid']);

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
        if (kLower === 'story' || kLower === 'storyid') {
          if (v) setStoryId(v);
        } else if (kLower === 'page' || kLower === 'pagename' || kLower === 'dashboard') {
          if (v) {
            newFilters['Page'] = v;
            setPage(v);
          }
        } else if (kLower === 'username') {
          if (v) setUser(formatDisplayName(v));
        } else if (kLower === 'userid') {
          if (v && v.includes('@') && !userEmail) setUserEmail(v);
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
          // Only add genuine dimension filters (Entity, Year, Month, Custom1, etc.)
          newFilters[k] = v;
        }
      });
      if (Object.keys(newFilters).length > 0)
        setFilters(prev => ({ ...prev, ...newFilters }));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [userEmail]);

  /* ── Fetch on context change ─────────────────────────────── */
  useEffect(() => {
    const fs = buildFilterStr(filters);
    const isOnlyPage = Object.keys(filters).length === 1 && (!!filters['Page'] || !!filters['Dashboard']);

    setIsLoading(true);

    if (isOnlyPage) {
      // If only Page is active (e.g. after "Clear Rows"), fetch all comments 
      // and filter locally to ensure we see all row-level comments for this page.
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
      // Direct load on page open (npm run dev):
      // Fetch and showcase comments directly for the current context
      fetchComments('')
        .then(data => {
          setComments(data);
        })
        .catch(err => {
          console.error("Failed to fetch comments on initial load:", err);
        })
        .finally(() => setTimeout(() => setIsLoading(false), 300));
    }
  }, [filters, page, storyId]);

  /* ── Computed ─────────────────────────────────────────────── */
  const filterStr = buildFilterStr(filters) ?? 'DefaultContext';
  const wb_keysStr = buildFilterValuesStr(filters) ?? 'DefaultContext';
  const isValidSACSelection = true;

  const isSameUser = (commentUser?: string) => {
    if (!commentUser) return false;
    const cUser = commentUser.toLowerCase().trim();
    const cUserFormatted = formatDisplayName(commentUser).toLowerCase().trim();
    const activeUser = (user || '').toLowerCase().trim();
    const activeUserFormatted = formatDisplayName(user || '').toLowerCase().trim();
    const activeEmail = (userEmail || '').toLowerCase().trim();
    const activeId = (userId || '').toLowerCase().trim();

    return (
      (activeUser && (cUser === activeUser || cUserFormatted === activeUserFormatted)) ||
      (activeId && (cUser === activeId || cUser.includes(activeId))) ||
      (activeEmail && (cUser === activeEmail || cUser.includes(activeEmail.split('@')[0])))
    );
  };

  const isCommentForCurrentContext = (c: Comment) => {
    // 1. Story matching: if we have an active storyId and the comment has a story property, match it
    if (storyId && c.story && c.story !== storyId) {
      return false;
    }
    // 2. Page matching: if we have an active page and the comment specifies a page, match it
    const commentPage = c.page || c.dashboard;
    if (page && commentPage && commentPage !== 'common') {
      const normalizedCommentPage = commentPage.toLowerCase().replace(/[\s_-]+/g, '');
      const normalizedCurrentPage = page.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalizedCommentPage !== normalizedCurrentPage) {
        return false;
      }
    }
    // 3. Privacy matching:
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
    if (!editorHtml.trim() || stripHtml(editorHtml).length < 2) {
      addToast('err', 'Comment cannot be empty.');
      return;
    }

    const existingComment = editingId ? comments.find(c => c.id === editingId) : null;
    const author = user || userEmail || (userId ? `User_${userId}` : 'Anonymous');

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
    userEmail, userRole, userId, setUserId, isSameUser,
    isPrivate, setIsPrivate, handlePublishPrivate, isValidSACSelection,
    lockDate, setLockDate, allowPrivateConfig, setAllowPrivateConfig,
    notifyEmail, setNotifyEmail, defaultLevelConfig, setDefaultLevelConfig,
    handleSaveAdminConfig,
    handleSave, handleEdit, handleDelete, resetPost,
    openSummary, handleAiRewrite, acceptAllAi, addToast,
    handleTestFilter, handleClearRowFilters,
    storyId, setStoryId, page, setPage, dashboard: page, setDashboard: setPage,
    lockedCommentIds, toggleLockComment,
  };
}