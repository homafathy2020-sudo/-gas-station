export const Sidebar = ({ user, page, setPage, onLogout, isOpen, onClose, collapsed }) => {
  const navs = {
    owner: [
      { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
      { id: 'workers', icon: '👷', label: 'إدارة العمال' },
      { id: 'reports', icon: '📋', label: 'التقارير' },
      { id: 'salary_payment', icon: '💵', label: 'صرف الرواتب' },
      { id: 'month_archive', icon: '📦', label: 'أرشيف الشهور' },
      { id: 'stations', icon: '⛽', label: 'محطاتي' },
      { id: 'accounts', icon: '🔐', label: 'إدارة الحسابات' },
      { id: 'owner_profile', icon: '👤', label: 'ملفي الشخصي' },
    ],
    manager: [
      { id: 'workers', icon: '👷', label: 'إدارة العمال' },
      { id: 'reports', icon: '📋', label: 'التقارير' },
    ],
    worker: [
      { id: 'profile', icon: '👤', label: 'ملفي الشخصي' },
    ],
  };
  return (
    <>
      <div className={`mobile-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ transform: collapsed ? 'translateX(100%)' : undefined, transition: 'transform 0.3s ease' }}>
        <div className="sidebar-logo">
          <div className="logo-icon">⛽</div>
          <div><div className="logo-text">WaqoudPro</div><div className="logo-sub">نظام المحطات الذكي</div></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">القائمة الرئيسية</div>
          {(navs[user.role] || []).map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); onClose(); }}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>🚪 تسجيل الخروج</button>
        </div>
      </div>
    </>
  );
};
