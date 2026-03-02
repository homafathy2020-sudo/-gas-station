import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { NotificationBell } from '../../features/owner/NotificationBell';
import { db } from '../../firebase';
import { useToast } from '../../shared/components/Toast';
import { calcNet, fmt, totalDed } from '../../utils/helpers';
import { AdminLoginPage } from './AdminLoginPage';

// ==================== ADMIN PANEL ====================
export const AdminPanel = () => {
  const toast = useToast();
  const [authed, setAuthed] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [tab, setTab] = useState('send'); // send | history | owners
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info'); // info | success | warning | danger
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingAnns, setLoadingAnns] = useState(false);

  useEffect(() => {
    if (!authed) return;
    loadData();
  }, [authed]);

  const loadData = async () => {
    setLoadingAnns(true);
    setLoadingOwners(true);
    const [anns, ownList] = await Promise.all([getAnnouncements(), getAllOwners()]);
    setAnnouncements(anns);
    setOwners(ownList);
    setLoadingAnns(false);
    setLoadingOwners(false);
  };

  const sendAnnouncement = async () => {
    if (!title.trim() || !body.trim()) { toast('اكتب العنوان والنص', 'error'); return; }
    setSending(true);
    await saveAnnouncement({ title: title.trim(), body: body.trim(), type });
    setTitle(''); setBody(''); setType('info');
    toast('تم إرسال الإشعار لجميع الملاك ✓', 'success');
    await loadData();
    setTab('history');
    setSending(false);
  };

  const handleDelete = async (id) => {
    await deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast('تم حذف الإشعار', 'info');
  };

  const typeColors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444' };
  const typeIcons  = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '🚨' };
  const typeLabels = { info: 'معلومة', success: 'إيجابي', warning: 'تحذير', danger: 'مهم' };

  if (!authed) return <AdminLoginPage onAuth={(u) => { setAuthed(true); setAdminUser(u); }} />;

  const ownersWithPhone = owners.filter(o => o.phone);
  const ownersWithoutPhone = owners.filter(o => !o.phone);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', padding: '32px 20px' }}>
      <div className="admin-wrap">
        {/* Header */}
        <div className="admin-header">
          <div style={{ fontSize: 40 }}>🛠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>لوحة تحكم المطور</div>
              <span className="admin-badge">ADMIN</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>إدارة الإشعارات والملاك — WaqoudPro</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="admin-stat">
              <div style={{ fontSize: 22, fontWeight: 900, color: '#3b82f6' }}>{owners.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ملاك</div>
            </div>
            <div className="admin-stat">
              <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{ownersWithPhone.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>عندهم رقم</div>
            </div>
            <div className="admin-stat">
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{announcements.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>إشعار مُرسل</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {[
            { id: 'send', label: '📢 إرسال إشعار جديد' },
            { id: 'history', label: `📋 الإشعارات السابقة (${announcements.length})` },
            { id: 'owners', label: `👤 الملاك (${owners.length})` },
          ].map(t => (
            <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: SEND */}
        {tab === 'send' && (
          <div className="announce-form">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>📢 إشعار جديد لجميع الملاك</div>

            {/* Type selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>نوع الإشعار</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.keys(typeLabels).map(t => (
                  <button key={t} onClick={() => setType(t)} style={{
                    padding: '7px 16px', borderRadius: 10, border: `1px solid ${type === t ? typeColors[t] : 'var(--border)'}`,
                    background: type === t ? `rgba(${t === 'info' ? '59,130,246' : t === 'success' ? '16,185,129' : t === 'warning' ? '245,158,11' : '239,68,68'},.15)` : 'none',
                    color: type === t ? typeColors[t] : 'var(--text-muted)',
                    fontFamily: 'Cairo,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                  }}>
                    {typeIcons[t]} {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>عنوان الإشعار *</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: تحديث جديد في التطبيق 🎉" maxLength={80} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'left' }}>{title.length}/80</div>
            </div>

            {/* Body */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>نص الإشعار *</label>
              <textarea className="form-input" rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="اكتب تفاصيل الإشعار هنا..." maxLength={1000} style={{ resize: 'vertical', minHeight: 100 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'left' }}>{body.length}/1000</div>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="announce-preview">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>👁️ معاينة كما سيراها الملاك:</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `rgba(${type === 'info' ? '59,130,246' : type === 'success' ? '16,185,129' : type === 'warning' ? '245,158,11' : '239,68,68'},.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{typeIcons[type]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: typeColors[type] }}>{title || 'العنوان'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.7 }}>{body || 'النص...'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Send */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-primary" style={{ justifyContent: 'center', minWidth: 160 }} onClick={sendAnnouncement} disabled={sending || !title.trim() || !body.trim()}>
                {sending ? '⏳ جاري الإرسال...' : `📢 إرسال لـ ${owners.length} مالك`}
              </button>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                بيوصل في الـ notification bell لكل الملاك فور دخولهم
              </div>
            </div>
          </div>
        )}

        {/* TAB: HISTORY */}
        {tab === 'history' && (
          <div className="table-container">
            <div className="table-hdr">
              <div style={{ fontSize: 15, fontWeight: 700 }}>📋 الإشعارات السابقة</div>
              <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 تحديث</button>
            </div>
            {loadingAnns ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
            ) : announcements.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">لا توجد إشعارات مرسلة بعد</div>
              </div>
            ) : (
              <div>
                {announcements.map(ann => (
                  <div key={ann.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `rgba(${ann.type === 'info' ? '59,130,246' : ann.type === 'success' ? '16,185,129' : ann.type === 'warning' ? '245,158,11' : '239,68,68'},.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{typeIcons[ann.type] || 'ℹ️'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{ann.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>{ann.body}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        🕐 {ann.createdAt ? new Date(ann.createdAt).toLocaleString('ar-EG') : '—'}
                      </div>
                    </div>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(ann.id)}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: OWNERS */}
        {tab === 'owners' && (
          <div>
            {/* WhatsApp bulk section */}
            {ownersWithPhone.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg,rgba(37,211,102,0.1),rgba(37,211,102,0.03))', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 16, padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: '#25d366' }}>
                  💬 إرسال واتساب لـ {ownersWithPhone.length} مالك عندهم رقم
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  ⚠️ واتساب مش بيسمح بـ bulk — هيفتح لكل مالك نافذة منفصلة. اضغط على اسمه أو استخدم زرار "واتساب الكل"
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ownersWithPhone.map(o => {
                    const phone = o.phone.startsWith('0') ? '2' + o.phone : o.phone;
                    const latestAnn = announcements[0];
                    const msg = latestAnn
                      ? encodeURIComponent(`⛽ WaqoudPro
مرحباً يا ${o.name} 👋

${typeIcons[latestAnn.type] || 'ℹ️'} ${latestAnn.title}
─────────────────
${latestAnn.body}
─────────────────
فريق WaqoudPro 🚀`)
                      : encodeURIComponent(`⛽ WaqoudPro
مرحباً يا ${o.name} 👋
لديك إشعار جديد في التطبيق — افتح التطبيق للاطلاع عليه.`);
                    return (
                      <a key={o.id} href={`https://wa.me/${phone}?text=${msg}`} target="_blank" rel="noreferrer">
                        <button className="wa-btn wa-btn-sm">💬 {o.name}</button>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owners without phone */}
            {ownersWithoutPhone.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
                  ⚠️ {ownersWithoutPhone.length} مالك بدون رقم — مش هيوصلهم واتساب
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ownersWithoutPhone.map(o => (
                    <span key={o.id} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#ef4444' }}>
                      {o.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full owners table */}
            <div className="table-container">
              <div className="table-hdr">
                <div style={{ fontSize: 15, fontWeight: 700 }}>👤 كل الملاك ({owners.length})</div>
                <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 تحديث</button>
              </div>
              {loadingOwners ? (
                <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
              ) : owners.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-icon">👤</div>
                  <div className="empty-title">لا يوجد ملاك مسجلين بعد</div>
                </div>
              ) : owners.map(o => (
                <div key={o.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* أفاتار */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{(o.name||'?')[0]}</div>
                  {/* بيانات */}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{o.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.email}</div>
                    {o.phone && <div style={{ fontSize: 11, color: '#10b981' }}>📱 {o.phone}</div>}
                  </div>
                  {/* الباقة الحالية */}
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, fontWeight: 700,
                    background: o.plan === 'lifetime' ? 'rgba(168,85,247,0.15)' : o.plan === 'enterprise' ? 'rgba(245,158,11,0.15)' : o.plan === 'trial' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.1)',
                    color: o.plan === 'lifetime' ? '#a855f7' : o.plan === 'enterprise' ? '#f59e0b' : o.plan === 'trial' ? '#3b82f6' : 'var(--text-muted)' }}>
                    { o.plan === 'lifetime' ? '♾️ مدى الحياة' : o.plan === 'enterprise' ? '👑 مميزة' : o.plan === 'starter' ? '⭐ أساسية' : o.plan === 'trial' ? '🎯 تجريبية' : '🆓 مجاني' }
                  </span>
                  {/* تغيير الباقة */}
                  <select
                    style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Cairo,sans-serif', cursor: 'pointer' }}
                    value={o.plan || 'trial'}
                    onChange={async (e) => {
                      const newPlan = e.target.value;
                      try {
                        const ref = doc(db, `${COLLECTION_PREFIX}owners`, o.id, `${COLLECTION_PREFIX}settings`, 'subscription');
                        const snap = await getDoc(ref);
                        if (snap.exists()) {
                          await updateDoc(ref, { plan: newPlan });
                        } else {
                          await setDoc(ref, { plan: newPlan, trialStart: new Date().toISOString() });
                        }
                        // حدّث الـ state فوراً بدون انتظار loadData
                        setOwners(prev => prev.map(x => x.id === o.id ? { ...x, plan: newPlan } : x));
                        toast('✅ تم تغيير باقة ' + o.name + ' إلى ' + newPlan, 'success');
                      } catch (err) { toast('خطأ: ' + err.message, 'error'); }
                    }}
                  >
                    <option value="trial">🎯 تجريبية</option>
                    <option value="free">🆓 مجاني</option>
                    <option value="starter">⭐ أساسية</option>
                    <option value="enterprise">👑 مميزة</option>
                    <option value="lifetime">♾️ مدى الحياة</option>
                  </select>
                  {/* حذف المالك */}
                  <button
                    className="btn btn-danger btn-sm"
                    title="حذف المالك"
                    onClick={async () => {
                      if (!window.confirm('هل أنت متأكد من حذف ' + o.name + '؟ هيتحذف نهائياً!')) return;
                      try {
                        await deleteDoc(doc(db, 'users', o.id));
                        toast('🗑️ تم حذف ' + o.name, 'info');
                        loadData();
                      } catch (err) { toast('خطأ في الحذف: ' + err.message, 'error'); }
                    }}
                  >🗑️ حذف</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const NotificationBell = ({ user, workers, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`notif_read_${user?.id}`) || '[]'); } catch { return []; }
  });
  const [deletedIds, setDeletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`notif_deleted_${user?.id}`) || '[]'); } catch { return []; }
  });
  const [announcements, setAnnouncements] = useState([]);
  const [expandedNotif, setExpandedNotif] = useState(null); // للـ modal
  const ref = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'owner') return;
    const load = async () => {
      const anns = await getAnnouncements();
      setAnnouncements(anns);
    };
    load();
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ownerId = user ? (user.role === 'owner' ? user.id : user.ownerId) : null;

  const buildNotifications = useCallback(() => {
    if (!user || !ownerId) return [];
    const notifs = [];
    const now = Date.now();

    if (user.role === 'owner') {
      announcements.forEach(ann => {
        notifs.push({
          id: `ann_${ann.id}`,
          type: ann.type || 'info',
          icon: { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '🚨' }[ann.type] || 'ℹ️',
          title: ann.title,
          sub: ann.body,
          time: ann.createdAt ? new Date(ann.createdAt).toLocaleString('ar-EG') : '',
          ts: ann.createdAt || now,
          isAnnouncement: true,
        });
      });
    }

    if (user.role === 'owner' || user.role === 'manager') {
      workers.filter(w => totalDed(w) > w.salary * 0.3 && w.salary > 0).forEach(w => {
        notifs.push({
          id: `high_ded_${w.id}`,
          type: 'danger', icon: '💸',
          title: `خصومات عالية — ${w.name}`,
          sub: `${fmt(totalDed(w))} خصومات (${Math.round((totalDed(w)/w.salary)*100)}% من الراتب)`,
          time: '', ts: now - 5000,
          page: 'workers', hint: '← انتقل لصفحة العمال',
          workerId: w.id,
        });
      });
      workers.filter(w => w.salary === 0 || w.pump === 'غير محدد').forEach(w => {
        notifs.push({
          id: `incomplete_${w.id}`,
          type: 'warning', icon: '👷',
          title: `بيانات ${w.name} غير مكتملة`,
          sub: 'الراتب أو مكان العمل غير محدد',
          time: '', ts: now - 8000,
          page: 'workers', hint: '← انتقل لصفحة العمال',
          workerId: w.id,
        });
      });
    } else if (user.role === 'worker') {
      const workerRecord = workers.find(w => w.id === user.id);
      if (workerRecord) {
        if (workerRecord.delays?.length > 0) {
          notifs.push({ id: `worker_delays`, type: 'warning', icon: '⏰', title: `${workerRecord.delays.length} تأخير مسجل هذا الشهر`, sub: `إجمالي الخصم: ${fmt(workerRecord.delays.reduce((s,d)=>s+(d.deduction||0),0))}`, time: '', ts: now - 2000, page: 'profile', hint: '← عرض ملفك الشخصي' });
        }
        if (workerRecord.absences?.length > 0) {
          notifs.push({ id: `worker_absences`, type: 'danger', icon: '📅', title: `${workerRecord.absences.length} غياب مسجل`, sub: `إجمالي الخصم: ${fmt(workerRecord.absences.reduce((s,a)=>s+(a.deduction||0),0))}`, time: '', ts: now - 3000, page: 'profile', hint: '← عرض ملفك الشخصي' });
        }
        const rewards = (workerRecord.discipline||[]).filter(d=>d.reward>0);
        if (rewards.length > 0) {
          notifs.push({ id: `worker_rewards`, type: 'success', icon: '⭐', title: `${rewards.length} مكافأة انضباط`, sub: `إجمالي المكافآت: ${fmt(rewards.reduce((s,d)=>s+(d.reward||0),0))}`, time: '', ts: now - 4000, page: 'profile', hint: '← عرض ملفك الشخصي' });
        }
        const net = calcNet(workerRecord);
        const pct = workerRecord.salary > 0 ? Math.round((net/workerRecord.salary)*100) : 100;
        if (pct < 80 && workerRecord.salary > 0) {
          notifs.push({ id: `worker_net_low`, type: 'danger', icon: '💰', title: `صافي راتبك ${pct}% هذا الشهر`, sub: `${fmt(net)} من أصل ${fmt(workerRecord.salary)}`, time: '', ts: now - 10000, page: 'profile', hint: '← عرض ملفك الشخصي' });
        }
      }
    }
    return notifs.sort((a,b) => b.ts - a.ts).filter(n => !deletedIds.includes(n.id));
  }, [user, workers, ownerId, announcements, deletedIds]);

  const notifications = buildNotifications();
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem(`notif_read_${user?.id}`, JSON.stringify(allIds));
  };

  const deleteNotif = (e, id) => {
    e.stopPropagation();
    const updated = [...deletedIds, id];
    setDeletedIds(updated);
    localStorage.setItem(`notif_deleted_${user?.id}`, JSON.stringify(updated));
  };

  const deleteAll = () => {
    const allIds = notifications.map(n => n.id);
    const updated = [...new Set([...deletedIds, ...allIds])];
    setDeletedIds(updated);
    localStorage.setItem(`notif_deleted_${user?.id}`, JSON.stringify(updated));
  };

  const handleNotifClick = (n) => {
    if (!readIds.includes(n.id)) {
      const updated = [...readIds, n.id];
      setReadIds(updated);
      localStorage.setItem(`notif_read_${user?.id}`, JSON.stringify(updated));
    }
    if (n.page && onNavigate) { onNavigate(n.page, n); setOpen(false); }
  };

  const typeColors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444' };
  const PREVIEW_LENGTH = 80;

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className={`notif-bell-btn ${unreadCount > 0 ? 'has-notif' : ''}`} onClick={() => setOpen(!open)} title="الإشعارات">
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {/* ── READ MORE MODAL ── */}
      {expandedNotif && (
        <div
          className="modal-overlay"
          onClick={() => setExpandedNotif(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="modal"
            style={{ maxWidth: 480, animation: 'fadeIn .2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* header */}
            <div className="modal-header" style={{ borderBottom: `2px solid ${typeColors[expandedNotif.type] || 'var(--border)'}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${typeColors[expandedNotif.type]}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {expandedNotif.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: typeColors[expandedNotif.type] || 'var(--text)', lineHeight: 1.4 }}>
                  {expandedNotif.title}
                </div>
              </div>
              <button className="close-btn" onClick={() => setExpandedNotif(null)}>✕</button>
            </div>

            {/* body */}
            <div className="modal-body">
              <div style={{
                fontSize: 14, color: 'var(--text)', lineHeight: 1.9,
                whiteSpace: 'pre-line',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 18px',
              }}>
                {expandedNotif.sub}
              </div>
              {expandedNotif.time && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  🕐 {expandedNotif.time}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="modal-footer">
              {expandedNotif.page && (
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { handleNotifClick(expandedNotif); setExpandedNotif(null); }}>
                  {expandedNotif.hint?.replace('←', '')} ↗
                </button>
              )}
              <button
                className="btn btn-danger"
                style={{ justifyContent: 'center' }}
                onClick={(e) => { deleteNotif(e, expandedNotif.id); setExpandedNotif(null); }}
              >
                🗑️ حذف
              </button>
              <button className="btn btn-ghost" onClick={() => setExpandedNotif(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="notif-dropdown">
          {/* header */}
          <div className="notif-hdr">
            <div className="notif-hdr-title">
              🔔 الإشعارات
              {unreadCount > 0 && <span style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 600, marginRight: 6 }}>({unreadCount} جديد)</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button className="notif-clear-btn" onClick={markAllRead}>✓ قراءة الكل</button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAll}
                  title="حذف كل الإشعارات"
                  style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', borderRadius: 7, padding: '3px 9px',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Cairo,sans-serif', transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                >
                  🗑️ حذف الكل
                </button>
              )}
            </div>
          </div>

          {/* list */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔕</div>
                <div>لا توجد إشعارات حالياً</div>
              </div>
            ) : notifications.map(n => {
              const isLong = n.sub && n.sub.length > PREVIEW_LENGTH;
              const preview = isLong ? n.sub.slice(0, PREVIEW_LENGTH) + '...' : n.sub;
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!readIds.includes(n.id) ? 'unread' : ''} ${n.page ? 'clickable' : ''}`}
                  onClick={() => handleNotifClick(n)}
                  style={{ position: 'relative' }}
                >
                  <div className={`notif-icon-wrap type-${n.type}`}>{n.icon}</div>
                  <div className="notif-text" style={{ flex: 1, minWidth: 0 }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-sub">{preview}</div>
                    {isLong && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedNotif(n); setOpen(false); }}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          fontSize: 11, fontWeight: 700,
                          color: typeColors[n.type] || 'var(--primary-light)',
                          cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
                          marginTop: 3, display: 'block',
                        }}
                      >
                        قراءة المزيد ↗
                      </button>
                    )}
                    {n.time && <div className="notif-time">🕐 {n.time}</div>}
                    {n.page && <div className="notif-nav-hint">{n.hint} ↗</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!readIds.includes(n.id) && <div className="notif-dot" />}
                    <button
                      onClick={e => deleteNotif(e, n.id)}
                      title="حذف"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 13, padding: '2px 4px',
                        borderRadius: 5, opacity: 0.5, transition: 'all .15s',
                        lineHeight: 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity='0.5'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='none'; }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== APP ====================