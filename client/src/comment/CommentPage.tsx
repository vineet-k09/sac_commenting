import React, { useState } from 'react';
import RichTextEditor from '../ui/RichTextEditor';
import ToastContainer from '../ui/ToastContainer';
import SkeletonCard from '../ui/SkeletonCard';
import { useCommentPage } from './useCommentPage';
import { groupByDate, formatTs, getInitials, formatDisplayName } from './commentUtils';
import type { Comment } from '../types';
import './CommentPage.css';

/* ─── Avatar palette ─────────────────────────────────────── */
const AVATAR_COLORS = ['#1e3a8a', '#dc2626', '#0f766e', '#7c3aed', '#b45309', '#0369a1', '#be185d', '#166534'];

/* ─── Fluent SVG Icons ───────────────────────────────────── */
const IcoChat = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const IcoPen = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
const IcoAI = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>;
const IcoPage = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>;
const IcoRow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>;
const IcoEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IcoTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
const IcoSend = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IcoUser = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IcoFilter = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const IcoEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const IcoEyeOff = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
const IcoLock = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IcoUnlock = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
const IcoChevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ─── Parse stored filter string back to key-value pairs ───────── */
// buildFilterStr stores as "Dashboard:X;Entity:Y;Month:Z" (sorted, semicolon-delimited)
function parseCommentFilter(filterStr: string): { key: string; val: string }[] {
  if (!filterStr || filterStr === 'DefaultContext') return [];
  return filterStr.split(';').filter(Boolean).map(seg => {
    const i = seg.indexOf(':');
    if (i === -1) return { key: 'Context', val: seg.trim() };
    return { key: seg.substring(0, i).trim(), val: seg.substring(i + 1).trim() };
  });
}



