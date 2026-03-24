// ==================== FIRESTORE UTILS ====================

import {
  doc, getDoc, setDoc, updateDoc, collection,
  onSnapshot, deleteDoc, getDocs, query, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { _lsKey, TRIAL_DAYS, BACKUP_INTERVAL_HOURS } from './constants';

// ==================== INVITES ====================

export const getInvites = (ownerId) => {
  try { return JSON.parse(localStorage.getItem(_lsKey(ownerId,'invites')) || '[]'); } catch { return []; }
};

export const saveInvites = async (ownerId, list, ownerCode) => {
  localStorage.setItem(_lsKey(ownerId,'invites'), JSON.stringify(list));
  try { await setDoc(doc(db,'owners',ownerId,'meta','invites'), { list }); } catch {}
  if (ownerCode) {
    try {
      await setDoc(doc(db,'ownerCodes',ownerCode), { ownerId, inviteList: list }, { merge: true });
    } catch(e) { console.warn('ownerCodes inviteList update failed:', e.code); }
  }
};

export const syncInvites = async (ownerId) => {
  try {
    const d = await getDoc(doc(db,'owners',ownerId,'meta','invites'));
    if (d.exists()) localStorage.setItem(_lsKey(ownerId,'invites'), JSON.stringify(d.data().list || []));
  } catch {}
};

// ==================== MONTH ARCHIVES ====================

export const saveMonthArchives = async (ownerId, list, stationId) => {
  const key = stationId
    ? `owner_${ownerId}_station_${stationId}_month_archives`
    : `owner_${ownerId}_month_archives`;
  localStorage.setItem(key, JSON.stringify(list));
  const docId = stationId ? `monthArchives_${stationId}` : 'monthArchives';
  try { await setDoc(doc(db,'owners',ownerId,'meta',docId), { list, stationId: stationId || null }); } catch {}
};

// ==================== PAYMENT RECORDS ====================

export const savePaymentRecords = async (ownerId, list, stationId) => {
  const key = stationId
    ? `owner_${ownerId}_station_${stationId}_payments`
    : `owner_${ownerId}_payments`;
  localStorage.setItem(key, JSON.stringify(list));
  const docId = stationId ? `payments_${stationId}` : 'payments';
  try { await setDoc(doc(db,'owners',ownerId,'meta',docId), { list, stationId: stationId || null }); } catch {}
};

// ==================== BACKUP SYSTEM ====================

export const backupsCol     = (ownerId) => collection(db,'owners',ownerId,'backups');
export const backupDoc      = (ownerId, backupId) => doc(db,'owners',ownerId,'backups',backupId);
export const backupMetaDoc  = (ownerId) => doc(db,'owners',ownerId,'meta','backupMeta');

export const getBackupsList = async (ownerId) => {
  try {
    const snap = await getDocs(backupsCol(ownerId));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  } catch(e) { console.error('getBackupsList error:', e?.code, e?.message); return []; }
};

export const createBackup = async (ownerId, workers, workPlaces, members, label = 'تلقائي') => {
  const MAX_BACKUPS = 30;
  const now = new Date().toISOString();
  const backupId = `backup_${Date.now()}`;
  const snapshot = { id: backupId, label, createdAt: now, workersCount: workers.length, data: { workers, workPlaces, members } };
  await setDoc(backupDoc(ownerId, backupId), snapshot);
  await setDoc(backupMetaDoc(ownerId), { lastBackupAt: now }, { merge: true });
  const allBackups = await getBackupsList(ownerId);
  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(MAX_BACKUPS);
    for (const b of toDelete) { try { await deleteDoc(backupDoc(ownerId, b.id)); } catch {} }
  }
  return backupId;
};

