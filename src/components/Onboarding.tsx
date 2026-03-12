'use client';

import { useState } from 'react';
import { UserProfile, ONBOARDING_QUESTIONS } from '@/types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserProfile>>({});
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');

  const question = ONBOARDING_QUESTIONS[step];
  const isLast = step === ONBOARDING_QUESTIONS.length - 1;
  const progress = ((step) / ONBOARDING_QUESTIONS.length) * 100;

  const handleSingle = (option: string) => {
    const updated = { ...answers, [question.field]: option };
    setAnswers(updated);
    if (!isLast) {
      setTimeout(() => setStep(s => s + 1), 300);
    } else {
      onComplete({ ...updated, completed: true } as UserProfile);
    }
  };

  const handleMultiToggle = (option: string) => {
    setMultiSelected(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const handleMultiNext = () => {
    const updated = { ...answers, [question.field]: multiSelected };
    setAnswers(updated);
    setMultiSelected([]);
    if (!isLast) setStep(s => s + 1);
    else onComplete({ ...updated, completed: true } as UserProfile);
  };

  const handleTextNext = () => {
    const updated = { ...answers, [question.field]: textValue || 'None' };
    setAnswers(updated);
    onComplete({ ...updated, completed: true } as UserProfile);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>◎</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.5px' }}>
              Glow Guide
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Personalised skincare intelligence</p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              Question {step + 1} of {ONBOARDING_QUESTIONS.length}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1a1a2e, #4a5568)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 24, fontWeight: 700, color: '#1a1a2e',
            margin: '0 0 8px', lineHeight: 1.3, letterSpacing: '-0.3px'
          }}>
            {question.question}
          </h2>
          {question.type === 'multi' && (
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Select all that apply</p>
          )}
        </div>

        {/* Options */}
        {question.type === 'single' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options?.map(opt => (
              <button key={opt} onClick={() => handleSingle(opt)} style={{
                padding: '14px 20px',
                background: '#fafafa',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                textAlign: 'left',
                fontSize: 15,
                color: '#1a1a2e',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.borderColor = '#1a1a2e';
                  (e.target as HTMLButtonElement).style.background = '#f8faff';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.borderColor = '#e2e8f0';
                  (e.target as HTMLButtonElement).style.background = '#fafafa';
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {question.type === 'multi' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {question.options?.map(opt => {
                const selected = multiSelected.includes(opt);
                return (
                  <button key={opt} onClick={() => handleMultiToggle(opt)} style={{
                    padding: '14px 20px',
                    background: selected ? '#1a1a2e' : '#fafafa',
                    border: `1.5px solid ${selected ? '#1a1a2e' : '#e2e8f0'}`,
                    borderRadius: 12,
                    textAlign: 'left',
                    fontSize: 15,
                    color: selected ? '#ffffff' : '#1a1a2e',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    {opt}
                    {selected && <span style={{ fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={handleMultiNext} disabled={multiSelected.length === 0} style={{
              width: '100%', padding: '14px',
              background: multiSelected.length > 0 ? '#1a1a2e' : '#e2e8f0',
              color: multiSelected.length > 0 ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: multiSelected.length > 0 ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'all 0.15s ease',
            }}>
              Continue →
            </button>
          </div>
        )}

        {question.type === 'text' && (
          <div>
            <textarea
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder="e.g. fragrance, lanolin, retinol — or type 'none'"
              rows={3}
              style={{
                width: '100%', padding: '14px 16px',
                border: '1.5px solid #e2e8f0', borderRadius: 12,
                fontSize: 15, color: '#1a1a2e', fontFamily: 'inherit',
                resize: 'none', outline: 'none', background: '#fafafa',
                boxSizing: 'border-box', marginBottom: 16,
                lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = '#1a1a2e'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button onClick={handleTextNext} style={{
              width: '100%', padding: '14px',
              background: '#1a1a2e', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {isLast ? 'Start my consultation →' : 'Continue →'}
            </button>
            <button onClick={() => handleTextNext()} style={{
              width: '100%', padding: '10px', marginTop: 8,
              background: 'transparent', color: '#94a3b8',
              border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Skip this question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
