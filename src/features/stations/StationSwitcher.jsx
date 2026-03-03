import { useEffect, useRef, useState } from 'react';
import { StationsPage } from './StationsPage';

export const StationSwitcher = ({ stations, activeStation, onSwitch, onManage }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  if (!stations || stations.length === 0) return null;
  const current = stations.find(s => s.id === activeStation) || stations[0];
  return (
    <div className="station-switcher" ref={ref}>
      <button className={`station-switcher-btn ${open ? 'open' : ''}`} onClick={() => setOpen(v => !v)}>
        <span style={{ fontSize: 16 }}>⛽</span>
        <span className="st-name">{current?.name || 'اختر محطة'}</span>
        <span className="st-arrow">▼</span>
      </button>
      {open && (
        <div className="station-switcher-dropdown">
          {stations.map(s => (
            <div key={s.id} className={`station-item ${s.id === activeStation ? 'active' : ''}`}
              onClick={() => { onSwitch(s.id); setOpen(false); }}>
              <div className="station-item-icon">⛽</div>
              <div style={{ flex: 1 }}>
                <div className="station-item-name">{s.name}</div>
                <div className="station-item-sub">{s.address || 'لا يوجد عنوان'}</div>
              </div>
              {s.id === activeStation && <span className="station-item-check">✓</span>}
            </div>
          ))}
          <div className="station-switcher-footer">
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { onManage(); setOpen(false); }}>⚙️ إدارة المحطات</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== STATIONS MANAGEMENT PAGE =====
const StationsPage = ({ ownerId, stations, activeStation, onSetActive, onRefresh }) => {