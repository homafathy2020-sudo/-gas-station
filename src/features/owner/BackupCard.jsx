import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { db } from '../../firebase';
import { backupDoc, backupMetaDoc, backupsCol } from '../../lib/backupService';
import { useToast } from '../../shared/components/Toast';

// ==================== BACKUP CARD (UI) ====================
export const BackupCard = ({ ownerId, workers, workPlaces, ownerUsers }) => {
  const toast = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null); // backup id
  const [confirmRestore, setConfirmRestore] = useState(null); // backup object
  const [expandedId, setExpandedId] = useState(null);

  const loadBackups = async () => {
    setLoading(true);
    const list = await getBackupsList(ownerId);
    setBackups(list);
    setLoading(false);
  };

  useEffect(() => { loadBackups(); }, [ownerId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createBackup(ownerId, workers, workPlaces, ownerUsers, 'يدوي');
      toast('✅ تم إنشاء النسخة الاحتياطية بنجاح', 'success');
      await loadBackups();
    } catch { toast('❌ فشل إنشاء النسخة الاحتياطية', 'error'); }
    setCreating(false);
  };

  const handleRestore = async (backup) => {
    setRestoring(backup.id);
    try {
      // أولاً: احفظ backup من الحالة الحالية قبل الاستعادة
      await createBackup(ownerId, workers, workPlaces, ownerUsers, `قبل استعادة ${fmtBackupDate(backup.createdAt)}`);
      // ثانياً: استعد البيانات
      await restoreBackup(ownerId, backup);
      toast('✅ تمت الاستعادة — سيتم تحديث البيانات تلقائياً', 'success');
      await loadBackups();
    } catch { toast('❌ فشلت الاستعادة، حاول مرة أخرى', 'error'); }
    setRestoring(null);
    setConfirmRestore(null);
  };

  const handleDelete = async (backupId) => {
    try {
      await deleteDoc(backupDoc(ownerId, backupId));
      toast('تم حذف النسخة', 'info');
      setBackups(prev => prev.filter(b => b.id !== backupId));
    } catch { toast('فشل الحذف', 'error'); }
  };

  const fmtBackupDate = (iso) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return `${date} — ${time}`;
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡️ النسخ الاحتياطية
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            نسخة تلقائية كل 24 ساعة • آخر {MAX_BACKUPS} نسخة محفوظة
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={creating}>
          {creating ? '⏳ جاري الحفظ...' : '➕ نسخة الآن'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 100, background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary-light)' }}>{backups.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>نسخة محفوظة</div>
        </div>
        <div style={{ flex: 1, minWidth: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{backups[0] ? timeAgo(backups[0].createdAt) : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>آخر نسخة</div>
        </div>
        <div style={{ flex: 1, minWidth: 100, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{workers.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>عامل حالياً</div>
        </div>
      </div>

      {/* Backups list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
      ) : backups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
          <div style={{ fontWeight: 600 }}>لا توجد نسخ احتياطية بعد</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>اضغط "نسخة الآن" لإنشاء أول نسخة</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {backups.map((b, idx) => (
            <div key={b.id} style={{
              background: idx === 0 ? 'rgba(26,86,219,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${idx === 0 ? 'rgba(26,86,219,0.2)' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                <div style={{ fontSize: 20 }}>{b.label === 'يدوي' ? '✋' : b.label?.startsWith('قبل') ? '🔄' : '🤖'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtBackupDate(b.createdAt)}</span>
                    {idx === 0 && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>الأحدث</span>}
                    <span style={{ fontSize: 10, background: b.label === 'يدوي' ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.1)', color: b.label === 'يدوي' ? '#3b82f6' : 'var(--text-muted)', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{b.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {b.workersCount} عامل • {timeAgo(b.createdAt)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{expandedId === b.id ? '▲' : '▼'}</div>
              </div>

              {/* Expanded actions */}
              {expandedId === b.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)' }}>
                  <button className="btn btn-success btn-sm"
                    onClick={() => setConfirmRestore(b)}
                    disabled={!!restoring}>
                    {restoring === b.id ? '⏳ جاري الاستعادة...' : '♻️ استعادة هذه النسخة'}
                  </button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(b.id)}
                    disabled={!!restoring}>
                    🗑️ حذف
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 'auto' }}>
                    📦 {b.workersCount} عامل • {(b.data?.workPlaces || []).length} مكان عمل
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm restore modal */}
      {confirmRestore && (
        <div className="modal-overlay" onClick={() => !restoring && setConfirmRestore(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">♻️ تأكيد الاستعادة</div>
              <button className="close-btn" onClick={() => !restoring && setConfirmRestore(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>⚠️ تحذير مهم</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                  سيتم <b style={{ color: 'var(--text)' }}>استبدال كل البيانات الحالية</b> ببيانات هذه النسخة.
                  سيتم حفظ نسخة من الحالة الحالية تلقائياً قبل الاستعادة.
                </div>
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <b>النسخة المختارة:</b> {fmtBackupDate(confirmRestore.createdAt)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                تحتوي على <b style={{ color: 'var(--text)' }}>{confirmRestore.workersCount} عامل</b>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={() => handleRestore(confirmRestore)} disabled={!!restoring} style={{ flex: 1, justifyContent: 'center' }}>
                {restoring ? '⏳ جاري الاستعادة...' : '✅ نعم، استعد البيانات'}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmRestore(null)} disabled={!!restoring}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== TOAST ====================