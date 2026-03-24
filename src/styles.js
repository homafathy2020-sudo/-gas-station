// ==================== WAQOUD PRO — DESIGN SYSTEM ====================
// Premium dark theme for gas station management
// Color palette: Deep navy + Amber gold + Emerald green

export const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* === BRAND COLORS === */
  --primary: #1a56db;
  --primary-dark: #1040a8;
  --primary-light: #3b82f6;
  --primary-glow: rgba(26,86,219,0.35);

  --accent: #f59e0b;
  --accent-dark: #d97706;
  --accent-light: #fbbf24;
  --accent-glow: rgba(245,158,11,0.3);

  --fuel: #f97316;
  --fuel-dark: #ea580c;
  --fuel-light: #fb923c;

  /* === NEUTRAL PALETTE === */
  --dark: #070c18;
  --dark-2: #0d1526;
  --dark-3: #162035;
  --dark-4: #1e2d47;
  --dark-5: #243355;

  --text: #f0f4ff;
  --text-soft: #c4ceeb;
  --text-muted: #8896b3;
  --text-faint: #4a5878;

  /* === SEMANTIC COLORS === */
  --success: #10b981;
  --success-dark: #059669;
  --success-bg: rgba(16,185,129,0.12);
  --success-border: rgba(16,185,129,0.25);

  --danger: #ef4444;
  --danger-dark: #dc2626;
  --danger-bg: rgba(239,68,68,0.12);
  --danger-border: rgba(239,68,68,0.25);

  --warning: #f59e0b;
  --warning-bg: rgba(245,158,11,0.12);
  --warning-border: rgba(245,158,11,0.25);

  --info: #3b82f6;
  --info-bg: rgba(59,130,246,0.12);
  --info-border: rgba(59,130,246,0.25);

  /* === SURFACES === */
  --surface: rgba(255,255,255,0.03);
  --surface-2: rgba(255,255,255,0.055);
  --surface-3: rgba(255,255,255,0.08);
  --surface-hover: rgba(255,255,255,0.07);
  --border: rgba(255,255,255,0.07);
  --border-2: rgba(255,255,255,0.12);
  --border-accent: rgba(26,86,219,0.3);

  /* === LAYOUT === */
  --sidebar-w: 270px;
  --topbar-h: 64px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;

  /* === SHADOWS === */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.35);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
  --shadow-blue: 0 4px 20px rgba(26,86,219,0.3);
  --shadow-gold: 0 4px 20px rgba(245,158,11,0.25);
}

html {
  direction: rtl;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  touch-action: manipulation;
  scroll-behavior: smooth;
}

body {
  font-family: 'Cairo', sans-serif;
  background: var(--dark);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* === SCROLLBAR === */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--dark-2); }
::-webkit-scrollbar-thumb { background: var(--dark-5); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-faint); }

/* ================================
   APP LAYOUT
================================ */
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ================================
   SIDEBAR
================================ */
.sidebar {
  width: var(--sidebar-w);
  background: var(--dark-2);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  background-image:
    radial-gradient(ellipse at 100% 0%, rgba(26,86,219,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 0% 100%, rgba(245,158,11,0.06) 0%, transparent 50%);
}

.sidebar-logo {
  padding: 20px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, var(--fuel), var(--accent));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(249,115,22,0.35);
}

.logo-text { font-size: 16px; font-weight: 900; color: var(--text); letter-spacing: -0.3px; }
.logo-sub { font-size: 10px; color: var(--text-muted); margin-top: 1px; font-weight: 500; letter-spacing: 0.5px; }

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section-title {
  font-size: 9px;
  font-weight: 800;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 10px 10px 5px;
  margin-top: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  transition: all 0.18s ease;
  margin-bottom: 1px;
  border: none;
  background: none;
  width: 100%;
  text-align: right;
  position: relative;
}

.nav-item:hover {
  background: var(--surface-3);
  color: var(--text-soft);
  transform: translateX(-2px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(26,86,219,0.2), rgba(26,86,219,0.08));
  color: var(--primary-light);
  border: 1px solid rgba(26,86,219,0.3);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(26,86,219,0.15);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--primary-light);
  border-radius: 2px 0 0 2px;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.18s;
}

.nav-item.active .nav-icon { opacity: 1; }
.nav-item:hover .nav-icon { opacity: 0.9; }

