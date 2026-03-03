import { useEffect, useState } from 'react';

export const TrialBanner = ({ remaining, onViewPlans, userName }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (remaining <= 0) return null;
  const urgent = remaining <= 3;

  return (
    <div className="trial-banner no-print" style={{
      background: urgent
        ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
        : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
      borderBottom: urgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '9px 28px', flexWrap: 'wrap', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 16 }}>{urgent ? '🔴' : '⏳'}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: urgent ? '#ef4444' : '#f59e0b' }}>
          {userName && <strong style={{ color: 'var(--text)' }}>{userName}، </strong>}
          أنت الآن في الفترة التجريبية المجانية
        </span>
        <span className={`trial-days-badge ${urgent ? 'urgent' : ''}`}>
          {remaining} {remaining === 1 ? 'يوم' : 'أيام'} متبقية
        </span>
        {timeLeft && (
          <span style={{
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
            padding: '3px 12px', borderRadius: 20, fontFamily: 'monospace',
            fontSize: 14, fontWeight: 800, color: urgent ? '#ef4444' : '#f8fafc', letterSpacing: 2,
          }}>⏱ {timeLeft}</span>
        )}
        <button className="btn btn-accent btn-sm" onClick={onViewPlans} style={{ marginRight: 4 }}>
          💳 اشترك الآن
        </button>
      </div>
    </div>
  );
};