export const restoreBackup = async (ownerId, backup) => {
  const { workers = [], workPlaces = [], members = [] } = backup.data || {};
  const [currentWorkers, currentPlaces, currentMembers] = await Promise.all([
    getDocs(collection(db,'owners',ownerId,'workers')),
    getDocs(collection(db,'owners',ownerId,'workplaces')),
    getDocs(collection(db,'owners',ownerId,'members')),
  ]);
  for (const d of currentWorkers.docs) { try { await deleteDoc(doc(db,'owners',ownerId,'workers',d.id)); } catch {} }
  for (const d of currentPlaces.docs) { try { await deleteDoc(doc(db,'owners',ownerId,'workplaces',d.id)); } catch {} }
  for (const d of currentMembers.docs) { try { await deleteDoc(doc(db,'owners',ownerId,'members',d.id)); } catch {} }
  for (const w of workers) await setDoc(doc(db,'owners',ownerId,'workers',String(w.id)), w);
  for (const p of workPlaces) await setDoc(doc(db,'owners',ownerId,'workplaces',String(p.id)), p);
  for (const m of members) await setDoc(doc(db,'owners',ownerId,'members',String(m.id)), m);
};

export const shouldAutoBackup = async (ownerId) => {
  try {
    const metaSnap = await getDoc(backupMetaDoc(ownerId));
    if (!metaSnap.exists()) return true;
    const lastAt = metaSnap.data().lastBackupAt;
    if (!lastAt) return true;
    const hoursSinceLast = (Date.now() - new Date(lastAt)) / (1000 * 60 * 60);
    return hoursSinceLast >= BACKUP_INTERVAL_HOURS;
  } catch { return false; }
};

// ==================== TRIAL ====================

export const getOwnerTrialDoc = (ownerId) => doc(db,'owners',ownerId,'meta','trial');

export const initTrialIfNeeded = async (ownerId) => {
  try {
    const ref = getOwnerTrialDoc(ownerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { trialStart: new Date().toISOString(), plan: 'trial' });
    }
  } catch(e) { if (e.code !== 'permission-denied') console.error('initTrial error:', e.code); }
};

export const getTrialInfoFromDB = async (ownerId) => {
  try {
    const ref = getOwnerTrialDoc(ownerId);
    const snap = await getDoc(ref);
    let data = snap.exists() ? snap.data() : null;
    if (!data) {
      try {
        const startDate = new Date().toISOString();
        await setDoc(ref, { trialStart: startDate, plan: 'trial' });
        data = { trialStart: startDate, plan: 'trial' };
      } catch { data = { trialStart: new Date().toISOString(), plan: 'trial' }; }
    }
    const start = new Date(data.trialStart);
    const now = new Date();
    const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
    const expired = elapsedDays >= TRIAL_DAYS;
    return { remaining, expired, elapsedDays, startDate: data.trialStart, plan: data.plan || 'trial' };
  } catch(e) {
    if (e.code !== 'permission-denied') console.error('getTrialInfo error:', e.code);
    return { remaining: 0, expired: false, elapsedDays: 0, startDate: null, plan: 'trial' };
  }
};

export const setPlanInDB = async (ownerId, plan) => {
  const ref = getOwnerTrialDoc(ownerId);
  await updateDoc(ref, { plan });
};

// ==================== STATIONS ====================

