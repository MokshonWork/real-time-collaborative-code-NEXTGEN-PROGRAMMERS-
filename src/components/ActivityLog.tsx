import React, { useEffect, useRef, useState } from 'react';
import { ActivityEntry, User, timeAgo } from '../types/collaboration';

interface ActivityLogProps {
  activities: ActivityEntry[];
  typingUsers: User[];
  currentUser: User | null;
}

const ActionIcon: React.FC<{ action: ActivityEntry['action'] }> = ({ action }) => {
  switch (action) {
    case 'edit':
      return (
        <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 'create':
      return (
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'delete':
      return (
        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case 'open':
      return (
        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'run':
      return (
        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      );
    case 'join':
      return (
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case 'leave':
      return (
        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      );
  }
};

const TypingDots: React.FC = () => (
  <span className="inline-flex gap-0.5 ml-1">
    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms', animationDuration: '800ms' }} />
    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms', animationDuration: '800ms' }} />
    <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms', animationDuration: '800ms' }} />
  </span>
);

export const ActivityLog: React.FC<ActivityLogProps> = ({
  activities,
  typingUsers,
  currentUser,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setTick] = useState(0);

  // Update "time ago" every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom on new activity
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activities.length]);

  const remoteTypingUsers = typingUsers.filter(
    u => u.isTyping && u.id !== currentUser?.id
  );

  const actionVerb = (action: ActivityEntry['action']) => {
    switch (action) {
      case 'edit': return 'edited';
      case 'create': return 'created';
      case 'delete': return 'deleted';
      case 'open': return 'opened';
      case 'run': return 'executed';
      case 'join': return 'joined the session';
      case 'leave': return 'left the session';
    }
  };

  // Show last 50 activities
  const recentActivities = activities.slice(-50);

  return (
    <div className="flex flex-col bg-[#252526] h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 uppercase tracking-wider border-b border-[#3c3c3c] cursor-pointer hover:bg-[#2a2d2e]"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span>Activity Log</span>
          {activities.length > 0 && (
            <span className="bg-[#007acc] text-white text-[10px] px-1.5 rounded-full font-normal">
              {activities.length}
            </span>
          )}
        </div>
        {remoteTypingUsers.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 normal-case text-[10px]">
              {remoteTypingUsers.length} typing
            </span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div ref={containerRef} className="flex-1 overflow-auto">
          {/* Typing Indicators */}
          {remoteTypingUsers.length > 0 && (
            <div className="border-b border-[#3c3c3c]">
              {remoteTypingUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-start gap-2.5 px-3 py-2 bg-[#1e1e1e]/50 animate-fadeIn"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5 ring-2 ring-offset-1 ring-offset-[#252526]"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: user.color }}>
                        {user.name}
                      </span>
                      <span className="text-[10px] text-gray-500">is typing</span>
                      <TypingDots />
                    </div>
                    {user.typingInFile && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] text-gray-500 truncate">
                          {user.typingInFile}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: user.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity Entries */}
          {recentActivities.length === 0 && remoteTypingUsers.length === 0 && (
            <div className="px-3 py-6 text-center">
              <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-xs">No activity yet</p>
              <p className="text-gray-600 text-[10px] mt-1">Changes will appear here in real-time</p>
            </div>
          )}

          <div className="py-1">
            {recentActivities.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-start gap-2.5 px-3 py-2 hover:bg-[#2a2d2e] transition-colors ${
                  i === recentActivities.length - 1 ? 'animate-fadeIn' : ''
                }`}
              >
                {/* User avatar */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: entry.userColor }}
                  title={entry.userName}
                >
                  {entry.userName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span
                      className="text-xs font-medium"
                      style={{ color: entry.userColor }}
                    >
                      {entry.userName}
                      {entry.userId === currentUser?.id ? (
                        <span className="text-gray-500 font-normal"> (you)</span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {actionVerb(entry.action)}
                    </span>
                  </div>

                  {entry.fileName && entry.action !== 'join' && entry.action !== 'leave' && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <ActionIcon action={entry.action} />
                      <span className="text-xs text-gray-300 truncate font-mono">
                        {entry.fileName}
                      </span>
                    </div>
                  )}

                  {entry.lineInfo && (
                    <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {entry.lineInfo}
                    </div>
                  )}

                  {entry.details && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {entry.details}
                    </div>
                  )}

                  {entry.preview && (
                    <div className="mt-1 px-2 py-1 bg-[#1e1e1e] rounded text-[10px] text-gray-400 font-mono truncate border-l-2" style={{ borderLeftColor: entry.userColor }}>
                      {entry.preview}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-600 flex-shrink-0 mt-0.5">
                  {timeAgo(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
