import React, { useState, useEffect } from 'react';
import { generateSessionId, getRandomName } from '../types/collaboration';

interface SessionJoinModalProps {
  onJoin: (sessionId: string, userName: string) => void;
  initialSessionId?: string;
}

export const SessionJoinModal: React.FC<SessionJoinModalProps> = ({ onJoin, initialSessionId = '' }) => {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [userName, setUserName] = useState(getRandomName());
  const [generatedId, setGeneratedId] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // If there's a session ID in the URL, go straight to join mode
  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      setMode('join');
    }
  }, [initialSessionId]);

  const handleCreateSession = () => {
    const newId = generateSessionId();
    setGeneratedId(newId);
    setMode('create');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSessionId = mode === 'create' ? generatedId : sessionId.toUpperCase().trim();
    if (finalSessionId && userName.trim()) {
      onJoin(finalSessionId, userName.trim());
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?session=${generatedId}`;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center z-50 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a0e1a] to-[#0d1117]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#007acc] to-[#0065a9] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">CollabIDE</h1>
                <p className="text-blue-200 text-sm">Real-time Collaborative Code Editor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'choice' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-center mb-6 text-sm">
                Code together with anyone, anywhere in the world — in real-time.
              </p>

              <button
                onClick={handleCreateSession}
                className="w-full bg-[#0e639c] hover:bg-[#1177bb] active:bg-[#0d5689] text-white py-4 px-6 rounded-lg font-medium transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Create New Session</div>
                  <div className="text-sm text-blue-200 opacity-80">Start a new coding session and invite others</div>
                </div>
              </button>

              <button
                onClick={() => setMode('join')}
                className="w-full bg-[#2d2d2d] hover:bg-[#3c3c3c] active:bg-[#333] text-white py-4 px-6 rounded-lg font-medium transition-all border border-[#3c3c3c] flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold">Join Existing Session</div>
                  <div className="text-sm text-gray-400">Enter a session ID to join a collaborator</div>
                </div>
              </button>

              <div className="mt-6 p-4 bg-[#252526] rounded-lg border border-[#3c3c3c]">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  How it works
                </h3>
                <div className="space-y-2 text-gray-400 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="bg-[#007acc] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                    <span>Create a session and get a unique Session ID</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-[#007acc] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                    <span>Share the ID or link with your collaborator</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-[#007acc] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                    <span>Both of you edit code together in real-time!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Session ID display */}
              <div className="bg-gradient-to-r from-[#0e639c]/20 to-[#0e639c]/10 border border-[#0e639c]/50 rounded-lg p-5">
                <p className="text-[#4fc1ff] text-sm mb-2 font-medium">Your Session ID</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-mono font-bold text-white tracking-[0.3em]">{generatedId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedId, 'id')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy Session ID"
                  >
                    {copied === 'id' ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(shareUrl, 'link')}
                  className="mt-3 text-sm text-[#4fc1ff] hover:text-[#80d4ff] flex items-center gap-1.5 transition-colors"
                >
                  {copied === 'link' ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Link copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Copy shareable link
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Your Display Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#3c3c3c] border border-[#555] focus:border-[#007acc] rounded-lg px-4 py-3 text-white outline-none transition-colors"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="bg-[#252526] rounded-lg p-4 border border-[#3c3c3c]">
                <p className="text-yellow-300/90 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Share the Session ID or link with your collaborator. They'll enter it to join your live coding session.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0e639c] hover:bg-[#1177bb] text-white py-3.5 px-6 rounded-lg font-semibold transition-colors text-base"
              >
                🚀 Start Coding
              </button>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <button
                type="button"
                onClick={() => { setMode('choice'); setSessionId(''); }}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {initialSessionId && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-300 text-sm">
                    Session ID auto-filled from the shared link! Just enter your name and click Join.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Session ID</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  className="w-full bg-[#3c3c3c] border border-[#555] focus:border-[#007acc] rounded-lg px-4 py-4 text-white outline-none transition-colors text-center text-3xl font-mono tracking-[0.3em] uppercase"
                  placeholder="XXXXXX"
                  maxLength={10}
                  required
                  autoFocus={!initialSessionId}
                />
                <p className="text-gray-500 text-xs mt-2">Enter the session ID shared by your collaborator</p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Your Display Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#3c3c3c] border border-[#555] focus:border-[#007acc] rounded-lg px-4 py-3 text-white outline-none transition-colors"
                  placeholder="Enter your name"
                  required
                  autoFocus={!!initialSessionId}
                />
              </div>

              <button
                type="submit"
                disabled={sessionId.length < 4 || !userName.trim()}
                className="w-full bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-lg font-semibold transition-colors text-base"
              >
                🤝 Join Session
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#252526] border-t border-[#3c3c3c]">
          <p className="text-gray-500 text-xs text-center flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Connected via WebSocket server — works across any network worldwide
          </p>
        </div>
      </div>
    </div>
  );
};