.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-2);
  border: 1px solid var(--border);
  margin-bottom: 8px;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 12px; font-weight: 700; color: var(--text); line-height: 1.3; }
.user-role { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

.logout-btn {
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-md);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: var(--danger);
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.logout-btn:hover {
  background: rgba(239,68,68,0.22);
  transform: translateY(-1px);
}

/* ================================
   MAIN CONTENT
================================ */
.main-content {
  flex: 1;
  margin-right: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--dark);
  background-image:
    radial-gradient(ellipse at 70% 0%, rgba(26,86,219,0.07) 0%, transparent 45%),
    radial-gradient(ellipse at 30% 100%, rgba(245,158,11,0.04) 0%, transparent 45%);
}

.topbar {
  background: rgba(13,21,38,0.9);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.topbar-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--text);
}

.topbar-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.page-content {
  padding: 24px;
  flex: 1;
  max-width: 100%;
}

/* ================================
   HAMBURGER & MOBILE
================================ */
.hamburger {
  display: none;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px;
  cursor: pointer;
  color: var(--text);
  transition: all 0.18s;
}

.hamburger:hover { background: var(--surface-3); }

.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(2px);
  z-index: 99;
}

.mobile-overlay.show { display: block; }

/* ================================
   CARDS & SURFACES
================================ */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 22px;
  position: relative;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 10px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ================================
   STAT CARDS
================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: all 0.22s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--stat-color, var(--primary)), transparent);
  opacity: 0;
  transition: opacity 0.22s;
}

.stat-card:hover {
  transform: translateY(-2px);
  background: var(--surface-3);
  border-color: var(--border-2);
  box-shadow: var(--shadow-md);
}

.stat-card:hover::after { opacity: 1; }

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
  font-weight: 500;
}

/* ================================
   BUTTONS
================================ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: var(--radius-md);
  font-family: 'Cairo', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  border: none;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.1px;
}

.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background 0.18s;
}

.btn:hover::before { background: rgba(255,255,255,0.06); }
.btn:active { transform: translateY(1px); }

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  box-shadow: 0 2px 8px rgba(26,86,219,0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-dark), var(--primary));
  box-shadow: 0 4px 16px rgba(26,86,219,0.4);
  transform: translateY(-1px);
}

.btn-accent {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  color: #0a0f1a;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(245,158,11,0.3);
}

.btn-accent:hover {
  box-shadow: 0 4px 16px rgba(245,158,11,0.4);
  transform: translateY(-1px);
}

.btn-ghost {
  background: var(--surface-2);
  color: var(--text-soft);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--text);
}

.btn-danger {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
}

.btn-danger:hover { background: rgba(239,68,68,0.22); }

.btn-success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success-border);
}

.btn-success:hover { background: rgba(16,185,129,0.22); }

.btn-warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid var(--warning-border);
}

.btn-warning:hover { background: rgba(245,158,11,0.22); }

.btn-blue {
  background: var(--info-bg);
  color: var(--info);
  border: 1px solid var(--info-border);
}

.btn-blue:hover { background: rgba(59,130,246,0.22); }

.btn-lifetime {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  box-shadow: 0 2px 8px rgba(124,58,237,0.3);
}

.btn-lifetime:hover { box-shadow: 0 4px 16px rgba(124,58,237,0.4); transform: translateY(-1px); }

.btn-sm { padding: 6px 13px; font-size: 12px; border-radius: var(--radius-sm); }
.btn-xs { padding: 4px 9px; font-size: 11px; border-radius: 6px; }
.btn-lg { padding: 12px 24px; font-size: 15px; border-radius: var(--radius-lg); }

/* ================================
   FORMS
================================ */
.form-group { margin-bottom: 15px; }

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.form-input {
  width: 100%;
  padding: 10px 13px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text);
  font-family: 'Cairo', sans-serif;
  font-size: 14px;
  transition: all 0.18s;
  outline: none;
  text-align: right;
}

.form-input:focus {
  border-color: var(--primary-light);
  background: rgba(26,86,219,0.06);
  box-shadow: 0 0 0 3px rgba(26,86,219,0.12);
}

.form-input.error { border-color: var(--danger); box-shadow: 0 0 0 3px var(--danger-bg); }

select.form-input {
  cursor: pointer;
}

select.form-input option {
  background: var(--dark-2);
  color: var(--text);
}

