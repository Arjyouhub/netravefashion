import React, { useRef, useEffect, useState } from 'react';

export default function RichTextEditor({ value = '', onChange, placeholder = 'Write rich product description...' }) {
    const editorRef = useRef(null);
    const [mode, setMode] = useState('visual'); // 'visual' | 'code'

    // Sync external value to contentEditable ONLY when not actively focused
    useEffect(() => {
        if (mode === 'visual' && editorRef.current) {
            if (document.activeElement === editorRef.current) return;
            const currentHtml = editorRef.current.innerHTML;
            const targetVal = value || '';
            if (currentHtml !== targetVal) {
                editorRef.current.innerHTML = targetVal;
            }
        }
    }, [value, mode]);

    const handleInput = () => {
        if (!editorRef.current || !onChange) return;
        const html = editorRef.current.innerHTML;
        // Clean out empty browser artifacts
        const isBlank = !html || html === '<br>' || html === '<p><br></p>' || html.trim() === '';
        onChange(isBlank ? '' : html);
    };

    const executeCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current && onChange) {
            const html = editorRef.current.innerHTML;
            const isBlank = !html || html === '<br>' || html === '<p><br></p>' || html.trim() === '';
            onChange(isBlank ? '' : html);
        }
        editorRef.current?.focus();
    };

    const handleInsertLink = () => {
        const url = prompt('Enter destination URL (e.g. https://...):');
        if (url) {
            executeCommand('createLink', url);
        }
    };

    const handleInsertImage = () => {
        const url = prompt('Enter direct image URL:');
        if (url) {
            executeCommand('insertImage', url);
        }
    };

    return (
        <div className="rich-editor-container" style={{
            background: '#0d111a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        }}>
            {/* Formatting Toolbar */}
            <div className="rich-editor-toolbar" style={{
                background: '#131826',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => executeCommand('formatBlock', '<h2>')}
                        title="Heading 2"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => executeCommand('formatBlock', '<h3>')}
                        title="Heading 3"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        H3
                    </button>
                    <button
                        type="button"
                        onClick={() => executeCommand('formatBlock', '<p>')}
                        title="Paragraph"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        ¶
                    </button>
                    <div style={separatorStyle} />
                    <button
                        type="button"
                        onClick={() => executeCommand('bold')}
                        title="Bold"
                        disabled={mode === 'code'}
                        style={{ ...toolbarBtnStyle, fontWeight: '900' }}
                    >
                        B
                    </button>
                    <button
                        type="button"
                        onClick={() => executeCommand('italic')}
                        title="Italic"
                        disabled={mode === 'code'}
                        style={{ ...toolbarBtnStyle, fontStyle: 'italic' }}
                    >
                        I
                    </button>
                    <button
                        type="button"
                        onClick={() => executeCommand('underline')}
                        title="Underline"
                        disabled={mode === 'code'}
                        style={{ ...toolbarBtnStyle, textDecoration: 'underline' }}
                    >
                        U
                    </button>
                    <div style={separatorStyle} />
                    <button
                        type="button"
                        onClick={() => executeCommand('insertUnorderedList')}
                        title="Bullet List"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        • List
                    </button>
                    <button
                        type="button"
                        onClick={() => executeCommand('insertOrderedList')}
                        title="Numbered List"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        1. List
                    </button>
                    <div style={separatorStyle} />
                    <button
                        type="button"
                        onClick={handleInsertLink}
                        title="Insert Link"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        🔗 Link
                    </button>
                    <button
                        type="button"
                        onClick={handleInsertImage}
                        title="Insert Image"
                        disabled={mode === 'code'}
                        style={toolbarBtnStyle}
                    >
                        🖼️ Image
                    </button>
                    <button
                        type="button"
                        onClick={() => executeCommand('removeFormat')}
                        title="Clear Formatting"
                        disabled={mode === 'code'}
                        style={{ ...toolbarBtnStyle, color: '#f87171' }}
                    >
                        🧹 Clear
                    </button>
                </div>

                {/* Mode Switcher: Visual vs Raw Text */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        type="button"
                        onClick={() => setMode('visual')}
                        style={{
                            ...toolbarBtnStyle,
                            background: mode === 'visual' ? 'var(--primary, #f59e0b)' : '#1c2234',
                            color: mode === 'visual' ? '#000' : '#cbd5e1',
                            fontWeight: '700'
                        }}
                        title="Rich Visual Editor"
                    >
                        Visual
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('code')}
                        style={{
                            ...toolbarBtnStyle,
                            background: mode === 'code' ? 'var(--primary, #f59e0b)' : '#1c2234',
                            color: mode === 'code' ? '#000' : '#cbd5e1',
                            fontWeight: '700'
                        }}
                        title="Plain / HTML Text Editor"
                    >
                        Text/HTML
                    </button>
                </div>
            </div>

            {/* Editable Content Area */}
            {mode === 'visual' ? (
                <div style={{ position: 'relative' }}>
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        onBlur={handleInput}
                        className="rich-editor-content"
                        style={{
                            minHeight: '140px',
                            maxHeight: '320px',
                            overflowY: 'auto',
                            padding: '12px 14px',
                            color: '#e2e8f0',
                            fontSize: '13.5px',
                            lineHeight: '1.6',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                    {(!value || value === '<br>' || value === '<p><br></p>') && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '12px',
                                left: '14px',
                                color: '#64748b',
                                fontSize: '13.5px',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        >
                            {placeholder}
                        </div>
                    )}
                </div>
            ) : (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={6}
                    style={{
                        width: '100%',
                        minHeight: '140px',
                        maxHeight: '320px',
                        padding: '12px 14px',
                        background: '#0a0d14',
                        color: '#f1f5f9',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        lineHeight: '1.6',
                        border: 'none',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            )}
        </div>
    );
}

const toolbarBtnStyle = {
    background: '#1c2234',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
};

const separatorStyle = {
    width: '1px',
    height: '18px',
    background: 'rgba(255, 255, 255, 0.12)',
    margin: '0 4px'
};
