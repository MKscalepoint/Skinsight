'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, UserProfile, RoutineProduct, ChatSession } from '@/types';
import {
  getSessions, saveSession, deleteSession, getRoutine, saveRoutine,
  getProfile, saveProfile, clearAll, generateId, setActiveSessionId, getActiveSessionId
} from '@/lib/storage';
import Onboarding from '@/components/Onboarding';
import RoutineSidebar from '@/components/RoutineSidebar';

const SUGGESTIONS = [
  'Can I use vitamin C and niacinamide together?',
  'What order should I apply my products?',
  'Help me build a morning routine',
  'Is retinol safe for sensitive skin?',
  'What does hyaluronic acid actually do?',
  'Explain skin cycling to me',
];

const WELCOME = `Welcome. I'm Glow Guide — your personal skincare advisor.

Based on your profile, I'll help you build an effective routine, check ingredient compatibility, and cut through the noise on products and marketing claims.

What would you like to explore today?`;

function formatMessage(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withEm = bold.replace(/\*(.+?)\*/g, '<em>$1</em>');
    if (line.trim().startsWith('- ')) {
      return <li key={i} style={{ marginBottom: 4, paddingLeft: 4 }} dangerouslySetInnerHTML={{ __html: withEm.trim().slice(2) }} />;
    }
    if (/^\d+\./.test(line.trim())) {
      return <li key={i} style={{ marginBottom: 6, paddingLeft: 4 }} dangerouslySetInnerHTML={{ __html: withEm.trim().replace(/^\d+\.\s*/, '') }} />;
    }
    if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ margin: '0 0 4px' }} dangerouslySetInnerHTML={{ __html: withEm }} />;
  });
}