.form-error { font-size: 11px; color: var(--danger); margin-top: 5px; display: flex; align-items: center; gap: 4px; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ================================
   BADGES
================================ */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.badge-success { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
.badge-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border); }
.badge-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning-border); }
.badge-blue { background: var(--info-bg); color: var(--info); border: 1px solid var(--info-border); }
.badge-fuel { background: rgba(249,115,22,0.12); color: var(--fuel-light); border: 1px solid rgba(249,115,22,0.25); }
.badge-purple { background: rgba(168,85,247,0.12); color: #c084fc; border: 1px solid rgba(168,85,247,0.25); }

/* ================================
   TABLE
================================ */
.table-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.table-hdr {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  background: var(--surface-2);
}

table { width: 100%; border-collapse: collapse; }

th {
  background: rgba(255,255,255,0.02);
  padding: 11px 14px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-faint);
  text-align: right;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 11px 14px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
}

tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,0.018); }

/* ================================
   MODAL
================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: overlayIn 0.2s ease;
}

@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: var(--dark-2);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  animation: modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.94) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title { font-size: 16px; font-weight: 800; color: var(--text); }
.modal-body { padding: 22px; }
.modal-footer { padding: 14px 22px; border-top: 1px solid var(--border); display: flex; gap: 10px; }

.close-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.18s;
  flex-shrink: 0;
}

.close-btn:hover { background: var(--danger-bg); color: var(--danger); border-color: var(--danger-border); }

/* ================================
   TOAST
================================ */
.toast-container {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 18px;
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 600;
  min-width: 260px;
  animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  border: 1px solid;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
  pointer-events: all;
}

@keyframes toastIn {
  from { transform: translateX(-120%) scale(0.9); opacity: 0; }
  to { transform: translateX(0) scale(1); opacity: 1; }
}

.toast-success { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.35); color: #34d399; }
.toast-error { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.35); color: #f87171; }
.toast-warning { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.35); color: #fbbf24; }
.toast-info { background: rgba(59,130,246,0.18); border-color: rgba(59,130,246,0.35); color: #60a5fa; }

/* ================================
   LOADER
================================ */
.loader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--primary-light);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ================================
   ANIMATIONS
================================ */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bellShake {
  0%,85%,100% { transform: rotate(0); }
  87% { transform: rotate(-10deg); }
  89% { transform: rotate(10deg); }
  91% { transform: rotate(-7deg); }
  93% { transform: rotate(6deg); }
  95% { transform: rotate(-3deg); }
}

@keyframes urgentPulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }

/* ================================
   PROGRESS BARS
================================ */
.progress-bar-wrap {
  height: 6px;
  background: var(--dark-5);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-dark), var(--success));
  border-radius: 4px;
  transition: width 0.5s ease;
}

.fuel-bar { height: 5px; background: var(--dark-5); border-radius: 3px; overflow: hidden; }
.fuel-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 3px; transition: width 0.4s ease; }

/* ================================
   LOGIN PAGE
================================ */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dark);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% -10%, rgba(26,86,219,0.22) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 110%, rgba(245,158,11,0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 10% 80%, rgba(249,115,22,0.06) 0%, transparent 40%);
}

.login-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  animation: fadeIn 0.4s ease;
}

.login-logo {
  width: 68px;
  height: 68px;
  background: linear-gradient(135deg, var(--fuel), var(--accent));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 16px;
  box-shadow: 0 8px 32px rgba(249,115,22,0.35), 0 0 0 1px rgba(255,255,255,0.1);
}

/* ================================
   WORKER SELECTOR
================================ */
.worker-selector {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 22px;
  margin-bottom: 22px;
}

.worker-dropdown { position: relative; }

.worker-dropdown-btn {
  width: 100%;
  padding: 13px 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text);
  font-family: 'Cairo', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.18s;
  text-align: right;
}

.worker-dropdown-btn:hover,
.worker-dropdown-btn.open {
  border-color: var(--primary-light);
  background: rgba(26,86,219,0.06);
}

.worker-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  background: var(--dark-3);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-lg);
  z-index: 50;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  max-height: 300px;
  overflow-y: auto;
  animation: fadeIn 0.18s ease;
}

.worker-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border);
}

.worker-dropdown-item:last-child { border-bottom: none; }
.worker-dropdown-item:hover { background: rgba(26,86,219,0.1); }
.worker-dropdown-item.selected { background: rgba(26,86,219,0.14); }

.w-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

/* ================================
   WORKER DETAIL
================================ */
.worker-detail { animation: fadeIn 0.3s ease; }

