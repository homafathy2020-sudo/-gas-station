// ==================== PLAN SYSTEM ====================
export const getPlan = () => {
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
export const getWorkerLimit  = (plan) => WORKER_LIMITS[plan] ?? 5;
const FREE_WORKER_LIMIT = 5;

// حدود المحطات
const STATION_LIMITS = { free: 1, basic: 1, pro: 3, enterprise: 3, lifetime: Infinity, trial: Infinity };
export const getStationLimit = (plan) => STATION_LIMITS[plan] ?? 1;

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
export const ACTIVE_STATION_KEY = (ownerId) => `owner_${ownerId}_active_station`;

// ===== الـ features حسب كل باقة بالظبط =====
// | Feature          | free | basic | pro | enterprise | lifetime | trial |
// | عدد العمال       |  5   |  10   | 20  |     ∞      |    ∞     |   ∞   |
// | رواتب وخصومات   |  ✅  |  ✅   | ✅  |    ✅      |   ✅     |  ✅   |
// | Excel            |  ❌  |  ✅   | ✅  |    ✅      |   ✅     |  ✅   |
// | واتساب للعمال   |  ❌  |  ❌   | ✅  |    ✅      |   ✅     |  ✅   |
// | صرف الرواتب     |  ❌  |  ❌   | ❌  |    ✅      |   ✅     |  ✅   |
// | أرشيف الشهور    |  ❌  |  ❌   | ❌  |    ✅      |   ✅     |  ✅   |
export const planIsFree        = (plan) => plan === 'free';
export const planHasExcelAdv   = (plan) => ['basic', 'pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
export const planHasWhatsApp   = (plan) => ['pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
export const planHasSalaryPay  = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);
export const planHasMonthReset = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);


// ===== STATION SWITCHER COMPONENT =====
const StationSwitcher = ({ stations, activeStation, onSwitch, onManage }) => {