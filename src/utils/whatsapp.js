import { calcNet, fmt } from './helpers';

// ==================== WHATSAPP NOTIFY ====================
export const sendWhatsAppNotify = (worker, type, entry) => {
  if (!worker.phone) return;
  const typeLabels = {
    delay:             'تأخير',
    absence:           'غياب',
    absence_no_reason: 'عجز / غياب بدون سبب',
    cash:              'سحب نقدي',
    discipline:        'مكافأة انضباط',
  };
  const label = typeLabels[type] || type;
  const amount = entry.deduction || entry.amount || entry.reward || 0;
  const net = calcNet(worker);
  const isPositive = type === 'discipline';

  let msg = '⛽ WaqoudPro\n';
  msg += '─────────────────\n';
  msg += 'مرحباً يا ' + worker.name + ' 👋\n\n';
  if (isPositive) {
    msg += '🎉 تم تسجيل مكافأة انضباط بتاريخ ' + entry.date + '\n';
    msg += '💰 المكافأة: +' + amount + ' ج.م\n';
  } else {
    msg += '⚠️ تم تسجيل ' + label + ' بتاريخ ' + entry.date + '\n';
    if (type === 'delay') msg += '⏰ المدة: ' + entry.minutes + ' دقيقة\n';
    if (type === 'absence') msg += '📝 السبب: ' + entry.reason + '\n';
    msg += '💸 الخصم: -' + amount + ' ج.م\n';
  }
  msg += '─────────────────\n';
  msg += '💵 صافي راتبك المتبقي: ' + fmt(net) + '\n';
  msg += '─────────────────\n';
  msg += 'للاستفسار تواصل مع المالك مباشرة.';

  const phone = worker.phone.startsWith('0') ? '2' + worker.phone : worker.phone;
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
};

// ==================== MONTH ARCHIVE UTILS ====================