.detail-header {
  background: linear-gradient(135deg, rgba(26,86,219,0.12), rgba(245,158,11,0.06));
  border: 1px solid rgba(26,86,219,0.2);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.detail-avatar {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 900;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(26,86,219,0.3);
}

.detail-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  margin-bottom: 16px;
  overflow: hidden;
}

.detail-section-hdr {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--surface-2);
}

.detail-section-title {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-body { padding: 18px; }

.entries-tbl { width: 100%; border-collapse: collapse; }
.entries-tbl th {
  background: rgba(255,255,255,0.02);
  padding: 9px 13px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-faint);
  text-align: right;
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.entries-tbl td {
  padding: 10px 13px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
  font-weight: 500;
}
.entries-tbl tr:last-child td { border-bottom: none; }
.entries-tbl tr:hover td { background: rgba(255,255,255,0.02); }

.net-card {
  background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03));
  border: 2px solid rgba(16,185,129,0.22);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.net-amount {
  font-size: 34px;
  font-weight: 900;
  color: var(--success);
  letter-spacing: -1px;
}

.empty-state {
  text-align: center;
  padding: 56px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 14px;
  opacity: 0.7;
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-soft);
  margin-bottom: 6px;
}

/* ================================
   SALARY PAYMENT
================================ */
.payment-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.payment-row:last-child { border-bottom: none; }
.payment-row:hover { background: rgba(255,255,255,0.02); }
.payment-row.paid { background: rgba(16,185,129,0.03); }

.payment-worker-info { flex: 1; display: flex; align-items: center; gap: 12px; }
.payment-net { font-size: 16px; font-weight: 900; color: var(--success); min-width: 120px; text-align: left; }

.pay-btn {
  background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08));
  border: 1px solid rgba(16,185,129,0.35);
  color: var(--success);
  padding: 8px 18px;
  border-radius: var(--radius-md);
  font-family: 'Cairo', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}

.pay-btn:hover { background: rgba(16,185,129,0.28); transform: translateY(-1px); }

.pay-btn.paid-btn {
  background: rgba(100,116,139,0.08);
  border-color: rgba(100,116,139,0.18);
  color: #64748b;
  cursor: default;
}

.pay-btn.paid-btn:hover { transform: none; }

.paid-stamp {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--success);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.salary-summary-bar {
  background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02));
  border: 1px solid rgba(16,185,129,0.18);
  border-radius: var(--radius-xl);
  padding: 16px 22px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

/* ================================
   MONTH ARCHIVE
================================ */
.month-reset-card {
  background: linear-gradient(135deg, rgba(239,68,68,0.07), rgba(239,68,68,0.02));
  border: 2px solid rgba(239,68,68,0.18);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
}

.month-archive-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
  transition: all 0.18s;
}

.month-archive-item:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
  transform: translateY(-1px);
}

/* ================================
   ADMIN PANEL
================================ */
.admin-wrap { max-width: 1100px; margin: 0 auto; animation: fadeIn .3s ease; }

.admin-header {
  background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03));
  border: 2px solid rgba(239,68,68,0.25);
  border-radius: var(--radius-2xl);
  padding: 24px 28px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.admin-badge {
  background: rgba(239,68,68,0.18);
  border: 1px solid rgba(239,68,68,0.35);
  color: var(--danger);
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.admin-stat {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 20px;
  text-align: center;
  min-width: 90px;
}

.admin-tab {
  padding: 8px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: none;
  color: var(--text-muted);
  font-family: 'Cairo', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
}

.admin-tab.active {
  background: linear-gradient(135deg, rgba(26,86,219,0.22), rgba(26,86,219,0.08));
  color: var(--primary-light);
  border-color: rgba(26,86,219,0.35);
}

.announce-form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 20px;
}

.announce-preview {
  background: linear-gradient(135deg, rgba(26,86,219,0.08), rgba(245,158,11,0.04));
  border: 1px solid rgba(26,86,219,0.2);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin: 14px 0;
}

/* ================================
   OWNER PHONE BANNER
================================ */
.owner-phone-banner {
  background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03));
  border-bottom: 1px solid rgba(245,158,11,0.25);
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.owner-phone-banner-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ================================
   WHATSAPP BUTTON
================================ */
.wa-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #25d366;
  color: white;
  border: none;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  font-family: 'Cairo', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}

