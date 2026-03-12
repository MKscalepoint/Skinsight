'use client';

import { useState, useRef } from 'react';
import { UserProfile } from '@/types';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#f0fdfa';

interface IngredientDecoderProps {
  profile: UserProfile | null;
  onClose: () => void;
}

interface DecoderResult {
  productName: string;
  analysis: string;
}

export default function IngredientDecoder({ profile, onClose }: IngredientDecoderProps) {
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecoderResult | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'photo'>('text');
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

  const handleDecode = async () => {
    if (inputMode === 'text' && !ingredients.trim()) return;
    if (inputMode === 'photo' && !photo) return;
    setLoading(true);
    setResult(null);

    const profileContext = profile
      ? `User has ${profile.skinType} skin, concerns: ${profile.concerns?.join(', ')}, sensitivities: ${profile.sensitivities || 'none'}.`
      : '';

    try {
      let messages;
      if (inputMode === 'photo' && photo) {
        messages = [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo } },
            { type: 'text', text: `You are Skinsight, an expert skincare advisor. The user has uploaded a photo of a product ingredient list.\n\n${profileContext}\nProduct: ${productName || 'Unknown product'}\n\nFirst extract the ingredient list from the image, then provide a structured analysis:\n1. **Key active ingredients** — what they do\n2. **Ingredients to note** — issues for this skin type/sensitivities\n3. **Best for** — skin types and concerns\n4. **Overall verdict** — well-formulated?\n5. **Compatibility tip** — layering advice\n\nIf the image is unclear, say so and suggest the user try the paste text option. Bold key ingredient names.` }
          ]
        }];
      } else {
        messages = [{
          role: 'user',
          content: `You are Skinsight, an expert skincare advisor.\n\n${profileContext}\nProduct: ${productName || 'Unknown product'}\nIngredients: ${ingredients}\n\nProvide a structured analysis:\n1. **Key active ingredients** — what they do\n2. **Ingredients to note** — issues for this skin type/sensitivities\n3. **Best for** — skin types and concerns\n4. **Overall verdict** — well-formulated? Marketing hype vs real actives?\n5. **Compatibility tip** — layering advice\n\nBe honest, specific, practical. Bold key ingredient names.`
        }];
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, profile }),
      });
      const data = await res.json();
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || 'Unable to analyse ingredients.';
      setResult({ productName: productName || 'Your product', analysis: text });
    } catch {
      setResult({ productName: 'Error', analysis: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setResult(null); setIngredients(''); setProductName(''); setPhoto(null); setPhotoName(''); };

  function formatAnalysis(text: string) {
    return text.split('\n').map((line, i) => {
      const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      if (line.trim().startsWith('- ')) return <li key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: html.trim().slice(2) }} />;
      if (/^\d+\./.test(line.trim())) return <li key={i} style={{ marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: html.trim().replace(/^\d+\.\s*/, '') }} />;
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ margin: '0 0 4px' }} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  }

  const canSubmit = inputMode === 'text' ? !!ingredients.trim() : !!photo;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: TEAL_LIGHT, border: `1px solid ${TEAL}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔬</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Ingredient Decoder</h2>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Paste an ingredient list or photograph the product packaging</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {!result ? (
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
                    {mode === 'text' ? '📋 Paste text' : '📷 Upload photo'}
                  </button>
                ))}
              </div>

              {/* Product name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Product name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. COSRX Advanced Snail 96 Mucin Power Essence"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Text mode */}
              {inputMode === 'text' && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Ingredient list <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
                      placeholder="Paste the full ingredient list here — copy from the product packaging, website, or an app like INCI Beauty or CosDNA..."
                      rows={6} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#0f172a', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                    💡 <strong>Tip:</strong> Find ingredient lists on brand websites, product packaging, or apps like INCI Beauty, CosDNA, or Think Dirty.
                  </div>
                </>
              )}

              {/* Photo mode */}
              {inputMode === 'photo' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Photo of ingredient list <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                  {!photo ? (
                    <button onClick={() => fileRef.current?.click()} style={{
                      width: '100%', padding: '32px 20px', border: '2px dashed #e2e8f0', borderRadius: 12,
                      background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => { (e.currentTarget).style.borderColor = TEAL; (e.currentTarget).style.background = TEAL_LIGHT; }}
                      onMouseLeave={e => { (e.currentTarget).style.borderColor = '#e2e8f0'; (e.currentTarget).style.background = '#fafafa'; }}
                    >
                      <span style={{ fontSize: 36 }}>📷</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Take a photo or upload from library</span>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>Point your camera at the ingredient list on the packaging</span>
                    </button>
                  ) : (
                    <div style={{ border: `1.5px solid ${TEAL}44`, borderRadius: 12, padding: '14px 16px', background: TEAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
                    💡 Make sure the text is well-lit and in focus. If results are poor, try pasting the text instead.
                  </p>
                </div>
              )}

              <button onClick={handleDecode} disabled={!canSubmit || loading} style={{
                padding: '13px', background: canSubmit && !loading ? TEAL : '#e2e8f0',
                color: canSubmit && !loading ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: canSubmit && !loading ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}>
                {loading ? 'Analysing ingredients…' : 'Decode ingredients →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{result.productName}</h3>
                <button onClick={resetForm} style={{ padding: '6px 12px', background: TEAL_LIGHT, border: `1px solid ${TEAL}33`, borderRadius: 8, fontSize: 13, color: TEAL, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Decode another</button>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1e293b', listStylePosition: 'inside' }}>
                {formatAnalysis(result.analysis)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
