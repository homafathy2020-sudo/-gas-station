import { useState } from 'react';
import { Loader } from '../../shared/components/Loader';
import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { getMonthArchives, saveMonthArchives } from '../../utils/monthArchive';

// ==================== MONTH RESET MODAL ====================
export const MonthResetModal = ({ workers, ownerId, onReset, onClose }) => {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const now = new Date();
  const monthLabel = months[now.getMonth()] + ' ' + now.getFullYear();

  const totalDedAll = workers.reduce((s,w) => s + totalDed(w), 0);
  const totalCashAll = workers.reduce((s,w) => s + totalCash(w), 0);
  const totalRewAll = workers.reduce((s,w) => s + totalRewards(w), 0);
  const totalNetAll = workers.reduce((s,w) => s + calcNet(w), 0);

  const handleReset = async () => {
    setLoading(true);
    // أرشفة الشهر الحالي
    const archive = {
      id: Date.now(),
      month: now.getMonth(),
      year: now.getFullYear(),
      label: monthLabel,
      archivedAt: new Date().toISOString(),
      summary: {
        workers: workers.length,
        totalSalary: workers.reduce((s,w) => s+w.salary, 0),
        totalDeductions: totalDedAll,
        totalRewards: totalRewAll,
        totalCash: totalCashAll,
        totalNet: totalNetAll,
      },
      workerSnapshots: workers.map(w => ({
        id: w.id, name: w.name, pump: w.pump, salary: w.salary,
        delays: w.delays || [], absences: w.absences || [],
        absences_no_reason: w.absences_no_reason || [],
        discipline: w.discipline || [],
        cash_withdrawals: w.cash_withdrawals || [],
        net: calcNet(w),
      })),
    };
    const archives = getMonthArchives(ownerId);
    await saveMonthArchives(ownerId, [...archives, archive]);
    // مسح كل البيانات الشهرية لكل العمال
    await onReset(workers.map(w => ({
      ...w,
      delays: [],
      absences: [],
      absences_no_reason: [],
      discipline: [],
      cash_withdrawals: [],
    })));
    setLoading(false);
    toast('تم إغلاق الشهر وحفظ الأرشيف ✓', 'success');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header">
          <div className="modal-title">🔄 إغلاق الشهر وبدء شهر جديد</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading && <Loader />}
          <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: '#3b82f6' }}>📊 ملخص شهر {monthLabel}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'إجمالي الرواتب', val: workers.reduce((s,w)=>s+w.salary,0), color: '#f59e0b' },
                { label: 'إجمالي الخصومات', val: totalDedAll, color: '#ef4444' },
                { label: 'إجمالي الحوافز', val: totalRewAll, color: '#10b981' },
                { label: 'إجمالي السحوبات', val: totalCashAll, color: '#3b82f6' },
              ].map((item,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{fmt(item.val)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>💵 إجمالي صافي المدفوعات</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{fmt(totalNetAll)}</span>
            </div>
          </div>
          {!confirm ? (
            <div className="month-reset-card">
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>⚠️ ماذا سيحدث؟</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2.2 }}>
                <div>📦 <b>حفظ الأرشيف:</b> كل بيانات الشهر هتتحفظ في الأرشيف</div>
                <div>🗑️ <b>مسح الشهري:</b> التأخيرات، الغيابات، العجز، الحوافز، والسحوبات</div>
                <div>✅ <b>البيانات الثابتة:</b> الراتب، أيام العمل، ومكان العمل — هتفضل</div>
                <div>🔄 <b>شهر جديد:</b> يبدأ بصفحة بيضاء نظيفة</div>
              </div>
              <button className="btn btn-danger" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => setConfirm(true)}>
                🔄 متابعة إغلاق الشهر
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>تأكيد إغلاق شهر {monthLabel}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>هذا الإجراء لا يمكن التراجع عنه — تأكد من تحميل تقرير Excel قبل المتابعة</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={handleReset} disabled={loading}>
                  {loading ? '⏳ جاري الإغلاق...' : '✅ نعم، أغلق الشهر'}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirm(false)}>رجوع</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MONTH ARCHIVE PAGE ====================