export default function ChatPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveId] = useState<string | null>(null);
  const [routine, setRoutine] = useState<RoutineProduct[]>([]);
  const [showRoutine, setShowRoutine] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const savedProfile = getProfile();
    const savedRoutine = getRoutine();
    const savedSessions = getSessions();
    const savedActiveId = getActiveSessionId();

    setRoutine(savedRoutine);
    setSessions(savedSessions);

    if (savedProfile?.completed) {
      setProfile(savedProfile);
      if (savedActiveId && savedSessions.find(s => s.id === savedActiveId)) {
        setActiveId(savedActiveId);
        const session = savedSessions.find(s => s.id === savedActiveId)!;
        setMessages(session.messages);
      } else {
        startNewSession(savedProfile, false);
      }
    } else {
      setShowOnboarding(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewSession = useCallback((p: UserProfile, persist = true) => {
    const id = generateId();
    const welcome: Message = { role: 'assistant', content: WELCOME };
    const session: ChatSession = {
      id,
      title: 'New consultation',
      messages: [welcome],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages([welcome]);
    setActiveId(id);
    setActiveSessionId(id);
    if (persist) {
      saveSession(session);
      setSessions(getSessions());
    }
  }, []);

  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p);
    saveProfile(p);
    setShowOnboarding(false);
    startNewSession(p);
  };

  const persistMessages = useCallback((msgs: Message[], sessionId: string, p: UserProfile | null) => {
    const allSessions = getSessions();
    const existing = allSessions.find(s => s.id === sessionId);
    const userMsgs = msgs.filter(m => m.role === 'user');
    const title = userMsgs.length > 0
      ? userMsgs[0].content.slice(0, 40) + (userMsgs[0].content.length > 40 ? '…' : '')
      : 'New consultation';

    const session: ChatSession = {
      id: sessionId,
      title,
      messages: msgs,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveSession(session);
    setSessions(getSessions());
  }, []);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading || !activeSessionId) return;
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, profile }),
      });
      const data = await res.json();
      const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text || 'Sorry, something went wrong. Please try again.';
      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(finalMessages);
      persistMessages(finalMessages, activeSessionId, profile);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    if (!profile) return;
    if (confirm('Start a new consultation? Your current chat will be saved in history.')) {
      startNewSession(profile);
    }
  };

  const handleResetAll = () => {
    if (confirm('This will clear your profile, all chats, and your routine. Are you sure?')) {
      clearAll();
      setProfile(null);
      setMessages([]);
      setSessions([]);
      setRoutine([]);
      setShowOnboarding(true);
    }
  };

  const handleLoadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveId(session.id);
    setActiveSessionId(session.id);
    setShowSessions(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    setSessions(getSessions());
    if (id === activeSessionId && profile) startNewSession(profile);
  };

  const handleRoutineUpdate = (r: RoutineProduct[]) => {
    setRoutine(r);
    saveRoutine(r);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!hydrated) return null;
  if (showOnboarding) return <Onboarding onComplete={handleProfileComplete} />;

  return (
    <div style={{
      height: '100vh', display: 'flex', overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#ffffff',
    }}>

      {/* Left sidebar — session history */}
      <div style={{
        width: showSessions ? 260 : 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        borderRight: showSessions ? '1px solid #e2e8f0' : 'none',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: '#fafafa',
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Chat History
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: '#cbd5e1', padding: '12px 8px', margin: 0 }}>No saved chats yet</p>
          ) : (
            sessions.map(s => (
              <div key={s.id} onClick={() => handleLoadSession(s)} style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: s.id === activeSessionId ? '#e2e8f0' : 'transparent',
                marginBottom: 2, display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', gap: 8,
              }}
                onMouseEnter={e => { if (s.id !== activeSessionId) (e.currentTarget as HTMLDivElement).style.background = '#f1f5f9'; }}
                onMouseLeave={e => { if (s.id !== activeSessionId) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={e => handleDeleteSession(s.id, e)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#cbd5e1', fontSize: 16, padding: 0, flexShrink: 0,
                }}
                  onMouseEnter={e => (e.target as HTMLButtonElement).style.color = '#ef4444'}
                  onMouseLeave={e => (e.target as HTMLButtonElement).style.color = '#cbd5e1'}
                >×</button>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={handleResetAll} style={{
            width: '100%', padding: '8px', background: 'transparent',
            border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Reset everything
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          padding: '0 24px',
          height: 60,
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#ffffff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setShowSessions(s => !s)} title="Chat history" style={{
              background: showSessions ? '#f1f5f9' : 'none',
              border: 'none', cursor: 'pointer', padding: '6px 8px',
              borderRadius: 8, color: '#64748b', fontSize: 18,
            }}>☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: '#fff',
              }}>◎</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>Glow Guide</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>Skincare Advisor</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {profile && (
              <div style={{
                fontSize: 12, color: '#64748b', background: '#f8fafc',
                padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0',
              }}>
                {profile.skinType} skin
              </div>
            )}
            <button onClick={handleStartOver} style={{
              padding: '6px 14px', background: 'transparent',
              border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 13, color: '#64748b', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 500,
            }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a2e'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'}
            >
              Start over
            </button>
            <button onClick={() => setShowRoutine(s => !s)} style={{
              padding: '6px 14px',
              background: showRoutine ? '#1a1a2e' : 'transparent',
              border: `1px solid ${showRoutine ? '#1a1a2e' : '#e2e8f0'}`,
              borderRadius: 8, fontSize: 13,
              color: showRoutine ? '#fff' : '#64748b',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              My Routine
              {routine.length > 0 && (
                <span style={{
                  background: showRoutine ? 'rgba(255,255,255,0.2)' : '#1a1a2e',
                  color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11,
                }}>{routine.length}</span>
              )}
            </button>
          </div>
        </header>

        {/* Messages */}
        <main style={{
          flex: 1, overflowY: 'auto', padding: '32px 24px',
          maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box',
        }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: 20,
              }}>
                {!isUser && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#1a1a2e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#fff', flexShrink: 0, marginRight: 12, marginTop: 2,
                  }}>◎</div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '14px 18px',
                  background: isUser ? '#1a1a2e' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#1a1a2e',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 15, lineHeight: 1.65,
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                }}>
                  {isUser ? (
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  ) : (
                    <div style={{ listStylePosition: 'inside' }}>
                      {formatMessage(msg.content)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: '#1a1a2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', flexShrink: 0, marginRight: 12,
              }}>◎</div>
              <div style={{
                padding: '14px 18px', background: '#f8fafc', borderRadius: '16px 16px 16px 4px',
                border: '1px solid #e2e8f0', display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#cbd5e1',
                    animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions — show when only welcome message */}
          {messages.length === 1 && !loading && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, fontWeight: 500, letterSpacing: '0.3px' }}>
                SUGGESTED QUESTIONS
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    padding: '8px 14px', background: '#ffffff',
                    border: '1px solid #e2e8f0', borderRadius: 20,
                    fontSize: 13, color: '#475569', cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s ease',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a2e';
                      (e.currentTarget as HTMLButtonElement).style.color = '#1a1a2e';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                      (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        {/* Input */}
        <div style={{
          padding: '16px 24px 24px', borderTop: '1px solid #f1f5f9',
          background: '#ffffff', flexShrink: 0,
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 12,
              background: '#f8fafc', borderRadius: 14,
              border: '1.5px solid #e2e8f0', padding: '12px 12px 12px 18px',
              transition: 'border-color 0.15s ease',
            }}
              onFocusCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#1a1a2e'}
              onBlurCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKey}
                placeholder="Ask about ingredients, compatibility, routines…"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 15, color: '#1a1a2e', fontFamily: 'inherit',
                  lineHeight: 1.5, resize: 'none', outline: 'none',
                  maxHeight: 120, overflow: 'auto',
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading ? '#1a1a2e' : '#e2e8f0',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                color: input.trim() && !loading ? '#fff' : '#94a3b8',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}>→</button>
            </div>
            <p style={{
              textAlign: 'center', fontSize: 11, color: '#cbd5e1',
              margin: '10px 0 0', letterSpacing: '0.2px',
            }}>
              Glow Guide provides general skincare guidance. Always patch test new products and consult a dermatologist for medical concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Routine sidebar */}
      {showRoutine && (
        <RoutineSidebar
          routine={routine}
          onUpdate={handleRoutineUpdate}
          onClose={() => setShowRoutine(false)}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
