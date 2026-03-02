import { useState } from 'react';
import { MonthResetModal } from '../../features/owner/MonthResetModal';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { getPlan, planHasExcelAdv, planHasMonthReset, planHasWhatsApp } from '../../utils/planUtils';
import { generateMonthlyReport } from '../../utils/reportGenerator';
import { getPaymentRecords, savePaymentRecords } from '../../utils/salaryPayment';

// ==================== SALARY PAYMENT PAGE ====================
export const SalaryPaymentPage = ({ workers, ownerId }) => {
  const toast = useToast();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const [payments, setPayments] = useState(() => getPaymentRecords(ownerId));
  const [confirmPay, setConfirmPay] = useState(null);
  const [confirmUnpay, setConfirmUnpay] = useState(null);
  const [payAllConfirm, setPayAllConfirm] = useState(false);

  const getPaidKey = (workerId) => `${currentMonthKey}_${workerId}`;
  const isPaid = (workerId) => payments.some(p => p.key === getPaidKey(workerId));
  const getPaidRecord = (workerId) => payments.find(p => p.key === getPaidKey(workerId));

  const markPaid = async (worker) => {
    const newRec = {
      key: getPaidKey(worker.id),
      workerId: worker.id,
      workerName: worker.name,
      month: currentMonthKey,
      net: calcNet(worker),
      paidAt: new Date().toISOString(),
    };
    const updated = [...payments.filter(p => p.key !== getPaidKey(worker.id)), newRec];
    setPayments(updated);
    await savePaymentRecords(ownerId, updated);
    toast(`تم تسجيل صرف راتب ${worker.name} ✓`, 'success');
    setConfirmPay(null);
  };

  const unmarkPaid = async (worker) => {
    const updated = payments.filter(p => p.key !== getPaidKey(worker.id));
    setPayments(updated);
    await savePaymentRecords(ownerId, updated);
    toast(`تم إلغاء تسجيل الصرف لـ ${worker.name}`, 'info');
    setConfirmUnpay(null);
  };

  const markAllPaid = async () => {
    const newRecs = workers.filter(w => !isPaid(w.id)).map(w => ({
      key: getPaidKey(w.id),
      workerId: w.id,
      workerName: w.name,
      month: currentMonthKey,
      net: calcNet(w),
      paidAt: new Date().toISOString(),
    }));
    const updated = [...payments, ...newRecs];
    setPayments(updated);
    await savePaymentRecords(ownerId, updated);
    toast('تم تسجيل صرف جميع الرواتب ✓', 'success');
    setPayAllConfirm(false);
  };

  const paidCount = workers.filter(w => isPaid(w.id)).length;
  const unpaidCount = workers.length - paidCount;
  const totalPaid = workers.filter(w => isPaid(w.id)).reduce((s,w) => s + calcNet(w), 0);
  const totalUnpaid = workers.filter(w => !isPaid(w.id)).reduce((s,w) => s + calcNet(w), 0);
  const paidPct = workers.length > 0 ? Math.round((paidCount / workers.length) * 100) : 0;

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {/* Confirm single pay */}
      {confirmPay && (
        <ConfirmModal
          message={`تأكيد صرف راتب "${confirmPay.name}" — ${fmt(calcNet(confirmPay))} ج.م ؟`}
          onConfirm={() => markPaid(confirmPay)}
          onClose={() => setConfirmPay(null)}
        />
      )}
      {confirmUnpay && (
        <ConfirmModal
          message={`إلغاء تسجيل صرف راتب "${confirmUnpay.name}"؟`}
          onConfirm={() => unmarkPaid(confirmUnpay)}
          onClose={() => setConfirmUnpay(null)}
        />
      )}
      {payAllConfirm && (
        <ConfirmModal
          message={`صرف رواتب جميع العمال غير المصروفين (${unpaidCount} عامل — ${fmt(totalUnpaid)})؟`}
          onConfirm={markAllPaid}
          onClose={() => setPayAllConfirm(false)}
        />
      )}

      {/* Summary bar */}
      <div className="salary-summary-bar">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>شهر {months[now.getMonth()]} {now.getFullYear()}</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{paidCount} من {workers.length} عامل تم صرف رواتبهم</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            تم الصرف: <b style={{ color: '#10b981' }}>{fmt(totalPaid)}</b> · متبقي: <b style={{ color: '#f59e0b' }}>{fmt(totalUnpaid)}</b>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{paidPct}%</span>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${paidPct}%` }} />
            </div>
          </div>
          {unpaidCount > 0 && (
            <button className="btn btn-success btn-sm" onClick={() => setPayAllConfirm(true)}>
              ✅ صرف الكل ({unpaidCount} عامل)
            </button>
          )}
          {paidCount === workers.length && workers.length > 0 && (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>🎉 تم صرف جميع الرواتب!</div>
          )}
        </div>
      </div>

      {/* Workers list */}
      <div className="table-container">
        <div className="table-hdr">
          <div style={{ fontSize: 15, fontWeight: 700 }}>💵 سجل صرف الرواتب</div>
          <span className="badge badge-blue">{workers.length} عامل</span>
        </div>
        {workers.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">👷</div>
            <div className="empty-title">لا يوجد عمال بعد</div>
          </div>
        ) : (
          <div>
            {/* غير مصروف أولاً */}
            {workers.filter(w => !isPaid(w.id)).map(w => (
              <div key={w.id} className="payment-row">
                <div className="payment-worker-info">
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{w.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.pump} · {w.delays.length} تأخير · {w.absences.length} غياب</div>
                  </div>
                </div>
                <div className="payment-net">{fmt(calcNet(w))}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {w.phone && planHasWhatsApp(getPlan()) && (
                    <button className="wa-btn wa-btn-sm" onClick={() => {
                      const net = calcNet(w);
                      const phone = w.phone.startsWith('0') ? '2' + w.phone : w.phone;
                      const msg = encodeURIComponent(
                        'مرحباً يا ' + w.name + ' 👋\n\n⛽ WaqoudPro\n─────────────────\n' +
                        '💵 راتب شهر ' + months[now.getMonth()] + ' ' + now.getFullYear() + '\n' +
                        '─────────────────\n' +
                        '💰 الراتب الأساسي: ' + fmt(w.salary) + '\n' +
                        '➖ الخصومات: -' + fmt(totalDed(w)) + '\n' +
                        (totalRewards(w) > 0 ? '🎁 الحوافز: +' + fmt(totalRewards(w)) + '\n' : '') +
                        (totalCash(w) > 0 ? '💸 السحوبات: -' + fmt(totalCash(w)) + '\n' : '') +
                        '─────────────────\n' +
                        '✅ صافي المدفوع: ' + fmt(net) + '\n─────────────────\nشكراً على مجهودك! 🙏'
                      );
                      window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
                    }}>💬 أبلغه</button>
                  )}
                  <button className="pay-btn" onClick={() => setConfirmPay(w)}>✅ تم الصرف</button>
                </div>
              </div>
            ))}
            {/* مصروف */}
            {workers.filter(w => isPaid(w.id)).map(w => {
              const rec = getPaidRecord(w.id);
              return (
                <div key={w.id} className="payment-row paid">
                  <div className="payment-worker-info">
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,rgba(16,185,129,0.4),rgba(16,185,129,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{w.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-muted)' }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {w.pump} · صُرف {rec ? new Date(rec.paidAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>
                  </div>
                  <div className="payment-net" style={{ color: 'var(--text-muted)' }}>{fmt(calcNet(w))}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="paid-stamp">✅ تم الصرف</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setConfirmUnpay(w)}>↩️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};



const ReportsPage = ({ workers, ownerId, onResetMonth }) => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [showReset, setShowReset] = useState(false);
  const toast = useToast();
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const totalSal = workers.reduce((s, w) => s + w.salary, 0);
  const allDed = workers.reduce((s, w) => s + totalDed(w), 0);
  const allRewards = workers.reduce((s, w) => s + totalRewards(w), 0);
  const allCash = workers.reduce((s, w) => s + totalCash(w), 0);
  const totalNet = workers.reduce((s, w) => s + calcNet(w), 0);
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }} className="no-print">
        <select className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
        <select className="form-input" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>{[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}</select>
        <button className="btn btn-accent" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateMonthlyReport(workers, month, year, months[month]); toast('جاري تحميل ملف Excel', 'info'); }}>📊 تحميل Excel {!planHasExcelAdv(getPlan()) && '🔒'}</button>
        <button className="btn btn-ghost" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️ طباعة</button>
        {onResetMonth && planHasMonthReset(getPlan()) && <button className="btn btn-danger" style={{marginRight:'auto'}} onClick={() => setShowReset(true)}>🔄 إغلاق الشهر وبدء شهر جديد</button>}{onResetMonth && !planHasMonthReset(getPlan()) && <button className="btn btn-ghost" style={{marginRight:'auto', opacity:.6}} onClick={() => toast('أرشفة الشهور متاحة في الباقة المميزة فقط 👑','warning')}>🔄 إغلاق الشهر 🔒</button>}
      </div>
      {showReset && <MonthResetModal workers={workers} ownerId={ownerId} onReset={onResetMonth} onClose={() => setShowReset(false)} />}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>التقرير الشهري — {months[month]} {year}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>WaqoudPro</div>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 22 }}>
        {[
          { label: 'العمال', value: workers.length, icon: '👷', color: '#3b82f6' },
          { label: 'إجمالي الرواتب', value: fmt(totalSal), icon: '💵', color: '#f59e0b' },
          { label: 'الخصومات', value: fmt(allDed), icon: '➖', color: '#ef4444' },
          { label: 'الحوافز', value: fmt(allRewards), icon: '🎁', color: '#10b981' },
          { label: 'السحب النقدي', value: fmt(allCash), icon: '💵', color: '#3b82f6' },
          { label: 'صافي المدفوع', value: fmt(totalNet), icon: '✅', color: '#10b981' }
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="table-container">
        <div className="table-hdr"><div style={{ fontSize: 15, fontWeight: 700 }}>تفاصيل العمال</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>العامل</th><th>مكان العمل</th><th>أيام العمل</th><th>التأخيرات</th><th>الغيابات</th><th>الخصومات</th><th>الحوافز</th><th>السحب النقدي</th><th>صافي المدفوع</th></tr></thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 600 }}>{w.name}</td>
                  <td><span className="badge badge-blue">{w.pump}</span></td>
                  <td>{w.workDays}</td>
                  <td>{w.delays.length}</td>
                  <td>{w.absences.length}</td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>{totalDed(w) > 0 ? `-${fmt(totalDed(w))}` : '—'}</td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>{totalRewards(w) > 0 ? `+${fmt(totalRewards(w))}` : '—'}</td>
                  <td style={{ color: '#3b82f6', fontWeight: 700 }}>{totalCash(w) > 0 ? `-${fmt(totalCash(w))}` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>{fmt(calcNet(w))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== SHIFT SETTLEMENT COMPONENT ====================