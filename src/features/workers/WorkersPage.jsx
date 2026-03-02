import { useState } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { db } from '../../firebase';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { Loader } from '../../shared/components/Loader';
import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt } from '../../utils/helpers';
import { getPlan, getWorkerLimit } from '../../utils/planUtils';
import { WorkerDetail } from './WorkerDetail';
import { WorkerModal } from './components/WorkerModal';

// ==================== WORKERS PAGE ====================
export const WorkersPage = ({ workers, setWorkers, ownerId }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [ddOpen, setDdOpen] = useState(false);
  const [workerModal, setWorkerModal] = useState(null);
  const [deleteW, setDeleteW] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const selected = workers.find(w => w.id === selectedId);

  const saveWorker = async (data) => {
    // تحقق من حد الباقة المجانية
    const isNewWorker = !workers.find(w => w.id === data.id);
    const _plan = getPlan();
    const _limit = getWorkerLimit(_plan);
    if (isNewWorker && workers.length >= _limit && _limit !== Infinity) {
      toast(`باقتك الحالية تسمح بـ ${_limit} عمال فقط — قم بالترقية لإضافة المزيد 🔒`, 'warning');
      setWorkerModal(null);
      return;
    }
    setLoading(true); await new Promise(r => setTimeout(r, 600));
    if (workers.find(w => w.id === data.id)) setWorkers(workers.map(w => w.id === data.id ? data : w));
    else { setWorkers([...workers, data]); setSelectedId(data.id); }
    setWorkerModal(null); setLoading(false);
  };

  const deleteWorker = async () => {
    setLoading(true); await new Promise(r => setTimeout(r, 500));
    setWorkers(workers.filter(w => w.id !== deleteW.id));
    if (selectedId === deleteW.id) setSelectedId(null);
    toast('تم حذف العامل', 'success'); setDeleteW(null); setLoading(false);
  };

  const updateWorker = (updated) => setWorkers(workers.map(w => w.id === updated.id ? updated : w));

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {loading && <Loader />}
      {workerModal !== null && <WorkerModal worker={workerModal === 'add' ? null : workerModal} onSave={saveWorker} onClose={() => setWorkerModal(null)} />}
      {deleteW && <ConfirmModal message={`هل تريد حذف "${deleteW.name}" نهائياً؟`} onConfirm={deleteWorker} onClose={() => setDeleteW(null)} />}

      <div className="worker-selector">
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          👷 اختر عاملاً لعرض بياناته التفصيلية
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="worker-dropdown" style={{ flex: 1, minWidth: 240 }}>
            <button className={`worker-dropdown-btn ${ddOpen ? 'open' : ''}`} onClick={() => setDdOpen(!ddOpen)}>
              {selected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="w-avatar" style={{ width: 34, height: 34, fontSize: 14 }}>{selected.avatar}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.pump} · صافي: {fmt(calcNet(selected))}</div>
                  </div>
                </div>
              ) : <span style={{ color: 'var(--text-muted)' }}>— اختر عاملاً —</span>}
              <span style={{ color: 'var(--text-muted)', display: 'inline-block', transition: 'transform .2s', transform: ddOpen ? 'rotate(180deg)' : 'none', fontSize: 12 }}>▾</span>
            </button>
            {ddOpen && (
              <div className="worker-dropdown-menu">
                {workers.map(w => (
                  <div key={w.id} className={`worker-dropdown-item ${w.id === selectedId ? 'selected' : ''}`}
                    onClick={() => { setSelectedId(w.id); setDdOpen(false); }}>
                    <div className="w-avatar">{w.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.pump} · {w.delays.length} تأخير · {w.absences.length} غياب · صافي: {fmt(calcNet(w))}</div>
                    </div>
                    {w.id === selectedId && <span style={{ color: 'var(--primary-light)', fontWeight: 800, fontSize: 16 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setWorkerModal('add')}>➕ عامل جديد</button>
            {selected && <>
              <button className="btn btn-ghost" onClick={() => setWorkerModal(selected)}>✏️ تعديل</button>
              <button className="btn btn-danger" onClick={() => setDeleteW(selected)}>🗑️ حذف</button>
            </>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {workers.map(w => (
            <button key={w.id} onClick={() => { setSelectedId(w.id); setDdOpen(false); }}
              style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all .15s', fontFamily: 'Cairo,sans-serif', background: w.id === selectedId ? 'rgba(26,86,219,0.2)' : 'rgba(255,255,255,0.04)', borderColor: w.id === selectedId ? 'var(--primary-light)' : 'var(--border)', color: w.id === selectedId ? 'var(--primary-light)' : 'var(--text-muted)' }}>
              {w.avatar} {w.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {selected
        ? <WorkerDetail key={selected.id} worker={selected} onUpdate={updateWorker} ownerId={ownerId} />
        : <div className="empty-state">
          <div className="empty-icon">👆</div>
          <div className="empty-title">اختر عاملاً من القائمة أعلاه</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>سيتم عرض بياناته الكاملة</div>
        </div>}
    </div>
  );
};

// ==================== OWNER DASHBOARD ====================