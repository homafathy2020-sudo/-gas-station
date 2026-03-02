import { useState } from 'react';
import { calcNet, fmt, totalCash, totalDed, totalRewards } from '../../utils/helpers';
import { WorkPlacesManager } from '../workplaces/WorkPlacesManager';

// ==================== OWNER DASHBOARD ====================
export const OwnerDashboard = ({ workers, workPlaces, onAddPlace, onEditPlace, onDeletePlace }) => {
  const [showPlacesManager, setShowPlacesManager] = useState(false);
  const totalSal = workers.reduce((s, w) => s + w.salary, 0);
  const allDed = workers.reduce((s, w) => s + totalDed(w), 0);
  const totalRewardsVal = workers.reduce((s, w) => s + totalRewards(w), 0);
  const allCash = workers.reduce((s, w) => s + totalCash(w), 0);
  const totalNet = workers.reduce((s, w) => s + calcNet(w), 0);
  const totalAbs = workers.reduce((s, w) => s + w.absences.length, 0);
  const totalDel = workers.reduce((s, w) => s + w.delays.length, 0);
  const totalAbsNoReason = workers.reduce((s, w) => s + (w.absences_no_reason || []).length, 0);
  const avgDiscipline = workers.length > 0 ? (workers.reduce((s, w) => s + (w.discipline || []).reduce((ds, d) => ds + d.stars, 0), 0) / Math.max(workers.reduce((c, w) => c + (w.discipline || []).length, 0), 1)).toFixed(1) : 0;
  
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {showPlacesManager && <WorkPlacesManager workPlaces={workPlaces} onAdd={onAddPlace} onEdit={onEditPlace} onDelete={onDeletePlace} onClose={() => setShowPlacesManager(false)} />}
      <div className="stats-grid">
        {[
          { icon: '👷', label: 'إجمالي العمال', value: workers.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { icon: '💵', label: 'إجمالي الرواتب', value: fmt(totalSal), color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { icon: '✅', label: 'صافي المدفوعات', value: fmt(totalNet), color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
          { icon: '➖', label: 'إجمالي الخصومات', value: fmt(allDed), color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          { icon: '💵', label: 'إجمالي السحوبات', value: fmt(allCash), color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { icon: '📦', label: 'حالات العجز', value: `${totalAbsNoReason}`, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          { icon: '⭐', label: 'متوسط الانضباط', value: `${avgDiscipline} نجم`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { icon: '🎁', label: 'إجمالي الحوافز', value: fmt(totalRewardsVal), color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: s.value.toString().length > 9 ? '16px' : '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>💹 ملخص الرواتب</div>
          {[
            { label: 'إجمالي الرواتب', val: totalSal, color: '#3b82f6', pct: 100 },
            { label: 'الخصومات', val: allDed, color: '#ef4444', pct: totalSal ? (allDed / totalSal) * 100 : 0 },
            { label: 'الحوافز', val: totalRewardsVal, color: '#10b981', pct: totalSal ? (totalRewardsVal / totalSal) * 100 : 0 },
            { label: 'السحب النقدي', val: allCash, color: '#3b82f6', pct: totalSal ? (allCash / totalSal) * 100 : 0 },
            { label: 'صافي المدفوع', val: totalNet, color: '#10b981', pct: totalSal ? (totalNet / totalSal) * 100 : 0 }
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{fmt(item.val)}</span>
              </div>
              <div className="fuel-bar"><div className="fuel-fill" style={{ width: `${item.pct}%`, background: item.color }} /></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>👷 العمال بمكان العمل</span>
            <button className="btn btn-primary btn-sm no-print" onClick={() => setShowPlacesManager(true)}>🏢 إدارة</button>
          </div>
          {workPlaces.map(p => { const c = workers.filter(w => w.pump === p).length; return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 68, fontSize: 12, color: 'var(--text-muted)' }}>{p}</div>
              <div className="fuel-bar" style={{ flex: 1 }}><div className="fuel-fill" style={{ width: workers.length > 0 ? `${(c / workers.length) * 100}%` : '0%' }} /></div>
              <div style={{ width: 52, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{c} عامل</div>
            </div>
          ); })}
          {/* العمال اللي عندهم مكان عمل مش في القائمة */}
          {[...new Set(workers.map(w => w.pump).filter(p => p && p !== 'غير محدد' && !workPlaces.includes(p)))].map(p => {
            const c = workers.filter(w => w.pump === p).length;
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 68, fontSize: 12, color: 'var(--text-muted)' }}>{p}</div>
                <div className="fuel-bar" style={{ flex: 1 }}><div className="fuel-fill" style={{ width: workers.length > 0 ? `${(c / workers.length) * 100}%` : '0%' }} /></div>
                <div style={{ width: 52, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{c} عامل</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="table-container">
        <div className="table-hdr"><div style={{ fontSize: 15, fontWeight: 700 }}>👷 ملخص جميع العمال</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>العامل</th><th>مكان العمل</th><th>أيام العمل</th><th>تأخيرات</th><th>غيابات</th><th>عجز</th><th>انضباط</th><th>خصومات</th><th>سحب نقدي</th><th>صافي المدفوعات</th></tr></thead>
            <tbody>
              {workers.map(w => {
                const discAvg = (w.discipline || []).length > 0 ? (w.discipline.reduce((s, d) => s + d.stars, 0) / w.discipline.length).toFixed(1) : '—';
                return (
                <tr key={w.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{w.avatar}</div><span style={{ fontWeight: 600 }}>{w.name}</span></div></td>
                  <td><span className="badge badge-blue">{w.pump}</span></td>
                  <td>{w.workDays} يوم</td>
                  <td>{w.delays.length > 0 ? <span className="badge badge-warning">{w.delays.length} مرة</span> : <span className="badge badge-success">لا يوجد</span>}</td>
                  <td>{w.absences.length > 0 ? <span className="badge badge-danger">{w.absences.length} يوم</span> : <span className="badge badge-success">لا يوجد</span>}</td>
                  <td>{(w.absences_no_reason || []).length > 0 ? <span className="badge badge-danger">{(w.absences_no_reason || []).length}</span> : <span className="badge badge-success">—</span>}</td>
                  <td>{discAvg !== '—' ? <span className="badge badge-warning">{discAvg} ⭐</span> : <span className="badge badge-success">—</span>}</td>
                  <td style={{ color: totalDed(w) > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>{totalDed(w) > 0 ? `-${fmt(totalDed(w))}` : '—'}</td>
                  <td style={{ color: totalCash(w) > 0 ? '#3b82f6' : 'var(--text-muted)', fontWeight: 700 }}>{totalCash(w) > 0 ? `-${fmt(totalCash(w))}` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>{fmt(calcNet(w))}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== REPORTS ====================