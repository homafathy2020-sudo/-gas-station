import { useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential } from 'firebase/auth';
import { COLLECTION_PREFIX } from '../../config/env';
import { auth, db } from '../../firebase';
import { useToast } from '../../shared/components/Toast';
import { fmt } from '../../utils/helpers';
import { getPlan, planHasExcelAdv, planHasMonthReset, planHasSalaryPay, planHasWhatsApp } from '../../utils/planUtils';
import { BackupCard } from './BackupCard';

// ==================== OWNER PROFILE PAGE ====================
const AVATAR_OPTIONS = [
  { emoji: '👑', label: 'ملك' },
  { emoji: '🧑‍💼', label: 'مدير' },
  { emoji: '👷', label: 'مهندس' },
  { emoji: '🦁', label: 'أسد' },
  { emoji: '🐯', label: 'نمر' },
  { emoji: '🦅', label: 'نسر' },
  { emoji: '🔥', label: 'نار' },
  { emoji: '⚡', label: 'برق' },
  { emoji: '💎', label: 'ماس' },
  { emoji: '🚀', label: 'صاروخ' },
  { emoji: '⛽', label: 'محطة' },
  { emoji: '🏆', label: 'بطل' },
  { emoji: '🌟', label: 'نجمة' },
  { emoji: '🎯', label: 'هدف' },
  { emoji: '🦊', label: 'ثعلب' },
  { emoji: '🐺', label: 'ذئب' },
];
const AVATAR_BG_OPTIONS = [
  { label: 'أزرق', value: 'linear-gradient(135deg,#1a56db,#3b82f6)' },
  { label: 'ذهبي', value: 'linear-gradient(135deg,#d97706,#f59e0b)' },
  { label: 'أخضر', value: 'linear-gradient(135deg,#059669,#10b981)' },
  { label: 'بنفسجي', value: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { label: 'أحمر', value: 'linear-gradient(135deg,#dc2626,#ef4444)' },
  { label: 'وردي', value: 'linear-gradient(135deg,#db2777,#ec4899)' },
  { label: 'سماوي', value: 'linear-gradient(135deg,#0891b2,#06b6d4)' },
  { label: 'برتقالي', value: 'linear-gradient(135deg,#ea580c,#f97316)' },
];

export const OwnerProfilePage = ({ user, onUpdate, onShowPricing, workers, workPlaces, ownerUsers }) => {
  const toast = useToast();
  const [phone, setPhone] = useState(user.phone || '');
  const [name, setName] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  // Avatar state
  const [selectedEmoji, setSelectedEmoji] = useState(user.avatarEmoji || '');
  const [selectedBg, setSelectedBg] = useState(user.avatarBg || AVATAR_BG_OPTIONS[0].value);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const planLabels = { free: '🆓 المجانية', starter: '⭐ الأساسية', enterprise: '👑 المميزة', lifetime: '♾️ مدى الحياة', trial: '🎯 تجريبية', basic: '🚀 الأساسية', pro: '⭐ الاحترافية' };
  const currentPlan = getPlan();
  const planLabel = planLabels[currentPlan] || currentPlan;
  const isPremium = currentPlan === 'enterprise' || currentPlan === 'lifetime';
  const totalWorkersCount = workers.length;
  const totalSalaries = workers.reduce((s, w) => s + (w.salary || 0), 0);

  const save = async () => {
    if (!name.trim()) { toast('الاسم مطلوب', 'error'); return; }
    setSaving(true);
    const updated = { ...user, name: name.trim(), phone: phone.trim(), avatarEmoji: selectedEmoji, avatarBg: selectedBg };
    try {
      await updateDoc(doc(db, 'users', user.id), { name: updated.name, phone: updated.phone, avatarEmoji: selectedEmoji, avatarBg: selectedBg });
      onUpdate(updated);
      toast('تم حفظ بياناتك ✓', 'success');
    } catch { toast('حدث خطأ، حاول مرة أخرى', 'error'); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!currentPass) { toast('أدخل كلمة المرور الحالية', 'error'); return; }
    if (newPass.length < 6) { toast('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'error'); return; }
    if (newPass !== confirmPass) { toast('كلمة المرور الجديدة غير متطابقة', 'error'); return; }
    setSavingPass(true);
    try {
      const firebaseUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPass);
      toast('تم تغيير كلمة المرور بنجاح ✓', 'success');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setShowPassSection(false);
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') toast('كلمة المرور الحالية غير صحيحة', 'error');
      else toast('حدث خطأ، حاول مرة أخرى', 'error');
    }
    setSavingPass(false);
  };

  const avatarBg = selectedBg || 'linear-gradient(135deg,var(--primary),var(--accent))';
  const avatarContent = selectedEmoji || name[0] || '؟';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', animation: 'fadeIn .3s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26,86,219,0.15), rgba(245,158,11,0.08))',
        border: '1px solid rgba(26,86,219,0.2)',
        borderRadius: 24,
        padding: '32px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* خلفية ديكور */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(245,158,11,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* الأفاتار */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 22,
            background: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: selectedEmoji ? 42 : 36, fontWeight: 900,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '3px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s',
          }}>
            {avatarContent}
          </div>
          <button
            onClick={() => setShowAvatarPicker(true)}
            style={{
              position: 'absolute', bottom: -6, left: -6,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--primary-light)', border: '2px solid var(--dark-2)',
              color: 'white', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title="تغيير الأفاتار"
          >✏️</button>
        </div>

        {/* البيانات */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>👑 مالك المحطة</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 14px', fontSize: 12 }}>
              👷 {totalWorkersCount} عامل
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '6px 14px', fontSize: 12, color: '#10b981', fontWeight: 700 }}>
              💰 {fmt(totalSalaries)} / شهر
            </div>
            <div style={{
              background: isPremium ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)',
              border: `1px solid ${isPremium ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
              borderRadius: 10, padding: '6px 14px', fontSize: 12,
              color: isPremium ? '#f59e0b' : 'var(--text-muted)', fontWeight: 700
            }}>
              {planLabel}
            </div>
          </div>
        </div>
      </div>

      {/* ── AVATAR PICKER MODAL ── */}
      {showAvatarPicker && (
        <div className="modal-overlay" onClick={() => setShowAvatarPicker(false)}>
          <div className="modal" style={{ maxWidth: 460, animation: 'fadeIn .2s ease' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🎨 اختر أفاتار</div>
              <button className="close-btn" onClick={() => setShowAvatarPicker(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* معاينة */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: selectedBg || avatarBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: selectedEmoji ? 38 : 32, fontWeight: 900,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s',
                }}>
                  {selectedEmoji || name[0] || '؟'}
                </div>
              </div>

              {/* اختيار الأيقونة */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>الأيقونة</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                  {/* خيار بلا أيقونة — أول حرف من الاسم */}
                  <button
                    onClick={() => setSelectedEmoji('')}
                    title="أول حرف من الاسم"
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 10,
                      background: !selectedEmoji ? 'rgba(26,86,219,0.2)' : 'rgba(255,255,255,0.05)',
                      border: !selectedEmoji ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                      cursor: 'pointer', fontSize: 16, fontWeight: 900, color: 'var(--text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {name[0] || '؟'}
                  </button>
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt.emoji}
                      onClick={() => setSelectedEmoji(opt.emoji)}
                      title={opt.label}
                      style={{
                        width: '100%', aspectRatio: '1', borderRadius: 10,
                        background: selectedEmoji === opt.emoji ? 'rgba(26,86,219,0.2)' : 'rgba(255,255,255,0.05)',
                        border: selectedEmoji === opt.emoji ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                        cursor: 'pointer', fontSize: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* اختيار اللون */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>لون الخلفية</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_BG_OPTIONS.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => setSelectedBg(bg.value)}
                      title={bg.label}
                      style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: bg.value,
                        border: selectedBg === bg.value ? '3px solid white' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: selectedBg === bg.value ? '0 0 0 2px var(--primary-light)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAvatarPicker(false)}>✅ تم</button>
              <button className="btn btn-ghost" onClick={() => setShowAvatarPicker(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ── البيانات الشخصية ── */}
      <div className="card" style={{ padding: 26 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>👤</span> البيانات الشخصية
        </div>

        {/* الإيميل - عرض فقط */}
        <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>📧 البريد الإلكتروني</div>
            <div style={{ fontSize: 14, direction: 'ltr', textAlign: 'left' }}>{user.email || '—'}</div>
          </div>
          <span style={{ fontSize: 11, background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>لا يمكن تغييره</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">👤 الاسم الكامل</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل" />
          </div>
          <div className="form-group">
            <label className="form-label">
              📱 رقم التليفون
              {!user.phone && <span style={{ marginRight: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: 6, fontSize: 10 }}>⚠️ غير مكتمل</span>}
            </label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" type="tel" dir="ltr" />
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, marginTop: -8 }}>📌 رقمك بيُستخدم لإرسال الإشعارات عبر واتساب</div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={save} disabled={saving}>
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ البيانات'}
        </button>
      </div>

      {/* ── الباقة الحالية ── */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📦</span> باقتك الحالية
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: '10px 20px', borderRadius: 20, fontWeight: 700, fontSize: 15,
              background: isPremium ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.12)',
              color: isPremium ? '#f59e0b' : 'var(--text-muted)',
              border: `1px solid ${isPremium ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
            }}>
              {planLabel}
            </div>
            {isPremium && <span style={{ fontSize: 12, color: '#10b981' }}>✅ أنت على أعلى باقة</span>}
          </div>
          {!isPremium && (
            <button className="btn btn-accent btn-sm" onClick={() => onShowPricing && onShowPricing()}>
              👑 ترقية الباقة
            </button>
          )}
        </div>
        {/* ميزات الباقة بشكل مختصر */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {[
            { ok: true, label: 'رواتب وخصومات' },
            { ok: planHasExcelAdv(currentPlan), label: 'تقارير Excel' },
            { ok: planHasWhatsApp(currentPlan), label: 'واتساب للعمال' },
            { ok: planHasSalaryPay(currentPlan), label: 'صرف الرواتب' },
            { ok: planHasMonthReset(currentPlan), label: 'أرشيف الشهور' },
          ].map((f, i) => (
            <span key={i} style={{
              fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 20,
              background: f.ok ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.08)',
              color: f.ok ? '#10b981' : 'var(--text-muted)',
              border: `1px solid ${f.ok ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
              opacity: f.ok ? 1 : 0.5,
            }}>
              {f.ok ? '✅' : '❌'} {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── كود المالك ── */}
      {user.ownerCode && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔑</span> كود الانضمام الخاص بك
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1, padding: '12px 18px', background: 'rgba(26,86,219,0.08)',
              border: '2px solid rgba(26,86,219,0.25)', borderRadius: 12,
              fontFamily: 'monospace', fontSize: 20, fontWeight: 900,
              color: 'var(--primary-light)', letterSpacing: 3, textAlign: 'center',
            }}>
              {user.ownerCode}
            </div>
            <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(user.ownerCode); toast('تم نسخ الكود ✓', 'success'); }}>📋 نسخ</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>يستخدمه العمال عند التسجيل للانضمام لحسابك</div>
        </div>
      )}

      {/* ── تغيير كلمة المرور ── */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPassSection ? 20 : 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔐</span> تغيير كلمة المرور
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPassSection(v => !v)}>
            {showPassSection ? '✕ إغلاق' : '✏️ تغيير'}
          </button>
        </div>
        {showPassSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">كلمة المرور الحالية</label>
              <input className="form-input" type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="••••••••" dir="ltr" />
            </div>
            <div className="form-grid-2">
              <div>
                <label className="form-label">كلمة المرور الجديدة</label>
                <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" />
              </div>
              <div>
                <label className="form-label">تأكيد كلمة المرور</label>
                <input className="form-input" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" dir="ltr" />
              </div>
            </div>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={changePassword} disabled={savingPass}>
              {savingPass ? '⏳ جاري التغيير...' : '🔐 تأكيد تغيير كلمة المرور'}
            </button>
          </div>
        )}
      </div>

      {/* ── النسخ الاحتياطية ── */}
      <BackupCard ownerId={user.id} workers={workers} workPlaces={workPlaces} ownerUsers={ownerUsers} />
    </div>
  );
};
const AdminLoginPage = ({ onAuth }) => {
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pass.trim()) return;
    setLoading(true);
    setErr('');
    try {
      const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pass);
      // تحقق إن الـ role = admin في Firestore
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        onAuth(cred.user);
      } else {
        await signOut(auth);
        setErr('ليس لديك صلاحية الوصول ❌');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (e) {
      setErr('باسوورد غلط أو حساب غير موجود ❌');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' }}>
      <div style={{ width: 360, animation: shake ? 'shake .5s ease' : 'fadeIn .3s ease' }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>لوحة تحكم المطور</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>WaqoudPro — Admin Only</div>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                className="form-input"
                value={pass}
                onChange={e => { setPass(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="أدخل كلمة المرور"
                autoFocus
              />
              <button onClick={() => setShow(!show)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
            {err && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{err}</div>}
          </div>
          <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={submit} disabled={loading}>
            {loading ? '⏳ جاري الدخول...' : '🔓 دخول'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== ADMIN PANEL ====================