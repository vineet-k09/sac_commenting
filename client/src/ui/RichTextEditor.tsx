import React, { useRef, useEffect, useCallback, useState } from 'react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

type FormatCmd =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'superscript' | 'subscript'
  | 'insertUnorderedList' | 'insertOrderedList'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull'
  | 'indent' | 'outdent'
  | 'undo' | 'redo'
  | 'removeFormat';

const FONT_SIZES = [
  { label: 'XS', value: '1' }, { label: 'S', value: '2' },
  { label: 'M',  value: '3' }, { label: 'L', value: '4' },
  { label: 'XL', value: '5' },
];

const PRESET_COLORS = [
  '#000000', '#1e3a8a', '#dc2626', '#166534',
  '#92400e', '#5b21b6', '#0369a1', '#be185d',
  '#4b5563', '#ffffff',
];

const PRESET_HIGHLIGHTS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca',
  '#e9d5ff', '#fed7aa', '#a7f3d0', 'transparent',
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = 'Write your comment here…',
}) => {
  const editorRef    = useRef<HTMLDivElement>(null);
  const fontColorRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLInputElement>(null);

  const [showColorPicker,     setShowColorPicker]     = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkPopup,       setShowLinkPopup]       = useState(false);
  const [linkUrl,             setLinkUrl]             = useState('https://');
  const [savedRange,          setSavedRange]          = useState<Range | null>(null);
  const [fontSize,            setFontSize]            = useState('3');
  const [fontColor,           setFontColor]           = useState('#000000');
  const [highlightColor,      setHighlightColor]      = useState('transparent');

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notify = useCallback(() => {
    onChange?.(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  const execFormat = useCallback((cmd: FormatCmd) => {
    document.execCommand(cmd, false, undefined);
    editorRef.current?.focus();
    notify();
  }, [notify]);

  const applyFontSize = useCallback((size: string) => {
    setFontSize(size);
    editorRef.current?.focus();
    document.execCommand('fontSize', false, size);
    notify();
  }, [notify]);

  const applyColor = useCallback((color: string) => {
    setFontColor(color);
    setShowColorPicker(false);
    editorRef.current?.focus();
    document.execCommand('foreColor', false, color);
    notify();
  }, [notify]);

  const applyHighlight = useCallback((color: string) => {
    setHighlightColor(color);
    setShowHighlightPicker(false);
    editorRef.current?.focus();
    document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
    notify();
  }, [notify]);

  /* ── Link insertion ─────────────────────────────────────── */
  const openLinkPopup = () => {
    // Save current selection so we can restore it when inserting
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) setSavedRange(sel.getRangeAt(0).cloneRange());
    setShowLinkPopup(true);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
  };

  const insertLink = () => {
    if (!linkUrl || linkUrl === 'https://') { setShowLinkPopup(false); return; }
    editorRef.current?.focus();
    if (savedRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
    }
    document.execCommand('createLink', false, linkUrl);
    // Make link open in new tab
    editorRef.current?.querySelectorAll('a').forEach(a => {
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
    });
    setShowLinkPopup(false);
    setLinkUrl('https://');
    notify();
  };

  /* ── Blockquote ─────────────────────────────────────────── */
  const insertBlockquote = () => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, 'blockquote');
    notify();
  };

  const handleInput = useCallback(() => { notify(); }, [notify]);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // Close all pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.rte-color-popup') && !t.closest('.rte-color-trigger') && !t.closest('.rte-link-popup')) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
        setShowLinkPopup(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Fluent SVG icons ────────────────────────────────────── */
  const SvgAlignLeft   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/></svg>;
  const SvgAlignCenter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
  const SvgAlignRight  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="5" y1="18" x2="21" y2="18"/></svg>;
  const SvgJustify     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
  const SvgBulletList  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>;
  const SvgOrderedList = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><path d="M4 5v4" strokeWidth="1.6"/><path d="M3 9h2" strokeWidth="1.6"/><path d="M3 14h1.5a.5.5 0 0 1 0 1H3.5a.5.5 0 0 0 0 1H5" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 20h2l-2-2.5h2" strokeWidth="1.4" strokeLinejoin="round"/></svg>;
  const SvgIndent      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="3 9 7 12 3 15"/></svg>;
  const SvgOutdent     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7 9 3 12 7 15"/></svg>;
  const SvgUndo        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>;
  const SvgRedo        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>;
  const SvgEraser      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l11-11 7 7-1.5 1.5"/><path d="M6 17l-3-3"/></svg>;
  const SvgLink        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
  const SvgQuote       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.756 2.017 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.757 2.017 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>;

  /* ── Tool arrays ─────────────────────────────────────────── */
  const styleTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: <strong style={{ fontFamily: 'Georgia, serif', fontSize: '13px' }}>B</strong>, cmd: 'bold',         title: 'Bold (Ctrl+B)' },
    { label: <em    style={{ fontFamily: 'Georgia, serif', fontSize: '13px' }}>I</em>,     cmd: 'italic',       title: 'Italic (Ctrl+I)' },
    { label: <u     style={{ fontSize: '12px' }}>U</u>,                                    cmd: 'underline',    title: 'Underline (Ctrl+U)' },
    { label: <s     style={{ fontSize: '12px' }}>S</s>,                                    cmd: 'strikeThrough',title: 'Strikethrough' },
  ];

  const scriptTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: <span style={{ fontSize: '11px', lineHeight: 1 }}>x<sup style={{ fontSize: '8px' }}>2</sup></span>, cmd: 'superscript', title: 'Superscript' },
    { label: <span style={{ fontSize: '11px', lineHeight: 1 }}>x<sub style={{ fontSize: '8px' }}>2</sub></span>, cmd: 'subscript',   title: 'Subscript' },
  ];

  const alignTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: <SvgAlignLeft />,   cmd: 'justifyLeft',   title: 'Align Left' },
    { label: <SvgAlignCenter />, cmd: 'justifyCenter', title: 'Align Center' },
    { label: <SvgAlignRight />,  cmd: 'justifyRight',  title: 'Align Right' },
    { label: <SvgJustify />,     cmd: 'justifyFull',   title: 'Justify' },
  ];

  const listTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: <SvgBulletList />,  cmd: 'insertUnorderedList', title: 'Bullet List' },
    { label: <SvgOrderedList />, cmd: 'insertOrderedList',   title: 'Numbered List' },
    { label: <SvgIndent />,      cmd: 'indent',              title: 'Indent' },
    { label: <SvgOutdent />,     cmd: 'outdent',             title: 'Outdent' },
  ];

  const makeBtn = (t: { label: React.ReactNode; cmd: FormatCmd; title: string }) => (
    <button key={t.cmd} type="button" title={t.title}
      className={`rte-btn${isActive(t.cmd) ? ' rte-btn--active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); execFormat(t.cmd); }}>
      {t.label}
    </button>
  );

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">

        {/* ── Undo / Redo ── */}
        <div className="rte-group">
          <button type="button" title="Undo (Ctrl+Z)" className="rte-btn"
            onMouseDown={(e) => { e.preventDefault(); execFormat('undo'); }}>
            <SvgUndo />
          </button>
          <button type="button" title="Redo (Ctrl+Y)" className="rte-btn"
            onMouseDown={(e) => { e.preventDefault(); execFormat('redo'); }}>
            <SvgRedo />
          </button>
        </div>

        <div className="rte-divider" />

        {/* ── Style group ── */}
        <div className="rte-group">{styleTools.map(makeBtn)}</div>

        {/* ── Superscript / Subscript ── */}
        <div className="rte-group">{scriptTools.map(makeBtn)}</div>

        <div className="rte-divider" />

        {/* ── Font size ── */}
        <div className="rte-group">
          <label className="rte-select-label" title="Font size">
            <span className="rte-select-icon">Aa</span>
            <select className="rte-select" value={fontSize}
              onChange={(e) => applyFontSize(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}>
              {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="rte-divider" />

        {/* ── Color group ── */}
        <div className="rte-group">
          {/* Font color */}
          <div className="rte-color-wrap">
            <button type="button" title="Font color" className="rte-btn rte-color-trigger"
              onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(v => !v); setShowHighlightPicker(false); setShowLinkPopup(false); }}>
              <span className="rte-color-icon">A<span className="rte-color-bar" style={{ background: fontColor }} /></span>
            </button>
            {showColorPicker && (
              <div className="rte-color-popup">
                <div className="rte-color-label">Font Color</div>
                <div className="rte-color-swatches">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button"
                      className={`rte-swatch${fontColor === c ? ' rte-swatch--active' : ''}`}
                      style={{ background: c, border: c === '#ffffff' ? '1px solid #e2e8f0' : undefined }}
                      onMouseDown={(e) => { e.preventDefault(); applyColor(c); }} title={c} />
                  ))}
                </div>
                <input ref={fontColorRef} type="color" className="rte-color-custom"
                  value={fontColor} onChange={(e) => applyColor(e.target.value)} title="Custom color" />
              </div>
            )}
          </div>

          {/* Highlight color */}
          <div className="rte-color-wrap">
            <button type="button" title="Highlight color" className="rte-btn rte-color-trigger rte-btn--highlight"
              onMouseDown={(e) => { e.preventDefault(); setShowHighlightPicker(v => !v); setShowColorPicker(false); setShowLinkPopup(false); }}>
              <span className="rte-highlight-icon">
                <span className="rte-highlight-letter">A</span>
                <span className="rte-highlight-bar" style={{
                  background: highlightColor === 'transparent'
                    ? 'repeating-linear-gradient(45deg,#e2e8f0 0,#e2e8f0 2px,transparent 2px,transparent 6px)'
                    : highlightColor,
                }} />
              </span>
            </button>
            {showHighlightPicker && (
              <div className="rte-color-popup">
                <div className="rte-color-label">Highlight</div>
                <div className="rte-color-swatches">
                  {PRESET_HIGHLIGHTS.map(c => (
                    <button key={c} type="button"
                      className={`rte-swatch${highlightColor === c ? ' rte-swatch--active' : ''}`}
                      style={{ background: c === 'transparent' ? 'repeating-linear-gradient(45deg,#e2e8f0 0,#e2e8f0 2px,transparent 2px,transparent 6px)' : c, border: '1px solid #e2e8f0' }}
                      onMouseDown={(e) => { e.preventDefault(); applyHighlight(c); }}
                      title={c === 'transparent' ? 'No highlight' : c} />
                  ))}
                </div>
                <input ref={highlightRef} type="color" className="rte-color-custom"
                  value={highlightColor === 'transparent' ? '#fef08a' : highlightColor}
                  onChange={(e) => applyHighlight(e.target.value)} title="Custom highlight" />
              </div>
            )}
          </div>
        </div>

        <div className="rte-divider" />

        {/* ── Alignment group ── */}
        <div className="rte-group">{alignTools.map(makeBtn)}</div>

        <div className="rte-divider" />

        {/* ── List & indent group ── */}
        <div className="rte-group">{listTools.map(makeBtn)}</div>

        <div className="rte-divider" />

        {/* ── Insert group: Link, Blockquote, Clear formatting ── */}
        <div className="rte-group">
          {/* Link */}
          <div className="rte-color-wrap">
            <button type="button" title="Insert link" className="rte-btn rte-color-trigger"
              onMouseDown={(e) => { e.preventDefault(); openLinkPopup(); }}>
              <SvgLink />
            </button>
            {showLinkPopup && (
              <div className="rte-link-popup rte-color-popup">
                <div className="rte-color-label">Insert Link</div>
                <input
                  className="rte-link-input"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } if (e.key === 'Escape') setShowLinkPopup(false); }}
                  placeholder="https://"
                  autoFocus
                />
                <div className="rte-link-actions">
                  <button type="button" className="rte-link-btn-apply" onMouseDown={(e) => { e.preventDefault(); insertLink(); }}>Apply</button>
                  <button type="button" className="rte-link-btn-cancel" onMouseDown={(e) => { e.preventDefault(); setShowLinkPopup(false); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Blockquote */}
          <button type="button" title="Blockquote" className="rte-btn"
            onMouseDown={(e) => { e.preventDefault(); insertBlockquote(); }}>
            <SvgQuote />
          </button>

          {/* Clear formatting */}
          <button type="button" title="Clear formatting" className="rte-btn"
            onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat'); }}>
            <SvgEraser />
          </button>
        </div>

      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="rte-editor"
        data-placeholder={placeholder}
        onInput={handleInput}
        spellCheck
      />
    </div>
  );
};

export default RichTextEditor;
