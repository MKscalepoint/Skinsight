'use client';

import { useState, useRef } from 'react';
import { UserProfile } from '@/types';

const TEAL = '#b5737a';
const TEAL_LIGHT = '#fdf2f3';
const TEAL_MID = '#f2d0d3';

interface ScamCheckProps {
  profile: UserProfile | null;
  onClose: () => void;
}

interface Verdict {
  score: number; // 0-100 legitimacy score
  verdict: 'legit' | 'overpriced' | 'misleading' | 'scam';
  summary: string;
  claimsVsReality: string;
  ingredientTruth: string;
  redFlags: string[];
  greenFlags: string[];
  alternatives: string;
  bottomLine: string;
}

const VERDICT_CONFIG = {
  legit: { label: 'Looks Legit', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', emoji: '✅' },
  overpriced: { label: 'Overpriced', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', emoji: '💸' },
  misleading: { label: 'Misleading Claims', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', emoji: '⚠️' },
  scam: { label: 'Likely a Scam', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🚨' },
};

export default function ScamCheck({ profile, onClose }: ScamCheckProps) {
  const [productName, setProductName] = useState('');
  const [brandClaim, setBrandClaim] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'photo'>('text');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setPhoto(res.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleCheck = async () => {
    if (!productName.trim() && !photo) return;
    setLoading(true);
    setVerdict(null);
    setError('');

    const prompt = `You are Skinsight's product authenticity expert. A user wants to know if a skincare product is legitimate or potentially a scam/misleading.

Product name: ${productName || 'Unknown (see photo)'}
Brand claims / ad copy: ${brandClaim || 'Not provided'}
Ingredient list: ${ingredients || 'Not provided'}
${profile ? `User skin type: ${profile.skinType}, concerns: ${profile.concerns?.join(', ')}` : ''}

Analyse this product thoroughly and respond ONLY with a valid JSON object in exactly this format (no markdown, no explanation outside the JSON):

{
  "score": <number 0-100 where 100 = completely legitimate, 0 = definite scam>,
  "verdict": <"legit" | "overpriced" | "misleading" | "scam">,
  "summary": "<1-2 sentence plain English verdict>",
  "claimsVsReality": "<What they claim vs what the ingredients actually do. Be specific.>",
  "ingredientTruth": "<Analysis of key ingredients — are the hero ingredients actually present in meaningful amounts? Any red flags in the formulation?>",
  "redFlags": ["<flag 1>", "<flag 2>", "<flag 3 if applicable>"],
  "greenFlags": ["<flag 1 if any>", "<flag 2 if any>"],
  "alternatives": "<Suggest 1-2 better value or more honest alternatives that do the same job, if relevant>",
  "bottomLine": "<One punchy sentence — should they buy it or not?>"
}

Be honest and direct. Do not give benefit of the doubt to vague claims. If ingredients aren't provided, base your assessment on the product name, brand claims, and any known information about this product. If it's a brand you don't recognise, say so clearly.`;

    try {
      let messages;

      if (inputMode === 'photo' && photo) {
        messages = [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo } },
            { type: 'text', text: prompt + '\n\nAlso extract any relevant product information visible in the image.' }
          ]
        }];
      } else {
        messages = [{ role: 'user', content: prompt }];
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, profile }),
      });

      const data = await res.json();
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as Verdict;
      setVerdict(parsed);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setVerdict(null);
    setProductName('');
    setBrandClaim('');
    setIngredients('');
    setPhoto(null);
    setPhotoName('');
    setError('');
  };

  const canSubmit = productName.trim() || photo;
  const vc = verdict ? VERDICT_CONFIG[verdict.verdict] : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
        maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: TEAL_LIGHT,
                border: `1px solid ${TEAL_MID}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>🕵️</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Reality Check</h2>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
              Is that Instagram skincare product actually worth it?
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {!verdict ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Mode toggle */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
                {(['text', 'photo'] as const).map(mode => (
                  <button key={mode} onClick={() => setInputMode(mode)} style={{
                    flex: 1, padding: '8px', border: 'none', borderRadius: 8,
                    background: inputMode === mode ? '#fff' : 'transparent',
                    color: inputMode === mode ? '#0f172a' : '#64748b',
                    fontWeight: inputMode === mode ? 600 : 400,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: inputMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {mode === 'text' ? '🔍 Enter product details' : '📷 Photo the ad or product'}
                  </button>
                ))}
              </div>

              {/* Product name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Product name {inputMode === 'text' && <span style={{ color: '#ef4444' }}>*</span>}
                  {inputMode === 'photo' && <span style={{ color: '#94a3b8', fontWeight: 400 }}> (optional if photo is clear)</span>}
                </label>
                <input value={productName} onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. GlowLab Pro Stem Cell Regenerating Serum"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Photo mode */}
              {inputMode === 'photo' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Photo of product or ad
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment"
                    onChange={handlePhotoSelect} style={{ display: 'none' }} />
                  {!photo ? (
                    <button onClick={() => fileRef.current?.click()} style={{
                      width: '100%', padding: '28px 20px', border: '2px dashed #e2e8f0',
                      borderRadius: 12, background: '#fafafa', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => { (e.currentTarget).style.borderColor = TEAL; (e.currentTarget).style.background = TEAL_LIGHT; }}
                      onMouseLeave={e => { (e.currentTarget).style.borderColor = '#e2e8f0'; (e.currentTarget).style.background = '#fafafa'; }}
                    >
                      <span style={{ fontSize: 32 }}>📷</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Photo the product, packaging or Instagram ad</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Works with screenshots too</span>
                    </button>
                  ) : (
                    <div style={{ border: `1.5px solid ${TEAL}44`, borderRadius: 12, padding: '14px 16px', background: TEAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20, color: TEAL }}>✓</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Photo ready</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{photoName}</div>
                        </div>
                      </div>
                      <button onClick={() => { setPhoto(null); setPhotoName(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: TEAL, fontFamily: 'inherit', fontWeight: 600 }}>Change</button>
                    </div>
                  )}
                </div>
              )}

              {/* Brand claims */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  What does the brand claim? <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional but helps)</span>
                </label>
                <textarea value={brandClaim} onChange={e => setBrandClaim(e.target.value)}
                  placeholder="e.g. 'Reduces wrinkles by 87% in 7 days', 'clinically proven stem cell technology', 'as seen on Dragon's Den'…"
                  rows={3} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Ingredients */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Ingredient list <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — makes analysis much more accurate)</span>
                </label>
                <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
                  placeholder="Paste from packaging, website, or an app like INCI Beauty…"
                  rows={3} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                💡 <strong>Tip:</strong> Screenshot an Instagram ad and upload it directly — Skinsight will read the claims and cross-reference them against skincare science.
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}

              <button onClick={handleCheck} disabled={!canSubmit || loading} style={{
                padding: '13px', background: canSubmit && !loading ? TEAL : '#e2e8f0',
                color: canSubmit && !loading ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: canSubmit && !loading ? 'pointer' : 'default',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}>
                {loading ? 'Investigating…' : '🕵️ Run reality check →'}
              </button>
            </div>

          ) : (
            <div>
              {/* Verdict header */}
              <div style={{
                background: vc!.bg, border: `1px solid ${vc!.border}`,
                borderRadius: 16, padding: '20px',
                marginBottom: 20, borderLeft: `4px solid ${vc!.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{vc!.emoji}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: vc!.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verdict</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{vc!.label}</div>
                    </div>
                  </div>
                  {/* Legitimacy score */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: vc!.color }}>{verdict.score}</div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>/ 100</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{verdict.summary}</p>
              </div>

              {/* Claims vs Reality */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📢 Claims vs Reality
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                  {verdict.claimsVsReality}
                </div>
              </div>

              {/* Ingredient truth */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔬 Ingredient Truth
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                  {verdict.ingredientTruth}
                </div>
              </div>

              {/* Red & green flags */}
              <div style={{ display: 'grid', gridTemplateColumns: verdict.greenFlags?.length ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>
                {verdict.redFlags?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>🚩 Red Flags</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {verdict.redFlags.map((f, i) => (
                        <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {verdict.greenFlags?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>✅ Green Flags</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {verdict.greenFlags.map((f, i) => (
                        <div key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alternatives */}
              {verdict.alternatives && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>💡 Better Alternatives</div>
                  <div style={{ background: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                    {verdict.alternatives}
                  </div>
                </div>
              )}

              {/* Bottom line */}
              <div style={{ background: '#0f172a', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Bottom Line</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.5 }}>{verdict.bottomLine}</div>
              </div>

              <button onClick={reset} style={{
                width: '100%', padding: '12px', background: TEAL_LIGHT,
                border: `1px solid ${TEAL_MID}`, borderRadius: 10,
                fontSize: 14, color: TEAL, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Check another product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
