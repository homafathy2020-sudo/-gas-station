import { useState } from 'react';
import { MonthResetModal } from '../../features/owner/MonthResetModal';
import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { getPlan, planHasExcelAdv, planHasMonthReset } from '../../utils/planUtils';
import { generateMonthlyReport } from '../../utils/reportGenerator';


export const ReportsPage = ({ workers, ownerId, onResetMonth }) => {
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