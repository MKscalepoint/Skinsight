'use client';

import { useState } from 'react';
import { UserProfile, ONBOARDING_QUESTIONS } from '@/types';

const TEAL = '#b5737a';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onHome: () => void;
  initialProfile?: UserProfile | null;
  editMode?: boolean;
}

export default function Onboarding({ onComplete, onHome, initialProfile, editMode }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserProfile>>(initialProfile || {});
  const [multiSelected, setMultiSelected] = useState<string[]>(
    (initialProfile?.concerns as string[]) || []
  );
  const [textValue, setTextValue] = useState(initialProfile?.sensitivities || '');

  const question = ONBOARDING_QUESTIONS[step];
  const isLast = step === ONBOARDING_QUESTIONS.length - 1;
  const progress = (step / ONBOARDING_QUESTIONS.length) * 100;

  const advance = (updated: Partial<UserProfile>) => {
    if (!isLast) {
      setStep(s => s + 1);
      // Pre-fill next question if editing
      const nextQ = ONBOARDING_QUESTIONS[step + 1];
      if (nextQ.type === 'multi') setMultiSelected((updated[nextQ.field] as string[]) || []);
      if (nextQ.type === 'text') setTextValue((updated[nextQ.field] as string) || '');
    } else {
      onComplete({ ...updated, completed: true } as UserProfile);
    }
  };

  const handleSingle = (option: string) => {
    const updated = { ...answers, [question.field]: option };
    setAnswers(updated);
    setTimeout(() => advance(updated), 250);
  };

  const handleMultiNext = () => {
    const updated = { ...answers, [question.field]: multiSelected };
    setAnswers(updated);
    advance(updated);
  };

  const handleTextNext = (skip = false) => {
    const updated = { ...answers, [question.field]: skip ? 'None' : (textValue.trim() || 'None') };
    setAnswers(updated);
    advance(updated);
  };

  const currentValue = answers[question.field];

  return (
    <div style={{
      minHeight: '100vh', background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <button onClick={onHome} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: TEAL,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 700,
          }}>S</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Skinsight</span>
        </button>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          {editMode ? 'Editing your profile' : 'Building your skin profile'}
        </span>
      </nav>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Progress */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>
                QUESTION {step + 1} OF {ONBOARDING_QUESTIONS.length}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(progress)}% complete</span>
            </div>
            <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: TEAL, borderRadius: 2,
                transition: 'width 0.4s ease',
              }} />
            </div>
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {ONBOARDING_QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  height: 4, flex: 1, borderRadius: 2,
                  background: i < step ? TEAL : i === step ? TEAL : '#e2e8f0',
                  opacity: i === step ? 1 : i < step ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          </div>

          {/* Question */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700, color: '#0f172a',
              margin: '0 0 8px', lineHeight: 1.3, letterSpacing: '-0.3px',
            }}>
              {question.question}
            </h2>
            {question.subtitle && (
              <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {question.subtitle}
              </p>
            )}
          </div>

          {/* Single select */}
          {question.type === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {question.options?.map(opt => {
                const selected = currentValue === opt;
                return (
                  <button key={opt} onClick={() => handleSingle(opt)} style={{
                    padding: '14px 20px',
                    background: selected ? '#f0fdfa' : '#fafafa',
                    border: `1.5px solid ${selected ? TEAL : '#e2e8f0'}`,
                    borderRadius: 12, textAlign: 'left',
                    fontSize: 15, color: selected ? TEAL : '#1a1a2e',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', fontWeight: selected ? 600 : 500,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                    onMouseEnter={e => { if (!selected) { (e.currentTarget).style.borderColor = TEAL; (e.currentTarget).style.background = '#f0fdfa'; } }}
                    onMouseLeave={e => { if (!selected) { (e.currentTarget).style.borderColor = '#e2e8f0'; (e.currentTarget).style.background = '#fafafa'; } }}
                  >
                    {opt}
                    {selected && <span style={{ color: TEAL, fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Multi select */}
          {question.type === 'multi' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {question.options?.map(opt => {
                  const sel = multiSelected.includes(opt);
                  return (
                    <button key={opt} onClick={() => setMultiSelected(prev =>
                      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
                    )} style={{
                      padding: '13px 20px',
                      background: sel ? '#f0fdfa' : '#fafafa',
                      border: `1.5px solid ${sel ? TEAL : '#e2e8f0'}`,
                      borderRadius: 12, textAlign: 'left',
                      fontSize: 15, color: sel ? TEAL : '#1a1a2e',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontFamily: 'inherit', fontWeight: sel ? 600 : 500,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      {opt}
                      {sel && <span style={{ color: TEAL, fontSize: 16 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={handleMultiNext} disabled={multiSelected.length === 0} style={{
                width: '100%', padding: '14px',
                background: multiSelected.length > 0 ? TEAL : '#e2e8f0',
                color: multiSelected.length > 0 ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: multiSelected.length > 0 ? 'pointer' : 'default',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}>
                Continue → {multiSelected.length > 0 && `(${multiSelected.length} selected)`}
              </button>
            </div>
          )}

          {/* Text */}
          {question.type === 'text' && (
            <div>
              <textarea
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                placeholder="e.g. fragrance, lanolin, retinol — or leave blank if none"
                rows={3}
                style={{
                  width: '100%', padding: '14px 16px',
                  border: '1.5px solid #e2e8f0', borderRadius: 12,
                  fontSize: 15, color: '#0f172a', fontFamily: 'inherit',
                  resize: 'none', outline: 'none', background: '#fafafa',
                  boxSizing: 'border-box', marginBottom: 12, lineHeight: 1.6,
                }}
                onFocus={e => e.target.style.borderColor = TEAL}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button onClick={() => handleTextNext(false)} style={{
                width: '100%', padding: '14px',
                background: TEAL, color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
              }}>
                {isLast ? 'Complete my profile →' : 'Continue →'}
              </button>
              <button onClick={() => handleTextNext(true)} style={{
                width: '100%', padding: '10px', background: 'transparent',
                color: '#94a3b8', border: 'none', fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Skip — no known sensitivities
              </button>
            </div>
          )}

          {/* Back */}
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              marginTop: 20, background: 'none', border: 'none',
              color: '#94a3b8', fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', display: 'block', width: '100%', textAlign: 'center',
            }}>
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
