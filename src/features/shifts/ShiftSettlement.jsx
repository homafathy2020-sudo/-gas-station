import { useState } from 'react';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { db } from '../../firebase';

// ==================== SHIFT SETTLEMENT COMPONENT ====================
export const ShiftSettlement = ({ worker, ownerId }) => {
  if (!ownerId) return null;

  const [tab, setTab] = useState('calc');
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');
  const [price, setPrice] = useState('');
  const [received, setReceived] = useState('');
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('morning');
  const [fuelType, setFuelType] = useState('بنزين 92');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`shift_history_${ownerId}_${worker.id}`) || '[]');
    } catch { return []; }
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const shiftLabels = { morning: '🌅 صباحية', evening: '🌆 مسائية', night: '🌙 ليلية' };
  const fuelTypes = ['بنزين 80', 'بنزين 92', 'بنزين 95', 'سولار'];

  const validate = () => {
    const e = {};
    if (!morning) e.morning = 'مطلوب';
    if (!evening) e.evening = 'مطلوب';
    if (!price || parseFloat(price) <= 0) e.price = 'مطلوب';
    if (!received) e.received = 'مطلوب';
    if (morning && evening && parseFloat(evening) <= parseFloat(morning)) e.evening = 'يجب أن تكون أكبر من البداية';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const calculate = () => {
    if (!validate()) return;
    setSaved(false);
    const qty = parseFloat(evening) - parseFloat(morning);
    const required = qty * parseFloat(price);
    const recv = parseFloat(received);
    const diff = recv - required;
    setResult({ qty, required, recv, diff, date: shiftDate, shiftType, fuelType, note });
  };

  const saveToHistory = () => {
    if (!result) return;
    const entry = {
      id: Date.now(), ...result,
      morning: parseFloat(morning), evening: parseFloat(evening), price: parseFloat(price),
      workerName: worker.name, savedAt: new Date().toLocaleString('ar-EG'),
    };
    const newHistory = [entry, ...history].slice(0, 50);
    setHistory(newHistory);
    try { localStorage.setItem(`shift_history_${ownerId}_${worker.id}`, JSON.stringify(newHistory)); } catch {}
    setSaved(true);
  };

  const deleteEntry = (id) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    try { localStorage.setItem(`shift_history_${ownerId}_${worker.id}`, JSON.stringify(newHistory)); } catch {}
  };

  const reset = () => {
    setMorning(''); setEvening(''); setReceived('');
    setNote(''); setResult(null); setSaved(false); setErrors({});
  };

  const stats = history.length > 0 ? {
    totalShifts: history.length,
    totalSurplus: history.filter(h => h.diff > 0).reduce((s, h) => s + h.diff, 0),
    totalDeficit: history.filter(h => h.diff < 0).reduce((s, h) => s + Math.abs(h.diff), 0),
  } : null;

  const inp = (field) => ({
    width: '100%', padding: '10px 13px',
    background: errors[field] ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${errors[field] ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, color: 'var(--text)', fontFamily: "'Cairo', sans-serif",
    fontSize: 14, outline: 'none', textAlign: 'right', transition: 'all 0.2s',
  });

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, marginBottom: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⛽</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>تصفية الوردية</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{worker.name} · {worker.pump}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10 }}>
          {[['calc', '🧮 الحساب'], ['history', `📋 السجل${history.length > 0 ? ` (${history.length})` : ''}`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, background: tab === key ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent', color: tab === key ? '#0f172a' : 'var(--text-muted)', transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ===== TAB: الحساب ===== */}
      {tab === 'calc' && (
        <div style={{ padding: '20px 22px' }}>
          {/* التاريخ + نوع الوردية */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 تاريخ الوردية</div>
              <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={inp()} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🕐 نوع الوردية</div>
              <select value={shiftType} onChange={e => setShiftType(e.target.value)} style={inp()}>
                <option value="morning">🌅 صباحية</option>
                <option value="evening">🌆 مسائية</option>
                <option value="night">🌙 ليلية</option>
              </select>
            </div>
          </div>

          {/* قراءات العداد */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ قراءات العداد (لتر)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>قراءة البداية</div>
                <input type="number" min="0" max="99999999" placeholder="مثال: 12450" value={morning} onChange={e => { const v = e.target.value; if (v === '' || parseFloat(v) <= 99999999) { setMorning(v); setErrors(p => ({ ...p, morning: '' })); } }} style={inp('morning')} />
                {errors.morning && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.morning}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>قراءة النهاية</div>
                <input type="number" min="0" max="99999999" placeholder="مثال: 15320" value={evening} onChange={e => { const v = e.target.value; if (v === '' || parseFloat(v) <= 99999999) { setEvening(v); setErrors(p => ({ ...p, evening: '' })); } }} style={inp('evening')} />
                {errors.evening && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.evening}</div>}
              </div>
            </div>
            {morning && evening && parseFloat(evening) > parseFloat(morning) && (
              <div style={{ marginTop: 8, padding: '7px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                ⚡ الكمية: {(parseFloat(evening) - parseFloat(morning)).toFixed(2)} لتر
              </div>
            )}
          </div>

          {/* نوع الوقود + السعر */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛢️ نوع الوقود</div>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={inp()}>
                {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 سعر اللتر (ج.م)</div>
              <input type="number" step="0.01" placeholder="مثال: 8.75" value={price} onChange={e => { setPrice(e.target.value); setErrors(p => ({ ...p, price: '' })); }} style={inp('price')} />
              {errors.price && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.price}</div>}
            </div>
          </div>

          {/* الواصل من العامل */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💵 المبلغ الواصل من العامل (ج.م)</div>
            <input type="number" placeholder="المبلغ الفعلي اللي سلّمه العامل" value={received} onChange={e => { setReceived(e.target.value); setErrors(p => ({ ...p, received: '' })); }} style={{ ...inp('received'), fontSize: 15, padding: '12px 15px' }} />
            {errors.received && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.received}</div>}
          </div>

          {/* ملاحظة */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 ملاحظة (اختياري)</div>
            <input type="text" placeholder="مثال: مشكلة في الطلمبة..." value={note} onChange={e => setNote(e.target.value)} style={inp()} />
          </div>

          {/* أزرار */}
          <div style={{ display: 'flex', gap: 10, marginBottom: result ? 20 : 0 }}>
            <button onClick={calculate} style={{ flex: 1, padding: '11px 20px', borderRadius: 11, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: 800 }}>🧮 احسب التصفية</button>
            <button onClick={reset} style={{ padding: '11px 16px', borderRadius: 11, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 600 }}>↺ مسح</button>
          </div>

          {/* النتيجة */}
          {result && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${result.diff > 0 ? 'rgba(16,185,129,0.35)' : result.diff < 0 ? 'rgba(239,68,68,0.35)' : 'rgba(148,163,184,0.3)'}`, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ padding: '16px 20px', background: result.diff > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' : result.diff < 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))' : 'linear-gradient(135deg, rgba(148,163,184,0.1), rgba(148,163,184,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{shiftLabels[result.shiftType]} · {result.date} · {result.fuelType}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{result.diff > 0 ? '✅ زيادة' : result.diff < 0 ? '❌ عجز' : '✔️ تمام بالظبط'}</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: result.diff > 0 ? '#10b981' : result.diff < 0 ? '#ef4444' : '#94a3b8' }}>
                  {result.diff > 0 ? '+' : ''}{result.diff.toFixed(2)} ج
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'الكمية المباعة', value: `${result.qty.toFixed(2)} لتر`, icon: '⚡' },
                  { label: 'المبلغ المطلوب', value: `${result.required.toFixed(2)} ج`, icon: '🎯', color: '#f59e0b' },
                  { label: 'الواصل فعلياً', value: `${result.recv.toFixed(2)} ج`, icon: '💵', color: '#3b82f6' },
                  { label: result.diff >= 0 ? 'الزيادة' : 'العجز', value: `${Math.abs(result.diff).toFixed(2)} ج`, icon: result.diff >= 0 ? '📈' : '📉', color: result.diff >= 0 ? '#10b981' : '#ef4444' },
                ].map(({ label, value, icon, color }, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderLeft: i % 2 === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>{icon} {label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {result.note && <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.1)' }}>📝 {result.note}</div>}
              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                {!saved ? (
                  <button onClick={saveToHistory} style={{ padding: '8px 18px', borderRadius: 9, cursor: 'pointer', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700 }}>💾 حفظ في السجل</button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 13, fontWeight: 700 }}>✅ تم الحفظ في السجل</span>
                )}
                <button onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>🖨️ طباعة</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: السجل ===== */}
      {tab === 'history' && (
        <div style={{ padding: '20px 22px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>لا يوجد سجل بعد</div>
              <div style={{ fontSize: 13 }}>احسب تصفية واحفظها وهتظهر هنا</div>
            </div>
          ) : (
            <>
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'إجمالي الورديات', value: stats.totalShifts, color: '#3b82f6', icon: '📊' },
                    { label: 'إجمالي الزيادات', value: `${stats.totalSurplus.toFixed(0)} ج`, color: '#10b981', icon: '📈' },
                    { label: 'إجمالي العجز', value: `${stats.totalDeficit.toFixed(0)} ج`, color: '#ef4444', icon: '📉' },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h) => (
                  <div key={h.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '13px 16px', border: `1px solid ${h.diff > 0 ? 'rgba(16,185,129,0.2)' : h.diff < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{shiftLabels[h.shiftType] || '⛽ وردية'} · {h.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.fuelType} · {h.qty?.toFixed(1)} لتر · المطلوب: {h.required?.toFixed(0)} ج · الواصل: {h.recv?.toFixed(0)} ج</div>
                      {h.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📝 {h.note}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, minWidth: 90, textAlign: 'left', color: h.diff > 0 ? '#10b981' : h.diff < 0 ? '#ef4444' : '#94a3b8' }}>
                        {h.diff > 0 ? '+' : ''}{h.diff.toFixed(2)} ج
                      </div>
                      <button onClick={() => deleteEntry(h.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 7, cursor: 'pointer', padding: '5px 9px', fontSize: 13 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== END SHIFT SETTLEMENT ====================

// ==================== WORKER PROFILE (self) ====================