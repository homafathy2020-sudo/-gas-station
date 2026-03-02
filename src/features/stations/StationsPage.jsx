import { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { db } from '../../firebase';
import { useToast } from '../../shared/components/Toast';
import { getPlan, getStationLimit, ACTIVE_STATION_KEY } from '../../utils/planUtils';

const saveStation = async (ownerId, station) => {
  await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}stations`, String(station.id)), station);
};
const deleteStation = async (ownerId, stationId) => {
  await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}stations`, String(stationId)));
};

export const StationsPage = ({ ownerId, stations, activeStation, onSetActive, onRefresh }) => {
  const toast = useToast();
  const plan = getPlan();
  const limit = getStationLimit(plan);
  const [showModal, setShowModal] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const openAdd = () => {
    if (stations.length >= limit && limit !== Infinity) { toast(`باقتك تسمح بـ ${limit} محطة فقط — قم بالترقية لإضافة المزيد 🔒`, 'warning'); return; }
    setEditStation(null); setForm({ name: '', address: '' }); setShowModal(true);
  };
  const openEdit = (s) => { setEditStation(s); setForm({ name: s.name, address: s.address || '' }); setShowModal(true); };
  const save = async () => {
    if (!form.name.trim()) { toast('اسم المحطة مطلوب', 'error'); return; }
    setSaving(true);
    try {
      if (editStation) {
        await saveStation(ownerId, { ...editStation, name: form.name.trim(), address: form.address.trim() });
        toast('تم تعديل المحطة ✓', 'success');
      } else {
        const ns = { id: String(Date.now()), name: form.name.trim(), address: form.address.trim(), createdAt: new Date().toISOString() };
        await saveStation(ownerId, ns);
        if (stations.length === 0) onSetActive(ns.id);
        toast('تم إضافة المحطة ✓', 'success');
      }
      await onRefresh(); setShowModal(false);
    } catch { toast('حدث خطأ، حاول مرة أخرى', 'error'); }
    setSaving(false);
  };
  const handleDelete = async (s) => {
    if (stations.length <= 1) { toast('لا يمكن حذف المحطة الوحيدة', 'warning'); return; }
    if (!window.confirm(`هل أنت متأكد من حذف "${s.name}"؟`)) return;
    setDeleting(s.id);
    try {
      await deleteStation(ownerId, s.id);
      if (activeStation === s.id) { const r = stations.filter(x => x.id !== s.id); if (r.length) onSetActive(r[0].id); }
      await onRefresh(); toast('تم حذف المحطة', 'info');
    } catch { toast('حدث خطأ في الحذف', 'error'); }
    setDeleting(null);
  };
  const planLabels = { free: 'مجانية', basic: 'أساسية', pro: 'احترافية', enterprise: 'مميزة', lifetime: 'مدى الحياة', trial: 'تجريبية' };
  return (
    <div className="stations-page">
      <div className="station-limit-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛽</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>محطاتك</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stations.length} من {limit === Infinity ? 'غير محدود' : limit} محطات — باقة {planLabels[plan] || plan}</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ إضافة محطة {stations.length >= limit && limit !== Infinity ? '🔒' : ''}</button>
      </div>
      {stations.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⛽</div><div className="empty-title">لا توجد محطات بعد</div><button className="btn btn-primary" style={{marginTop:16}} onClick={openAdd}>+ إضافة أول محطة</button></div>
      ) : stations.map(s => (
        <div key={s.id} className={`station-card ${s.id === activeStation ? 'active-station' : ''}`}>
          <div className="station-card-icon">⛽</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="station-card-name">{s.name}</div>
              {s.id === activeStation && <span style={{ background: 'rgba(26,86,219,0.2)', color: 'var(--primary-light)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ نشطة</span>}
            </div>
            <div className="station-card-meta">{s.address && <span>📍 {s.address}</span>}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {s.id !== activeStation && <button className="btn btn-blue btn-sm" onClick={() => onSetActive(s.id)}>⚡ تفعيل</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️</button>
            {stations.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)} disabled={deleting === s.id}>{deleting === s.id ? '...' : '🗑️'}</button>}
          </div>
        </div>
      ))}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{editStation ? '✏️ تعديل المحطة' : '⛽ إضافة محطة'}</div><button className="close-btn" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">اسم المحطة *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: محطة المنصورة" /></div>
              <div className="form-group"><label className="form-label">العنوان (اختياري)</label><input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="مثال: شارع النيل" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : editStation ? '💾 حفظ' : '✅ إضافة'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

