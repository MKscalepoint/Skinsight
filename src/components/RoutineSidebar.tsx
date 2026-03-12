'use client';

import { useState } from 'react';
import { RoutineProduct } from '@/types';
import { generateId } from '@/lib/storage';

interface RoutineSidebarProps {
  routine: RoutineProduct[];
  onUpdate: (routine: RoutineProduct[]) => void;
  onClose: () => void;
}

const PRODUCT_TYPES = [
  'Cleanser', 'Toner', 'Essence', 'Serum', 'Eye Cream',
  'Moisturiser', 'Face Oil', 'SPF / Sunscreen', 'Exfoliant', 'Mask', 'Other'
];

export default function RoutineSidebar({ routine, onUpdate, onClose }: RoutineSidebarProps) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Serum', timeOfDay: 'AM' as 'AM' | 'PM' | 'Both', notes: '' });

  const amProducts = routine.filter(p => p.timeOfDay === 'AM' || p.timeOfDay === 'Both')
    .sort((a, b) => a.step - b.step);
  const pmProducts = routine.filter(p => p.timeOfDay === 'PM' || p.timeOfDay === 'Both')
    .sort((a, b) => a.step - b.step);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newProduct: RoutineProduct = {
      id: generateId(),
      name: form.name.trim(),
      type: form.type,
      timeOfDay: form.timeOfDay,
      step: routine.length + 1,
      notes: form.notes.trim() || undefined,
    };
    onUpdate([...routine, newProduct]);
    setForm({ name: '', type: 'Serum', timeOfDay: 'AM', notes: '' });
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onUpdate(routine.filter(p => p.id !== id));
  };

  const ProductList = ({ products, label }: { products: RoutineProduct[]; label: string }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '1px',
        color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10
      }}>{label}</div>
      {products.length === 0 ? (
        <p style={{ fontSize: 13, color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>
          No products added yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {products.map((p, i) => (
            <div key={p.id} style={{
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: '#1a1a2e', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.type}</div>
                {p.notes && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{p.notes}</div>
                )}
              </div>
              <button onClick={() => handleRemove(p.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#cbd5e1', fontSize: 16, padding: 0, flexShrink: 0,
                lineHeight: 1,
              }}
                onMouseEnter={e => (e.target as HTMLButtonElement).style.color = '#ef4444'}
                onMouseLeave={e => (e.target as HTMLButtonElement).style.color = '#cbd5e1'}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      width: 300, height: '100vh',
      background: '#ffffff',
      borderLeft: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>My Routine</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {routine.length} product{routine.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: '#f1f5f9', border: 'none', borderRadius: 8,
          width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#64748b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>

      {/* Product lists */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <ProductList products={amProducts} label="☀ Morning" />
        <ProductList products={pmProducts} label="☾ Evening" />
      </div>

      {/* Add product */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
        {!adding ? (
          <button onClick={() => setAdding(true)} style={{
            width: '100%', padding: '11px',
            background: '#1a1a2e', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + Add Product
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Product name"
              style={{
                padding: '9px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                color: '#1a1a2e', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#1a1a2e'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{
                padding: '9px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                color: '#1a1a2e', background: '#fff', outline: 'none',
              }}>
              {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={form.timeOfDay} onChange={e => setForm(f => ({ ...f, timeOfDay: e.target.value as 'AM' | 'PM' | 'Both' }))}
              style={{
                padding: '9px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                color: '#1a1a2e', background: '#fff', outline: 'none',
              }}>
              <option value="AM">Morning (AM)</option>
              <option value="PM">Evening (PM)</option>
              <option value="Both">Both</option>
            </select>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes (optional)"
              style={{
                padding: '9px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                color: '#1a1a2e', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#1a1a2e'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={{
                flex: 1, padding: '9px', background: '#f1f5f9',
                border: 'none', borderRadius: 8, fontSize: 14, color: '#64748b',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button onClick={handleAdd} style={{
                flex: 1, padding: '9px', background: '#1a1a2e',
                border: 'none', borderRadius: 8, fontSize: 14, color: '#fff',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
