'use client';

import { useState } from 'react';
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

  const handleDecode = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setResult(null);

    const profileContext = profile ? `User has ${profile.skinType} skin, concerns: ${profile.concerns?.join(', ')}, sensitivities: ${profile.sensitivities || 'none'}.` : '';

    const prompt = `You are Skinsight, an expert skincare advisor. Decode and explain this ingredient list for the user.

${profileContext}

Product: ${productName || 'Unknown product'}
Ingredients: ${ingredients}

Please provide a clear, structured analysis covering:
1. **Key active ingredients** — what they do and why they matter
2. **Ingredients to note** — anything that could be an issue for this user's skin type or sensitivities  
3. **What this product is best for** — skin types and concerns it suits
4. **Overall verdict** — is this a well-formulated product? Any marketing hype vs real actives?
5. **Compatibility tip** — one key thing to know when layering this with other products

Be honest, specific, and practical. Bold key ingredient names.`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          profile,
        }),
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

  function formatAnalysis(text: string) {
    return text.split('\n').map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      if (line.trim().startsWith('- ')) return <li key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: html.trim().slice(2) }} />;
      if (/^\d+\./.test(line.trim())) return <li key={i} style={{ marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: html.trim().replace(/^\d+\.\s*/, '') }} />;
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ margin: '0 0 4px' }} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: TEAL_LIGHT,
                border: `1px solid ${TEAL}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>🔬</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Ingredient Decoder
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
              Paste any ingredient list and get a plain-English breakdown
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#64748b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {!result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Product name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. COSRX Advanced Snail 96 Mucin Power Essence"
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    fontSize: 14, fontFamily: 'inherit', color: '#0f172a',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Ingredient list <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder="Paste the full ingredient list here — copy from the product packaging, website, or app like INCI Beauty or CosDNA..."
                  rows={6}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    fontSize: 14, fontFamily: 'inherit', color: '#0f172a',
                    outline: 'none', resize: 'vertical', lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = TEAL}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '12px 14px',
                fontSize: 13, color: '#64748b', lineHeight: 1.5,
              }}>
                💡 <strong>Tip:</strong> Find ingredient lists on brand websites, product packaging, or apps like INCI Beauty, CosDNA, or Think Dirty.
              </div>

              <button
                onClick={handleDecode}
                disabled={!ingredients.trim() || loading}
                style={{
                  padding: '13px',
                  background: ingredients.trim() && !loading ? TEAL : '#e2e8f0',
                  color: ingredients.trim() && !loading ? '#fff' : '#94a3b8',
                  border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                  cursor: ingredients.trim() && !loading ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'all 0.15s ease',
                }}
              >
                {loading ? 'Analysing ingredients…' : 'Decode ingredients →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                  {result.productName}
                </h3>
                <button onClick={() => { setResult(null); setIngredients(''); setProductName(''); }} style={{
                  padding: '6px 12px', background: TEAL_LIGHT,
                  border: `1px solid ${TEAL}33`, borderRadius: 8,
                  fontSize: 13, color: TEAL, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 600,
                }}>
                  Decode another
                </button>
              </div>
              <div style={{
                fontSize: 15, lineHeight: 1.7, color: '#1e293b',
                listStylePosition: 'inside',
              }}>
                {formatAnalysis(result.analysis)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
