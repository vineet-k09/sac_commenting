import React, { useRef, useEffect, useCallback, useState } from 'react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

type FormatCmd =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'indent'
  | 'outdent';

const FONT_SIZES = [
  { label: 'XS',  value: '1' },
  { label: 'S',   value: '2' },
  { label: 'M',   value: '3' },
  { label: 'L',   value: '4' },
  { label: 'XL',  value: '5' },
  { label: 'XXL', value: '6' },
  { label: '3XL', value: '7' },
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
  const editorRef      = useRef<HTMLDivElement>(null);
  const fontColorRef   = useRef<HTMLInputElement>(null);
  const highlightRef   = useRef<HTMLInputElement>(null);

  const [showColorPicker, setShowColorPicker]     = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [fontSize, setFontSize]                   = useState('3');
  const [fontColor, setFontColor]                 = useState('#000000');
  const [highlightColor, setHighlightColor]       = useState('transparent');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
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
    if (color === 'transparent') {
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      document.execCommand('hiliteColor', false, color);
    }
    notify();
  }, [notify]);

  const handleInput = useCallback(() => { notify(); }, [notify]);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.rte-color-popup') && !t.closest('.rte-color-trigger')) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const styleTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: <strong>B</strong>,  cmd: 'bold',         title: 'Bold (Ctrl+B)' },
    { label: <em>I</em>,          cmd: 'italic',        title: 'Italic (Ctrl+I)' },
    { label: <u>U</u>,            cmd: 'underline',     title: 'Underline (Ctrl+U)' },
    { label: <s>S</s>,            cmd: 'strikeThrough', title: 'Strikethrough' },
  ];

  const alignTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: '⬛L', cmd: 'justifyLeft',   title: 'Align Left' },
    { label: '⬛C', cmd: 'justifyCenter', title: 'Align Center' },
    { label: '⬛R', cmd: 'justifyRight',  title: 'Align Right' },
    { label: '⬛J', cmd: 'justifyFull',   title: 'Justify' },
  ];

  const listTools: { label: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: '• List', cmd: 'insertUnorderedList', title: 'Bullet List' },
    { label: '1. List', cmd: 'insertOrderedList',  title: 'Numbered List' },
    { label: '→ In',   cmd: 'indent',              title: 'Indent' },
    { label: '← Out',  cmd: 'outdent',             title: 'Outdent' },
  ];

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">

        {/* ── Style group ── */}
        <div className="rte-group">
          {styleTools.map((t) => (
            <button
              key={t.cmd}
              type="button"
              title={t.title}
              className={`rte-btn${isActive(t.cmd) ? ' rte-btn--active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); execFormat(t.cmd); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rte-divider" />

        {/* ── Font size group ── */}
        <div className="rte-group">
          <label className="rte-select-label" title="Font size">
            <span className="rte-select-icon">Aa</span>
            <select
              className="rte-select"
              value={fontSize}
              onChange={(e) => applyFontSize(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {FONT_SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rte-divider" />

        {/* ── Color group ── */}
        <div className="rte-group">
          {/* Font color */}
          <div className="rte-color-wrap">
            <button
              type="button"
              title="Font color"
              className="rte-btn rte-color-trigger"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowColorPicker(v => !v);
                setShowHighlightPicker(false);
              }}
            >
              <span className="rte-color-icon">
                A
                <span className="rte-color-bar" style={{ background: fontColor }} />
              </span>
            </button>
            {showColorPicker && (
              <div className="rte-color-popup">
                <div className="rte-color-label">Font Color</div>
                <div className="rte-color-swatches">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`rte-swatch${fontColor === c ? ' rte-swatch--active' : ''}`}
                      style={{ background: c, border: c === '#ffffff' ? '1px solid #e2e8f0' : undefined }}
                      onMouseDown={(e) => { e.preventDefault(); applyColor(c); }}
                      title={c}
                    />
                  ))}
                </div>
                <input
                  ref={fontColorRef}
                  type="color"
                  className="rte-color-custom"
                  value={fontColor}
                  onChange={(e) => applyColor(e.target.value)}
                  title="Custom color"
                />
              </div>
            )}
          </div>

          {/* Highlight color */}
          <div className="rte-color-wrap">
            <button
              type="button"
              title="Highlight color"
              className="rte-btn rte-color-trigger"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlightPicker(v => !v);
                setShowColorPicker(false);
              }}
            >
              <span className="rte-color-icon">
                🖊️
                <span className="rte-color-bar" style={{
                  background: highlightColor === 'transparent' ? 'repeating-linear-gradient(45deg,#e2e8f0 0,#e2e8f0 2px,transparent 2px,transparent 6px)' : highlightColor
                }} />
              </span>
            </button>
            {showHighlightPicker && (
              <div className="rte-color-popup">
                <div className="rte-color-label">Highlight</div>
                <div className="rte-color-swatches">
                  {PRESET_HIGHLIGHTS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`rte-swatch${highlightColor === c ? ' rte-swatch--active' : ''}`}
                      style={{
                        background: c === 'transparent'
                          ? 'repeating-linear-gradient(45deg,#e2e8f0 0,#e2e8f0 2px,transparent 2px,transparent 6px)'
                          : c,
                        border: '1px solid #e2e8f0',
                      }}
                      onMouseDown={(e) => { e.preventDefault(); applyHighlight(c); }}
                      title={c === 'transparent' ? 'No highlight' : c}
                    />
                  ))}
                </div>
                <input
                  ref={highlightRef}
                  type="color"
                  className="rte-color-custom"
                  value={highlightColor === 'transparent' ? '#fef08a' : highlightColor}
                  onChange={(e) => applyHighlight(e.target.value)}
                  title="Custom highlight"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rte-divider" />

        {/* ── Alignment group ── */}
        <div className="rte-group">
          {alignTools.map((t) => (
            <button
              key={t.cmd}
              type="button"
              title={t.title}
              className={`rte-btn${isActive(t.cmd) ? ' rte-btn--active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); execFormat(t.cmd); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rte-divider" />

        {/* ── List & indent group ── */}
        <div className="rte-group">
          {listTools.map((t) => (
            <button
              key={t.cmd}
              type="button"
              title={t.title}
              className={`rte-btn${isActive(t.cmd) ? ' rte-btn--active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); execFormat(t.cmd); }}
            >
              {t.label}
            </button>
          ))}
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
