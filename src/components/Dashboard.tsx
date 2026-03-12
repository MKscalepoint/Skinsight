'use client';

import { UserProfile, RoutineProduct } from '@/types';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#f0fdfa';
const TEAL_MID = '#ccfbf1';

interface DashboardProps {
  profile: UserProfile;
  routine: RoutineProduct[];
  onOpenChat: (initialMessage?: string) => void;
  onOpenIngredients: () => void;
  onOpenCheckProducts: () => void;
  onOpenScamCheck: () => void;
  onOpenRoutine: () => void;
  onEditProfile: () => void;
}

const SUGGESTIONS = [
  'Build me a morning routine',
  'Can I use retinol + vitamin C?',
  'What does niacinamide do?',
  'Is my routine causing breakouts?',
];

const AM_STEPS = ['Cleanser', 'Toner', 'Serum', 'Moisturiser', 'SPF'];

export default function Dashboard({
  profile, routine, onOpenChat, onOpenIngredients,
  onOpenCheckProducts, onOpenScamCheck, onOpenRoutine, onEditProfile,
}: DashboardProps) {

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const amRoutine = routine.filter(p => p.timeOfDay === 'AM' || p.timeOfDay === 'Both');
  const pmRoutine = routine.filter(p => p.timeOfDay === 'PM' || p.timeOfDay === 'Both');
  const displayRoutine = amRoutine.length > 0 ? amRoutine : pmRoutine;
  const routineLabel = amRoutine.length > 0 ? '☀ Morning' : '☾ Evening';

  return (
    <div style={{
      flex: 1, overflowY: 'auto', background: '#f8fafc',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 100px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
            {greeting} 👋
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
            What do you want to work on today?
          </p>
        </div>

        {/* Chat card */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18,
          padding: '20px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {/* Teal top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${TEAL}, #06b6d4)`,
            borderRadius: '18px 18px 0 0',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: TEAL, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 17,
            }}>S</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Ask your skin advisor</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
                Personalised advice based on your {profile.skinType?.toLowerCase()} skin profile
              </div>
              {/* Fake input */}
              <div
                onClick={() => onOpenChat()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#f8fafc', border: '1.5px solid #e2e8f0',
                  borderRadius: 12, padding: '11px 14px', cursor: 'text',
                  marginBottom: 12,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = TEAL}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'}
              >
                <span style={{ flex: 1, fontSize: 14, color: '#94a3b8' }}>Ask about ingredients, routines, products…</span>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: TEAL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, flexShrink: 0,
                }}>→</div>
              </div>
              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => onOpenChat(s)} style={{
                    background: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`,
                    color: TEAL, fontSize: 12, fontWeight: 500,
                    padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tools grid */}
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 10 }}>
          Tools
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, marginBottom: 20,
        }} className="tools-grid">
          {[
            { emoji: '🔬', title: 'Ingredient Decoder', desc: 'Decode any ingredient list', onClick: onOpenIngredients },
            { emoji: '⚗️', title: 'Check Products', desc: 'Find conflicts & layering order', onClick: onOpenCheckProducts },
            { emoji: '🕵️', title: 'Reality Check', desc: 'Is that Instagram product a scam?', onClick: onOpenScamCheck },
          ].map((tool) => (
            <div key={tool.title}
              onClick={tool.onClick}
              style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
                padding: '16px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 8,
                transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = TEAL;
                el.style.boxShadow = `0 4px 16px rgba(13,148,136,0.12)`;
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = '#e2e8f0';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 24 }}>{tool.emoji}</span>
                <span style={{
                  background: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`,
                  color: TEAL, fontSize: 9, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 8, letterSpacing: '0.2px',
                }}>FREE</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{tool.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{tool.desc}</div>
              <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginTop: 'auto' }}>Open →</div>
            </div>
          ))}
        </div>

        {/* Routine preview */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
            My Routine
          </div>
          <button onClick={onOpenRoutine} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: TEAL, fontWeight: 600, fontFamily: 'inherit',
          }}>Edit →</button>
        </div>

        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '16px', marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {displayRoutine.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No routine yet</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>Add your products to track your routine</div>
              <button onClick={onOpenRoutine} style={{
                padding: '8px 20px', background: TEAL, border: 'none',
                borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Build my routine</button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700,
                color: TEAL, background: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`,
                padding: '3px 10px', borderRadius: 20, marginBottom: 12,
              }}>{routineLabel} · {displayRoutine.length} step{displayRoutine.length !== 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {displayRoutine.slice(0, 4).map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', background: '#f8fafc', borderRadius: 10,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, background: TEAL,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{p.type || ''}</div>
                  </div>
                ))}
                {displayRoutine.length > 4 && (
                  <button onClick={onOpenRoutine} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: '#94a3b8', fontFamily: 'inherit', textAlign: 'left', padding: '4px 0',
                  }}>+{displayRoutine.length - 4} more…</button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile card */}
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginBottom: 10 }}>
          My Profile
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${TEAL} 0%, #0a7a70 100%)`,
          borderRadius: 16, padding: '18px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: `0 4px 16px rgba(13,148,136,0.2)`,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>🧴</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
              {profile.skinType} skin · {profile.concerns?.slice(0, 2).join(', ')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
              {profile.experience} · {profile.age}{profile.sensitivities && profile.sensitivities !== 'None' ? ` · ${profile.sensitivities}` : ''}
            </div>
          </div>
          <button onClick={onEditProfile} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 8, padding: '7px 14px',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}>Edit</button>
        </div>

      </div>

      <style>{`
        @media (max-width: 600px) {
          .tools-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
