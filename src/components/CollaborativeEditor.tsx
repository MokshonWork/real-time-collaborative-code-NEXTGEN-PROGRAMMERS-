import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type * as Monaco from 'monaco-editor';

interface RemoteCursor {
  odceKey: string;
  name: string;
  color: string;
  position: { lineNumber: number; column: number } | null;
  isTyping: boolean;
}

interface CollaborativeEditorProps {
  sessionId: string;
  odce: string;
  userName: string;
  userColor: string;
  fileName: string;
  fileContent: string;
  language: string;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  onContentChange?: (content: string) => void;
  onActivity?: (type: string, details: any) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  userName,
  userColor,
  fileName,
  fileContent,
  language,
  ydoc,
  provider,
  onContentChange,
  onActivity
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const cursorWidgetsRef = useRef<Map<string, Monaco.editor.IContentWidget>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getYText = useCallback(() => {
    return ydoc.getText(`file:${fileName}`);
  }, [ydoc, fileName]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Bind Y.js
    const ytext = getYText();
    if (ytext.length === 0 && fileContent) {
      ytext.insert(0, fileContent);
    }

    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    const awareness = provider.awareness;

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      awareness.setLocalStateField('cursor', {
        position: { lineNumber: e.position.lineNumber, column: e.position.column }
      });
    });

    // Track typing
    editor.onDidChangeModelContent((e) => {
      awareness.setLocalStateField('isTyping', true);
      awareness.setLocalStateField('typingTime', Date.now());
      awareness.setLocalStateField('typingFile', fileName);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        awareness.setLocalStateField('isTyping', false);
      }, 1500);

      if (onContentChange) onContentChange(editor.getValue());

      if (onActivity && e.changes.length > 0) {
        const change = e.changes[0];
        onActivity('edit', {
          fileName,
          lineStart: change.range.startLineNumber,
          lineEnd: change.range.endLineNumber,
          added: change.text.length,
          removed: change.rangeLength,
          preview: change.text.substring(0, 50)
        });
      }
    });
  };

  // Handle remote cursors
  useEffect(() => {
    const awareness = provider.awareness;

    const updateRemoteCursors = () => {
      const states = awareness.getStates();
      const newCursors = new Map<string, RemoteCursor>();

      states.forEach((state: any, clientId: number) => {
        if (clientId === awareness.clientID) return;
        
        if (state.user && state.cursor) {
          newCursors.set(clientId.toString(), {
            odceKey: clientId.toString(),
            name: state.user.name,
            color: state.user.color,
            position: state.cursor?.position || null,
            isTyping: state.isTyping || false
          });
        }
      });

      setRemoteCursors(newCursors);
    };

    awareness.on('change', updateRemoteCursors);
    updateRemoteCursors();

    return () => {
      awareness.off('change', updateRemoteCursors);
    };
  }, [provider]);

  // Render cursor widgets
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;

    // Clear old widgets
    cursorWidgetsRef.current.forEach(widget => {
      editor.removeContentWidget(widget);
    });
    cursorWidgetsRef.current.clear();

    remoteCursors.forEach((cursor, odceKey) => {
      if (!cursor.position) return;

      const { lineNumber, column } = cursor.position;
      const widgetId = `cursor-widget-${odceKey}`;

      const widget: Monaco.editor.IContentWidget = {
        getId: () => widgetId,
        getDomNode: () => {
          let domNode = document.getElementById(widgetId);
          if (!domNode) {
            domNode = document.createElement('div');
            domNode.id = widgetId;
            domNode.style.cssText = `
              background: ${cursor.color};
              color: white;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 600;
              white-space: nowrap;
              pointer-events: none;
              z-index: 1000;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              gap: 4px;
              margin-top: -22px;
              margin-left: 2px;
              ${cursor.isTyping ? 'animation: cursorPulse 1s ease-in-out infinite;' : ''}
            `;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = cursor.name;
            domNode.appendChild(nameSpan);

            if (cursor.isTyping) {
              const dots = document.createElement('span');
              dots.innerHTML = '<span style="animation: typingDot 1.4s infinite;">.</span><span style="animation: typingDot 1.4s infinite 0.2s;">.</span><span style="animation: typingDot 1.4s infinite 0.4s;">.</span>';
              domNode.appendChild(dots);
            }
          }
          return domNode;
        },
        getPosition: () => ({
          position: { lineNumber, column },
          preference: [0, 1] // ABOVE, BELOW
        })
      };

      editor.addContentWidget(widget);
      cursorWidgetsRef.current.set(odceKey, widget);
    });

    // Inject animations
    let styleEl = document.getElementById('cursor-animations');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'cursor-animations';
      styleEl.textContent = `
        @keyframes cursorPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes typingDot {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, [remoteCursors]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (bindingRef.current) bindingRef.current.destroy();
      cursorWidgetsRef.current.forEach(widget => {
        editorRef.current?.removeContentWidget(widget);
      });
    };
  }, []);

  return (
    <div className="collaborative-editor">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          padding: { top: 10 },
          wordWrap: 'on',
          tabSize: 2,
          folding: true,
          matchBrackets: 'always',
          quickSuggestions: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#007acc] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading editor...</p>
            </div>
          </div>
        }
      />
      
      {/* Typing overlay */}
      <div className="typing-overlay">
        {Array.from(remoteCursors.values())
          .filter(c => c.isTyping)
          .map(cursor => (
            <div 
              key={cursor.odceKey}
              className="typing-badge"
              style={{ background: cursor.color }}
            >
              <span className="typing-name">{cursor.name}</span>
              <span className="typing-text">is typing</span>
              <span className="typing-dots-inline">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
};