.wa-btn:hover { background: #1da851; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
.wa-btn-sm { padding: 5px 10px; font-size: 11px; border-radius: var(--radius-sm); }

/* ================================
   STATION SWITCHER
================================ */
.station-switcher { position: relative; }

.station-switcher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  transition: all 0.18s;
  white-space: nowrap;
  max-width: 200px;
}

.station-switcher-btn:hover,
.station-switcher-btn.open {
  background: var(--surface-3);
  border-color: var(--primary-light);
}

.station-switcher-btn .st-name { overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: right; }
.station-switcher-btn .st-arrow { font-size: 10px; color: var(--text-muted); flex-shrink: 0; transition: transform 0.18s; }
.station-switcher-btn.open .st-arrow { transform: rotate(180deg); }

.station-switcher-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  background: var(--dark-3);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  z-index: 300;
  overflow: hidden;
  animation: fadeIn 0.18s ease;
}

.station-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.station-item:last-child { border-bottom: none; }
.station-item:hover { background: rgba(26,86,219,0.1); }
.station-item.active { background: rgba(26,86,219,0.13); }

.station-item-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.station-item-name { font-size: 13px; font-weight: 700; }
.station-item-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.station-item-check { margin-right: auto; color: var(--primary-light); font-size: 14px; }
.station-switcher-footer { padding: 8px 12px; border-top: 1px solid var(--border); }

.stations-page { max-width: 760px; margin: 0 auto; animation: fadeIn .3s ease; }

.station-card {
  background: var(--surface-2);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.22s;
  margin-bottom: 12px;
}

.station-card:hover {
  background: var(--surface-3);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.station-card.active-station {
  border-color: rgba(26,86,219,0.35);
  background: linear-gradient(135deg, rgba(26,86,219,0.06), rgba(26,86,219,0.02));
}

.station-card-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(26,86,219,0.3);
}

.station-card-name { font-size: 15px; font-weight: 800; }
.station-card-meta { font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap; }

.station-limit-bar {
  background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02));
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* ================================
   SHIFT LOG
================================ */
.shift-page { max-width: 820px; margin: 0 auto; animation: fadeIn .3s ease; }

.shift-date-bar {
  background: linear-gradient(135deg, rgba(26,86,219,0.1), rgba(26,86,219,0.03));
  border: 1px solid rgba(26,86,219,0.2);
  border-radius: var(--radius-xl);
  padding: 14px 20px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.shift-status-btns { display: flex; gap: 5px; flex-wrap: wrap; }

.shift-status-btn {
  padding: 6px 13px;
  border-radius: var(--radius-sm);
  border: 1.5px solid;
  font-family: 'Cairo', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  background: none;
}

.shift-status-btn.present { border-color: rgba(16,185,129,0.35); color: var(--success); }
.shift-status-btn.present.sel { background: rgba(16,185,129,0.18); border-color: var(--success); }
.shift-status-btn.late { border-color: rgba(245,158,11,0.35); color: var(--warning); }
.shift-status-btn.late.sel { background: rgba(245,158,11,0.18); border-color: var(--warning); }
.shift-status-btn.absent { border-color: rgba(239,68,68,0.35); color: var(--danger); }
.shift-status-btn.absent.sel { background: rgba(239,68,68,0.18); border-color: var(--danger); }
.shift-status-btn.no-reason { border-color: rgba(168,85,247,0.35); color: #c084fc; }
.shift-status-btn.no-reason.sel { background: rgba(168,85,247,0.18); border-color: #a855f7; }

.shift-extra { display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap; width: 100%; }

.shift-mini-input {
  width: 90px;
  padding: 5px 9px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: 'Cairo', sans-serif;
  font-size: 13px;
  outline: none;
  text-align: center;
  transition: border-color 0.18s;
}

.shift-mini-input:focus { border-color: var(--primary-light); }

.shift-sum-card {
  flex: 1;
  min-width: 90px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  text-align: center;
}

.shift-sum-num { font-size: 24px; font-weight: 900; }
.shift-sum-lbl { font-size: 10px; color: var(--text-muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

/* ================================
   FUEL LOG
================================ */
.fuel-page { max-width: 860px; margin: 0 auto; animation: fadeIn .3s ease; }
.fuel-shortage { color: var(--danger); font-weight: 800; }
.fuel-surplus { color: var(--success); font-weight: 800; }
.fuel-ok { color: var(--text-muted); font-weight: 600; }

.fuel-stat-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  text-align: center;
  flex: 1;
  min-width: 110px;
  transition: all 0.18s;
}

.fuel-stat-card:hover {
  background: var(--surface-3);
  transform: translateY(-2px);
}

.fuel-stat-num { font-size: 26px; font-weight: 900; }
.fuel-stat-lbl { font-size: 10px; color: var(--text-muted); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }

/* ================================
   NOTIFICATION BELL
================================ */
.notif-bell-wrap { position: relative; }

.notif-bell-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--surface-2);
  border: 1px solid var(--border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  transition: all 0.18s;
  color: var(--text);
}

.notif-bell-btn:hover { background: var(--surface-3); border-color: var(--primary-light); }
.notif-bell-btn.has-notif { animation: bellShake 3s ease-in-out infinite; }

.notif-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--danger);
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--dark-2);
  animation: popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 340px;
  background: var(--dark-3);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  z-index: 300;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

.notif-hdr {
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-2);
}

