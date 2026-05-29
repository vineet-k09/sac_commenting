import React from 'react';
import RichTextEditor from '../helper/RichTextEditor';
import ToastContainer from '../ui/ToastContainer';
import SkeletonCard from '../ui/SkeletonCard';
import { useCommentPage } from './useCommentPage';
import { groupByDate, formatTs, getInitials, stripHtml } from '../api/commentUtils';
import type { Comment } from '../../types';
import './CommentPage.css';

/* ─── Constants ──────────────────────────────────────────── */
const AVATAR_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F0', '#F0FF33', '#33F0FF',
  '#FF8C33', '#33FF8C', '#8C33FF', '#FF338C', '#8CFF33', '#338CFF',
];

/* ─── Inline SVG Icons ───────────────────────────────────── */
const IconChat    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconPen     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

/* ─── Filter Parsing Logic ──────────────────────────────── */
function parseFilterString(filterStr: string) {
  if (!filterStr || filterStr === 'DefaultContext') return [];
  return filterStr.split(/[;,?\/\s]+/).filter(s => s.trim()).map(segment => {
    const sepIndex = segment.indexOf(':');
    if (sepIndex === -1) return { key: 'Context', val: segment.trim() };
    const key = segment.substring(0, sepIndex).trim();
    const val = segment.substring(sepIndex + 1).trim();
    return { key: key || 'Context', val };
  });
}

  
export default function CommentPage() {
  const {
    activeTab, setActiveTab,
    level, setLevel,
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
    aiMode, wordSugs, sentSugs, aiHtml,
    visibleComments,
    newCommentCount,
    handleSave, handleEdit, resetPost, handleDelete,
    openSummary,
    handleAiRewrite,
    applyWordChoice, acceptAllAi, applySentence,
  } = useCommentPage();

  return (
    <div className="cp-root">

      {/* ── Header ── */}
      <div className="cp-header">
        <div className="cp-header-inner">
          <span className="cp-logo">💬</span>
          <div>
            <h1 className="cp-title">SAC Comments</h1>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cp-tabs">
        <button 
          className={`cp-tab${activeTab === 'comments' ? ' cp-tab--active' : ''}`} 
          onClick={() => setActiveTab('comments')} 
          id="tab-comments"
        >
          <IconChat /> Comments
          <span className="cp-tab-badge">{visibleComments.length}</span>
          {newCommentCount > 0 && <span className="cp-tab-dot" />}
        </button>
        <button 
          className={`cp-tab${activeTab === 'post' ? ' cp-tab--active' : ''}`} 
          onClick={() => setActiveTab('post')} 
          id="tab-post"
        >
          <IconPen /> {editingId ? 'Editing' : 'Post'}
        </button>

        <button 
          className={`cp-tab${activeTab === 'ai' ? ' cp-tab--active' : ''}`} 
          onClick={() => setActiveTab('ai')} 
          id="tab-ai"
        >
          ✨ Ask AI
        </button>
      </div>

      {/* ══════════ COMMENTS TAB ══════════ */}
      {activeTab === 'comments' && (
        <div className="cp-panel">
          {/* Level toggle + summarise */}
          <div className="cp-toolbar">
            <div className="cp-level-toggle">
              <button 
                className={`cp-level-btn${level === 'page' ? ' active' : ''}`} 
                onClick={() => setLevel('page')} 
                id="level-page"
              >📄 Page</button>
              <button 
                className={`cp-level-btn${level === 'row'  ? ' active' : ''}`} 
                onClick={() => setLevel('row')}  
                id="level-row"
              >≡ Row</button>
            </div>
            <button 
              className="cp-level-btn"
              style={{ fontSize: '10px', opacity: 0.7, margin: '0 8px 0 auto' }}
              onClick={() => window.postMessage("Region:APAC;Country:India;UserID:DemoUser", "*")}
            >
              🛠️ Test SAC Filter
            </button>
            <button 
              className="cp-summarise-btn" 
              onClick={openSummary} 
              id="btn-summarise"
            >✨ Summarise</button>
          </div>

          {/* ── SAC Context Breadcrumb ── */}
          {Object.keys(filters).length > 0 && (
            <div className="cp-breadcrumb" style={{ margin: '0 0 8px 0', border: '1.5px solid var(--border)', borderRadius: '8px' }}>
              <span className="cp-breadcrumb-level">SAC Context:</span>
              {Object.entries(filters).map(([k, v]) => (
                <span key={k} className="cp-breadcrumb-chip">
                  <span className="cp-breadcrumb-key">{k}:</span>
                  <span className="cp-breadcrumb-val">{v}</span>
                </span>
              ))}
            </div>
          )}


          {/* Comment cards */}
          <div className="cp-comments-list">
            {isLoading ? (
              [0, 1, 2].map(i => <SkeletonCard key={i} index={i} />)
            ) : visibleComments.length === 0 ? (
              <div className="cp-empty">
                <div className="cp-empty-icon">💬</div>
                <p>No {level}-level comments yet.</p>
                <button 
                  className="cp-link-btn" 
                  onClick={() => setActiveTab('post')}
                >Be the first to add one →</button>
              </div>
            ) : (
              groupByDate(visibleComments).map(({ label, items }) => (
                <div key={label}>
                  <div className="cp-date-divider"><span>{label}</span></div>
                  {items.map((c: Comment, i: number) => {
                    const { relative, absolute } = formatTs(c.timestamp);
                    const accent  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const isNew   = new Date(c.timestamp) > lastOpened;
                    const parsedFilters = parseFilterString(c.filter);
                    
                    return (
                      <div
                        key={c.id}
                        className={`cp-card${isNew ? ' cp-card--new' : ''}${c.level === 'row' ? ' cp-card--row' : ''}`}
                        style={{ 
                          '--accent': c.level === 'row' ? 'linear-gradient(180deg,#C8102E,#0f1f6e)' : 'linear-gradient(180deg,#0f1f6e,#1e56c8)', 
                          animationDelay: `${i * 0.05}s` 
                        } as React.CSSProperties}
                      >
                        <div className="cp-card-accent" />
                        <div className="cp-card-body">
                          <div className="cp-card-head">
                            <div className="cp-avatar" style={{ background: accent }}>{getInitials(c.user)}</div>
                            <div className="cp-meta">
                              <div className="cp-username-row">
                                <span className="cp-username">{c.user}</span>
                                {isNew && <span className="cp-new-badge">New</span>}
                              </div>
                              <span className="cp-ts" title={absolute}>{relative} · {absolute}</span>
                            </div>
                            <button 
                              className="cp-edit-btn" 
                              onClick={() => handleEdit(c)}
                            >✏️ Edit</button>
                            <button 
                              className="cp-delete-btn" 
                              onClick={() => handleDelete(c.id)}
                            >🗑️ Delete</button>
                          </div>

                          {/* ── Row-level: per-comment context ── */}
                          {c.level === 'row' && (
                            <div className="cp-row-ctx">
                              <span className="cp-row-ctx-icon">≡</span>
                              <div className="cp-page-ctx-chips" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {parsedFilters.map((f, idx) => (
                                  <span key={idx} className="cp-page-ctx-chip" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                    <span className="cp-page-ctx-key">{f.key}</span>{f.val}
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

      {/* ══════════ POST TAB ══════════ */}
      {activeTab === 'post' && (
        <div className="cp-panel">
          <div className="cp-field">
            <label className="cp-label">Posting as (User ID)</label>
            <div className="cp-user-badge">
              <span className="cp-user-dot" />
              <span style={{ fontWeight: 700 }}>{user || 'Waiting for SAC context…'}</span>
            </div>
          </div>

          <div className="cp-field">
            <label className="cp-label">Comment Level</label>
            <div className="cp-level-toggle">
              <button 
                className={`cp-level-btn${level === 'page' ? ' active' : ''}`} 
                onClick={() => setLevel('page')}
              >📄 Page</button>
              <button 
                className={`cp-level-btn${level === 'row'  ? ' active' : ''}`} 
                onClick={() => setLevel('row')}
              >≡ Row</button>
            </div>
          </div>

          <div className="cp-field">
            <label className="cp-label">Comment</label>
            <RichTextEditor key={editorKey} initialContent={editorHtml} onChange={setEditorHtml} />
          </div>

          {/* AI diff preview */}
          {aiMode && (
            <div className="cp-ai-panel">
              <div className="cp-ai-header">
                <span className="cp-ai-badge">✨ AI Rewrite Suggestions</span>
                <button 
                  className="cp-link-btn" 
                  onClick={resetPost}
                >✕ Cancel</button>
              </div>
              <div className="cp-ai-preview" dangerouslySetInnerHTML={{ __html: aiHtml }} />
              {wordSugs.length > 0 && (
                <div className="cp-ai-section">
                  <p className="cp-ai-section-title">Word Suggestions</p>
                  <div className="cp-word-chips">
                    {wordSugs.map((w, i) => (
                      <div key={i} className="cp-word-group">
                        <span className="cp-word-orig">{w.original}</span>
                        <span className="cp-word-arrow">→</span>
                        {w.alts.map(alt => (
                          <button 
                            key={alt} 
                            className={`cp-word-alt${w.chosen === alt ? ' chosen' : ''}`} 
                            onClick={() => applyWordChoice(i, alt)}
                          >{alt}</button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sentSugs.length > 0 && (
                <div className="cp-ai-section">
                  <p className="cp-ai-section-title">Sentence Rewrites</p>
                  {sentSugs.map((s, i) => (
                    <div key={i} className="cp-sent-card">
                      <p className="cp-sent-orig">{s.original}</p>
                      <p className="cp-sent-new">{s.rewritten}</p>
                      <button 
                        className="cp-sent-apply" 
                        onClick={() => applySentence(s)}
                      >Apply →</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="cp-ai-actions">
                <button 
                  className="cp-btn-primary" 
                  onClick={acceptAllAi}
                >Accept All</button>
                <button 
                  className="cp-btn-ghost" 
                  onClick={() => setActiveTab('post')}
                >Dismiss</button>
              </div>
            </div>
          )}

          <div className="cp-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>

            <button 
              className="cp-btn-primary" 
              onClick={handleSave} 
              id="btn-post"
              style={{ background: 'linear-gradient(135deg, #C8102E, #0f1f6e)', color: 'white', border: 'none' }}
            >
              {editingId ? 'Save Changes' : 'Post Comment'}
            </button>
            <button 
              className="cp-btn-ghost" 
              onClick={resetPost}
              style={{ background: 'linear-gradient(135deg, #C8102E, #0f1f6e)', color: 'white', border: 'none' }}
            >
              Cancel
            </button>
            <button 
              className="cp-btn-ai" 
              onClick={handleAiRewrite} 
              disabled={!editorHtml || stripHtml(editorHtml).length < 5} 
              id="btn-ai-rewrite"
            >
              ✨ Generate Comment
            </button>
          </div>
        </div>
      )}



      {/* ══════════ AI TAB ══════════ */}
      {activeTab === 'ai' && (
        <div className="cp-panel cp-ai-page">
          <div className="cp-ai-page-hero">
            <div className="cp-ai-page-icon">✨</div>
            <h2 className="cp-ai-page-title">AI Dashboard Assistant</h2>
            <p className="cp-ai-page-sub">Ask questions about your dashboard data, get trend analysis, and surface key insights — all in context.</p>
          </div>
        </div>
      )}

      {/* ══════════ SUMMARY DRAWER ══════════ */}
      {drawerOpen && (
        <>
          <div className="cp-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="cp-drawer">
            <div className="cp-drawer-header">
              <div>
                <h2 className="cp-drawer-title">✨ AI Summary</h2>
                <p className="cp-drawer-sub">{level === 'page' ? 'Page' : 'Row'}-level · {visibleComments.length} comment{visibleComments.length !== 1 ? 's' : ''}</p>
              </div>
              <button 
                className="cp-drawer-close" 
                onClick={() => setDrawerOpen(false)}
              >✕</button>
            </div>
            <div className="cp-drawer-body">
              {sumLoading ? (
                <div className="cp-loading">
                  <div className="cp-spinner" />
                  <p>Analysing comments…</p>
                </div>
              ) : (
                <>
                  <div className="cp-summary-text">{summaryText}</div>
                  <div className="cp-summary-meta">
                    <strong>Contributors:</strong>{' '}
                    {[...new Set(visibleComments.map(c => c.user))].join(', ')}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
