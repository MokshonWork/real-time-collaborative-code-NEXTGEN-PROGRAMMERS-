export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  activeFile?: string;
  isOnline: boolean;
  joinedAt: number;
  isTyping?: boolean;
  typingInFile?: string;
  lastActivity?: number;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  fileName: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  users: User[];
  files: FileNode[];
}

export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  fileName: string;
  action: 'edit' | 'create' | 'delete' | 'open' | 'run' | 'join' | 'leave';
  details?: string;
  preview?: string;
  lineInfo?: string;
  timestamp: number;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
  userId?: string;
  userName?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: number;
}

export const LANGUAGES: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'html': 'html',
  'css': 'css',
  'json': 'json',
  'md': 'markdown',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'go': 'go',
  'rs': 'rust',
  'rb': 'ruby',
  'php': 'php',
  'sql': 'sql',
  'sh': 'shell',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
};

export const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return LANGUAGES[ext] || 'plaintext';
}

export function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

export function getRandomName(): string {
  const adjectives = ['Swift', 'Clever', 'Bright', 'Quick', 'Sharp', 'Bold', 'Calm', 'Keen'];
  const nouns = ['Coder', 'Dev', 'Hacker', 'Ninja', 'Wizard', 'Master', 'Pro', 'Guru'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