.notif-hdr-title { font-size: 13px; font-weight: 700; }

.notif-clear-btn {
  font-size: 11px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.18s;
}

.notif-clear-btn:hover { background: var(--surface-3); color: var(--text); }

.notif-list { max-height: 400px; overflow-y: auto; }

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  transition: background 0.15s;
}

.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--surface-2); }
.notif-item.unread { background: rgba(26,86,219,0.05); }
.notif-item.unread:hover { background: rgba(26,86,219,0.09); }

.notif-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.notif-icon-wrap.type-warning { background: var(--warning-bg); }
.notif-icon-wrap.type-info { background: var(--info-bg); }
.notif-icon-wrap.type-success { background: var(--success-bg); }
.notif-icon-wrap.type-danger { background: var(--danger-bg); }

.notif-text { flex: 1; min-width: 0; }
.notif-title { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.notif-sub { font-size: 11px; color: var(--text-muted); line-height: 1.5; }
.notif-time { font-size: 10px; color: var(--text-faint); margin-top: 3px; }
.notif-nav-hint { font-size: 10px; color: var(--primary-light); margin-top: 2px; opacity: 0.8; }

.notif-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary-light);
  flex-shrink: 0;
  margin-top: 4px;
}

.notif-empty { padding: 32px 20px; text-align: center; color: var(--text-muted); font-size: 13px; }
.notif-empty-icon { font-size: 32px; margin-bottom: 8px; }

/* ================================
   TRIAL BANNER
================================ */
.trial-banner {
  background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03));
  border-bottom: 1px solid rgba(245,158,11,0.22);
  padding: 9px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.trial-banner-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 8px;
}

.trial-days-badge {
  background: rgba(245,158,11,0.18);
  border: 1px solid rgba(245,158,11,0.35);
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  color: var(--accent);
}

.trial-days-badge.urgent {
  background: rgba(239,68,68,0.18);
  border-color: rgba(239,68,68,0.35);
  color: var(--danger);
  animation: urgentPulse 1.5s ease-in-out infinite;
}

/* ================================
   PRICING SCREEN
================================ */
.expired-screen {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--dark);
  position: relative;
  overflow-y: auto;
  padding: 30px 20px;
}

.expired-screen::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.1) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 100%, rgba(245,158,11,0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.pricing-wrap { width: 100%; max-width: 1000px; position: relative; z-index: 1; }
.pricing-header { text-align: center; margin-bottom: 36px; }

.pricing-icon {
  width: 68px;
  height: 68px;
  background: linear-gradient(135deg, var(--danger), var(--accent));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 16px;
  box-shadow: 0 8px 28px rgba(239,68,68,0.3);
}

.pricing-title { font-size: 26px; font-weight: 900; margin-bottom: 10px; letter-spacing: -0.5px; }
.pricing-sub { font-size: 14px; color: var(--text-muted); line-height: 1.8; max-width: 480px; margin: 0 auto; }

.plans-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 26px;
}

.plan-card {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.25s;
}

.plan-card:hover { transform: translateY(-4px); background: var(--surface-2); }

.plan-card.popular {
  border-color: var(--primary-light);
  background: linear-gradient(160deg, rgba(26,86,219,0.08), rgba(26,86,219,0.02));
  box-shadow: 0 0 0 1px rgba(59,130,246,0.18), var(--shadow-md);
}

.plan-card.gold {
  border-color: rgba(245,158,11,0.45);
  background: linear-gradient(160deg, rgba(245,158,11,0.07), rgba(245,158,11,0.02));
}

