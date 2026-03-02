import React, { useState, useRef, useEffect } from 'react';
import { TerminalLine, User } from '../types/collaboration';

interface TerminalProps {
  lines: TerminalLine[];
  onCommand: (command: string) => void;
  currentUser: User | null;
  isConnected: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  onCommand,
  currentUser,
  isConnected,
}) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    onCommand(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onCommand('clear');
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'system': return 'text-blue-400';
      case 'input': return 'text-green-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-[#3c3c3c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-300 text-xs font-medium">TERMINAL</span>
          </div>
          {isConnected && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Synced
            </span>
          )}
        </div>
        <button
          onClick={() => onCommand('clear')}
          className="p-1 hover:bg-[#3c3c3c] rounded text-gray-400 hover:text-white transition-colors"
          title="Clear (Ctrl+L)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 space-y-0.5"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.length === 0 && (
          <div className="text-gray-500 text-xs space-y-1">
            <p className="text-gray-400">Welcome to CollabIDE Terminal (shared between all users)</p>
            <p>Type <span className="text-blue-400">help</span> for available commands</p>
            <p>Type <span className="text-blue-400">run main.js</span> to execute a file</p>
          </div>
        )}

        {lines.map((line) => (
          <div key={line.id} className="flex items-start gap-1 leading-5">
            {line.type === 'input' && (
              <span className="text-green-400 flex-shrink-0">
                <span className="text-gray-500">{line.userName || 'user'}</span>
                <span className="text-gray-600">@collab</span>
                <span className="text-blue-400">:~</span>$ {' '}
              </span>
            )}
            <span className={`${getLineColor(line.type)} whitespace-pre-wrap break-all`}>
              {line.type === 'input' ? line.content : line.content}
            </span>
          </div>
        ))}
      </div>

      {/* Terminal Input */}
      <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 bg-[#1a1a1a] border-t border-[#333] flex-shrink-0">
        <span className="text-green-400 mr-1 flex-shrink-0 text-xs">
          <span className="text-gray-500">{currentUser?.name || 'user'}</span>
          <span className="text-gray-600">@collab</span>
          <span className="text-blue-400">:~</span>$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-gray-300 font-mono ml-1"
          placeholder="Type a command..."
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
};
