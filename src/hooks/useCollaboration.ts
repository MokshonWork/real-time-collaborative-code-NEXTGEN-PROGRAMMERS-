import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { User, ChatMessage, TerminalLine, ActivityEntry, getRandomColor, generateUserId } from '../types/collaboration';

interface CollaborationState {
  isConnected: boolean;
  users: User[];
  chatMessages: ChatMessage[];
  terminalLines: TerminalLine[];
  activityLog: ActivityEntry[];
  currentUser: User | null;
}

interface UseCollaborationReturn extends CollaborationState {
  joinSession: (sessionId: string, userName: string) => void;
  leaveSession: () => void;
  getFileContent: (fileId: string) => string;
  sendChatMessage: (content: string) => void;
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;
  updateCursor: (position: { lineNumber: number; column: number; fileName: string }) => void;
  setTypingState: (isTyping: boolean, fileName?: string) => void;
  addFile: (fileId: string, content?: string) => void;
  deleteFile: (fileId: string) => void;
  addActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userColor'>) => void;
  getYDoc: () => Y.Doc | null;
  getProvider: () => WebsocketProvider | null;
  sessionId: string | null;
  peerCount: number;
}

const WS_SERVER = 'wss://demos.yjs.dev/ws';

export function useCollaboration(): UseCollaborationReturn {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    users: [],
    chatMessages: [],
    terminalLines: [],
    activityLog: [],
    currentUser: null,
  });
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const joinSession = useCallback((newSessionId: string, userName: string) => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const roomName = `collabide-live-${newSessionId}`;

    const provider = new WebsocketProvider(WS_SERVER, roomName, ydoc, {
      connect: true,
    });
    providerRef.current = provider;

    const user: User = {
      id: generateUserId(),
      name: userName,
      color: getRandomColor(),
      isOnline: true,
      joinedAt: Date.now(),
      isTyping: false,
    };
    currentUserRef.current = user;

    provider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
      isOnline: true,
      joinedAt: user.joinedAt,
      isTyping: false,
      typingInFile: undefined,
    });

    // Listen for awareness updates
    const awarenessHandler = () => {
      const states = provider.awareness.getStates();
      const users: User[] = [];
      
      states.forEach((awarenessState) => {
        if (awarenessState.user) {
          users.push({
            ...awarenessState.user,
            isOnline: true,
          });
        }
      });

      setPeerCount(users.length);
      setState(prev => ({ ...prev, users }));
    };

    provider.awareness.on('change', awarenessHandler);

    const statusHandler = (event: { status: string }) => {
      const connected = event.status === 'connected';
      setState(prev => ({ ...prev, isConnected: connected }));
    };
    provider.on('status', statusHandler);

    // Sync chat messages
    const yChat = ydoc.getArray<ChatMessage>('chat');
    const chatObserver = () => {
      const messages = yChat.toArray();
      setState(prev => ({ ...prev, chatMessages: messages }));
    };
    yChat.observe(chatObserver);

    // Sync terminal
    const yTerminal = ydoc.getArray<TerminalLine>('terminal');
    const terminalObserver = () => {
      const lines = yTerminal.toArray();
      setState(prev => ({ ...prev, terminalLines: lines }));
    };
    yTerminal.observe(terminalObserver);

    // Sync activity log
    const yActivity = ydoc.getArray<ActivityEntry>('activity');
    const activityObserver = () => {
      const entries = yActivity.toArray();
      setState(prev => ({ ...prev, activityLog: entries }));
    };
    yActivity.observe(activityObserver);

    // Initialize default files on first join
    provider.on('sync', () => {
      const yFiles = ydoc.getMap<string>('fileContents');
      if (yFiles.size === 0) {
        ydoc.transact(() => {
          yFiles.set('main.js', `// Welcome to CollabIDE!
// Session: ${newSessionId}
// Share this session ID with your friend!

function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to CollabIDE!\`;
}

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);

greet("World");
`);
          yFiles.set('styles.css', `/* Collaborative CSS Editor */
body {
  font-family: 'Segoe UI', sans-serif;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #4ECDC4;
  text-align: center;
  font-size: 2.5rem;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  backdrop-filter: blur(10px);
}
`);
          yFiles.set('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Collaborative Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Hello from CollabIDE!</h1>
    <p>This file is being edited in real-time.</p>
    <div id="app"></div>
  </div>
  <script src="main.js"></script>
</body>
</html>
`);
          yFiles.set('README.md', `# Collaborative Project

## Session: ${newSessionId}

### How to use
1. Share your session ID with a friend
2. They click "Join Existing Session" and enter the ID
3. You both edit files together in real-time!

### Terminal Commands
- \`run <file>\` - Execute a JavaScript file
- \`eval <code>\` - Evaluate JavaScript
- \`ls\` - List files
- \`cat <file>\` - View file contents
- \`help\` - Show all commands

Happy coding! 🚀
`);
        });
      }

      // Add "join" activity
      yActivity.push([{
        id: Math.random().toString(36).substring(2, 10),
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        fileName: '',
        action: 'join',
        details: 'Joined the session',
        timestamp: Date.now(),
      }]);
    });

    setSessionId(newSessionId);
    setState(prev => ({
      ...prev,
      currentUser: user,
      isConnected: true,
    }));

    cleanupRef.current = () => {
      provider.awareness.off('change', awarenessHandler);
      provider.off('status', statusHandler);
      yChat.unobserve(chatObserver);
      yTerminal.unobserve(terminalObserver);
      yActivity.unobserve(activityObserver);
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      currentUserRef.current = null;
    };
  }, []);

  const leaveSession = useCallback(() => {
    // Add leave activity before disconnecting
    if (ydocRef.current && currentUserRef.current) {
      const yActivity = ydocRef.current.getArray<ActivityEntry>('activity');
      yActivity.push([{
        id: Math.random().toString(36).substring(2, 10),
        userId: currentUserRef.current.id,
        userName: currentUserRef.current.name,
        userColor: currentUserRef.current.color,
        fileName: '',
        action: 'leave',
        details: 'Left the session',
        timestamp: Date.now(),
      }]);
    }

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setSessionId(null);
    setPeerCount(0);
    setState({
      isConnected: false,
      users: [],
      chatMessages: [],
      terminalLines: [],
      activityLog: [],
      currentUser: null,
    });
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  const getFileContent = useCallback((fileId: string): string => {
    if (!ydocRef.current) return '';
    const yFiles = ydocRef.current.getMap<string>('fileContents');
    return yFiles.get(fileId) || '';
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    if (!ydocRef.current || !currentUserRef.current) return;
    const yChat = ydocRef.current.getArray<ChatMessage>('chat');
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(2, 10),
      userId: currentUserRef.current.id,
      userName: currentUserRef.current.name,
      userColor: currentUserRef.current.color,
      content,
      timestamp: Date.now(),
    };
    yChat.push([message]);
  }, []);

  const addTerminalLine = useCallback((line: Omit<TerminalLine, 'id' | 'timestamp'>) => {
    if (!ydocRef.current) return;
    const yTerminal = ydocRef.current.getArray<TerminalLine>('terminal');
    const fullLine: TerminalLine = {
      ...line,
      id: Math.random().toString(36).substring(2, 10),
      timestamp: Date.now(),
      userId: currentUserRef.current?.id,
      userName: currentUserRef.current?.name,
    };
    yTerminal.push([fullLine]);
  }, []);

  const clearTerminal = useCallback(() => {
    if (!ydocRef.current) return;
    const yTerminal = ydocRef.current.getArray<TerminalLine>('terminal');
    ydocRef.current.transact(() => {
      yTerminal.delete(0, yTerminal.length);
    });
  }, []);

  const updateCursor = useCallback((position: { lineNumber: number; column: number; fileName: string }) => {
    if (!providerRef.current || !currentUserRef.current) return;
    const currentState = providerRef.current.awareness.getLocalState()?.user || {};
    providerRef.current.awareness.setLocalStateField('user', {
      ...currentState,
      ...currentUserRef.current,
      cursor: position,
      activeFile: position.fileName,
    });
  }, []);

  const setTypingState = useCallback((isTyping: boolean, fileName?: string) => {
    if (!providerRef.current || !currentUserRef.current) return;
    const currentState = providerRef.current.awareness.getLocalState()?.user || {};
    providerRef.current.awareness.setLocalStateField('user', {
      ...currentState,
      ...currentUserRef.current,
      isTyping,
      typingInFile: isTyping ? fileName : undefined,
      lastActivity: Date.now(),
    });
  }, []);

  const addFile = useCallback((fileId: string, content?: string) => {
    if (!ydocRef.current) return;
    const yFiles = ydocRef.current.getMap<string>('fileContents');
    yFiles.set(fileId, content || '');
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    if (!ydocRef.current) return;
    const yFiles = ydocRef.current.getMap<string>('fileContents');
    yFiles.delete(fileId);
  }, []);

  const addActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userColor'>) => {
    if (!ydocRef.current || !currentUserRef.current) return;
    const yActivity = ydocRef.current.getArray<ActivityEntry>('activity');
    
    // Limit to last 200 entries
    if (yActivity.length > 200) {
      ydocRef.current.transact(() => {
        yActivity.delete(0, yActivity.length - 150);
      });
    }

    const fullEntry: ActivityEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 10),
      userId: currentUserRef.current.id,
      userName: currentUserRef.current.name,
      userColor: currentUserRef.current.color,
      timestamp: Date.now(),
    };
    yActivity.push([fullEntry]);
  }, []);

  const getYDoc = useCallback(() => ydocRef.current, []);
  const getProvider = useCallback(() => providerRef.current, []);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    ...state,
    sessionId,
    peerCount,
    joinSession,
    leaveSession,
    getFileContent,
    sendChatMessage,
    addTerminalLine,
    clearTerminal,
    updateCursor,
    setTypingState,
    addFile,
    deleteFile,
    addActivity,
    getYDoc,
    getProvider,
  };
}