.plan-card.lifetime {
  border-color: rgba(168,85,247,0.55);
  background: linear-gradient(160deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02));
  box-shadow: 0 0 0 1px rgba(168,85,247,0.18), var(--shadow-md);
}

.plan-card.free {
  border-color: rgba(16,185,129,0.35);
  background: linear-gradient(160deg, rgba(16,185,129,0.07), rgba(16,185,129,0.02));
}

.popular-badge {
  position: absolute;
  top: -12px;
  right: 50%;
  transform: translateX(50%);
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 20px;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.lifetime-badge {
  position: absolute;
  top: -12px;
  right: 50%;
  transform: translateX(50%);
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 20px;
  white-space: nowrap;
}

.free-badge {
  position: absolute;
  top: -10px;
  right: 18px;
  background: linear-gradient(135deg, var(--success-dark), var(--success));
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.plan-emoji { font-size: 30px; margin-bottom: 8px; }
.plan-name { font-size: 17px; font-weight: 800; margin-bottom: 3px; }
.plan-desc { font-size: 11px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.6; }
.plan-price { font-size: 38px; font-weight: 900; line-height: 1; }
.plan-price sup { font-size: 14px; font-weight: 700; color: var(--text-muted); vertical-align: super; }
.plan-price sub { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.plan-period { font-size: 11px; color: var(--text-muted); margin-top: 4px; margin-bottom: 16px; }
.plan-divider { height: 1px; background: var(--border); margin: 12px 0; }
.plan-features { flex: 1; display: flex; flex-direction: column; gap: 2px; margin-bottom: 18px; }

.plan-feature { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; padding: 4px 0; }
.plan-feature.yes { color: var(--text-soft); }
.plan-feature.no { color: var(--text-muted); opacity: 0.4; }
.feat-icon { font-size: 12px; flex-shrink: 0; margin-top: 1px; }

.whatsapp-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #25d366;
  color: white;
  padding: 12px 28px;
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border: none;
  font-family: 'Cairo', sans-serif;
  transition: all 0.2s;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(37,211,102,0.3);
}

.whatsapp-btn:hover { background: #1da851; transform: translateY(-1px); }

.contact-strip p { color: var(--text-muted); font-size: 13px; margin-bottom: 14px; line-height: 1.7; text-align: center; }

/* ================================
   RESPONSIVE
================================ */
@media (max-width: 768px) {
  .sidebar { transform: translateX(100%) !important; }
  .sidebar.open { transform: translateX(0) !important; }
  .main-content { margin-right: 0 !important; }
  .hamburger { display: flex; }
  .app-shell { overflow-x: hidden; }
  .page-content { padding: 14px; }
  .topbar { padding: 0 14px; }
  .topbar-title { font-size: 15px; }
  .card { padding: 14px; border-radius: var(--radius-lg); }
  .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
  .stat-card { padding: 12px; gap: 10px; }
  .stat-icon { width: 36px; height: 36px; font-size: 16px; flex-shrink: 0; }
  .table-hdr { flex-direction: column; align-items: flex-start; }
  .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .form-grid-2 { grid-template-columns: 1fr; }
  .modal { max-width: 100%; margin: 0; border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  .modal-overlay { align-items: flex-end; padding: 0; }
  .salary-summary-bar { flex-direction: column; align-items: flex-start; padding: 14px; }
  .shift-sum-card { min-width: unset !important; }
  .fuel-stat-card { min-width: unset !important; }
  .net-amount { font-size: 26px; }
  .toast-container { left: 10px; right: 10px; bottom: 16px; }
  .toast { min-width: unset; width: 100%; }
  .plans-grid { grid-template-columns: 1fr 1fr; }
  .notif-dropdown { right: -80px; left: auto; width: 290px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
  .stat-card { padding: 10px; }
  .stat-icon { width: 32px; height: 32px; }
  .plans-grid { grid-template-columns: 1fr; max-width: 380px; margin: 0 auto 26px; }
}

@media (max-width: 900px) {
  .plans-grid { grid-template-columns: repeat(2, 1fr); }
}

@media print {
  .sidebar, .topbar, .no-print { display: none !important; }
  .main-content { margin-right: 0; }
  body { background: white; color: black; }
  .card, .detail-section, .net-card { background: white !important; border: 1px solid #ddd; }
}
`;
