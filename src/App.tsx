import { useState, useCallback, useRef } from 'react';
import { useCollaboration } from './hooks/useCollaboration';
import { SessionJoinModal } from './components/SessionJoinModal';
import { CollaborativeEditor } from './components/CollaborativeEditor';
import { Terminal } from './components/Terminal';
import { Chat } from './components/Chat';
import { FileExplorer } from './components/FileExplorer';
import { UserPresence } from './components/UserPresence';
import { ActivityLog } from './components/ActivityLog';
import { VoiceChat } from './components/VoiceChat';
import { FileNode } from './types/collaboration';

const defaultFiles: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'main.js', name: 'main.js', type: 'file', language: 'javascript' },
      { id: 'styles.css', name: 'styles.css', type: 'file', language: 'css' },
    ],
  },
  { id: 'index.html', name: 'index.html', type: 'file', language: 'html' },
  { id: 'README.md', name: 'README.md', type: 'file', language: 'markdown' },
];

function App() {
  const collaboration = useCollaboration();
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [openTabs, setOpenTabs] = useState<FileNode[]>([]);
  const [files, setFiles] = useState<FileNode[]>(defaultFiles);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [chatWidth, setChatWidth] = useState(300);
  const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
  const [sidebarActivityHeight, setSidebarActivityHeight] = useState(280);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [urlSessionId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session') || '';
  });

  const handleJoinSession = useCallback((sessionId: string, userName: string) => {
    collaboration.joinSession(sessionId, userName);
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({}, '', url.toString());
  }, [collaboration]);

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file);
      if (!openTabs.find(t => t.id === file.id)) {
        setOpenTabs(prev => [...prev, file]);
      }
      collaboration.updateCursor({ lineNumber: 1, column: 1, fileName: file.name });
      collaboration.addActivity({
        fileName: file.name,
        action: 'open',
        details: `Opened ${file.name}`,
      });
    }
  }, [openTabs, collaboration]);

  const handleCloseTab = useCallback((fileId: string) => {
    setOpenTabs(prev => {
      const remaining = prev.filter(t => t.id !== fileId);
      if (activeFile?.id === fileId) {
        setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
      }
      return remaining;
    });
  }, [activeFile]);

  const handleCreateFile = useCallback((name: string, type: 'file' | 'folder') => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
    };
    const newFile: FileNode = {
      id: name,
      name,
      type,
      language: type === 'file' ? (langMap[ext] || 'plaintext') : undefined,
      children: type === 'folder' ? [] : undefined,
    };
    setFiles(prev => [...prev, newFile]);
    if (type === 'file') {
      collaboration.addFile(name, '');
      collaboration.addActivity({
        fileName: name,
        action: 'create',
        details: `Created new ${type}: ${name}`,
      });
    }
  }, [collaboration]);

  const handleDeleteFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setOpenTabs(prev => prev.filter(t => t.id !== fileId));
    if (activeFile?.id === fileId) {
      setActiveFile(null);
    }
    collaboration.deleteFile(fileId);
    if (file) {
      collaboration.addActivity({
        fileName: file.name,
        action: 'delete',
        details: `Deleted ${file.name}`,
      });
    }
  }, [activeFile, files, collaboration]);

  // Handle typing state changes from editor
  const handleTypingChange = useCallback((isTyping: boolean) => {
    collaboration.setTypingState(isTyping, activeFile?.name);
  }, [collaboration, activeFile]);

  // Handle edit activity from editor
  const handleEditActivity = useCallback((type: string, details: {
    fileName: string;
    lineStart: number;
    lineEnd: number;
    added: number;
    removed: number;
    preview: string;
  }) => {
    collaboration.addActivity({
      fileName: details.fileName,
      action: type as 'edit',
      lineInfo: details.lineStart === details.lineEnd 
        ? `Line ${details.lineStart}` 
        : `Lines ${details.lineStart}-${details.lineEnd}`,
      details: `+${details.added} chars${details.removed > 0 ? `, -${details.removed} chars` : ''}`,
      preview: details.preview,
    });
    
    // Also update typing state
    handleTypingChange(true);
  }, [collaboration, handleTypingChange]);

  // Terminal command handler
  const handleTerminalCommand = useCallback((command: string) => {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'clear') {
      collaboration.clearTerminal();
      return;
    }

    collaboration.addTerminalLine({ type: 'input', content: command });

    switch (cmd) {
      case 'help':
        collaboration.addTerminalLine({
          type: 'system',
          content: `Available commands:
  run <file>    - Execute JavaScript file
  eval <code>   - Evaluate JavaScript expression
  clear         - Clear terminal
  ls            - List files
  cat <file>    - Show file contents
  echo <text>   - Print text
  date          - Show current date/time
  whoami        - Show current user
  users         - Show connected users
  session       - Show session info
  help          - Show this help`,
        });
        break;

      case 'ls': {
        const flatFiles = (nodes: FileNode[], prefix = ''): string[] => {
          const result: string[] = [];
          for (const node of nodes) {
            if (node.type === 'folder') {
              result.push(`📁 ${prefix}${node.name}/`);
              if (node.children) {
                result.push(...flatFiles(node.children, prefix + '  '));
              }
            } else {
              result.push(`📄 ${prefix}${node.name}`);
            }
          }
          return result;
        };
        collaboration.addTerminalLine({ type: 'output', content: flatFiles(files).join('\n') });
        break;
      }

      case 'cat':
        if (args.length > 0) {
          const content = collaboration.getFileContent(args[0]);
          if (content) {
            collaboration.addTerminalLine({ type: 'output', content });
          } else {
            collaboration.addTerminalLine({ type: 'error', content: `File not found: ${args[0]}` });
          }
        } else {
          collaboration.addTerminalLine({ type: 'error', content: 'Usage: cat <filename>' });
        }
        break;

      case 'echo':
        collaboration.addTerminalLine({ type: 'output', content: args.join(' ') });
        break;

      case 'date':
        collaboration.addTerminalLine({ type: 'output', content: new Date().toString() });
        break;

      case 'whoami':
        collaboration.addTerminalLine({
          type: 'output',
          content: collaboration.currentUser?.name || 'Unknown user',
        });
        break;

      case 'users': {
        const userList = collaboration.users.map(u =>
          `${u.id === collaboration.currentUser?.id ? '→ ' : '  '}${u.name} ${u.id === collaboration.currentUser?.id ? '(you)' : ''} ${u.activeFile ? `- editing ${u.activeFile}` : ''}${u.isTyping ? ' [typing...]' : ''}`
        ).join('\n');
        collaboration.addTerminalLine({
          type: 'output',
          content: `Connected users (${collaboration.users.length}):\n${userList}`,
        });
        break;
      }

      case 'session':
        collaboration.addTerminalLine({
          type: 'system',
          content: `Session ID: ${collaboration.sessionId}\nUsers online: ${collaboration.users.length}\nConnection: ${collaboration.isConnected ? '✓ Connected' : '✗ Disconnected'}\nShare link: ${window.location.href}`,
        });
        break;

      case 'run':
        if (args.length > 0) {
          const fileContent = collaboration.getFileContent(args[0]);
          if (fileContent) {
            try {
              const logs: string[] = [];
              const mockConsole = {
                log: (...a: unknown[]) => logs.push(a.map(v => typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)).join(' ')),
                error: (...a: unknown[]) => logs.push(`[ERROR] ${a.map(String).join(' ')}`),
                warn: (...a: unknown[]) => logs.push(`[WARN] ${a.map(String).join(' ')}`),
                info: (...a: unknown[]) => logs.push(`[INFO] ${a.map(String).join(' ')}`),
                table: (d: unknown) => logs.push(JSON.stringify(d, null, 2)),
              };
              const fn = new Function('console', fileContent);
              const result = fn(mockConsole);
              if (logs.length > 0) {
                collaboration.addTerminalLine({ type: 'output', content: logs.join('\n') });
              }
              if (result !== undefined) {
                collaboration.addTerminalLine({ type: 'output', content: `→ ${JSON.stringify(result)}` });
              }
              collaboration.addTerminalLine({ type: 'system', content: `✓ ${args[0]} executed successfully` });
              collaboration.addActivity({
                fileName: args[0],
                action: 'run',
                details: `Executed ${args[0]} successfully`,
              });
            } catch (error) {
              collaboration.addTerminalLine({
                type: 'error',
                content: `Runtime error: ${error instanceof Error ? error.message : String(error)}`,
              });
              collaboration.addActivity({
                fileName: args[0],
                action: 'run',
                details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              });
            }
          } else {
            collaboration.addTerminalLine({ type: 'error', content: `File not found: ${args[0]}` });
          }
        } else {
          collaboration.addTerminalLine({ type: 'error', content: 'Usage: run <filename>' });
        }
        break;

      case 'eval':
        if (args.length > 0) {
          try {
            const logs: string[] = [];
            const mockConsole = {
              log: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
              error: (...a: unknown[]) => logs.push(`[ERROR] ${a.map(String).join(' ')}`),
              warn: (...a: unknown[]) => logs.push(`[WARN] ${a.map(String).join(' ')}`),
            };
            const code = args.join(' ');
            const fn = new Function('console', `return (${code})`);
            const result = fn(mockConsole);
            if (logs.length > 0) {
              collaboration.addTerminalLine({ type: 'output', content: logs.join('\n') });
            }
            collaboration.addTerminalLine({
              type: 'output',
              content: result !== undefined ? String(result) : 'undefined',
            });
          } catch (error) {
            collaboration.addTerminalLine({
              type: 'error',
              content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        } else {
          collaboration.addTerminalLine({ type: 'error', content: 'Usage: eval <expression>' });
        }
        break;

      case 'node':
        if (args.length > 0) {
          handleTerminalCommand(`run ${args.join(' ')}`);
          return;
        }
        collaboration.addTerminalLine({ type: 'error', content: 'Usage: node <filename>' });
        break;

      default:
        collaboration.addTerminalLine({
          type: 'error',
          content: `Command not found: ${cmd}. Type 'help' for available commands.`,
        });
    }
  }, [collaboration, files]);

  // If not in a session, show join modal
  if (!collaboration.sessionId) {
    return <SessionJoinModal onJoin={handleJoinSession} initialSessionId={urlSessionId} />;
  }

  const ydoc = collaboration.getYDoc();
  const provider = collaboration.getProvider();

  // Get typing users
  const typingUsers = collaboration.users.filter(u => u.isTyping);

  // Count edits by current user
  const myEdits = collaboration.activityLog.filter(
    a => a.userId === collaboration.currentUser?.id && a.action === 'edit'
  ).length;
  const otherEdits = collaboration.activityLog.filter(
    a => a.userId !== collaboration.currentUser?.id && a.action === 'edit'
  ).length;

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden select-none">
      {/* Title Bar */}
      <div className="h-9 bg-[#323233] flex items-center justify-between px-4 border-b border-[#1e1e1e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#007acc]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.17 2.06A13.1 13.1 0 0 0 19 1.87a12.94 12.94 0 0 0-7 2.05 12.94 12.94 0 0 0-7-2 13.1 13.1 0 0 0-2.17.19 1 1 0 0 0-.83 1v12a1 1 0 0 0 1.17 1 10.9 10.9 0 0 1 8.25 1.91l.58.37.58-.37A10.9 10.9 0 0 1 21 16.11a1 1 0 0 0 1-1V3.11a1 1 0 0 0-.83-1.05z"/>
          </svg>
          <span className="text-sm font-medium">CollabIDE</span>
          {typingUsers.filter(u => u.id !== collaboration.currentUser?.id).length > 0 && (
            <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">
                {typingUsers.filter(u => u.id !== collaboration.currentUser?.id).map(u => u.name).join(', ')} typing...
              </span>
            </div>
          )}
        </div>

        <UserPresence
          users={collaboration.users}
          currentUser={collaboration.currentUser}
          sessionId={collaboration.sessionId}
        />

        <div className="flex items-center gap-1">
          {/* Voice Chat Button */}
          {provider && collaboration.currentUser && (
            <VoiceChat
              sessionId={collaboration.sessionId}
              odce={collaboration.currentUser.id}
              userName={collaboration.currentUser.name}
              userColor={collaboration.currentUser.color}
              awareness={provider.awareness}
            />
          )}
          <div className="w-px h-5 bg-[#3c3c3c] mx-1" />
          <button
            onClick={() => setShowChat(v => !v)}
            className={`p-1.5 rounded transition-colors ${showChat ? 'bg-[#094771] text-white' : 'text-gray-400 hover:bg-[#3c3c3c]'}`}
            title="Toggle Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={() => setShowTerminal(v => !v)}
            className={`p-1.5 rounded transition-colors ${showTerminal ? 'bg-[#094771] text-white' : 'text-gray-400 hover:bg-[#3c3c3c]'}`}
            title="Toggle Terminal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <div className="w-px h-5 bg-[#3c3c3c] mx-1" />
          <button
            onClick={() => collaboration.leaveSession()}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400"
            title="Leave Session"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-2 border-r border-[#1e1e1e] flex-shrink-0">
          <button className="p-2 text-white bg-[#1e1e1e] rounded mb-1" title="Explorer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-white" title="Search">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="flex-1" />
          {/* Online users count */}
          <div className="relative p-2 text-gray-500" title={`${collaboration.users.length} users online`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#007acc] rounded-full text-[9px] flex items-center justify-center text-white font-bold">
              {collaboration.users.length}
            </span>
          </div>
          <button className="p-2 text-gray-500 hover:text-white" title="Settings">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Sidebar: Explorer + Activity Log */}
        <div
          ref={sidebarRef}
          className="bg-[#252526] border-r border-[#1e1e1e] flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          {/* File Explorer - top portion */}
          <div className="flex-1 min-h-[120px] overflow-hidden" style={{ height: `calc(100% - ${sidebarActivityHeight}px - 4px)` }}>
            <FileExplorer
              files={files}
              activeFileId={activeFile?.id || null}
              onFileSelect={handleFileSelect}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>

          {/* Resize handle between explorer and activity log */}
          <div
            className="h-1 bg-[#3c3c3c] resize-handle-v flex-shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startH = sidebarActivityHeight;
              const sidebarH = sidebarRef.current?.clientHeight || 600;
              const onMove = (me: MouseEvent) => {
                const newH = Math.max(100, Math.min(sidebarH - 120, startH - (me.clientY - startY)));
                setSidebarActivityHeight(newH);
              };
              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          />

          {/* Activity Log - bottom portion */}
          <div style={{ height: sidebarActivityHeight }} className="flex-shrink-0 overflow-hidden">
            <ActivityLog
              activities={collaboration.activityLog}
              typingUsers={collaboration.users}
              currentUser={collaboration.currentUser}
            />
          </div>
        </div>

        {/* Sidebar resize handle */}
        <div
          className="w-1 bg-transparent resize-handle-h flex-shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            const onMove = (me: MouseEvent) => {
              setSidebarWidth(Math.max(180, Math.min(500, startWidth + me.clientX - startX)));
            };
            const onUp = () => {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
        />

        {/* Editor + Terminal Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Breadcrumbs */}
          {activeFile && (
            <div className="h-7 bg-[#252526] flex items-center px-3 border-b border-[#1e1e1e] flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className="hover:text-white cursor-default">workspace</span>
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-300">{activeFile.name}</span>
              </div>
              {/* Show who else is viewing this file */}
              {collaboration.users.filter(u => u.activeFile === activeFile.name && u.id !== collaboration.currentUser?.id).length > 0 && (
                <div className="ml-auto flex items-center gap-1">
                  {collaboration.users.filter(u => u.activeFile === activeFile.name && u.id !== collaboration.currentUser?.id).map(u => (
                    <div
                      key={u.id}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: `${u.color}20`, color: u.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.color }} />
                      {u.name}
                      {u.isTyping && (
                        <span className="inline-flex gap-0.5 ml-0.5">
                          <span className="w-0.5 h-0.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms', animationDuration: '600ms' }} />
                          <span className="w-0.5 h-0.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '100ms', animationDuration: '600ms' }} />
                          <span className="w-0.5 h-0.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '200ms', animationDuration: '600ms' }} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="h-9 bg-[#252526] flex items-center border-b border-[#1e1e1e] overflow-x-auto flex-shrink-0">
            {openTabs.map((tab) => {
              const isEditingThis = collaboration.users.filter(
                u => u.activeFile === tab.name && u.id !== collaboration.currentUser?.id && u.isTyping
              );
              return (
                <div
                  key={tab.id}
                  className={`group flex items-center gap-2 px-3 h-full border-r border-[#1e1e1e] cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    activeFile?.id === tab.id
                      ? 'bg-[#1e1e1e] text-white'
                      : 'bg-[#2d2d2d] text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveFile(tab)}
                >
                  {/* Typing indicator dot on tab */}
                  {isEditingThis.length > 0 && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                      style={{ backgroundColor: isEditingThis[0].color }}
                      title={`${isEditingThis.map(u => u.name).join(', ')} typing here`}
                    />
                  )}
                  <span className="text-sm">{tab.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                    className="p-0.5 rounded hover:bg-[#3c3c3c] opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden" style={showTerminal ? { height: `calc(100% - ${terminalHeight}px - 4px)` } : undefined}>
            {activeFile && ydoc && provider && collaboration.currentUser ? (
              <CollaborativeEditor
                key={activeFile.id}
                sessionId={collaboration.sessionId}
                odce={collaboration.currentUser.id}
                userName={collaboration.currentUser.name}
                userColor={collaboration.currentUser.color}
                fileName={activeFile.name}
                fileContent=""
                language={activeFile.language || 'plaintext'}
                ydoc={ydoc}
                provider={provider}
                onContentChange={(content) => {
                  // Content is synced via Y.js
                }}
                onActivity={handleEditActivity}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center space-y-4">
                  <svg className="w-20 h-20 mx-auto opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">Select a file to start editing</p>
                  <p className="text-sm text-gray-600">Click a file in the explorer on the left</p>
                  <div className="mt-6 p-4 bg-[#252526] rounded-lg border border-[#3c3c3c] text-left max-w-sm mx-auto">
                    <p className="text-sm text-gray-400 mb-2">Session ID:</p>
                    <p className="text-xl font-mono font-bold text-[#4fc1ff]">{collaboration.sessionId}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Share this ID or URL with your collaborator!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal resize handle */}
          {showTerminal && (
            <div
              className="h-1 bg-[#3c3c3c] resize-handle-v flex-shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startH = terminalHeight;
                const onMove = (me: MouseEvent) => {
                  setTerminalHeight(Math.max(80, Math.min(500, startH - (me.clientY - startY))));
                };
                const onUp = () => {
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
            />
          )}

          {/* Terminal */}
          {showTerminal && (
            <div style={{ height: terminalHeight }} className="flex-shrink-0">
              <Terminal
                lines={collaboration.terminalLines}
                onCommand={handleTerminalCommand}
                currentUser={collaboration.currentUser}
                isConnected={collaboration.isConnected}
              />
            </div>
          )}
        </div>

        {/* Chat resize handle */}
        {showChat && (
          <div
            className="w-1 bg-transparent resize-handle-h flex-shrink-0"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startW = chatWidth;
              const onMove = (me: MouseEvent) => {
                setChatWidth(Math.max(200, Math.min(500, startW - (me.clientX - startX))));
              };
              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          />
        )}

        {/* Chat Panel */}
        {showChat && (
          <div
            className="bg-[#252526] border-l border-[#1e1e1e] flex-shrink-0 overflow-hidden"
            style={{ width: chatWidth }}
          >
            <Chat
              messages={collaboration.chatMessages}
              onSendMessage={collaboration.sendChatMessage}
              currentUser={collaboration.currentUser}
              users={collaboration.users}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${collaboration.isConnected ? 'bg-green-300' : 'bg-red-400 animate-pulse'}`} />
            {collaboration.isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            {collaboration.users.length} user{collaboration.users.length !== 1 ? 's' : ''}
          </span>
          <span className="opacity-75">Session: {collaboration.sessionId}</span>
          {/* Edit counts */}
          {(myEdits > 0 || otherEdits > 0) && (
            <span className="opacity-75">
              Edits: {myEdits} you · {otherEdits} other{otherEdits !== 1 ? 's' : ''}
            </span>
          )}
          {/* Live typing */}
          {typingUsers.filter(u => u.id !== collaboration.currentUser?.id).length > 0 && (
            <span className="flex items-center gap-1 text-green-200">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
              {typingUsers.filter(u => u.id !== collaboration.currentUser?.id).map(u => u.name).join(', ')} typing
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {activeFile && (
            <>
              <span>Ln {cursorPos.lineNumber}, Col {cursorPos.column}</span>
              <span>{activeFile.language || 'Plain Text'}</span>
              <span>UTF-8</span>
            </>
          )}
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}

export default App;
