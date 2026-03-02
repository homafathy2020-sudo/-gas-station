import { collection, doc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../config/env';
import { db } from '../firebase';

// ==================== BACKUP SYSTEM ====================
const MAX_BACKUPS = 30;
const BACKUP_INTERVAL_HOURS = 24;
export const backupsCol = (ownerId) => collection(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}backups`);
export const backupDoc  = (ownerId, backupId) => doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}backups`, backupId);
export const backupMetaDoc = (ownerId) => doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}meta`, 'backup_meta');

// جلب كل الـ backups مرتبة من الأحدث للأقدم
const getBackupsList = async (ownerId) => {
  try {
    const snap = await getDocs(backupsCol(ownerId));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  } catch { return []; }
};

// إنشاء backup جديد
const createBackup = async (ownerId, workers, workPlaces, members, label = 'تلقائي') => {
  const now = new Date().toISOString();
  const backupId = `backup_${Date.now()}`;

  const snapshot = {
    id: backupId,
    label,
    createdAt: now,
    workersCount: workers.length,
    data: {
      workers,
      workPlaces,
      members,
    }
  };

  // احفظ الـ backup
  await setDoc(backupDoc(ownerId, backupId), snapshot);

  // حدّث آخر وقت backup
  await setDoc(backupMetaDoc(ownerId), { lastBackupAt: now }, { merge: true });

  // لو عدد الـ backups أكبر من الحد → احذف الأقدم
  const allBackups = await getBackupsList(ownerId);
  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(MAX_BACKUPS);
    for (const b of toDelete) {
      try { await deleteDoc(backupDoc(ownerId, b.id)); } catch {}
    }
  }

  return backupId;
};

// استعادة backup — بيكتب فوق البيانات الحالية
const restoreBackup = async (ownerId, backup) => {
  const { workers = [], workPlaces = [], members = [] } = backup.data || {};

  // 1) احذف كل العمال الحاليين
  const currentWorkers = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workers`));
  for (const d of currentWorkers.docs) {
    try { await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workers`, d.id)); } catch {}
  }
  // 2) احذف كل الـ workplaces الحالية
  const currentPlaces = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workplaces`));
  for (const d of currentPlaces.docs) {
    try { await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workplaces`, d.id)); } catch {}
  }
  // 3) احذف كل الـ members الحاليين
  const currentMembers = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}members`));
  for (const d of currentMembers.docs) {
    try { await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}members`, d.id)); } catch {}
  }

  // 4) أعد كتابة البيانات من الـ backup
  for (const w of workers) {
    await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workers`, String(w.id)), w);
  }
  for (const p of workPlaces) {
    await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workplaces`, String(p.id)), p);
  }
  for (const m of members) {
    await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}members`, String(m.id)), m);
  }
};

// هل محتاج backup تلقائي؟ (لو آخر backup أكثر من 24 ساعة)
const shouldAutoBackup = async (ownerId) => {
  try {
    const metaSnap = await getDoc(backupMetaDoc(ownerId));
    if (!metaSnap.exists()) return true;
    const lastAt = metaSnap.data().lastBackupAt;
    if (!lastAt) return true;
    const hoursSinceLast = (Date.now() - new Date(lastAt)) / (1000 * 60 * 60);
    return hoursSinceLast >= BACKUP_INTERVAL_HOURS;
  } catch { return false; }
};
