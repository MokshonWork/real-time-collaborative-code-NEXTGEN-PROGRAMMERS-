import React, { useState } from 'react';
import { User } from '../types/collaboration';

interface UserPresenceProps {
  users: User[];
  currentUser: User | null;
  sessionId: string;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  users,
  currentUser,
  sessionId,
}) => {
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWhat(label);
    setTimeout(() => setCopiedWhat(null), 2000);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;

  return (
    <div className="flex items-center gap-3">
      {/* Session Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252526] rounded-md border border-[#3c3c3c]">
        <span className="text-gray-400 text-xs">Session:</span>
        <code className="text-[#4fc1ff] font-mono text-xs font-bold tracking-wider">{sessionId}</code>
        <button
          onClick={() => copyText(sessionId, 'id')}
          className="p-0.5 hover:bg-[#3c3c3c] rounded transition-colors ml-0.5"
          title="Copy Session ID"
        >
          {copiedWhat === 'id' ? (
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => copyText(shareUrl, 'link')}
          className="p-0.5 hover:bg-[#3c3c3c] rounded transition-colors"
          title="Copy Share Link"
        >
          {copiedWhat === 'link' ? (
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </button>
      </div>

      {/* User Avatars */}
      <div className="flex items-center -space-x-1.5">
        {users.map((user) => (
          <div
            key={user.id}
            className="relative group"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#323233] hover:scale-110 transition-transform cursor-default"
              style={{ backgroundColor: user.color }}
              title={`${user.name}${user.id === currentUser?.id ? ' (you)' : ''}`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#323233]" />
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {user.name}{user.id === currentUser?.id ? ' (you)' : ''}
              {user.activeFile && <span className="text-gray-400"> · {user.activeFile}</span>}
            </div>
          </div>
        ))}

        {/* Invite button */}
        <button
          onClick={() => copyText(shareUrl, 'link')}
          className="w-7 h-7 rounded-full border-2 border-dashed border-[#555] flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-400 transition-colors ml-1"
          title="Copy invite link"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
