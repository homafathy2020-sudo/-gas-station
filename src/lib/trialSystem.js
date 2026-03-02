import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../config/env';
import { db } from '../firebase';

// ==================== TRIAL SYSTEM ====================
const TRIAL_DAYS = 15;
const WHATSAPP_NUMBER = '201220523598';

// ---- Firebase-based trial & plan helpers ----
export const getOwnerTrialDoc = (ownerId) => doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}settings`, 'subscription');

const initTrialIfNeeded = async (ownerId) => {
  try {
    const ref = getOwnerTrialDoc(ownerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        trialStart: new Date().toISOString(),
        plan: 'trial',
      });
    }
  } catch(e) {
    // العامل ممكن ما يكونش عنده صلاحية كتابة — مش مشكلة
    if (e.code !== 'permission-denied') console.error('initTrial error:', e.code);
  }
};

const getTrialInfoFromDB = async (ownerId) => {
  try {
    const ref = getOwnerTrialDoc(ownerId);
    const snap = await getDoc(ref);
    let data = snap.exists() ? snap.data() : null;
    if (!data) {
      // لو مش موجود وعنده صلاحية كتابة، ابدأ trial جديد
      try {
        const startDate = new Date().toISOString();
        await setDoc(ref, { trialStart: startDate, plan: 'trial' });
        data = { trialStart: startDate, plan: 'trial' };
      } catch(writeErr) {
        // العامل ما عندوش صلاحية كتابة — استخدم بيانات افتراضية
        data = { trialStart: new Date().toISOString(), plan: 'trial' };
      }
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

const setPlanInDB = async (ownerId, plan) => {
  const ref = getOwnerTrialDoc(ownerId);
  await updateDoc(ref, { plan });
};

// legacy fallback (غير مستخدم للمستخدمين المسجلين)
export const getTrialInfo = () => {
  let startDate = localStorage.getItem('app_trial_start');
  if (!startDate) {
    startDate = new Date().toISOString();
    localStorage.setItem('app_trial_start', startDate);
  }
  const start = new Date(startDate);
  const now = new Date();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  const expired = elapsedDays >= TRIAL_DAYS;
  return { remaining, expired, elapsedDays, startDate };
};

// ==================== PLAN SYSTEM ====================
const getPlan = () => {
  // لو في باقة محددة في localStorage (lifetime/enterprise/starter) → استخدمها أولاً
  const p = localStorage.getItem('app_plan');
  if (p && p !== 'trial' && p !== 'free') return p; // باقة مدفوعة → override كل حاجة
  // لو الـ trial لسه شغال → رجّع trial (كل المميزات مفتوحة)
  const trialStart = localStorage.getItem('app_trial_start');
  if (trialStart) {
    const elapsed = Math.floor((Date.now() - new Date(trialStart)) / (1000 * 60 * 60 * 24));
    if (elapsed < 15) return 'trial';
  }
  if (!p || p === 'trial') return 'free'; // trial خلص بدون اختيار → مجاني
  return p;
};
// trial = كل المميزات مفتوحة، free = محدود
// حدود العمال لكل باقة
// free=5, basic=10, pro=20, enterprise=∞, lifetime=∞, trial=∞
const WORKER_LIMITS = { free: 5, basic: 10, pro: 20, enterprise: Infinity, lifetime: Infinity, trial: Infinity };
const getWorkerLimit  = (plan) => WORKER_LIMITS[plan] ?? 5;
const FREE_WORKER_LIMIT = 5;

// حدود المحطات
const STATION_LIMITS = { free: 1, basic: 1, pro: 3, enterprise: 3, lifetime: Infinity, trial: Infinity };
const getStationLimit = (plan) => STATION_LIMITS[plan] ?? 1;

// Firestore helpers للمحطات
const getStations = async (ownerId) => {
  try { const snap = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}stations`)); return snap.docs.map(d => ({ id: d.id, ...d.data() })); } catch { return []; }
};
const saveStation = async (ownerId, station) => {
  await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}stations`, String(station.id)), station);
};
const deleteStation = async (ownerId, stationId) => {
  await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}stations`, String(stationId)));
};
const ACTIVE_STATION_KEY = (ownerId) => `owner_${ownerId}_active_station`;

// ===== الـ features حسب كل باقة بالظبط =====
// | Feature          | free | basic | pro | enterprise | lifetime | trial |
// | عدد العمال       |  5   |  10   | 20  |     ∞      |    ∞     |   ∞   |
// | رواتب وخصومات   |  ✅  |  ✅   | ✅  |    ✅      |   ✅     |  ✅   |
// | Excel            |  ❌  |  ✅   | ✅  |    ✅      |   ✅     |  ✅   |
// | واتساب للعمال   |  ❌  |  ❌   | ✅  |    ✅      |   ✅     |  ✅   |
// | صرف الرواتب     |  ❌  |  ❌   | ❌  |    ✅      |   ✅     |  ✅   |
// | أرشيف الشهور    |  ❌  |  ❌   | ❌  |    ✅      |   ✅     |  ✅   |
const planIsFree        = (plan) => plan === 'free';
const planHasExcelAdv   = (plan) => ['basic', 'pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
const planHasWhatsApp   = (plan) => ['pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
const planHasSalaryPay  = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);
const planHasMonthReset = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);




// ===== HOOKS =====

export const useTrialSystem = (ownerId) => {
  const [trialInfo, setTrialInfo] = useState({ remaining: 0, expired: false, elapsedDays: 0, startDate: null, plan: 'trial' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) { setLoading(false); return; }
    initTrialIfNeeded(ownerId).then(() =>
      getTrialInfoFromDB(ownerId).then(info => { setTrialInfo(info); setLoading(false); })
    );
  }, [ownerId]);

  const setPlan = async (plan) => {
    await setPlanInDB(ownerId, plan);
    const info = await getTrialInfoFromDB(ownerId);
    setTrialInfo(info);
  };

  return { trialInfo, loading, setPlan };
};

export const useStationSystem = (ownerId) => {
  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!ownerId) { setLoading(false); return; }
    const data = await getStations(ownerId);
    setStations(data);
    const saved = localStorage.getItem(ACTIVE_STATION_KEY(ownerId));
    setActiveStation(saved || (data[0]?.id ?? null));
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [ownerId]);

  const switchStation = (id) => {
    setActiveStation(id);
    localStorage.setItem(ACTIVE_STATION_KEY(ownerId), id);
  };

  const addStation = async (station) => {
    await saveStation(ownerId, station);
    await refresh();
  };

  const removeStation = async (stationId) => {
    await deleteStation(ownerId, stationId);
    if (activeStation === stationId) {
      const remaining = stations.filter(s => s.id !== stationId);
      switchStation(remaining[0]?.id ?? null);
    }
    await refresh();
  };

  return { stations, activeStation, loading, switchStation, addStation, removeStation, refresh };
};
