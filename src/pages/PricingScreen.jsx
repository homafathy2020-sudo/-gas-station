import { TrialBanner } from '../../shared/components/TrialBanner';
import { TRIAL_DAYS, WHATSAPP_NUMBER } from '../../utils/planUtils';

export const PricingScreen = ({ onBack, onSelectFree }) => {
  const plans = [
    {
      id: 'free',
      emoji: '🆓',
      name: 'المجانية',
      desc: 'ابدأ مجاناً بدون أي التزام',
      price: '0',
      period: 'مجاناً للأبد',
      className: 'free',
      free: true,
      features: [
        { yes: true,  text: 'حتى 5 عمال فقط' },
        { yes: true,  text: 'إدارة الرواتب والخصومات' },
        { yes: false, text: 'تقارير Excel' },
        { yes: false, text: 'إشعارات واتساب للعمال' },
        { yes: false, text: 'تقرير صرف الرواتب' },
        { yes: false, text: 'أرشيف وإغلاق الشهر' },
        { yes: false, text: 'دعم فني' },
      ],
      btnClass: 'btn-success',
      btnLabel: '✅ استمر مجاناً',
      isFreePlan: true,
    },
    {
      id: 'basic',
      emoji: '🚀',
      name: 'الأساسية',
      desc: 'مناسبة للمحطات الصغيرة',
      price: '149',
      period: 'شهرياً',
      className: '',
      features: [
        { yes: true,  text: 'حتى 10 عمال' },
        { yes: true,  text: 'إدارة الرواتب والخصومات' },
        { yes: true,  text: 'تقارير Excel' },
        { yes: false, text: 'إشعارات واتساب للعمال' },
        { yes: false, text: 'تقرير صرف الرواتب' },
        { yes: false, text: 'أرشيف وإغلاق الشهر' },
        { yes: false, text: 'عمال غير محدودين' },
      ],
      btnClass: 'btn-ghost',
      btnLabel: 'اشترك الآن',
    },
    {
      id: 'pro',
      emoji: '⭐',
      name: 'الاحترافية',
      desc: 'الأكثر مبيعاً — للمحطات المتوسطة',
      price: '299',
      period: 'شهرياً',
      className: 'popular',
      popular: true,
      features: [
        { yes: true,  text: 'حتى 20 عاملاً' },
        { yes: true,  text: 'إدارة الرواتب والخصومات' },
        { yes: true,  text: 'تقارير Excel متقدمة' },
        { yes: true,  text: '💬 إشعارات واتساب للعمال' },
        { yes: false, text: 'عمال غير محدودين' },
        { yes: false, text: '💵 تقرير صرف الرواتب' },
        { yes: false, text: '📦 أرشيف وإغلاق الشهر' },
      ],
      btnClass: 'btn-primary',
      btnLabel: '🔥 اشترك الآن',
    },
    {
      id: 'enterprise',
      emoji: '👑',
      name: 'المميزة',
      desc: 'للشركات والمحطات الكبيرة',
      price: '499',
      period: 'شهرياً',
      className: 'gold',
      features: [
        { yes: true,  text: 'عمال غير محدودين' },
        { yes: true,  text: 'إدارة الرواتب والخصومات' },
        { yes: true,  text: 'تقارير Excel متقدمة' },
        { yes: true,  text: '💬 إشعارات واتساب للعمال' },
        { yes: true,  text: '💵 تقرير صرف الرواتب' },
        { yes: true,  text: '📦 أرشيف وإغلاق الشهر' },
        { yes: true,  text: 'دعم فني أولوية 24/7' },
      ],
      btnClass: 'btn-accent',
      btnLabel: '👑 اشترك الآن',
    },
    {
      id: 'lifetime',
      emoji: '♾️',
      name: 'مدى الحياة',
      desc: 'ادفع مرة واحدة — استخدم للأبد',
      price: '4,999',
      period: 'دفعة واحدة فقط — بدون أي رسوم شهرية',
      className: 'lifetime',
      lifetime: true,
      features: [
        { yes: true, text: 'عمال غير محدودين' },
        { yes: true, text: 'إدارة الرواتب والخصومات' },
        { yes: true, text: 'تقارير Excel متقدمة' },
        { yes: true, text: '💬 إشعارات واتساب للعمال' },
        { yes: true, text: '💵 تقرير صرف الرواتب' },
        { yes: true, text: '📦 أرشيف وإغلاق الشهر' },
        { yes: true, text: 'دعم فني أولوية 24/7' },
        { yes: true, text: '🎁 كل التحديثات القادمة مجاناً' },
      ],
      btnClass: 'btn-lifetime',
      btnLabel: '♾️ اشتري مرة واحدة',
    },
  ];

  const msg = encodeURIComponent(`مرحباً، أريد الاشتراك في WaqoudPro لإدارة المحطة 🚀`);
  const wa = (plan) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`مرحباً، أريد الاشتراك في خطة "${plan}" — WaqoudPro ⛽`)}`;

  return (
    <div className="expired-screen">
      <div className="pricing-wrap">
        {/* Header */}
        <div className="pricing-header">
          {onBack && (
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: 13, fontWeight: 600, marginBottom: 24, transition: 'all .2s' }}
              onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
            >
              ← رجوع للتطبيق
            </button>
          )}
          <div className="pricing-icon">⛽</div>
          <div className="pricing-title">انتهت فترة التجربة المجانية</div>
          <div className="pricing-sub">
            استمتعت بـ {TRIAL_DAYS} يوم مجاناً — اختر الخطة المناسبة لمحطتك وابقى متحكم في كل شيء
          </div>
        </div>

        {/* Plans */}
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`plan-card ${plan.className}`}>
              {plan.popular && <div className="popular-badge">⚡ الأكثر مبيعاً</div>}
              {plan.lifetime && <div className="lifetime-badge">♾️ مدى الحياة</div>}
              {plan.free && <div className="free-badge">✅ مجاناً للأبد</div>}
              <div className="plan-emoji">{plan.emoji}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.desc}</div>
              <div className="plan-price">
                <sup>ج.م </sup>{plan.price}
                {!plan.lifetime && <sub> /شهر</sub>}
              </div>
              <div className="plan-period">{plan.period}</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {plan.features.map((f, i) => (
                  <div key={i} className={`plan-feature ${f.yes ? 'yes' : 'no'}`}>
                    <span className="feat-icon">{f.yes ? '✅' : '❌'}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
              {plan.isFreePlan ? (
                <button className={`btn ${plan.btnClass}`} style={{ justifyContent: 'center', marginTop: 'auto' }}
                  onClick={() => onSelectFree && onSelectFree()}>
                  {plan.btnLabel}
                </button>
              ) : (
                <a href={wa(plan.name)} target="_blank" rel="noreferrer" className={`btn ${plan.btnClass}`} style={{ justifyContent: 'center', textDecoration: 'none', marginTop: 'auto', paddingTop: plan.lifetime ? 20 : undefined }}>
                  {plan.btnLabel}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="contact-strip">
          <p>مش متأكد إيه الخطة المناسبة؟ تواصل معنا على واتساب وهنساعدك تختار الأنسب لمحطتك</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
            <span style={{ fontSize: 20 }}>💬</span>
            تواصل معنا على واتساب
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          جميع الخطط تشمل: تشفير البيانات · دعم عربي كامل · تحديثات مجانية
        </div>
      </div>
    </div>
  );
};
