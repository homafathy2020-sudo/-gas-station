import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { db } from '../../firebase';

// ==================== WORK PLACES MANAGER ====================
export const WorkPlacesManager = ({ workPlaces, onAdd, onEdit, onDelete, onClose }) => {
  const [newPlace, setNewPlace] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const handleAdd = () => {
    if (newPlace.trim()) { onAdd(newPlace.trim()); setNewPlace(''); }
  };

  const handleEdit = (id, value) => {
    if (value.trim()) { onEdit(id, value.trim()); setEditId(null); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header"><div className="modal-title">🏢 إدارة أماكن العمل</div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">إضافة مكان عمل جديد</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" className="form-input" placeholder="أدخل مكان العمل" value={newPlace} onChange={e => setNewPlace(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdd()} />
              <button className="btn btn-primary btn-sm" onClick={handleAdd}>➕</button>
            </div>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {workPlaces.map((place, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                {editId === idx ? (
                  <>
                    <input type="text" className="form-input" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-success btn-xs" onClick={() => handleEdit(idx, editValue)}>✓</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 500 }}>{place}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => { setEditId(idx); setEditValue(place); }}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => onDelete(idx)}>🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>💾 حفظ وإغلاق</button></div>
      </div>
    </div>
  );
};

// ==================== WORKER MODAL ====================