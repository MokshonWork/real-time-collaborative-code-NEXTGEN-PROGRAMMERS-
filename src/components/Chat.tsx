import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types/collaboration';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  currentUser: User | null;
  users: User[];
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  currentUser,
  users,
}) => {
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Chat Header */}
      <div className="px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-gray-300 text-xs font-medium">CHAT</span>
          <span className="text-gray-500 text-xs">({users.length} online)</span>
        </div>
      </div>

      {/* Online Users */}
      <div className="px-3 py-2 bg-[#252526] border-b border-[#3c3c3c] flex items-center gap-2 flex-wrap">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ backgroundColor: `${user.color}20`, color: user.color }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color }}
            ></span>
            {user.name}
            {user.id === currentUser?.id && ' (you)'}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start a conversation with your collaborator!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className="group">
            <div className="flex items-baseline gap-2 mb-1">
              <span 
                className="font-medium text-sm"
                style={{ color: message.userColor }}
              >
                {message.userName}
                {message.userId === currentUser?.id && ' (you)'}
              </span>
              <span className="text-gray-500 text-xs">
                {formatTime(message.timestamp)}
              </span>
            </div>
            <p className="text-gray-300 text-sm pl-0 break-words">
              {message.content}
            </p>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#3c3c3c] rounded px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#007acc]"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-gray-500 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
