import { useState } from 'react';
import { fmt, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { getMonthArchives } from '../../utils/monthArchive';
import { generateMonthlyReport } from '../../utils/reportGenerator';

// ==================== MONTH ARCHIVE PAGE ====================
export const MonthArchivePage = ({ ownerId }) => {
  const [archives, setArchives] = useState(() => getMonthArchives(ownerId));
  const [selected, setSelected] = useState(null);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {archives.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">لا يوجد أرشيف بعد</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>بعد إغلاق الشهر الأول هيظهر هنا</div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {[...archives].reverse().map(arch => (
              <div key={arch.id} className="month-archive-item" onClick={() => setSelected(selected?.id === arch.id ? null : arch)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{arch.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>أُغلق {new Date(arch.archivedAt).toLocaleDateString('ar-EG')} · {arch.summary.workers} عامل</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>صافي المدفوع</div>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: 14 }}>{fmt(arch.summary.totalNet)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>الخصومات</div>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 14 }}>{fmt(arch.summary.totalDeductions)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>السحوبات</div>
                    <div style={{ fontWeight: 800, color: '#3b82f6', fontSize: 14 }}>{fmt(arch.summary.totalCash)}</div>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{selected?.id === arch.id ? '▲' : '▼'}</span>
              </div>
            ))}
          </div>
          {/* تفاصيل الشهر المختار */}
          {selected && (
            <div className="table-container" style={{ animation: 'fadeIn .2s ease' }}>
              <div className="table-hdr">
                <div style={{ fontSize: 15, fontWeight: 700 }}>📋 تفاصيل {selected.label}</div>
                <button className="btn btn-accent btn-sm" onClick={() => {
                  const workers = selected.workerSnapshots || [];
                  const months2 = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
                  generateMonthlyReport(workers, selected.month, selected.year, months2[selected.month]);
                }}>📊 تحميل Excel</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>العامل</th><th>مكان العمل</th><th>الراتب</th><th>الخصومات</th><th>الحوافز</th><th>السحوبات</th><th>صافي المدفوع</th></tr></thead>
                  <tbody>
                    {(selected.workerSnapshots || []).map(w => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 700 }}>{w.name}</td>
                        <td><span className="badge badge-blue">{w.pump}</span></td>
                        <td style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(w.salary)}</td>
                        <td style={{ color: '#ef4444', fontWeight: 700 }}>{totalDed(w) > 0 ? `-${fmt(totalDed(w))}` : '—'}</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>{totalRewards(w) > 0 ? `+${fmt(totalRewards(w))}` : '—'}</td>
                        <td style={{ color: '#3b82f6', fontWeight: 700 }}>{totalCash(w) > 0 ? `-${fmt(totalCash(w))}` : '—'}</td>
                        <td style={{ color: '#10b981', fontWeight: 800, fontSize: 14 }}>{fmt(w.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== SALARY PAYMENT PAGE ====================