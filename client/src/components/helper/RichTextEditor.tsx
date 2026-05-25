import React, { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editorKey?: string; // change to force re-mount on edit
}

type FormatCmd =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'strikeThrough';

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = 'Write your comment here…',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const execFormat = useCallback((cmd: FormatCmd) => {
    document.execCommand(cmd, false, undefined);
    editorRef.current?.focus();
    onChange?.(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  const handleInput = useCallback(() => {
    onChange?.(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const tools: { label: string; icon: React.ReactNode; cmd: FormatCmd; title: string }[] = [
    { label: 'B',  icon: <strong>B</strong>,  cmd: 'bold',                title: 'Bold (Ctrl+B)' },
    { label: 'I',  icon: <em>I</em>,          cmd: 'italic',              title: 'Italic (Ctrl+I)' },
    { label: 'U',  icon: <u>U</u>,            cmd: 'underline',           title: 'Underline (Ctrl+U)' },
    { label: 'S',  icon: <s>S</s>,            cmd: 'strikeThrough',       title: 'Strikethrough' },
    { label: '•',  icon: <>• List</>,          cmd: 'insertUnorderedList', title: 'Bullet List' },
    { label: '1.', icon: <>1. List</>,         cmd: 'insertOrderedList',   title: 'Numbered List' },
  ];

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
        {tools.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.title}
            className={`rte-btn${isActive(t.cmd) ? ' rte-btn--active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault(); // keep editor focus
              execFormat(t.cmd);
            }}
          >
            {t.icon}
          </button>
        ))}
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
