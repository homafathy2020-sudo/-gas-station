// ==================== CONSTANTS ====================

export const WORK_PLACES = ['الطرمبة 1', 'الطرمبة 2', 'الطرمبة 3', 'الطرمبة 4', 'المكتب', 'الورشة', 'البوابة'];
export const TRIAL_DAYS = 15;
export const WHATSAPP_NUMBER = '201220523598';
export const MAX_BACKUPS = 30;
export const BACKUP_INTERVAL_HOURS = 24;

export const FUEL_TYPES = ['بنزين 80', 'بنزين 92', 'بنزين 95', 'سولار', 'غاز طبيعي'];
export const SHIFT_TYPES = ['صباحي', 'مسائي', 'ليلي'];

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'homafathy2020@gmail.com';

export const WORKER_LIMITS = {
  free: 5, starter: 15, pro: 30,
  enterprise: Infinity, lifetime: Infinity, trial: Infinity
};

export const STATION_LIMITS = {
  free: 1, starter: 1, pro: 3,
  enterprise: Infinity, lifetime: Infinity, trial: Infinity
};

export const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

export const TODAY = new Date(
  new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })
).toISOString().split('T')[0];

// ==================== PLAN HELPERS ====================

export const getWorkerLimit  = (plan) => WORKER_LIMITS[plan] ?? 5;
export const getStationLimit = (plan) => STATION_LIMITS[plan] ?? 1;
export const planHasExcelAdv   = (plan) => ['starter','pro','enterprise','lifetime','trial'].includes(plan);
export const planHasWhatsApp   = (plan) => ['starter','pro','enterprise','lifetime','trial'].includes(plan);
export const planHasSalaryPay  = (plan) => ['pro','enterprise','lifetime','trial'].includes(plan);
export const planHasMonthReset = (plan) => ['pro','enterprise','lifetime','trial'].includes(plan);

export const getPlan = () => {
  const p = localStorage.getItem('app_plan');
  if (p && p !== 'trial' && p !== 'free') return p;
  const trialStart = localStorage.getItem('app_trial_start');
  if (trialStart) {
    const elapsed = Math.floor((Date.now() - new Date(trialStart)) / (1000 * 60 * 60 * 24));
    if (elapsed < TRIAL_DAYS) return 'trial';
  }
  if (!p || p === 'trial') return 'free';
  return p;
};

export const ACTIVE_STATION_KEY = (ownerId) => `owner_${ownerId}_active_station`;

// ==================== CALC UTILS ====================

export const totalDed = (w) =>
  [...(w.delays || []), ...(w.absences || []), ...(w.absences_no_reason || [])]
    .reduce((s, e) => s + (e.deduction || 0), 0);

export const totalRewards = (w) =>
  ((w.incentives || w.discipline || []).reduce((s, e) => s + (e.reward || e.amount || 0), 0));

export const totalCash = (w) =>
  ((w.cash_withdrawals || []).reduce((s, e) => s + (e.amount || 0), 0));

export const calcNet = (w) => w.salary - totalDed(w) + totalRewards(w) - totalCash(w);

export const fmt = (n) => `${Number(n).toLocaleString('ar-EG')} ج.م`;

// ==================== VALIDATION ====================

export const validateNum = (val, label) => {
  const n = Number(val);
  if (val === '' || val === null || val === undefined) return `${label} مطلوب`;
  if (isNaN(n)) return `${label} يجب أن يكون رقماً`;
  if (n < 0) return `${label} لا يمكن أن يكون أقل من 0`;
  if (n > 1000000) return `${label} لا يمكن أن يتجاوز 1,000,000`;
  return '';
};

// ==================== NOTIFICATION ====================

export const sendWorkerNotification = (workerName, type, amount, net) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const typeLabels = {
    delay: 'تأخير', absence: 'غياب',
    absence_no_reason: 'عجز / غياب بدون سبب', cash: 'سحب نقدي',
  };
  const label = typeLabels[type] || type;
  new Notification(`تنبيه مالي — ${workerName}`, {
    body: `تم خصم ${fmt(amount)} بسبب ${label}\nصافي الراتب المتبقي: ${fmt(net)}`,
    icon: '/favicon.ico'
  });
};

// ==================== WHATSAPP ====================

export const sendWhatsAppNotify = (worker, type, entry, calcNetFn) => {
  if (!worker.phone) return;
  const typeLabels = {
    delay: 'تأخير', absence: 'غياب',
    absence_no_reason: 'عجز / غياب بدون سبب',
    cash: 'سحب نقدي', incentive: 'حافز', discipline: 'حافز',
  };
  const label = typeLabels[type] || type;
  const amount = entry.deduction || entry.amount || entry.reward || 0;
  const net = calcNetFn ? calcNetFn(worker) : calcNet(worker);
  const isPositive = type === 'incentive' || type === 'discipline';

  let msg = 'WaqoudPro\n─────────────────\n';
  msg += `مرحباً يا ${worker.name} \n\n`;
  if (isPositive) {
    msg += `تم تسجيل حافز بتاريخ ${entry.date}\n`;
    msg += `قيمة الحافز: +${amount} ج.م\n`;
    if (entry.reason) msg += `السبب: ${entry.reason}\n`;
  } else {
    msg += `⚠️ تم تسجيل ${label} بتاريخ ${entry.date}\n`;
    if (type === 'delay') msg += `⏰ المدة: ${entry.minutes} دقيقة\n`;
    if (type === 'absence') msg += `السبب: ${entry.reason}\n`;
    msg += `الخصم: -${amount} ج.م\n`;
  }
  msg += `─────────────────\nصافي راتبك المتبقي: ${fmt(net)}\n`;
  msg += `─────────────────\nللاستفسار تواصل مع المالك مباشرة.`;

  const phone = worker.phone.startsWith('0') ? '2' + worker.phone : worker.phone;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
};

// ==================== REPORT UTILS ====================

export const generateReport = (worker) => {
  // استدعاء generateMonthlyReport من الملف الرئيسي
  window.__generateReport?.(worker);
};

// ==================== STORAGE KEYS ====================

export const _lsKey = (ownerId, type) => `owner_${ownerId}_${type}`;

export const getMonthArchives = (ownerId, stationId) => {
  const key = stationId
    ? `owner_${ownerId}_station_${stationId}_month_archives`
    : `owner_${ownerId}_month_archives`;
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};

export const getPaymentRecords = (ownerId, stationId) => {
  const key = stationId
    ? `owner_${ownerId}_station_${stationId}_payments`
    : `owner_${ownerId}_payments`;
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};

export const getTrialInfo = () => {
  const startDate = localStorage.getItem('app_trial_start');
  if (!startDate) return { remaining: TRIAL_DAYS, expired: false, elapsedDays: 0, startDate: null };
  const start = new Date(startDate);
  const now = new Date();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  const expired = elapsedDays >= TRIAL_DAYS;
  return { remaining, expired, elapsedDays, startDate };
};
