import { useEffect, useRef, useState } from 'react';
import { COLLECTION_PREFIX } from './config/env';
import { NotificationBell } from './features/owner/NotificationBell';
import { OwnerDashboard } from './features/owner/OwnerDashboard';
import { OwnerProfilePage } from './features/owner/OwnerProfilePage';
import { StationSwitcher } from './features/stations/StationSwitcher';
import { StationsPage } from './features/stations/StationsPage';
import { WorkerProfile } from './features/workers/WorkerProfile';
import { WorkersPage } from './features/workers/WorkersPage';
import { auth, db } from './firebase';
import { getTrialInfo } from './lib/trialSystem';
import { AccountsPage } from './pages/AccountsPage';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';
import { MonthArchivePage } from './pages/MonthArchivePage';
import { PricingScreen } from './pages/PricingScreen';
import { ReportsPage } from './pages/ReportsPage';
import { SalaryPaymentPage } from './pages/SalaryPaymentPage';
import { Sidebar } from './shared/components/Sidebar';
import { ToastProvider } from './shared/components/Toast';
import { TrialBanner } from './shared/components/TrialBanner';
import { getPlan, planHasMonthReset, planHasSalaryPay } from './utils/planUtils';

// ==================== APP ====================
const App = ({ onShowPricing }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [workers, setWorkers] = useState([]);
  const [workPlaces, setWorkPlaces] = useState([]);
  const [ownerUsers, setOwnerUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const unsubscribeListeners = useRef([]);

  // طلب إذن التنبيهات عند بدء التطبيق
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getOwnerId = (u) => u ? (u.role === 'owner' ? u.id : u.ownerId) : null;

  // تابع حالة الـ Auth تلقائياً
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() };
          setUser(userData);
          const defaults = { owner: 'dashboard', manager: 'workers', worker: 'profile' };
          setPage(defaults[userData.role] || 'dashboard');
          // مزامنة الباقة من Firestore عشان getPlan() يشتغل صح
          const ownId = userData.role === 'owner' ? userData.id : userData.ownerId;
          if (ownId) {
            try {
              const info = await getTrialInfoFromDB(ownId);
              if (info?.plan && info.plan !== 'trial') {
                localStorage.setItem('app_plan', info.plan);
              }
            } catch {}
          }
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // لما يتغير المستخدم، نحمل داتاه من Firestore
  useEffect(() => {
    if (!user) return;
    const oid = getOwnerId(user);
    if (!oid) return;

    // workers — real-time listener
    const unsubWorkers = onSnapshot(
      collection(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`),
      (snap) => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // workplaces
    const unsubPlaces = onSnapshot(
      collection(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workplaces`),
      (snap) => setWorkPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // users
    const unsubUsers = onSnapshot(
      collection(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}members`),
      (snap) => {
        const members = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => !m.deleted); // فلتر المحذوفين
        setOwnerUsers(members.length > 0 ? members : [user]);
      }
    );
    // حفظ مراجع إلغاء الاشتراك عشان نقدر نوقفهم قبل تسجيل الخروج
    unsubscribeListeners.current = [unsubWorkers, unsubPlaces, unsubUsers];
    // مزامنة بيانات الدعوات من Firestore للـ localStorage cache
    syncInvites(oid);

    // تحميل المحطات
    const loadStations = async () => {
      const stList = await getStations(oid);
      setStations(stList);
      const savedActive = localStorage.getItem(ACTIVE_STATION_KEY(oid));
      if (savedActive && stList.find(s => s.id === savedActive)) {
        setActiveStation(savedActive);
      } else if (stList.length > 0) {
        setActiveStation(stList[0].id);
        localStorage.setItem(ACTIVE_STATION_KEY(oid), stList[0].id);
      }
      if (stList.length === 0) {
        const def = { id: String(Date.now()), name: 'المحطة الرئيسية', address: '', createdAt: new Date().toISOString() };
        await saveStation(oid, def);
        setStations([def]); setActiveStation(def.id);
        localStorage.setItem(ACTIVE_STATION_KEY(oid), def.id);
      }
    };
    loadStations();

    // backup تلقائي لو المالك وعنده نت ومحتاج backup
    if (user?.role === 'owner') {
      shouldAutoBackup(oid).then(async (needed) => {
        if (!needed) return;
        try {
          // انتظر شوية عشان الـ listeners يجيبوا البيانات الأول
          setTimeout(async () => {
            const wSnap = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`));
            const pSnap = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workplaces`));
            const mSnap = await getDocs(collection(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}members`));
            const ws = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const ps = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const ms = mSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => !m.deleted);
            await createBackup(oid, ws, ps, ms, 'تلقائي');
          }, 4000);
        } catch {}
      });
    }
    return () => {
      unsubWorkers(); unsubPlaces(); unsubUsers();
      unsubscribeListeners.current = [];
    };
  }, [user]);

  const saveWorkers = async (list, ownerId) => {
    // حفظ كل عامل كـ document منفصل
    for (const w of list) {
      await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workers`, String(w.id)), w);
    }
  };

  const setWorkersAndSave = async (updater) => {
    const oid = getOwnerId(user);
    if (!oid) return;
    const newList = typeof updater === 'function' ? updater(workers) : updater;
    setWorkers(newList);
    for (const w of newList) {
      await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, String(w.id)), w);
    }
  };

  const defaults = { owner: 'dashboard', manager: 'workers', worker: 'profile' };

  const handleLogin = (u) => {
    setUser(u);
    setPage(defaults[u.role] || 'workers');
    if (u.role === 'owner' && u.ownerCode) {
      Promise.all([
        getDoc(doc(db, 'ownerCodes', u.ownerCode)),
        getDoc(doc(db, `${COLLECTION_PREFIX}owners`, u.id, `${COLLECTION_PREFIX}meta`, 'invites'))
      ]).then(([codeSnap, invSnap]) => {
        const inviteList = invSnap.exists() ? (invSnap.data().list || []) : [];
        const needsUpdate = !codeSnap.exists() || JSON.stringify(codeSnap.data().inviteList || []) !== JSON.stringify(inviteList);
        if (needsUpdate) {
          setDoc(doc(db, 'ownerCodes', u.ownerCode), { ownerId: u.id, ownerName: u.name, inviteList }, { merge: true })
            .catch(e => console.warn('ownerCodes sync failed:', e.code));
        }
      }).catch(() => {});
    }
  };

  const handleLogout = async () => {
    // إلغاء مستمعي Firestore أولاً قبل تسجيل الخروج لتجنب خطأ الصلاحيات
    unsubscribeListeners.current.forEach(unsub => unsub());
    unsubscribeListeners.current = [];
    await signOut(auth);
    setUser(null);
    setPage('dashboard');
    setWorkers([]);
    setWorkPlaces([]);
    setOwnerUsers([]);
  };

  // حذف عامل/مدير بالكامل
  const handleDeleteUser = async (userId) => {
    const oid = getOwnerId(user);
    if (!oid) return;
    const uid = String(userId);
    try {
      // 1) حدّث الـ state فوراً قبل أي حاجة
      setOwnerUsers(prev => prev.filter(u => String(u.id) !== uid));
      setWorkers(prev => prev.filter(w => String(w.id) !== uid));

      // 2) علّم الـ member كـ deleted (أسرع وأضمن من الحذف)
      try { await setDoc(doc(db, 'owners', oid, 'members', uid), { deleted: true }, { merge: true }); } catch(e) { console.warn('members mark deleted:', e); }
      // وامسحه كمان
      try { await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}members`, uid)); } catch(e) { console.warn('members delete:', e); }
      // 3) امسحه من workers
      try { await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, uid)); } catch(e) { console.warn('workers delete:', e); }
      // 4) علّم الحساب كـ deleted في users collection
      try { await updateDoc(doc(db, 'users', uid), { deleted: true }); } catch(e) { console.warn('users update:', e); }
    } catch (err) { console.error('Error deleting user:', err); }
  };

  // لما عامل يسجل — يتضاف في داتا المالك
  const handleRegisterWorker = async (newUser, ownerId) => {
    const newWorker = {
      id: newUser.id,
      name: newUser.name,
      pump: 'غير محدد',
      workDays: 0,
      salary: 0,
      phone: '',
      avatar: newUser.name[0] || '؟',
      delays: [], absences: [], absences_no_reason: [], discipline: [], cash_withdrawals: []
    };
    let workerWriteOk = false;
    let memberWriteOk = false;
    try {
      await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}workers`, String(newUser.id)), newWorker);
      workerWriteOk = true;
      console.log('[DEBUG] workers write OK');
    } catch(e) {
      console.error('[DEBUG] workers write FAILED:', e.code, e.message);
      try {
        await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}pendingWorkers`, String(newUser.id)), {
          ...newWorker, pendingAt: new Date().toISOString(), reason: e.code
        });
        console.log('[DEBUG] fallback pendingWorkers OK');
      } catch(e2) { console.error('[DEBUG] pendingWorkers fallback FAILED:', e2.code); }
    }
    try {
      await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}members`, String(newUser.id)), newUser);
      memberWriteOk = true;
      console.log('[DEBUG] members write OK');
    } catch(e) {
      console.error('[DEBUG] members write FAILED:', e.code, e.message);
    }
    console.log('[DEBUG] registerWorker done — worker:', workerWriteOk, 'member:', memberWriteOk);
  };

  const titles = { dashboard: '📊 لوحة التحكم', workers: '👷 إدارة العمال', reports: '📋 التقارير الشهرية', profile: '👤 ملفي الشخصي', accounts: '🔐 إدارة الحسابات', salary_payment: '💵 صرف الرواتب', month_archive: '📦 أرشيف الشهور', owner_profile: '👤 ملفي الشخصي', stations: '⛽ إدارة المحطات' };
  const workerRecord = user?.role === 'worker' ? workers.find(w => w.id === user.id) : null;

  const updateWorker = async (updated) => {
    const oid = getOwnerId(user);
    if (!oid) return;
    await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, String(updated.id)), updated);
  };

  const handleNavigate = (targetPage) => setPage(targetPage);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin} onRegisterWorker={handleRegisterWorker} />;

  return (
    <div className="app-shell">
      <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
      <div className="main-content" style={{ marginRight: sidebarCollapsed ? 0 : 'var(--sidebar-w)', transition: 'margin-right 0.3s ease' }}>
        <div className="topbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="no-print"
              title={sidebarCollapsed ? 'إظهار القائمة' : 'إخفاء القائمة'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 7,
                background: 'transparent', border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.2s', padding: 0, flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                {sidebarCollapsed ? (
                  // ثلاث خطوط أفقية مع سهم يمين
                  <>
                    <rect x="1" y="2.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                    <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                    <rect x="1" y="10" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                  </>
                ) : (
                  // سهم لليسار بجانب خط عمودي
                  <>
                    <rect x="1" y="2.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                    <rect x="1" y="6.25" width="8" height="1.5" rx="0.75" fill="currentColor"/>
                    <rect x="1" y="10" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                    <path d="M11.5 5L9 7L11.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </>
                )}
              </svg>
            </button>
            <div>
              <div className="topbar-title">{titles[page]}</div>
              {user.role === 'owner' && activeStation && ['workers','reports','salary_payment'].includes(page) && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>⛽ {stations.find(s => s.id === activeStation)?.name || ''}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.role === 'owner' && stations.length > 0 && (
              <StationSwitcher
                stations={stations}
                activeStation={activeStation}
                onSwitch={(id) => { setActiveStation(id); const oid = getOwnerId(user); if (oid) localStorage.setItem(ACTIVE_STATION_KEY(oid), id); }}
                onManage={() => setPage('stations')}
              />
            )}
            <NotificationBell user={user} workers={workers} onNavigate={handleNavigate} />
            {user.role === 'owner' && (
              <button
                onClick={() => setPage('owner_profile')}
                title="ملفي الشخصي"
                style={{
                  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                  background: user.avatarBg || 'linear-gradient(135deg,var(--primary),var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: user.avatarEmoji ? 19 : 16,
                  border: page === 'owner_profile' ? '2px solid var(--primary-light)' : '2px solid transparent',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                {user.avatarEmoji || user.name[0]}
              </button>
            )}
          </div>
        </div>
        <div className="page-content">
          {/* بانر إكمال البيانات — لو المالك مالكش رقم */}
          {user.role === 'owner' && !user.phone && (
            <div className="owner-phone-banner no-print">
              <div className="owner-phone-banner-text">
                📱 <span>أكمل بياناتك — أضف رقم تليفونك عشان نقدر نوصلك بالتحديثات والإشعارات المهمة</span>
              </div>
              <button className="btn btn-warning btn-sm" onClick={() => setPage('owner_profile')}>
                ➕ أضف رقمك الآن
              </button>
            </div>
          )}
          {page === 'dashboard' && user.role === 'owner' && (
            <OwnerDashboard workers={workers} workPlaces={workPlaces}
              onAddPlace={async (p) => {
                const oid = getOwnerId(user);
                const id = String(Date.now());
                await setDoc(doc(db, 'owners', oid, 'workplaces', id), { ...p, id });
              }}
              onEditPlace={async (idx, val) => {
                const oid = getOwnerId(user);
                const place = workPlaces[idx];
                if (place?.id) await setDoc(doc(db, 'owners', oid, 'workplaces', place.id), val);
              }}
              onDeletePlace={async (idx) => {
                const oid = getOwnerId(user);
                const place = workPlaces[idx];
                if (place?.id) await deleteDoc(doc(db, 'owners', oid, 'workplaces', place.id));
              }} />
          )}

          {page === 'workers' && (user.role === 'owner' || user.role === 'manager') && (
            <WorkersPage workers={workers} ownerId={getOwnerId(user)} setWorkers={async (updater) => {
              const oid = getOwnerId(user);
              const newList = typeof updater === 'function' ? updater(workers) : updater;
              // اعرف مين اتحذف
              const deletedWorkers = workers.filter(w => !newList.find(n => n.id === w.id));
              // احذفهم من Firebase
              for (const w of deletedWorkers) {
                await deleteDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, String(w.id)));
              }
              // حدّث الباقيين
              for (const w of newList) {
                await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, String(w.id)), w);
              }
            }} />
          )}
          {page === 'reports' && <ReportsPage workers={workers} ownerId={getOwnerId(user)} onResetMonth={(resetWorkers) => {
              const oid = getOwnerId(user);
              resetWorkers.forEach(async w => {
                await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, String(w.id)), w);
              });
            }} />}
          {page === 'salary_payment' && user.role === 'owner' && (
            planHasSalaryPay(getPlan())
              ? <SalaryPaymentPage workers={workers} ownerId={getOwnerId(user)} />
              : <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>👑</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>تقرير صرف الرواتب</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>هذه الميزة متاحة في الباقة المميزة فقط</div>
                  <button className="btn btn-accent" onClick={() => onShowPricing && onShowPricing()}>👑 ترقية للمميزة</button>
                </div>
          )}
          {page === 'month_archive' && user.role === 'owner' && (
            planHasMonthReset(getPlan())
              ? <MonthArchivePage ownerId={getOwnerId(user)} />
              : <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>👑</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>أرشيف الشهور</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>هذه الميزة متاحة في الباقة المميزة فقط</div>
                  <button className="btn btn-accent" onClick={() => onShowPricing && onShowPricing()}>👑 ترقية للمميزة</button>
                </div>
          )}
          {page === 'profile' && workerRecord && <WorkerProfile worker={workerRecord} onUpdate={updateWorker} />}
          {page === 'profile' && !workerRecord && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>لا توجد بيانات مرتبطة بحسابك</div>}
          {page === 'owner_profile' && user.role === 'owner' && (
            <OwnerProfilePage user={user} onUpdate={(updated) => setUser(updated)} onShowPricing={() => onShowPricing && onShowPricing()} workers={workers} workPlaces={workPlaces} ownerUsers={ownerUsers} />
          )}
          {page === 'accounts' && user.role === 'owner' && (
            <AccountsPage
              users={ownerUsers}
              currentUser={user}
              workers={workers}
              onAddWorker={async (w) => {
                const oid = getOwnerId(user);
                await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}workers`, String(w.id)), w);
              }}
              onAddUser={async (u) => {
                const oid = getOwnerId(user);
                await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}members`, String(u.id)), u);
                await setDoc(doc(db, 'users', String(u.id)), u);
                setOwnerUsers(prev => [...prev, u]);
              }}
              onEditUser={async (id, updated) => {
                const oid = getOwnerId(user);
                await updateDoc(doc(db, `${COLLECTION_PREFIX}owners`, oid, `${COLLECTION_PREFIX}members`, String(id)), updated);
                await updateDoc(doc(db, 'users', String(id)), updated);
                setOwnerUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
              }}
              onDeleteUser={handleDeleteUser}
            />
          )}
          {page === 'stations' && user.role === 'owner' && (
            <StationsPage
              ownerId={getOwnerId(user)}
              stations={stations}
              activeStation={activeStation}
              onSetActive={(id) => { setActiveStation(id); const oid = getOwnerId(user); if (oid) localStorage.setItem(ACTIVE_STATION_KEY(oid), id); }}
              onRefresh={async () => { const stList = await getStations(getOwnerId(user)); setStations(stList); }}
              plan={getPlan()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function Root() {
  const [showPricing, setShowPricing] = useState(false);
  const [trialInfo, setTrialInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // تابع حالة Auth عشان نعرف المستخدم الحالي
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { id: firebaseUser.uid, ...userDoc.data() };
          setCurrentUser(userData);
          // حمّل الـ trial من Firebase
          const ownerId = userData.role === 'owner' ? userData.id : userData.ownerId;
          if (ownerId) {
            await initTrialIfNeeded(ownerId);
            const info = await getTrialInfoFromDB(ownerId);
            setTrialInfo(info);
            // مزامنة الباقة من Firestore مع localStorage عشان getPlan() يشتغل صح
            if (info?.plan) {
              localStorage.setItem('app_plan', info.plan);
            }
          }
        }
      } else {
        setCurrentUser(null);
        setTrialInfo(null);
      }
    });
    return () => unsub();
  }, []);

  const trial = trialInfo || getTrialInfo();
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || '';
  const currentPlan = trialInfo?.plan || getPlan();

  // لو الـ trial خلص وما اختارش خطة → حوّله تلقائياً للمجانية
  useEffect(() => {
    if (trial.expired && currentPlan === 'trial') {
      const autoFree = async () => {
        localStorage.setItem('app_plan', 'free');
        if (currentUser) {
          const ownerId = currentUser.role === 'owner' ? currentUser.id : currentUser.ownerId;
          if (ownerId) await setPlanInDB(ownerId, 'free');
        }
        if (trialInfo) setTrialInfo({ ...trialInfo, plan: 'free', expired: false });
      };
      autoFree();
    }
  }, [trial.expired, currentPlan]);

  const handleSelectFree = async () => {
    localStorage.setItem('app_plan', 'free');
    if (currentUser) {
      const ownerId = currentUser.role === 'owner' ? currentUser.id : currentUser.ownerId;
      if (ownerId) await setPlanInDB(ownerId, 'free');
    }
    setShowPricing(false);
    if (trialInfo) setTrialInfo({ ...trialInfo, plan: 'free', expired: false });
  };

  // Admin route — supports both /admin path and #admin hash (for SPA hosting)
  const isAdminRoute = typeof window !== 'undefined' && (
    window.location.pathname === '/admin' ||
    window.location.hash === '#admin' ||
    window.location.search === '?admin'
  );
  if (isAdminRoute) {
    return (
      <ToastProvider>
        <style>{globalStyles}</style>
        <AdminPanel />
      </ToastProvider>
    );
  }

  // التطبيق دايماً شغال — مفيش قفل بأي حال
  return (
    <>
      <style>{globalStyles}</style>
      <ToastProvider>
        {/* أثناء الـ trial: بانر العد التنازلي */}
        {currentPlan === 'trial' && trial.remaining > 0 && (
          <TrialBanner
            remaining={trial.remaining}
            onViewPlans={() => setShowPricing(true)}
            userName={userName}
          />
        )}

        {/* بعد الـ trial: بانر ترقية خفيف */}
        {(currentPlan === 'free' || (currentPlan === 'trial' && trial.expired)) && (
          <div className="trial-banner no-print" style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.04))',
            borderBottom: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '8px 28px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
              🆓 أنت على الباقة المجانية — حتى 5 عمال
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPricing(true)}>
              ⚡ ترقية الباقة
            </button>
          </div>
        )}

        <App onShowPricing={() => setShowPricing(true)} />

        {/* شاشة الخطط كـ modal فوق التطبيق */}
        {showPricing && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, overflowY: 'auto', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
            <PricingScreen
              onBack={() => setShowPricing(false)}
              onSelectFree={handleSelectFree}
            />
          </div>
        )}
      </ToastProvider>
    </>
  );
}
