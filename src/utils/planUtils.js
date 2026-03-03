export const getPlan = () => {
  const p = localStorage.getItem('app_plan');
  if (p && p !== 'trial' && p !== 'free') return p;
  const trialStart = localStorage.getItem('app_trial_start');
  if (trialStart) {
    const elapsed = Math.floor((Date.now() - new Date(trialStart)) / (1000 * 60 * 60 * 24));
    if (elapsed < 15) return 'trial';
  }
  if (!p || p === 'trial') return 'free';
  return p;
};

const WORKER_LIMITS = { free: 5, basic: 10, pro: 20, enterprise: Infinity, lifetime: Infinity, trial: Infinity };
export const getWorkerLimit = (plan) => WORKER_LIMITS[plan] ?? 5;
const STATION_LIMITS = { free: 1, basic: 1, pro: 3, enterprise: 3, lifetime: Infinity, trial: Infinity };
export const getStationLimit = (plan) => STATION_LIMITS[plan] ?? 1;
export const ACTIVE_STATION_KEY = (ownerId) => `owner_${ownerId}_active_station`;

export const planIsFree        = (plan) => plan === 'free';
export const planHasExcelAdv   = (plan) => ['basic', 'pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
export const planHasWhatsApp   = (plan) => ['pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
export const planHasSalaryPay  = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);
export const planHasMonthReset = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);
