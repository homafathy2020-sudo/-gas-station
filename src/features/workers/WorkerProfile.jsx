import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { getPlan, planHasExcelAdv } from '../../utils/planUtils';
import { generateReport } from '../../utils/reportGenerator';

// ==================== WORKER PROFILE (self) ====================
export const WorkerProfile = ({ worker, onUpdate }) => {
  const toast = useToast();
  const w = worker;
  const ded = totalDed(w);
  const net = calcNet(w);
  const absNoReasonDed = (w.absences_no_reason || []).reduce((s, a) => s + (a.deduction || 0), 0);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', animation: 'fadeIn .3s ease' }}>
      {/* Header */}
      <div className="detail-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="detail-avatar">{w.avatar}</div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{w.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>⛽ {w.pump || 'غير محدد'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateReport(w); toast('جاري تحميل ملف Excel', 'info'); }}>📊 تقريري Excel {!planHasExcelAdv(getPlan()) && '🔒'}</button>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️</button>
        </div>
      </div>

      {/* البيانات الأساسية */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr"><div className="detail-section-title">⚙️ البيانات الأساسية</div></div>
        <div className="detail-body">
          <div className="form-grid-2" style={{ gap: 16 }}>
            <div><div className="form-label">مكان العمل</div><span className="badge badge-blue" style={{ fontSize: 13, padding: '5px 14px' }}>{w.pump}</span></div>
            <div><div className="form-label">أيام العمل</div><span style={{ fontWeight: 700, fontSize: 16 }}>{w.workDays} يوم</span></div>
            <div><div className="form-label">الراتب الأساسي</div><span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{fmt(w.salary)}</span></div>
            <div><div className="form-label">إجمالي الخصومات</div><span style={{ fontWeight: 700, fontSize: 16, color: ded > 0 ? '#ef4444' : 'var(--text-muted)' }}>{ded > 0 ? `-${fmt(ded)}` : 'لا يوجد'}</span></div>
            <div><div className="form-label">📱 رقم التليفون</div><span style={{ fontWeight: 600, fontSize: 15, color: w.phone ? 'var(--text)' : 'var(--text-muted)' }}>{w.phone || '—'}</span></div>
          </div>
        </div>
      </div>

      {/* التأخيرات */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">⏰ التأخيرات <span className="badge badge-warning">{w.delays.length} مرة</span></div>
        </div>
        {w.delays.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد تأخيرات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المدة</th><th>الخصم</th></tr></thead>
              <tbody>
                {w.delays.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{d.minutes} دقيقة</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(d.deduction)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم التأخيرات</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.delays.reduce((s, d) => s + d.deduction, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* الغيابات */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">❌ الغيابات <span className="badge badge-danger">{w.absences.length} يوم</span></div>
        </div>
        {w.absences.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد غيابات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>السبب</th><th>الخصم</th></tr></thead>
              <tbody>
                {w.absences.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td><span className="badge badge-danger">{a.reason}</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم الغياب</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.absences.reduce((s, a) => s + a.deduction, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* العجز */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">📦 العجز <span className="badge badge-danger">{(w.absences_no_reason || []).length} مرة</span></div>
        </div>
        {(!w.absences_no_reason || w.absences_no_reason.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد عجز مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>قيمة العجز</th></tr></thead>
              <tbody>
                {w.absences_no_reason.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصومات العجز</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(absNoReasonDed)}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* الانضباط */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">⭐ الانضباط اليومي <span className="badge badge-warning">{(w.discipline || []).length} مرة</span></div>
        </div>
        {(!w.discipline || w.discipline.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سجل انضباط</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>النجوم</th><th>الحوافز</th></tr></thead>
              <tbody>
                {w.discipline.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{'⭐'.repeat(d.stars)}</span></td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(d.reward)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي مكافآت الانضباط</td>
                  <td style={{ fontWeight: 800, color: '#10b981' }}>+{fmt((w.discipline || []).reduce((s, d) => s + d.reward, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* السحب النقدي */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
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
      </div>

      {/* صافي المدفوعات */}
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

// ==================== ACCOUNTS PAGE ====================