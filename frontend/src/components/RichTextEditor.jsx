import React, { useRef, useEffect } from 'react';

export default function RichTextEditor({ value, onChange, placeholder = 'Write rich product description...' }) {
    const editorRef = useRef(null);

    // Sync external value to contentEditable when value prop changes externally
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const executeCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
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
                alignItems: 'center'
            }}>
                <button
                    type="button"
                    onClick={() => executeCommand('formatBlock', '<h2>')}
                    title="Heading 2"
                    style={toolbarBtnStyle}
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('formatBlock', '<h3>')}
                    title="Heading 3"
                    style={toolbarBtnStyle}
                >
                    H3
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('formatBlock', '<p>')}
                    title="Paragraph"
                    style={toolbarBtnStyle}
                >
                    ¶
                </button>
                <div style={separatorStyle} />
                <button
                    type="button"
                    onClick={() => executeCommand('bold')}
                    title="Bold"
                    style={{ ...toolbarBtnStyle, fontWeight: '900' }}
                >
                    B
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('italic')}
                    title="Italic"
                    style={{ ...toolbarBtnStyle, fontStyle: 'italic' }}
                >
                    I
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('underline')}
                    title="Underline"
                    style={{ ...toolbarBtnStyle, textDecoration: 'underline' }}
                >
                    U
                </button>
                <div style={separatorStyle} />
                <button
                    type="button"
                    onClick={() => executeCommand('insertUnorderedList')}
                    title="Bullet List"
                    style={toolbarBtnStyle}
                >
                    • List
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('insertOrderedList')}
                    title="Numbered List"
                    style={toolbarBtnStyle}
                >
                    1. List
                </button>
                <div style={separatorStyle} />
                <button
                    type="button"
                    onClick={handleInsertLink}
                    title="Insert Link"
                    style={toolbarBtnStyle}
                >
                    🔗 Link
                </button>
                <button
                    type="button"
                    onClick={handleInsertImage}
                    title="Insert Image"
                    style={toolbarBtnStyle}
                >
                    🖼️ Image
                </button>
                <button
                    type="button"
                    onClick={() => executeCommand('removeFormat')}
                    title="Clear Formatting"
                    style={{ ...toolbarBtnStyle, color: '#f87171' }}
                >
                    🧹 Clear
                </button>
            </div>

            {/* Editable Content Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="rich-editor-content"
                data-placeholder={placeholder}
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
