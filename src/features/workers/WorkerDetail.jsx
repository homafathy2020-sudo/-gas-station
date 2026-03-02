import { useState } from 'react';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { Loader } from '../../shared/components/Loader';
import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt, sendWorkerNotification, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { getPlan, planHasExcelAdv, planHasWhatsApp } from '../../utils/planUtils';
import { generateReport } from '../../utils/reportGenerator';
import { sendWhatsAppNotify } from '../../utils/whatsapp';
import { ShiftSettlement } from '../shifts/ShiftSettlement';
import { AbsenceNoReasonModal, CashWithdrawalModal, DisciplineModal, EntryModal } from './components/EntryModals';

// ==================== WORKER DETAIL ====================
export const WorkerDetail = ({ worker, onUpdate, isWorkerView = false, canEdit = true, ownerId }) => {
  const toast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: worker.name, pump: worker.pump, workDays: worker.workDays, salary: worker.salary, phone: worker.phone || '' });
  const [entryModal, setEntryModal] = useState(null);
  const [absenceNoReasonModal, setAbsenceNoReasonModal] = useState(false);
  const [disciplineModal, setDisciplineModal] = useState(false);
  const [cashModal, setCashModal] = useState(false);
  const [delEntry, setDelEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const w = worker;
  const ded = totalDed(w);
  const net = calcNet(w);

  const saveEdit = async () => {
    if (isWorkerView) {
      if (!editForm.name.trim()) { toast('الاسم مطلوب', 'error'); return; }
      setLoading(true); await new Promise(r => setTimeout(r, 500));
      onUpdate({ ...w, name: editForm.name });
      setEditMode(false); setLoading(false); toast('تم حفظ اسمك ✓', 'success');
    } else {
      if (!editForm.name.trim() || !editForm.pump || !editForm.workDays || !editForm.salary) { toast('يرجى ملء جميع الحقول', 'error'); return; }
      setLoading(true); await new Promise(r => setTimeout(r, 500));
      onUpdate({ ...w, ...editForm, workDays: +editForm.workDays, salary: +editForm.salary });
      setEditMode(false); setLoading(false); toast('تم حفظ التعديلات ✓', 'success');    }
  };

  const addEntry = async (type, entry) => {
    setLoading(true); await new Promise(r => setTimeout(r, 400));
    let updatedWorker = w;
    if (type === 'delay') updatedWorker = { ...w, delays: [...w.delays, entry] };
    else if (type === 'absence') updatedWorker = { ...w, absences: [...w.absences, entry] };
    else if (type === 'absence_no_reason') updatedWorker = { ...w, absences_no_reason: [...(w.absences_no_reason || []), entry] };
    else if (type === 'discipline') updatedWorker = { ...w, discipline: [...(w.discipline || []), entry] };
    else if (type === 'cash') updatedWorker = { ...w, cash_withdrawals: [...(w.cash_withdrawals || []), entry] };
    onUpdate(updatedWorker);

    // إرسال Browser Notification للعامل لو في خصم أو سحب
    if (['delay', 'absence', 'absence_no_reason', 'cash'].includes(type)) {
      const amount = entry.deduction || entry.amount || 0;
      const net = calcNet(updatedWorker);
      sendWorkerNotification(w.name, type, amount, net);
    }

    setEntryModal(null); setAbsenceNoReasonModal(false); setDisciplineModal(false); setCashModal(false); setLoading(false);
    // لو العامل عنده تليفون — اعرض toast بزرار واتساب
    if (updatedWorker.phone && ['delay','absence','absence_no_reason','cash','discipline'].includes(type)) {
      const amount = entry.deduction || entry.amount || entry.reward || 0;
      toast('تم الإضافة ✓ — ' + (updatedWorker.phone ? 'يمكنك إبلاغ العامل عبر واتساب' : ''), 'success');
      // حفظ entry الأخيرة عشان يبعتها لو ضغط الزرار
      window.__lastWaEntry = { worker: updatedWorker, type, entry };
    } else {
      toast('تم الإضافة ✓', 'success');
    }
  };

  const removeEntry = async (type, id) => {
    setLoading(true); await new Promise(r => setTimeout(r, 400));
    if (type === 'delay') onUpdate({ ...w, delays: w.delays.filter(d => d.id !== id) });
    else if (type === 'absence') onUpdate({ ...w, absences: w.absences.filter(a => a.id !== id) });
    else if (type === 'absence_no_reason') onUpdate({ ...w, absences_no_reason: w.absences_no_reason.filter(a => a.id !== id) });
    else if (type === 'discipline') onUpdate({ ...w, discipline: w.discipline.filter(d => d.id !== id) });
    else if (type === 'cash') onUpdate({ ...w, cash_withdrawals: (w.cash_withdrawals || []).filter(c => c.id !== id) });
    setDelEntry(null); setLoading(false); toast('تم الحذف', 'success');
  };

  const ef = k => ({ value: editForm[k], onChange: e => setEditForm({ ...editForm, [k]: e.target.value }), className: 'form-input' });

  const absNoReasonDed = (w.absences_no_reason || []).reduce((s, a) => s + (a.deduction || 0), 0);

  return (
    <div className="worker-detail">
      {loading && <Loader />}
      {entryModal && <EntryModal type={entryModal} onSave={entry => addEntry(entryModal, entry)} onClose={() => setEntryModal(null)} />}
      {absenceNoReasonModal && <AbsenceNoReasonModal onSave={entry => addEntry('absence_no_reason', entry)} onClose={() => setAbsenceNoReasonModal(false)} />}
      {disciplineModal && <DisciplineModal onSave={entry => addEntry('discipline', entry)} onClose={() => setDisciplineModal(false)} />}
      {cashModal && <CashWithdrawalModal onSave={entry => addEntry('cash', entry)} onClose={() => setCashModal(false)} />}
      {delEntry && <ConfirmModal message="هل تريد حذف هذا السجل نهائياً؟" onConfirm={() => removeEntry(delEntry.type, delEntry.id)} onClose={() => setDelEntry(null)} />}

      {/* Header */}
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="detail-avatar">{w.avatar}</div>
          <div>
            {editMode
              ? <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, padding: '7px 12px' }} />
              : <div style={{ fontSize: 21, fontWeight: 800 }}>{w.name}</div>}
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>⛽ {w.pump || 'غير محدد'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEdit && (editMode ? (
            <><button className="btn btn-success btn-sm" onClick={saveEdit}>💾 حفظ</button><button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(false); setEditForm({ name: w.name, pump: w.pump, workDays: w.workDays, salary: w.salary }); }}>إلغاء</button></>
          ) : (
            <button className="btn btn-accent btn-sm" onClick={() => setEditMode(true)}>✏️ تعديل</button>
          ))}
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateReport(w); toast('جاري التحميل', 'info'); }}>📄{!planHasExcelAdv(getPlan()) && '🔒'}</button>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️</button>
        </div>
      </div>

      {/* Basic Info */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr"><div className="detail-section-title">⚙️ البيانات الأساسية</div></div>
        <div className="detail-body">
          <div className="form-grid-2" style={{ gap: 16 }}>
            <div>
              <div className="form-label">مكان العمل</div>
              {editMode
                ? <input type="text" {...ef('pump')} placeholder="مثال: الطرمبة 1، المكتب، الورشة" />
                : <span className="badge badge-blue" style={{ fontSize: 13, padding: '5px 14px' }}>{w.pump}</span>}
            </div>
            <div>
              <div className="form-label">أيام العمل</div>
              {editMode ? <input type="number" min="0" max="1000000" {...ef('workDays')} /> : <span style={{ fontWeight: 700, fontSize: 16 }}>{w.workDays} يوم</span>}
            </div>
            <div>
              <div className="form-label">الراتب الأساسي</div>
              {editMode ? <input type="number" min="0" max="1000000" {...ef('salary')} /> : <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{fmt(w.salary)}</span>}
            </div>
            <div>
              <div className="form-label">إجمالي الخصومات</div>
              <span style={{ fontWeight: 700, fontSize: 16, color: ded > 0 ? '#ef4444' : 'var(--text-muted)' }}>{ded > 0 ? `-${fmt(ded)}` : 'لا يوجد'}</span>
            </div>
            <div>
              <div className="form-label">📱 رقم التليفون</div>
              {editMode
                ? <input type="tel" {...ef('phone')} placeholder="01012345678" maxLength={11} onInput={e => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11); }} />
                : <span style={{ fontWeight: 600, fontSize: 15, color: w.phone ? 'var(--text)' : 'var(--text-muted)' }}>{w.phone || '—'}</span>}
            </div>
          </div>
        </div>
      </div>}

      {/* Delays */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">⏰ التأخيرات <span className="badge badge-warning">{w.delays.length} مرة</span></div>
          <button className="btn btn-warning btn-sm no-print" onClick={() => setEntryModal('delay')}>➕ إضافة تأخير</button>
        </div>
        {w.delays.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد تأخيرات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المدة</th><th>الخصم</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.delays.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{d.minutes} دقيقة</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(d.deduction)}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'delay', id: d.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w, delays:[...w.delays]}, 'delay', d)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم التأخيرات</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.delays.reduce((s, d) => s + d.deduction, 0))}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* Absences */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">❌ الغيابات <span className="badge badge-danger">{w.absences.length} يوم</span></div>
          <button className="btn btn-danger btn-sm no-print" onClick={() => setEntryModal('absence')}>➕ إضافة غياب</button>
        </div>
        {w.absences.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد غيابات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>السبب</th><th>الخصم</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.absences.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td><span className="badge badge-danger">{a.reason}</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'absence', id: a.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w}, 'absence', a)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم الغياب</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.absences.reduce((s, a) => s + a.deduction, 0))}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* العجز - FIX: now shows deduction not reward */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">📦 العجز <span className="badge badge-danger">{(w.absences_no_reason || []).length} مرة</span></div>
          <button className="btn btn-blue btn-sm no-print" onClick={() => setAbsenceNoReasonModal(true)}>➕ إضافة عجز</button>
        </div>
        {(!w.absences_no_reason || w.absences_no_reason.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد عجز مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>قيمة العجز</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.absences_no_reason.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'absence_no_reason', id: a.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w}, 'absence_no_reason', a)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصومات العجز</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(absNoReasonDed)}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* Discipline */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">⭐ الانضباط اليومي <span className="badge badge-warning">{(w.discipline || []).length} مرة</span></div>
          <button className="btn btn-warning btn-sm no-print" onClick={() => setDisciplineModal(true)}>➕ إضافة انضباط</button>
        </div>
        {(!w.discipline || w.discipline.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سجل انضباط</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>النجوم</th><th>الحوافز</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.discipline.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{'⭐'.repeat(d.stars)}</span></td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(d.reward)}</td>
                    <td className="no-print"><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'discipline', id: d.id })}>🗑️ حذف</button></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي مكافآت الانضباط</td>
                  <td style={{ fontWeight: 800, color: '#10b981' }}>+{fmt((w.discipline || []).reduce((s, d) => s + d.reward, 0))}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* السحب النقدي */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{(w.cash_withdrawals || []).length} مرة</span></div>
          <button className="btn btn-primary btn-sm no-print" onClick={() => setCashModal(true)}>➕ تسجيل سحب</button>
        </div>
        {(!w.cash_withdrawals || w.cash_withdrawals.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سحب نقدي مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.cash_withdrawals.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.date}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 700 }}>−{fmt(c.amount)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.note || '—'}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'cash', id: c.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w}, 'cash', c)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي السحوبات</td>
                  <td style={{ fontWeight: 800, color: '#3b82f6' }}>−{fmt(totalCash(w))}</td>
                  <td /><td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* تصفية الوردية - للمالك فقط (إذا كان ownerId موجود) */}
      {!isWorkerView && ownerId && <ShiftSettlement worker={w} ownerId={ownerId} />}

      {/* السحب النقدي - عرض للعامل */}
      {isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{(w.cash_withdrawals || []).length} مرة</span></div>
        </div>
        {(!w.cash_withdrawals || w.cash_withdrawals.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سحب نقدي مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead>
              <tbody>
                {w.cash_withdrawals.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.date}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 700 }}>−{fmt(c.amount)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.note || '—'}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي السحوبات</td>
                  <td style={{ fontWeight: 800, color: '#3b82f6' }}>−{fmt(totalCash(w))}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* Net */}
      <div className="net-card">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>💰 صافي المدفوعات</div>
          <div className="net-amount">{fmt(net)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 2 }}>
            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(w.salary)} ← الراتب الأساسي</div>
            <div style={{ color: '#ef4444' }}>−{fmt(ded)} ← إجمالي الخصومات</div>
            <div style={{ color: '#10b981' }}>+{fmt(totalRewards(w))} ← الحوافز</div>
            {totalCash(w) > 0 && <div style={{ color: '#3b82f6' }}>−{fmt(totalCash(w))} ← السحب النقدي</div>}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4, fontWeight: 700, fontSize: 13, color: '#10b981' }}>= {fmt(net)} صافي المدفوعات</div>
          </div>
          <div style={{ marginTop: 10, width: 200 }}>
            <div className="fuel-bar"><div className="fuel-fill" style={{ width: `${Math.max(0, Math.min(100, (net / w.salary) * 100))}%`, background: net >= w.salary * 0.9 ? '#10b981' : net >= w.salary * 0.75 ? '#f59e0b' : '#ef4444' }} /></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{Math.round((net / w.salary) * 100)}% من الراتب الأساسي</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>💵</div>
          <span className={`badge ${net >= w.salary * 0.9 ? 'badge-success' : net >= w.salary * 0.75 ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: 8, fontSize: 12 }}>
            {net >= w.salary * 0.9 ? '✅ ممتاز' : net >= w.salary * 0.75 ? '⚠️ جيد' : '❗ خصومات عالية'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== WORKERS PAGE ====================