export const getStations = async (ownerId) => {
  try {
    const snap = await getDocs(collection(db,'owners',ownerId,'stations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { console.error('getStations error:', e); return []; }
};

export const saveStation = async (ownerId, station) => {
  await setDoc(doc(db,'owners',ownerId,'stations',String(station.id)), station);
};

export const deleteStation = async (ownerId, stationId) => {
  await deleteDoc(doc(db,'owners',ownerId,'stations',String(stationId)));
};

// ==================== SHIFT LOGS ====================

export const getShiftKey = (date, stationId) => stationId ? `${stationId}_${date}` : date;

export const saveShiftLog = async (ownerId, date, entries, stationId) => {
  await setDoc(
    doc(db,'owners',ownerId,'shifts',getShiftKey(date, stationId)),
    { date, stationId: stationId || null, entries, savedAt: new Date().toISOString() }
  );
};

export const getShiftLog = async (ownerId, date, stationId) => {
  try {
    const snap = await getDoc(doc(db,'owners',ownerId,'shifts',getShiftKey(date, stationId)));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

export const getShiftLogs = async (ownerId, limitDays = 30, stationId) => {
  try {
    const snap = await getDocs(collection(db,'owners',ownerId,'shifts'));
    return snap.docs.map(d => d.data())
      .filter(d => stationId ? d.stationId === stationId : true)
      .sort((a,b) => b.date.localeCompare(a.date)).slice(0, limitDays);
  } catch { return []; }
};

// ==================== FUEL LOGS ====================

export const saveFuelLog = async (ownerId, log, stationId) => {
  const id = log.id || String(Date.now());
  const col = stationId ? `fuelLogs_${stationId}` : 'fuelLogs';
  await setDoc(doc(db,'owners',ownerId,col,id), { ...log, id, stationId: stationId || null });
  return id;
};

export const deleteFuelLog = async (ownerId, id, stationId) => {
  const col = stationId ? `fuelLogs_${stationId}` : 'fuelLogs';
  await deleteDoc(doc(db,'owners',ownerId,col,id));
};

export const getFuelLogs = async (ownerId, stationId) => {
  try {
    const col = stationId ? `fuelLogs_${stationId}` : 'fuelLogs';
    const snap = await getDocs(collection(db,'owners',ownerId,col));
    return snap.docs.map(d => d.data()).sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);
  } catch { return []; }
};

// ==================== ANNOUNCEMENTS ====================

export const getAnnouncements = async () => {
  try {
    const snap = await getDocs(collection(db,'announcements'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  } catch { return []; }
};

export const saveAnnouncement = async (ann) => {
  const id = String(Date.now());
  await setDoc(doc(db,'announcements',id), { ...ann, id, createdAt: Date.now() });
  return id;
};

export const deleteAnnouncement = async (id) => {
  await deleteDoc(doc(db,'announcements',id));
};

// ==================== DISCOUNT CODES ====================

export const getDiscountCodes = async () => {
  try {
    const snap = await getDocs(collection(db,'discountCodes'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  } catch { return []; }
};

export const saveDiscountCode = async (code) => {
  const id = code.code.toUpperCase().trim();
  await setDoc(doc(db,'discountCodes',id), { ...code, code: id, createdAt: code.createdAt || Date.now() });
  return id;
};

export const deleteDiscountCode = async (id) => {
  await deleteDoc(doc(db,'discountCodes',id));
};

export const validateDiscountCode = async (codeStr) => {
  try {
    const id = codeStr.toUpperCase().trim();
    if (!id) return { valid: false, reason: 'أدخل الكود أولاً' };
    const snap = await getDoc(doc(db,'discountCodes',id));
    if (!snap.exists()) return { valid: false, reason: 'الكود غير موجود' };
    const data = snap.data();
    if (data.active === false) return { valid: false, reason: 'الكود غير مفعّل' };
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) return { valid: false, reason: 'انتهت صلاحية الكود' };
    if (data.usageLimit && (data.usageCount || 0) >= data.usageLimit) return { valid: false, reason: 'تم استنفاد الحد المسموح به للكود' };
    return { valid: true, discount: data.discount, code: id, name: data.name };
  } catch(e) {
    if (e?.code === 'permission-denied') return { valid: false, reason: 'خطأ في الصلاحيات — راجع Firestore Rules', _permissionError: true };
    return { valid: false, reason: 'تعذّر التحقق من الكود، حاول مرة أخرى' };
  }
};

export const incrementCodeUsage = async (codeStr) => {
  try {
    const id = codeStr.toUpperCase().trim();
    const ref = doc(db,'discountCodes',id);
    const snap = await getDoc(ref);
    if (snap.exists()) await updateDoc(ref, { usageCount: (snap.data().usageCount || 0) + 1 });
  } catch {}
};

export const getAllOwners = async () => {
  try {
    const snap = await getDocs(collection(db,'users'));
    const owners = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'owner');
    const withPlans = await Promise.all(owners.map(async (o) => {
      try {
        const trialRef = getOwnerTrialDoc(o.id);
        const subSnap = await getDoc(trialRef);
        const plan = subSnap.exists() ? (subSnap.data().plan || 'trial') : 'trial';
        return { ...o, plan };
      } catch { return { ...o, plan: 'trial' }; }
    }));
    return withPlans;
  } catch { return []; }
};
