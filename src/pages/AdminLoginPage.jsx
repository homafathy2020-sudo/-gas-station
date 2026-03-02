import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ADMIN_EMAIL = 'homafathy2020@gmail.com';

export const AdminLoginPage = ({ onAuth }) => {
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
