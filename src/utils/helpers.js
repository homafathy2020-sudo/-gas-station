// ==================== UTILS ====================
export const totalDed = (w) => [...w.delays, ...w.absences, ...(w.absences_no_reason || [])].reduce((s, e) => s + (e.deduction || 0), 0);
export const totalRewards = (w) => ((w.discipline || []).reduce((s, e) => s + (e.reward || 0), 0));
export const totalCash = (w) => ((w.cash_withdrawals || []).reduce((s, e) => s + (e.amount || 0), 0));
export const calcNet = (w) => w.salary - totalDed(w) + totalRewards(w) - totalCash(w);
export const fmt = (n) => `${Number(n).toLocaleString('ar-EG')} ج.م`;

// إرسال Browser Notification للعامل
export const sendWorkerNotification = (workerName, type, amount, net) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const typeLabels = {
    delay:             'تأخير',
    absence:           'غياب',
    absence_no_reason: 'عجز / غياب بدون سبب',
    cash:              'سحب نقدي',
  };
  const label = typeLabels[type] || type;
  const title = `💸 تنبيه مالي — ${workerName}`;
  const body  = `تم خصم ${fmt(amount)} بسبب ${label}\nصافي الراتب المتبقي: ${fmt(net)}`;
  new Notification(title, { body, icon: '/favicon.ico' });
};

// ==================== WHATSAPP NOTIFY ====================