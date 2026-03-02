import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { COLLECTION_PREFIX } from '../../config/env';
import { auth, db } from '../../firebase';
import { Loader } from '../../shared/components/Loader';
import { useToast } from '../../shared/components/Toast';

// ==================== LOGIN (Firebase Auth) ====================
export const LoginPage = ({ onLogin, onRegisterWorker }) => {
  const [tab, setTab] = useState('login');
  const [loginForm, setLoginForm]   = useState({ emailOrUsername: '', password: '', loginRole: 'owner' });
  const [regForm,   setRegForm]     = useState({ email: '', username: '', password: '', name: '', role: 'owner', ownerCode: '' });
  const [errors,    setErrors]      = useState({});
  const [loading,   setLoading]     = useState(false);
  
  const toast = useToast();

  // ---- تسجيل الدخول ----
  const submitLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginForm.emailOrUsername.trim()) errs.emailOrUsername = 'هذا الحقل مطلوب';
    if (loginForm.password.length < 6)     errs.password = 'كلمة المرور 6 أحرف على الأقل';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      let emailToUse = loginForm.emailOrUsername.trim();

      // لو عامل، حول الـ username لـ fake email بنفس طريقة الإنشاء
      if (loginForm.loginRole === 'worker') {
        const safeUsername = loginForm.emailOrUsername.trim().toLowerCase().replace(/\s+/g, '_');
        const encodedUsername = encodeURIComponent(safeUsername).replace(/%/g, 'x').toLowerCase();
        emailToUse = `${encodedUsername}@waqoudpro.worker`;
      }

      let cred;

      if (loginForm.loginRole === 'owner') {
        // المالك بيدخل بالـ email مباشرة
        cred = await signInWithEmailAndPassword(auth, emailToUse, loginForm.password);
      } else {
        // العامل — جرب كل الـ variants
        const rawUsername = loginForm.emailOrUsername.trim();
        const usernameWithUnderscore = rawUsername.replace(/\s+/g, '_');

        const emailVariants = [
          `${usernameWithUnderscore}@petromin.worker`,
          `${usernameWithUnderscore.toLowerCase()}@petromin.worker`,
          emailToUse,
          `${usernameWithUnderscore}@waqoudpro.worker`,
        ];

        let lastErr = null;
        for (const email of emailVariants) {
          try {
            cred = await signInWithEmailAndPassword(auth, email, loginForm.password);
            break;
          } catch (e) {
            lastErr = e;
            if (e.code !== 'auth/invalid-credential' && e.code !== 'auth/wrong-password' && e.code !== 'auth/user-not-found') {
              throw e;
            }
          }
        }
        if (!cred) throw lastErr;
      }

      const uid  = cred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) { setErrors({ form: 'بيانات المستخدم غير موجودة' }); setLoading(false); return; }
      const userData = { id: uid, ...userDoc.data() };

      if (userData.deleted) {
        await signOut(auth);
        setErrors({ form: 'تم حذف حسابك من قِبل المالك. تواصل معه لإعادة التسجيل.' });
        setLoading(false); return;
      }

      toast('مرحباً بك ' + userData.name, 'success');
      onLogin(userData);
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'حدث خطأ، حاول مرة أخرى';
      setErrors({ form: msg });
    }
    setLoading(false);
  };

  // ---- إنشاء حساب ----
  const submitRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    // المالك يحتاج إيميل، العامل يحتاج username
    if (regForm.role === 'owner') {
      if (!regForm.email.trim())       errs.reg_email    = 'البريد الإلكتروني مطلوب';
    } else {
      if (!regForm.username.trim())    errs.reg_username = 'اسم المستخدم مطلوب';
      else if (!/^[a-zA-Z0-9_؀-ۿ]+$/.test(regForm.username.trim()))
        errs.reg_username = 'اسم المستخدم: حروف وأرقام بس (بدون مسافات)';
    }
    if (!regForm.name.trim())        errs.reg_name     = 'الاسم الكامل مطلوب';
    if (regForm.password.length < 6) errs.reg_password = 'كلمة المرور 6 أحرف على الأقل';

    let ownerData = null;
    if (regForm.role === 'worker') {
      if (!regForm.ownerCode.trim()) { errs.reg_ownerCode = 'كود المالك مطلوب'; }
      else {
        try {
          // تنظيف الكود — شيل أي حروف عربية أو مسافات أو رموز غريبة
          const cleanCode = regForm.ownerCode.trim().replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
          console.log('[DEBUG] looking up ownerCode:', cleanCode);
          const codeDoc = await getDoc(doc(db, 'ownerCodes', cleanCode));
          console.log('[DEBUG] codeDoc.exists:', codeDoc.exists());
          if (!codeDoc.exists()) {
            errs.reg_ownerCode = 'كود المالك غير صحيح';
          } else {
            const ownerId = codeDoc.data().ownerId;
            // ✅ كل البيانات من ownerCodes — بدون أي قراءة تانية محتاجة auth
            ownerData = { id: ownerId, ownerCode: cleanCode };
            const norm = (s) => s.trim().replace(/\s+/g, ' ').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[يى]/g, 'ي');
            const inviteList = codeDoc.data().inviteList || [];
            if (inviteList.length > 0) {
              const found = inviteList.some(inv => norm(inv) === norm(regForm.name));
              if (!found) {
                errs.reg_name = 'الاسم ده مش موجود في قائمة الدعوات — تأكد إن المالك كتب اسمك بالظبط';
              }
            }
          }
        } catch(e) {
          console.error('[DEBUG] owner lookup error:', e.code, e.message);
          errs.reg_ownerCode = 'تعذّر التحقق من الكود — تأكد من الاتصال بالإنترنت';
        }
      }
    }

    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const roleLabels = { owner: 'المالك', worker: 'عامل' };
      // العامل يستخدم fake email من username مع encode للعربي
      const emailForAuth = regForm.role === 'worker'
        ? `${encodeURIComponent(regForm.username.trim().replace(/\s+/g,'_')).replace(/%/g,'x').toLowerCase()}@waqoudpro.worker`
        : regForm.email.trim();

      const cred = await createUserWithEmailAndPassword(auth, emailForAuth, regForm.password);
      const uid  = cred.user.uid;
      const newUser = {
        id: uid,
        email:     emailForAuth,
        name:      regForm.name.trim(),
        role:      regForm.role,
        roleLabel: roleLabels[regForm.role],
        ...(regForm.role === 'owner'  ? { ownerCode: 'STAT-' + Math.random().toString(36).substring(2,6).toUpperCase(), ownerId: uid } : {}),
        ...(regForm.role === 'worker' ? { username: regForm.username.trim().toLowerCase(), ownerId: ownerData?.id } : {}),
      };
      await setDoc(doc(db, 'users', uid), newUser);

      // لو مالك، ابدأله الـ trial تلقائياً من لحظة التسجيل
      if (regForm.role === 'owner') {
        await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, uid, `${COLLECTION_PREFIX}settings`, 'subscription'), {
          trialStart: new Date().toISOString(),
          plan: 'trial',
        });
        // احفظ في localStorage برضو
        localStorage.setItem('app_trial_start', new Date().toISOString());
        localStorage.removeItem('app_plan');
        try {
          await setDoc(doc(db, 'ownerCodes', newUser.ownerCode), { ownerId: uid, ownerName: newUser.name, inviteList: [] });
        } catch(e) { console.error('[DEBUG] ownerCodes write failed:', e.code); }
      }

      // لو عامل، يتضاف في داتا المالك
      if (regForm.role === 'worker' && ownerData && onRegisterWorker) {
        await onRegisterWorker(newUser, ownerData.id);
        // امسح الدعوة من Firebase مباشرة
        try {
          const norm = (s) => s.trim().replace(/\s+/g, ' ').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[يى]/g, 'ي');
          const workerNorm = norm(regForm.name);
          const inviteDoc = await getDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerData.id, `${COLLECTION_PREFIX}meta`, 'invites'));
          const currentList = inviteDoc.exists() ? (inviteDoc.data().list || []) : [];
          const updatedList = currentList.filter(x => norm(x) !== workerNorm);
          await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerData.id, `${COLLECTION_PREFIX}meta`, 'invites'), { list: updatedList });
          await setDoc(doc(db, 'ownerCodes', ownerData.ownerCode), { inviteList: updatedList }, { merge: true });
        } catch (e) { console.log('invite remove error', e); }
      }

      // لو مالك، ادخله على طول بدون تحقق من الإيميل
      toast('تم إنشاء الحساب بنجاح ✓', 'success');
      onLogin(newUser);
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'البريد الإلكتروني مستخدم مسبقاً' : 'حدث خطأ، حاول مرة أخرى';
      setErrors({ form: msg });
    }
    setLoading(false);
  };

  const lf = k => ({ value: loginForm[k], onChange: e => { setLoginForm({ ...loginForm, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); }, className: `form-input ${errors[k] ? 'error' : ''}` });
  const rf = k => ({ value: regForm[k] || '', onChange: e => { setRegForm({ ...regForm, [k]: e.target.value }); setErrors({ ...errors, ['reg_'+k]: '' }); }, className: `form-input ${errors['reg_'+k] ? 'error' : ''}` });

  const tabStyle = (t) => ({
    flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif', fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
    background: tab === t ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'rgba(255,255,255,0.04)',
    color: tab === t ? 'white' : 'var(--text-muted)',
    boxShadow: tab === t ? '0 4px 12px rgba(26,86,219,0.3)' : 'none',
  });

  // شاشة تأكيد الإيميل
  return (
    <div className="login-page">
      {loading && <Loader />}
      <div className="login-bg" />
      <div className="login-card" style={{ animation: 'fadeIn .4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="login-logo">⛽</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>WaqoudPro</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>نظام المحطات الذكي</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'rgba(255,255,255,0.04)', padding: 6, borderRadius: 14, border: '1px solid var(--border)' }}>
          <button style={tabStyle('login')}    onClick={() => { setTab('login');    setErrors({}); }}>🔐 تسجيل الدخول</button>
          <button style={tabStyle('register')} onClick={() => { setTab('register'); setErrors({}); }}>✨ إنشاء حساب</button>
        </div>

        <div className="card">
          {/* ---- تسجيل الدخول ---- */}
          {tab === 'login' && (
            <form onSubmit={submitLogin}>
              {errors.form && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{errors.form}</div>}

              {/* اختيار نوع الحساب عند الدخول */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 12, border: '1px solid var(--border)' }}>
                {[{ r: 'owner', label: '👑 مالك' }, { r: 'worker', label: '👷 عامل' }].map(opt => (
                  <button key={opt.r} type="button"
                    onClick={() => setLoginForm({ ...loginForm, loginRole: opt.r, emailOrUsername: '' })}
                    style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                      background: loginForm.loginRole === opt.r ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'transparent',
                      color: loginForm.loginRole === opt.r ? 'white' : 'var(--text-muted)' }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">{loginForm.loginRole === 'owner' ? '📧 البريد الإلكتروني' : '👤 اسم المستخدم'}</label>
                <input
                  type={loginForm.loginRole === 'owner' ? 'email' : 'text'}
                  placeholder={loginForm.loginRole === 'owner' ? 'example@email.com' : 'اكتب اسم المستخدم'}
                  {...lf('emailOrUsername')}
                />
                {errors.emailOrUsername && <div className="form-error">{errors.emailOrUsername}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور</label>
                <input type="password" placeholder="أدخل كلمة المرور" {...lf('password')} />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 6 }}>🔐 دخول</button>
            </form>
          )}

          {/* ---- إنشاء حساب ---- */}
          {tab === 'register' && (
            <form onSubmit={submitRegister}>
              {errors.form && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{errors.form}</div>}
              {/* اختيار النوع */}
              <div style={{ marginBottom: 20 }}>
                <div className="form-label" style={{ marginBottom: 10 }}>نوع الحساب</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { role: 'owner',  icon: '👑', label: 'مالك',  desc: 'صلاحيات كاملة',   color: '#10b981', bg: 'rgba(16,185,129,' },
                    { role: 'worker', icon: '👷', label: 'عامل',  desc: 'أدخل كود المالك', color: '#3b82f6', bg: 'rgba(59,130,246,' },
                  ].map(opt => (
                    <button key={opt.role} type="button"
                      onClick={() => { setRegForm({ ...regForm, role: opt.role, ownerCode: '' }); setErrors({}); }}
                      style={{
                        flex: 1, padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${regForm.role === opt.role ? opt.color : 'var(--border)'}`,
                        background: regForm.role === opt.role ? `${opt.bg}0.12)` : 'rgba(255,255,255,0.03)',
                        color: regForm.role === opt.role ? opt.color : 'var(--text-muted)',
                        transition: 'all 0.2s', fontFamily: 'Cairo, sans-serif',
                        transform: regForm.role === opt.role ? 'scale(1.02)' : 'scale(1)',
                      }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, marginTop: 3, opacity: 0.8 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* كود المالك — بس لو عامل */}
              {regForm.role === 'worker' && (
                <div className="form-group" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <label className="form-label" style={{ color: '#3b82f6' }}>🔑 كود المالك</label>
                  <input placeholder="اكتب كود المالك بتاعك" {...rf('ownerCode')} />
                  {errors.reg_ownerCode && <div className="form-error">{errors.reg_ownerCode}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>اطلب الكود من المالك</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">الاسم الكامل</label>
                <input placeholder="أدخل اسمك الكامل" {...rf('name')} />
                {errors.reg_name && <div className="form-error">{errors.reg_name}</div>}
              </div>

              {/* المالك يسجل بإيميل، العامل بـ username */}
              {regForm.role === 'owner' ? (
                <div className="form-group">
                  <label className="form-label">📧 البريد الإلكتروني</label>
                  <input type="email" placeholder="example@email.com" {...rf('email')} />
                  {errors.reg_email && <div className="form-error">{errors.reg_email}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>⚠️ هيتبعتلك إيميل تأكيد — تأكد إنه حقيقي</div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">👤 اسم المستخدم</label>
                  <input placeholder="مثال: ahmed_worker" {...rf('username')} />
                  {errors.reg_username && <div className="form-error">{errors.reg_username}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>حروف وأرقام بس — هيستخدمه للدخول</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">كلمة المرور</label>
                <input type="password" placeholder="6 أحرف على الأقل" {...rf('password')} />
                {errors.reg_password && <div className="form-error">{errors.reg_password}</div>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 6 }}>✨ إنشاء الحساب</button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          MADE BY ADHAM FATHY
        </div>
      </div>
    </div>
  );
};

// ==================== SIDEBAR ====================