/* ─── Component ──────────────────────────────────────────── */
export default function CommentPage() {
  const {
    activeTab, setActiveTab, level, setLevel, user,
    editorHtml, setEditorHtml, editorKey, editingId,
    filters, isLoading, lastOpened, toasts, removeToast,
    drawerOpen, setDrawerOpen, summaryText, sumLoading,
    aiMode, aiHtml, visibleComments, newCommentCount,
    userEmail, userRole, showRoleModal, setShowRoleModal, handleSelectRole,
    isPrivate, setIsPrivate, handlePublishPrivate,
    lockDate, setLockDate, allowPrivateConfig, setAllowPrivateConfig,
    notifyEmail, setNotifyEmail, defaultLevelConfig, setDefaultLevelConfig,
    handleSaveAdminConfig,
    handleSave, handleEdit, resetPost, handleDelete, /*openSummary,
    handleAiRewrite,*/ acceptAllAi,
    handleTestFilter, handleClearRowFilters,
    lockedCommentIds, toggleLockComment,
  } = useCommentPage();

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [hiddenRowFilters, setHiddenRowFilters] = useState<Set<string>>(new Set());

  const toggleRowFilter = (id: string) => {
    setHiddenRowFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterCount = Object.keys(filters || {}).length;

  return (
    <div className="cp-root">

      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IcoChat /><h1 className="cp-title">SAC Comments</h1>
          </div>
          <div className="cp-header-role">
            <span className="cp-user-email">{userEmail || 'Guest'}</span>
            <button 
              className="cp-role-badge-static" 
              onClick={() => setShowRoleModal(true)}
              title="Click to switch role"
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {userRole ? `Role: ${userRole} ▾` : 'Role: Admin ▾'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        <button className={`cp-tab${activeTab === 'comments' ? ' cp-tab--active' : ''}`} onClick={() => setActiveTab('comments')} id="tab-comments">
          <IcoChat /> Comments
          <span className="cp-tab-badge">{visibleComments.length}</span>
          {newCommentCount > 0 && <span className="cp-tab-dot" />}
        </button>
        {userRole !== 'Viewer' && (
          <button className={`cp-tab${activeTab === 'post' ? ' cp-tab--active' : ''}`} onClick={() => setActiveTab('post')} id="tab-post">
            <IcoPen /> {editingId ? 'Editing' : 'Post'}
          </button>
        )}
        {/* <button className={`cp-tab${activeTab === 'ai' ? ' cp-tab--active' : ''}`} onClick={() => setActiveTab('ai')} id="tab-ai">
          <IcoAI /> Ask AI
        </button> */}
        {userRole === 'Admin' && (
          <button className={`cp-tab${activeTab === 'admin' ? ' cp-tab--active' : ''}`} onClick={() => setActiveTab('admin')} id="tab-admin">
            <IcoFilter /> Admin Config
          </button>
        )}
      </div>

      {/* ══ COMMENTS TAB ══ */}
      {activeTab === 'comments' && (
        <div className="cp-panel">
          <div className="cp-toolbar">
            <div className="cp-level-toggle">
              <button className={`cp-level-btn${level === 'page' ? ' active' : ''}`} onClick={() => setLevel('page')} id="level-page"><IcoPage /> Page</button>
              <button className={`cp-level-btn${level === 'row' ? ' active' : ''}`} onClick={() => setLevel('row')} id="level-row"><IcoRow /> Row</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="cp-test-btn" onClick={handleTestFilter} title="Send demo SAC filter string">Test SAC</button>
              <button className="cp-test-btn" onClick={handleClearRowFilters} title="Clear row filters but keep dashboard">Clear Rows</button>
              {/* <button className="cp-summarise-btn" onClick={openSummary} id="btn-summarise"><IcoAI /> Summarise</button> */}
            </div>
          </div>

          {/* Collapsible filter bar */}
          {/* {level === 'page' && filterCount > 0 && ( */}
          {filterCount > 0 && (
            <>
              <div className="cp-filter-bar">
                <div className="cp-filter-bar-summary"><IcoFilter /><span className="cp-filter-bar-label">{filterCount} filter{filterCount !== 1 ? 's' : ''} active</span></div>
                <button className="cp-filter-toggle-btn" onClick={() => setFiltersExpanded(v => !v)} aria-expanded={filtersExpanded}>
                  {filtersExpanded ? 'Hide' : 'Show'} <IcoChevron open={filtersExpanded} />
                </button>
              </div>
              {filtersExpanded && (
                <div className="cp-filter-chip-list">
                  {Object.entries(filters).map(([k, v]) => (
                    <span key={k} className="cp-breadcrumb-chip">
                      <span className="cp-breadcrumb-key">{k}:</span>
                      <span className="cp-breadcrumb-val">{v}</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* {level === 'row' && filterCount > 0 && (
            <>
              <div className="cp-filter-bar">
                <div className="cp-filter-bar-summary"><IcoFilter /><span className="cp-filter-bar-label">{filterCount} filter{filterCount !== 1 ? 's' : ''} active</span></div>
                <button className="cp-filter-toggle-btn" onClick={() => setFiltersExpanded(v => !v)} aria-expanded={filtersExpanded}>
                  {filtersExpanded ? 'Hide' : 'Show'} <IcoChevron open={filtersExpanded} />
                </button>
              </div>
              {filtersExpanded && (
                <div className="cp-filter-chip-list">
                  {Object.entries(filters).map(([k, v]) => (
                    <span key={k} className="cp-breadcrumb-chip">
                      <span className="cp-breadcrumb-key">{k}:</span>
                      <span className="cp-breadcrumb-val">{v}</span>
                    </span>
                  ))}
                </div>
              )}
            </>
          )} */}

          {/* Comment list */}
          <div className="cp-comments-list">
            {isLoading ? (
              [0, 1, 2].map(i => <SkeletonCard key={i} index={i} />)
            ) : visibleComments.length === 0 ? (
              <div className="cp-empty">
                <div className="cp-empty-icon"><IcoChat /></div>
                <p>No {level}-level comments yet.</p>
                {userRole !== 'Viewer' && <button className="cp-link-btn" onClick={() => setActiveTab('post')}>Be the first to add one →</button>}
              </div>
            ) : (
              groupByDate(visibleComments).map(({ label, items }) => (
                <div key={label}>
                  <div className="cp-date-divider"><span>{label}</span></div>
                  {items.map((c: Comment, i: number) => {
                    const { relative, absolute } = formatTs(c.created_at?.value);
                    const accent = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const isNew = new Date(c.created_at?.value) > lastOpened;
                    const isLocked = c.is_locked || (lockDate && c.created_at?.value && new Date(c.created_at.value) < new Date(lockDate)) || (lockedCommentIds || []).includes(c.id);
                    return (
                      <div key={c.id}
                        className={`cp-card${isNew ? ' cp-card--new' : ''}${c.level === 'row' ? ' cp-card--row' : ''}${c.is_private ? ' cp-card--private' : ''}`}
                        style={{ '--accent': c.level === 'row' ? 'linear-gradient(180deg,#C8102E,#0f1f6e)' : 'linear-gradient(180deg,#0f1f6e,#1e56c8)', animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
                        <div className="cp-card-accent" />
                        <div className="cp-card-body">
                          <div className="cp-card-head">
                            <div className="cp-avatar" style={{ background: accent }}>{getInitials(c.user)}</div>
                            <div className="cp-meta">
                              <div className="cp-username-row">
                                <span className="cp-username">{formatDisplayName(c.user)}</span>
                                {isNew && <span className="cp-new-badge">New</span>}
                                {c.is_private ? (
                                  <span className="cp-private-badge">Private Comment</span>
                                ) : (
                                  <span className="cp-public-badge">Public Comment</span>
                                )}
                              </div>
                              <span className="cp-ts" title={absolute}>{relative} · {absolute}</span>
                            </div>
                            <div className="cp-card-actions">
                              {c.is_private && (userRole === 'Admin' || formatDisplayName(c.user) === formatDisplayName(user)) && (
                                <button className="cp-publish-btn" onClick={() => handlePublishPrivate(c)} title="Publish for wider audience">Publish</button>
                              )}
                              {/* {c.level === 'row' && ( */}
                              {parseCommentFilter(c.filter).length > 0 &&(
                                <button className="cp-icon-btn" onClick={() => toggleRowFilter(c.id)} title={hiddenRowFilters.has(c.id) ? "Show context filters" : "Hide context filters"}>
                                  {hiddenRowFilters.has(c.id) ? <IcoEyeOff /> : <IcoEye />}
                                </button>
                              )}
                              {userRole === 'Admin' && (
                                <>
                                  {isLocked && <span className="cp-locked-badge" title="Locked by Admin">🔒 Locked</span>}
                                  <button
                                    className="cp-icon-btn cp-lock-btn"
                                    onClick={() => toggleLockComment(c.id)}
                                    title={isLocked ? "Unlock comment" : "Lock comment"}
                                  >
                                    {isLocked ? <IcoUnlock /> : <IcoLock />}
                                  </button>
                                </>
                              )}
                              {userRole !== 'Viewer' && (
                                isLocked ? (
                                  userRole === 'Admin' && (
                                    <>
                                      <button className="cp-icon-btn" onClick={() => handleEdit(c)} title="Edit comment"><IcoEdit /></button>
                                      <button className="cp-icon-btn cp-icon-btn--delete" onClick={() => handleDelete(c.id)} title="Delete comment"><IcoTrash /></button>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <button className="cp-icon-btn" onClick={() => handleEdit(c)} title="Edit comment"><IcoEdit /></button>
                                    <button className="cp-icon-btn cp-icon-btn--delete" onClick={() => handleDelete(c.id)} title="Delete comment"><IcoTrash /></button>
                                  </>
                                )
                              )}
                            </div>
                          </div>

                          {/* Row-level: compact inline filter context */}
                          {/* {c.level === 'row' && !hiddenRowFilters.has(c.id) && parseCommentFilter(c.filter).length > 0 && ( */}
                          {!hiddenRowFilters.has(c.id) && parseCommentFilter(c.filter).length > 0 && (
                            <div className="cp-row-ctx">
                              {/* <IcoRow /> */}
                              {c.level === 'row' ? <IcoRow /> : <IcoPage />}
                              <div className="cp-row-filter-chips">
                                {parseCommentFilter(c.filter).map(f => (
                                  <span key={f.key} className="cp-row-filter-chip">
                                    <span className="cp-row-filter-key">{f.key}</span>{f.val}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="cp-content" dangerouslySetInnerHTML={{ __html: c.content }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ POST TAB ══ */}
      {activeTab === 'post' && (
        <div className="cp-panel">
          {userRole === 'Viewer' ? (
            <div className="cp-invalid-selection-box">
              <h3>Access Denied</h3>
              <p>Your current role (Viewer) does not permit posting or editing comments.</p>
            </div>
          ) : (
            <>
              <div className="cp-field">
                <label className="cp-label">Posting as</label>
                <div className="cp-user-badge"><IcoUser /><span style={{ fontWeight: 700 }}>{user || userEmail || 'Waiting for SAC context…'}</span></div>
              </div>
              <div className="cp-field">
                <label className="cp-label">Comment Level</label>
                <div className="cp-level-toggle">
                  <button className={`cp-level-btn${level === 'page' ? ' active' : ''}`} onClick={() => setLevel('page')}><IcoPage /> Page</button>
                  <button className={`cp-level-btn${level === 'row' ? ' active' : ''}`} onClick={() => setLevel('row')}><IcoRow /> Row</button>
                </div>
              </div>
              <div className="cp-field">
                <label className="cp-label">Comment Visibility</label>
                <div className="cp-visibility-row">
                  <span className={`cp-visibility-status ${isPrivate ? 'status-private' : 'status-public'}`}>
                    Currently: <strong>{isPrivate ? 'Private Comment' : 'Public Comment'}</strong>
                  </span>
                  <button
                    type="button"
                    className="cp-btn-toggle-visibility"
                    onClick={() => setIsPrivate(prev => !prev)}
                  >
                    {isPrivate ? 'Turn Public' : 'Turn Private'}
                  </button>
                </div>
              </div>
              <div className="cp-field">
                <label className="cp-label">Comment</label>
                <RichTextEditor key={editorKey} initialContent={editorHtml} onChange={setEditorHtml} />
              </div>

              {aiMode && (
                <div className="cp-ai-panel">
                  <div className="cp-ai-header">
                    <span className="cp-ai-badge"><IcoAI /> AI Rewrite</span>
                    <button className="cp-link-btn" onClick={resetPost}>✕ Cancel</button>
                  </div>
                  <div className="cp-ai-preview" dangerouslySetInnerHTML={{ __html: aiHtml }} />
                  <div className="cp-ai-actions">
                    <button className="cp-btn-primary" onClick={acceptAllAi}>Accept Rewrite</button>
                    <button className="cp-btn-ghost" onClick={() => setActiveTab('post')}>Dismiss</button>
                  </div>
                </div>
              )}

              <div className="cp-actions">
                <button className="cp-btn-primary" onClick={handleSave} id="btn-post"><IcoSend /> {editingId ? 'Save Changes' : 'Post Comment'}</button>
                <button className="cp-btn-ghost" onClick={resetPost}>Cancel</button>
                {/* <button className="cp-btn-ai" onClick={handleAiRewrite} disabled={!editorHtml || stripHtml(editorHtml).length < 5} id="btn-ai-rewrite">
                  <IcoAI /> Generate
                </button> */}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ AI TAB ══ */}
      {activeTab === 'ai' && (
        <div className="cp-panel cp-ai-page">
          <div className="cp-ai-page-hero">
            <div className="cp-ai-page-icon"><IcoAI /></div>
            <h2 className="cp-ai-page-title">AI Dashboard Assistant</h2>
            <p className="cp-ai-page-sub">Ask questions about your dashboard data, get trend analysis, and surface key insights — all in context.</p>
          </div>
        </div>
      )}

      {/* ══ ADMIN CONFIG TAB ══ */}
      {activeTab === 'admin' && (
        <div className="cp-panel cp-config">
          <div className="cp-ai-page-hero" style={{ padding: '20px', marginBottom: '8px' }}>
            <h2 className="cp-ai-page-title">Admin Governance & Configuration</h2>
            <p className="cp-ai-page-sub">Configure global comment locking cut-off dates, default posting levels, visibility rules, and notification targets.</p>
          </div>

          <div className="cp-config-section">
            <h3 className="cp-config-title">Comment Locking</h3>
            <p className="cp-config-desc">Define a cut-off date. Comments created prior to this date will be locked and cannot be edited or deleted.</p>
            <div className="cp-field">
              <label className="cp-label">Lock Cut-off Date</label>
              <input type="date" className="cp-input" value={lockDate} onChange={e => setLockDate(e.target.value)} />
            </div>
          </div>

          <div className="cp-config-section">
            <h3 className="cp-config-title">Comment Visibility & Defaults</h3>
            <p className="cp-config-desc">Control whether contributors can post private comments and set the default comment level.</p>
            <div className="cp-field">
              <label className="cp-label">Allow Private Comments</label>
              <label className="cp-toggle-label">
                <input type="checkbox" checked={allowPrivateConfig} onChange={e => setAllowPrivateConfig(e.target.checked)} />
                <span className="cp-toggle-slider"></span>
                <span className="cp-toggle-text">{allowPrivateConfig ? 'Enabled (Contributors can create private comments)' : 'Disabled (All comments are public)'}</span>
              </label>
            </div>
            <div className="cp-field" style={{ marginTop: '12px' }}>
              <label className="cp-label">Default Comment Level</label>
              <div className="cp-level-toggle" style={{ alignSelf: 'flex-start' }}>
                <button className={`cp-level-btn${defaultLevelConfig === 'page' ? ' active' : ''}`} onClick={() => setDefaultLevelConfig('page')}><IcoPage /> Page</button>
                <button className={`cp-level-btn${defaultLevelConfig === 'row' ? ' active' : ''}`} onClick={() => setDefaultLevelConfig('row')}><IcoRow /> Row</button>
              </div>
            </div>
          </div>

          <div className="cp-config-section">
            <h3 className="cp-config-title">Notification Triggers</h3>
            <p className="cp-config-desc">Define the target email address for automated alerts on comment submission or publishing.</p>
            <div className="cp-field">
              <label className="cp-label">Alert Recipient Email</label>
              <input type="email" className="cp-input" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="alerts@datalinksoftware.com" />
            </div>
          </div>

          <div className="cp-actions" style={{ marginTop: '8px' }}>
            <button className="cp-btn-primary" onClick={handleSaveAdminConfig}>Save Configuration</button>
          </div>
        </div>
      )}

      {/* Summary drawer */}
      {drawerOpen && (
        <>
          <div className="cp-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="cp-drawer">
            <div className="cp-drawer-header">
              <div>
                <h2 className="cp-drawer-title"><IcoAI /> AI Summary</h2>
                <p className="cp-drawer-sub">{level === 'page' ? 'Page' : 'Row'}-level · {visibleComments.length} comment{visibleComments.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="cp-drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className="cp-drawer-body">
              {sumLoading ? (
                <div className="cp-loading"><div className="cp-spinner" /><p>Analysing comments…</p></div>
              ) : (
                <>
                  <div className="cp-summary-text" dangerouslySetInnerHTML={{ __html: summaryText }} />
                  <div className="cp-summary-meta">
                    <strong>Contributors:</strong>{' '}
                    {[...new Set(visibleComments.map(c => formatDisplayName(c.user)))].join(', ')}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <>
          <div className="cp-drawer-backdrop" onClick={() => setShowRoleModal(false)} />
          <div className="cp-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1e293b', padding: '24px', borderRadius: '12px', zIndex: 1000, minWidth: '320px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f8fafc' }}>Switch User Role</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>Select role for <strong>{userEmail || 'Current User'}</strong>. Changes are saved to backend BigQuery.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['Admin', 'Editor', 'Contributor', 'Viewer'] as const).map(role => (
                <button
                  key={role}
                  className={`cp-btn-primary`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: userRole === role ? '#0284c7' : '#334155',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                  onClick={() => handleSelectRole(role)}
                >
                  <span>{role}</span>
                  {userRole === role && <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>Active</span>}
                </button>
              ))}
            </div>
            <button 
              className="cp-btn-ghost" 
              style={{ marginTop: '16px', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer' }}
              onClick={() => setShowRoleModal(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
