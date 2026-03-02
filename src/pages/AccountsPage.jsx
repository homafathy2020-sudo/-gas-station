import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { COLLECTION_PREFIX } from '../../config/env';
import { auth, db } from '../../firebase';
import { saveInvites } from '../../lib/firestore';
import { useToast } from '../../shared/components/Toast';

// ==================== ACCOUNTS PAGE ====================
// الآن تدعم: مالك، مدير، عامل
// المالك يقدر يشيل المدير ويغير كلمة سره
// لما تضيف عامل من هنا، يتضاف في قائمة العمال تلقائياً
export const AccountsPage = ({ users, onAddUser, onEditUser, onDeleteUser, currentUser, workers, onAddWorker }) => {
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'worker' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [changePassId, setChangePassId] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [newPassErr, setNewPassErr] = useState('');
  const [inviteWorkerName, setInviteWorkerName] = useState('');
  const [invites, setInvites] = useState([]);
  const [addingUser, setAddingUser] = useState(false);

  // جيب الدعوات من Firebase عند فتح الصفحة
  useEffect(() => {
    const loadInvites = async () => {
      try {
        const d = await getDoc(doc(db, `${COLLECTION_PREFIX}owners`, currentUser.id, `${COLLECTION_PREFIX}meta`, 'invites'));
        if (d.exists()) setInvites(d.data().list || []);
      } catch {}
    };
    loadInvites();
  }, []);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();
  const ownerCode = currentUser.ownerCode || 'STAT-????';
  const appUrl = window.location.origin;

  const roleLabels = { owner: 'المالك', manager: 'مدير', worker: 'عامل' };

  const validateUser = (u) => {
    const e = {};
    if (!u.username?.trim()) e.username = 'اسم المستخدم مطلوب';
    else if (/\s/.test(u.username.trim())) e.username = 'اسم المستخدم لا يحتوي على مسافات';
    if (!u.password || u.password.length < 6) e.password = 'كلمة المرور 6 أحرف على الأقل';
    if (!u.name?.trim()) e.name = 'الاسم مطلوب';
    if (users.find(x => x.username === u.username && x.id !== u.id)) e.username = 'اسم المستخدم موجود مسبقاً';
    return e;
  };

  const handleAdd = async () => {
    const errs = validateUser(newUser);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setAddingUser(true);
    try {
      // تحويل اسم المستخدم لـ fake email — نستبدل المسافات بـ _ ونشيل الرموز الغريبة
      const safeUsername = newUser.username.trim().replace(/\s+/g, '_');
      // encode اسم المستخدم عشان ينفع يكون في email (حروف عربية مش مقبولة في Firebase email)
      const encodedUsername = encodeURIComponent(safeUsername).replace(/%/g, 'x').toLowerCase();
      const fakeEmail = `${encodedUsername}@waqoudpro.worker`;
      const cred = await createUserWithEmailAndPassword(auth, fakeEmail, newUser.password);
      const uid = cred.user.uid;

      const fullUser = {
        id: uid,
        email: fakeEmail,
        username: safeUsername,
        name: newUser.name.trim(),
        role: 'worker',
        roleLabel: 'عامل',
        ownerId: currentUser.id,
        password: newUser.password,
      };

      // احفظ في users collection
      await setDoc(doc(db, 'users', uid), fullUser);

      // أضف كـ member عند المالك
      await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, currentUser.id, `${COLLECTION_PREFIX}members`, uid), fullUser);

      onAddUser(fullUser);

      // أضفه في قائمة العمال
      if (onAddWorker) {
        const workerEntry = {
          id: uid,
          name: newUser.name.trim(),
          pump: 'غير محدد',
          workDays: 0,
          salary: 0,
          phone: '',
          avatar: newUser.name[0] || '؟',
          delays: [], absences: [], absences_no_reason: [], discipline: [], cash_withdrawals: []
        };
        await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, currentUser.id, `${COLLECTION_PREFIX}workers`, uid), workerEntry);
        onAddWorker(workerEntry);
      }

      setNewUser({ username: '', password: '', name: '', role: 'worker' });
      setErrors({});
      toast('تم إضافة حساب العامل ✓ — يقدر يسجل دخول دلوقتي', 'success');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ username: 'اسم المستخدم ده موجود مسبقاً، اختار اسم تاني' });
      } else {
        toast('حدث خطأ: ' + err.message, 'error');
      }
    }
    setAddingUser(false);
  };

  const handleSaveEdit = () => {
    const errs = validateUser({ ...editForm, id: editId });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onEditUser(editId, { ...editForm, roleLabel: roleLabels[editForm.role] });
    setEditId(null); setEditForm(null); setErrors({});
    toast('تم تحديث الحساب ✓', 'success');
  };

  const handleChangePassword = (userId) => {
    if (!newPass || newPass.length < 6) { setNewPassErr('كلمة المرور 6 أحرف على الأقل'); return; }
    const u = users.find(x => x.id === userId);
    onEditUser(userId, { ...u, password: newPass });
    setChangePassId(null); setNewPass(''); setNewPassErr('');
    toast('تم تغيير كلمة المرور ✓', 'success');
  };

  const canDelete = (u) => {
    // المالك لا يُحذف
    if (u.role === 'owner') return false;
    return true;
  };

  const handleAddInvite = () => {
    const workerName = inviteWorkerName.trim();
    if (!workerName) { toast('اكتب اسم العامل أولاً', 'error'); return; }
    if (invites.includes(workerName)) { toast('هذا الاسم موجود في القائمة مسبقاً', 'warning'); return; }
    const updated = [...invites, workerName];
    setInvites(updated);
    saveInvites(currentUser.id, updated, currentUser.ownerCode);

    // فتح واتساب برسالة جاهزة باسم العامل والكود
    const msg = encodeURIComponent(
      `أهلاً يا ${workerName} 👋

تم تسجيلك في WaqoudPro لإدارة المحطة ⛽

خطوات التسجيل:
1️⃣ افتح الرابط: ${appUrl}
2️⃣ اضغط "إنشاء حساب جديد"
3️⃣ اختر دورك: عامل
4️⃣ اكتب اسمك بالظبط: ${workerName}
5️⃣ كود الانضمام: ${ownerCode}

متنساش تحفظ الكود! 🔑`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');

    setInviteWorkerName('');
    toast(`تمت دعوة "${workerName}" ✓`, 'success');
  };

  const handleRemoveInvite = (workerName) => {
    const updated = invites.filter(u => u !== workerName);
    setInvites(updated);
    saveInvites(currentUser.id, updated, currentUser.ownerCode);
    toast('تم حذف الدعوة', 'success');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn .3s ease' }}>
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 440, animation: 'fadeIn .2s ease' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: '#ef4444' }}>🗑️ تأكيد حذف الحساب</div>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>⚠️ انتبه! هذا الإجراء لا يمكن التراجع عنه</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
                  <div>• سيتم حذف حساب <b style={{ color: 'var(--text)' }}>{confirmDelete.name}</b> نهائياً</div>
                  <div>• ستُحذف جميع بياناته — الرواتب، الحضور، الخصومات</div>
                  <div>• لن يتمكن من تسجيل الدخول مرة أخرى</div>
                  <div>• لإعادته يجب إنشاء حساب جديد له</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>هل أنت متأكد من حذف حساب "{confirmDelete.name}"؟</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={async () => {
                await onDeleteUser(confirmDelete.id);
                toast(`تم حذف حساب ${confirmDelete.name} وجميع بياناته`, 'success');
                setConfirmDelete(null);
              }}>🗑️ نعم، احذف نهائياً</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {changePassId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setChangePassId(null)}>
          <div className="modal" style={{ maxWidth: 420, animation: 'fadeIn .2s ease' }}>
            <div className="modal-header">
              <div className="modal-title">🔑 تغيير كلمة المرور</div>
              <button className="close-btn" onClick={() => setChangePassId(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">كلمة المرور الجديدة</label>
                <input type="password" className={`form-input ${newPassErr ? 'error' : ''}`} placeholder="6 أحرف على الأقل" value={newPass} onChange={e => { setNewPass(e.target.value); setNewPassErr(''); }} />
                {newPassErr && <div className="form-error">{newPassErr}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => handleChangePassword(changePassId)}>💾 حفظ</button>
              <button className="btn btn-ghost" onClick={() => setChangePassId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>➕ إضافة عامل جديد</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>العامل هيقدر يسجل دخول فوراً بعد الإضافة باسم المستخدم وكلمة المرور دول</div>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">اسم المستخدم (للدخول)</label>
            <input type="text" className={`form-input ${errors.username ? 'error' : ''}`} placeholder="مثال: ahmed123 أو أحمد" value={newUser.username} onChange={e => { setNewUser({...newUser, username: e.target.value.replace(/\s/g,'')}); setErrors({...errors, username: ''});}} />
            {errors.username && <div className="form-error">{errors.username}</div>}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>بدون مسافات — عربي أو إنجليزي</div>
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="6 أحرف على الأقل" value={newUser.password} onChange={e => { setNewUser({...newUser, password: e.target.value}); setErrors({...errors, password: ''});}} dir="ltr" />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">الاسم الكامل (للعرض)</label>
            <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="مثال: أحمد محمد" value={newUser.name} onChange={e => { setNewUser({...newUser, name: e.target.value}); setErrors({...errors, name: ''});}} />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: 4 }} disabled={addingUser}>
          {addingUser ? '⏳ جاري الإضافة...' : '➕ إضافة العامل'}
        </button>
      </div>

      <div className="table-container">
        <div className="table-hdr"><div style={{ fontSize: 15, fontWeight: 700 }}>👤 الحسابات الموجودة</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>اسم المستخدم</th><th>الاسم الكامل</th><th>الصلاحية</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {users.map(u => (
                editId === u.id ? (
                  <tr key={u.id} style={{ background: 'rgba(26,86,219,0.1)' }}>
                    <td><input type="text" className="form-input" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} style={{ width: '100%' }} /></td>
                    <td><input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%' }} /></td>
                    <td>
                      <select className="form-input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ width: '100%' }}
                        disabled={u.role === 'owner'}>
                        <option value="worker">عامل</option>
                        <option value="owner" disabled>مالك</option>
                      </select>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success btn-xs" onClick={handleSaveEdit}>✓ حفظ</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setEditId(null)}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>{u.name}</td>
                    <td>
                      <span className={`badge ${u.role === 'owner' ? 'badge-success' : u.role === 'manager' ? 'badge-warning' : 'badge-blue'}`}>
                        {roleLabels[u.role] || u.roleLabel}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => { setEditId(u.id); setEditForm({...u}); }}>✏️ تعديل</button>
                        <button className="btn btn-blue btn-xs" onClick={() => { setChangePassId(u.id); setNewPass(''); setNewPassErr(''); }}>🔑 كلمة المرور</button>
                        {canDelete(u) && (
                          <button className="btn btn-danger btn-xs" onClick={() => setConfirmDelete({ id: u.id, name: u.name })}>🗑️ حذف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== قائمة الدعوات ==================== */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          📩 دعوة العمال
        </div>

        {/* كود الانضمام */}
        <div style={{ background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>كود الانضمام الخاص بك</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: 'var(--primary-light)', fontFamily: 'monospace' }}>{ownerCode}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>العمال بيحتاجوا الكود ده عشان يسجلوا تحت اسمك</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(ownerCode); toast('تم نسخ الكود ✓', 'success'); }}>
            📋 نسخ الكود
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          اكتب اسم العامل بالظبط — هيتبعتله رسالة واتساب بالكود وخطوات التسجيل
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder="اسم العامل (مثال: محمد أحمد)"
            value={inviteWorkerName}
            onChange={e => setInviteWorkerName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddInvite()}
          />
          <button className="btn btn-primary" onClick={handleAddInvite} style={{ whiteSpace: 'nowrap' }}>
            💬 دعوة واتساب
          </button>
        </div>

        {invites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
            لا توجد دعوات معلقة
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invites.map((workerName) => (
              <div key={workerName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>👷</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{workerName}</span>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>في الانتظار</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-success btn-xs" onClick={() => {
                    const msg = encodeURIComponent(`أهلاً يا ${workerName} 👋

تذكير بخطوات التسجيل في WaqoudPro ⛽

1️⃣ افتح الرابط: ${appUrl}
2️⃣ اضغط "إنشاء حساب جديد"
3️⃣ اختر دورك: عامل
4️⃣ اكتب اسمك بالظبط: ${workerName}
5️⃣ كود الانضمام: ${ownerCode}

متنساش تحفظ الكود! 🔑`);
                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                  }}>💬 إعادة إرسال</button>
                  <button className="btn btn-danger btn-xs" onClick={() => handleRemoveInvite(workerName)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== LOGIN (Firebase Auth) ====================