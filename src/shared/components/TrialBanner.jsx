import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { OwnerProfilePage } from '../../features/owner/OwnerProfilePage';
import { db } from '../../firebase';

export const TrialBanner = ({ remaining, onViewPlans, userName }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (remaining <= 0) return null;
  const urgent = remaining <= 3;

  return (
    <div className="trial-banner no-print" style={{
      background: urgent
        ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
        : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
      borderBottom: urgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '9px 28px',
      flexWrap: 'wrap',
      position: 'relative',
    }}>

      {/* النص في النص تماماً */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 16 }}>{urgent ? '🔴' : '⏳'}</span>

        <span style={{ fontSize: 13, fontWeight: 600, color: urgent ? '#ef4444' : '#f59e0b' }}>
          {userName && <strong style={{ color: 'var(--text)' }}>{userName}، </strong>}
          أنت الآن في الفترة التجريبية المجانية
        </span>

        {/* عدد الأيام */}
        <span className={`trial-days-badge ${urgent ? 'urgent' : ''}`}>
          {remaining} {remaining === 1 ? 'يوم' : 'أيام'} متبقية
        </span>

        {/* العداد التنازلي */}
        {timeLeft && (
          <span style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '3px 12px',
            borderRadius: 20,
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 800,
            color: urgent ? '#ef4444' : '#f8fafc',
            letterSpacing: 2,
          }}>
            ⏱ {timeLeft}
          </span>
        )}

        {/* زرار الاشتراك */}
        <button className="btn btn-accent btn-sm" onClick={onViewPlans} style={{ marginRight: 4 }}>
          💳 اشترك الآن
        </button>
      </div>
    </div>
  );
};

// ==================== NOTIFICATION BELL ====================
// ==================== ANNOUNCEMENTS UTILS ====================
const ADMIN_EMAIL = 'homafathy2020@gmail.com';

const getAnnouncements = async () => {
  try {
    const snap = await getDocs(collection(db, 'announcements'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  } catch { return []; }
};

const saveAnnouncement = async (ann) => {
  const id = String(Date.now());
  await setDoc(doc(db, 'announcements', id), { ...ann, id, createdAt: Date.now() });
  return id;
};

const deleteAnnouncement = async (id) => {
  await deleteDoc(doc(db, 'announcements', id));
};

const getAllOwners = async () => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const owners = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === 'owner');
    // جيب الباقة لكل مالك من settings/subscription
    const withPlans = await Promise.all(owners.map(async (o) => {
      try {
        const subSnap = await getDoc(doc(db, `${COLLECTION_PREFIX}owners`, o.id, `${COLLECTION_PREFIX}settings`, 'subscription'));
        const plan = subSnap.exists() ? (subSnap.data().plan || 'trial') : 'trial';
        return { ...o, plan };
      } catch { return { ...o, plan: 'trial' }; }
    }));
    return withPlans;
  } catch { return []; }
};

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

const OwnerProfilePage = ({ user, onUpdate, onShowPricing, workers, workPlaces, ownerUsers }) => {