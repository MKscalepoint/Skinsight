'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, UserProfile, RoutineProduct, ChatSession } from '@/types';
import {
  getSessions, saveSession, deleteSession, getRoutine, saveRoutine,
  getProfile, saveProfile, clearAll, generateId, setActiveSessionId, getActiveSessionId
} from '@/lib/storage';
import Landing from '@/components/Landing';
import Onboarding from '@/components/Onboarding';
import RoutineSidebar from '@/components/RoutineSidebar';
import IngredientDecoder from '@/components/IngredientDecoder';
import CheckProducts from '@/components/CheckProducts';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#f0fdfa';

type View = 'landing' | 'onboarding' | 'chat';

const SUGGESTIONS = [
  'Can I use vitamin C and niacinamide together?',
  'What order should I apply my products?',
  'Help me build a morning routine',
  'Is retinol safe for sensitive skin?',
  'What does hyaluronic acid actually do?',
  'Explain skin cycling to me',
];

const WELCOME = `Welcome to Skinsight. I've reviewed your skin profile and I'm ready to help.

I can assist with ingredient compatibility, routine building, product recommendations, and anything else skincare-related. All my advice is tailored to your specific skin type and concerns.

What would you like to explore today?`;

function formatMessage(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    if (line.trim().startsWith('- ')) return <li key={i} style={{ marginBottom: 4, paddingLeft: 4 }} dangerouslySetInnerHTML={{ __html: html.trim().slice(2) }} />;
    if (/^\d+\./.test(line.trim())) return <li key={i} style={{ marginBottom: 6, paddingLeft: 4 }} dangerouslySetInnerHTML={{ __html: html.trim().replace(/^\d+\.\s*/, '') }} />;
    if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ margin: '0 0 4px' }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveId] = useState<string | null>(null);
  const [routine, setRoutine] = useState<RoutineProduct[]>([]);
  const [showRoutine, setShowRoutine] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCheckProducts, setShowCheckProducts] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        setMessages(savedSessions.find(s => s.id === savedActiveId)!.messages);
      }
      setView('landing');
    } else {
      setView('landing');
    }
    setHydrated(true);

    // Handle deep links (e.g. /ingredients redirects here with a flag)
    const openTool = sessionStorage.getItem('skinsight_open_tool');
    if (openTool) {
      sessionStorage.removeItem('skinsight_open_tool');
      if (openTool === 'ingredients') {
        setShowIngredients(true);
        setView('chat');
      }
    }
  }, []);

  const lastAssistantRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && messages.length > 1 && messages[messages.length - 1].role === 'assistant') {
      lastAssistantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, loading]);

  const startNewSession = useCallback((p: UserProfile) => {
    const id = generateId();
    const welcome: Message = { role: 'assistant', content: WELCOME };
    const session: ChatSession = {
      id, title: 'New consultation', messages: [welcome],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setMessages([welcome]);
    setActiveId(id);
    setActiveSessionId(id);
    saveSession(session);
    setSessions(getSessions());
    setView('chat');
  }, []);

  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p);
    saveProfile(p);
    setEditingProfile(false);
    startNewSession(p);
  };

  const persistMessages = useCallback((msgs: Message[], sessionId: string) => {
    const existing = getSessions().find(s => s.id === sessionId);
    const userMsgs = msgs.filter(m => m.role === 'user');
    const title = userMsgs.length > 0 ? userMsgs[0].content.slice(0, 45) + (userMsgs[0].content.length > 45 ? '…' : '') : 'New consultation';
    saveSession({ id: sessionId, title, messages: msgs, createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
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
      const final: Message[] = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(final);
      persistMessages(final, activeSessionId);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => setShowStartOverConfirm(true);

  const confirmStartOver = () => {
    setShowStartOverConfirm(false);
    if (profile) startNewSession(profile);
  };

  const handleResetAll = () => {
    clearAll();
    setProfile(null); setMessages([]); setSessions([]); setRoutine([]);
    setView('landing');
  };

  const handleRoutineUpdate = (r: RoutineProduct[]) => { setRoutine(r); saveRoutine(r); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!hydrated) return null;

  // Landing
  if (view === 'landing') {
    return (
      <Landing
        hasProfile={!!profile?.completed}
        onStart={() => {
          if (profile?.completed) {
            startNewSession(profile);
          } else {
            setView('onboarding');
          }
        }}
        onResume={() => {
          if (profile && activeSessionId) setView('chat');
          else if (profile) startNewSession(profile);
          else setView('onboarding');
        }}
      />
    );
  }

  // Onboarding / Edit profile
  if (view === 'onboarding' || editingProfile) {
    return (
      <Onboarding
        onComplete={handleProfileComplete}
        onHome={() => { setEditingProfile(false); setView('landing'); }}
        initialProfile={editingProfile ? profile : null}
        editMode={editingProfile}
      />
    );
  }

  // Chat
  return (
    <div style={{
      height: '100vh', display: 'flex', overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif", background: '#ffffff',
    }}>

      {/* Session history sidebar */}
      <div style={{
        width: showSessions ? 260 : 0, overflow: 'hidden',
        transition: 'width 0.25s ease',
        borderRight: showSessions ? '1px solid #e2e8f0' : 'none',
        flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fafafa',
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Chat History</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: '#cbd5e1', padding: '12px 8px', margin: 0 }}>No saved chats yet</p>
          ) : sessions.map(s => (
            <div key={s.id} onClick={() => { setMessages(s.messages); setActiveId(s.id); setActiveSessionId(s.id); setShowSessions(false); }}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: s.id === activeSessionId ? TEAL_LIGHT : 'transparent',
                border: s.id === activeSessionId ? `1px solid ${TEAL}22` : '1px solid transparent',
                marginBottom: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(s.updatedAt).toLocaleDateString()}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id); setSessions(getSessions()); if (s.id === activeSessionId && profile) startNewSession(profile); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 16, padding: 0, flexShrink: 0 }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#ef4444'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#cbd5e1'}
              >×</button>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => { setEditingProfile(true); }} style={{
            width: '100%', padding: '8px', background: TEAL_LIGHT,
            border: `1px solid ${TEAL}44`, borderRadius: 8, color: TEAL,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          }}>✎ Edit my profile</button>
          <button onClick={handleResetAll} style={{
            width: '100%', padding: '8px', background: 'transparent',
            border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>Reset everything</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          padding: '0 20px', height: 60,
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#ffffff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setShowSessions(s => !s)} style={{
              background: showSessions ? TEAL_LIGHT : 'none', border: 'none',
              cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
              color: showSessions ? TEAL : '#64748b', fontSize: 18,
            }}>☰</button>
            <button onClick={() => setView('landing')} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: TEAL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 15, fontWeight: 700,
              }}>S</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, textAlign: 'left' }}>Skinsight</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>Skincare Advisor</div>
              </div>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Desktop nav - full buttons */}
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {profile?.skinType && (
                <div style={{ fontSize: 12, color: TEAL, background: TEAL_LIGHT, padding: '4px 10px', borderRadius: 20, border: `1px solid ${TEAL}33`, fontWeight: 500 }}>{profile.skinType} skin</div>
              )}
              <button onClick={() => setEditingProfile(true)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = TEAL; (e.currentTarget).style.color = TEAL; }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = '#e2e8f0'; (e.currentTarget).style.color = '#64748b'; }}>✎ Edit</button>
              <button onClick={handleStartOver} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = '#0f172a'; (e.currentTarget).style.color = '#0f172a'; }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = '#e2e8f0'; (e.currentTarget).style.color = '#64748b'; }}>Start over</button>
              <button onClick={() => { setShowIngredients(s => !s); setShowCheckProducts(false); setShowRoutine(false); }} style={{ padding: '6px 12px', background: showIngredients ? TEAL : 'transparent', border: `1px solid ${showIngredients ? TEAL : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: showIngredients ? '#fff' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>🔬 Ingredients</button>
              <button onClick={() => { setShowCheckProducts(s => !s); setShowIngredients(false); setShowRoutine(false); }} style={{ padding: '6px 12px', background: showCheckProducts ? TEAL : 'transparent', border: `1px solid ${showCheckProducts ? TEAL : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: showCheckProducts ? '#fff' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>⚗️ Check</button>
              <button onClick={() => setShowRoutine(s => !s)} style={{ padding: '6px 12px', background: showRoutine ? TEAL : 'transparent', border: `1px solid ${showRoutine ? TEAL : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: showRoutine ? '#fff' : '#64748b', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                My Routine
                {routine.length > 0 && <span style={{ background: showRoutine ? 'rgba(255,255,255,0.25)' : TEAL, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{routine.length}</span>}
              </button>
            </div>

            {/* Mobile nav - 3 icon buttons + menu */}
            <div className="show-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => { setShowIngredients(s => !s); setShowCheckProducts(false); setShowRoutine(false); setShowMobileMenu(false); }} style={{ width: 36, height: 36, borderRadius: 8, background: showIngredients ? TEAL : '#f8fafc', border: `1px solid ${showIngredients ? TEAL : '#e2e8f0'}`, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Ingredient Decoder">🔬</button>
              <button onClick={() => { setShowCheckProducts(s => !s); setShowIngredients(false); setShowRoutine(false); setShowMobileMenu(false); }} style={{ width: 36, height: 36, borderRadius: 8, background: showCheckProducts ? TEAL : '#f8fafc', border: `1px solid ${showCheckProducts ? TEAL : '#e2e8f0'}`, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Check Products">⚗️</button>
              <button onClick={() => { setShowRoutine(s => !s); setShowMobileMenu(false); }} style={{ width: 36, height: 36, borderRadius: 8, background: showRoutine ? TEAL : '#f8fafc', border: `1px solid ${showRoutine ? TEAL : '#e2e8f0'}`, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} title="My Routine">
                📋
                {routine.length > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: TEAL, color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{routine.length}</span>}
              </button>
              {/* More menu */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMobileMenu(s => !s)} style={{ width: 36, height: 36, borderRadius: 8, background: showMobileMenu ? '#0f172a' : '#f8fafc', border: `1px solid ${showMobileMenu ? '#0f172a' : '#e2e8f0'}`, cursor: 'pointer', color: showMobileMenu ? '#fff' : '#64748b', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋯</button>
                {showMobileMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 44, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 160, overflow: 'hidden' }}>
                    {profile?.skinType && (
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: TEAL, fontWeight: 600, background: TEAL_LIGHT }}>{profile.skinType} skin</div>
                    )}
                    <button onClick={() => { setEditingProfile(true); setShowMobileMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>✎ Edit profile</button>
                    <button onClick={() => { handleStartOver(); setShowMobileMenu(false); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', fontSize: 14, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>↺ Start over</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Start over confirm banner */}
        {showStartOverConfirm && (
          <div style={{
            background: '#fffbeb', borderBottom: '1px solid #fde68a',
            padding: '12px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
          }}>
            <span style={{ fontSize: 14, color: '#92400e' }}>
              Start a new consultation? Your current chat will be saved in history.
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setShowStartOverConfirm(false)} style={{
                padding: '6px 14px', background: '#fff', border: '1px solid #d97706',
                borderRadius: 6, fontSize: 13, color: '#92400e', cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button onClick={confirmStartOver} style={{
                padding: '6px 14px', background: '#d97706', border: 'none',
                borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600,
              }}>Yes, start over</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <main style={{
          flex: 1, overflowY: 'auto', padding: '32px 24px',
          maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box',
        }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && i === messages.length - 1;
            return (
              <div key={i} ref={isLastAssistant ? lastAssistantRef : null} style={{
                display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 20,
              }}>
                {!isUser && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: TEAL,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#fff', fontWeight: 700,
                    flexShrink: 0, marginRight: 12, marginTop: 2,
                  }}>S</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '14px 18px',
                  background: isUser ? '#0f172a' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#0f172a',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 15, lineHeight: 1.65,
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                }}>
                  {isUser
                    ? <p style={{ margin: 0 }}>{msg.content}</p>
                    : <div style={{ listStylePosition: 'inside' }}>{formatMessage(msg.content)}</div>
                  }
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: TEAL,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', fontWeight: 700,
                flexShrink: 0, marginRight: 12,
              }}>S</div>
              <div style={{
                padding: '14px 18px', background: '#f8fafc',
                borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0',
                display: 'flex', gap: 5, alignItems: 'center',
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

          {messages.length === 1 && !loading && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Suggested questions
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    padding: '8px 14px', background: '#ffffff',
                    border: '1px solid #e2e8f0', borderRadius: 20,
                    fontSize: 13, color: '#475569', cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s ease',
                  }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = TEAL; (e.currentTarget).style.color = TEAL; (e.currentTarget).style.background = TEAL_LIGHT; }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = '#e2e8f0'; (e.currentTarget).style.color = '#475569'; (e.currentTarget).style.background = '#fff'; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Input */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #f1f5f9', background: '#ffffff', flexShrink: 0 }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 12,
              background: '#f8fafc', borderRadius: 14,
              border: '1.5px solid #e2e8f0', padding: '12px 12px 12px 18px',
            }}
              onFocusCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = TEAL}
              onBlurCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'}
            >
              <textarea
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
                  fontSize: 15, color: '#0f172a', fontFamily: 'inherit',
                  lineHeight: 1.5, resize: 'none', outline: 'none', maxHeight: 120,
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading ? TEAL : '#e2e8f0',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                color: input.trim() && !loading ? '#fff' : '#94a3b8',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}>→</button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', margin: '10px 0 0' }}>
              Skinsight provides general skincare guidance. Always patch test and consult a dermatologist for medical concerns.
            </p>
          </div>
        </div>
      </div>

      {showRoutine && <RoutineSidebar routine={routine} onUpdate={handleRoutineUpdate} onClose={() => setShowRoutine(false)} />}
      {showIngredients && <IngredientDecoder profile={profile} onClose={() => setShowIngredients(false)} />}
      {showCheckProducts && <CheckProducts profile={profile} onClose={() => setShowCheckProducts(false)} />}

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media (max-width: 600px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 601px) {
          .show-mobile { display: none !important; }
          .hide-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
