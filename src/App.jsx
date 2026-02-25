import { useState, useCallback, useContext, createContext, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, getDocs } from "firebase/firestore";

// ==================== STYLES ====================
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --primary: #1a56db; --primary-dark: #1040a8; --primary-light: #3b82f6;
  --accent: #f59e0b; --accent-dark: #d97706;
  --dark: #0f172a; --dark-2: #1e293b; --dark-3: #334155;
  --text: #f8fafc; --text-muted: #94a3b8;
  --success: #10b981; --danger: #ef4444; --warning: #f59e0b;
  --border: rgba(255,255,255,0.08); --card: rgba(255,255,255,0.04); --card-hover: rgba(255,255,255,0.07);
  --sidebar-w: 260px;
}
html { direction: rtl; }
body { font-family: 'Cairo', sans-serif; background: var(--dark); color: var(--text); min-height: 100vh; overflow-x: hidden; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--dark-2); } ::-webkit-scrollbar-thumb { background: var(--dark-3); border-radius: 3px; }
.app-shell { display: flex; min-height: 100vh; }

.sidebar { width: var(--sidebar-w); background: var(--dark-2); border-left: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; right: 0; top: 0; bottom: 0; z-index: 100; transition: transform 0.3s ease; }
.sidebar-logo { padding: 24px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.logo-text { font-size: 16px; font-weight: 800; line-height: 1.2; }
.logo-sub { font-size: 11px; color: var(--text-muted); }
.sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
.nav-section-title { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; padding: 8px 8px 4px; margin-top: 8px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-muted); transition: all 0.2s; margin-bottom: 2px; border: none; background: none; width: 100%; text-align: right; }
.nav-item:hover { background: var(--card-hover); color: var(--text); }
.nav-item.active { background: linear-gradient(135deg, rgba(26,86,219,0.3), rgba(245,158,11,0.1)); color: var(--primary-light); border: 1px solid rgba(26,86,219,0.3); }
.nav-icon { font-size: 18px; width: 20px; text-align: center; }
.sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--border); }
.user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: var(--card); }
.user-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.user-name { font-size: 13px; font-weight: 600; }
.user-role { font-size: 11px; color: var(--text-muted); }
.logout-btn { margin-top: 10px; width: 100%; padding: 8px; border-radius: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; cursor: pointer; font-family: 'Cairo', sans-serif; font-size: 13px; font-weight: 600; transition: all 0.2s; }
.logout-btn:hover { background: rgba(239,68,68,0.2); }
.main-content { flex: 1; margin-right: var(--sidebar-w); display: flex; flex-direction: column; }
.topbar { background: var(--dark-2); border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
.topbar-title { font-size: 20px; font-weight: 700; }
.page-content { padding: 28px; flex: 1; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: flex; align-items: flex-start; gap: 16px; transition: all 0.2s; }
.stat-card:hover { transform: translateY(-2px); background: var(--card-hover); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 10px; font-family: 'Cairo', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; white-space: nowrap; }
.btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; }
.btn-primary:hover { background: linear-gradient(135deg, var(--primary-dark), var(--primary)); transform: translateY(-1px); box-shadow: 0 4px 15px rgba(26,86,219,0.3); }
.btn-accent { background: linear-gradient(135deg, var(--accent-dark), var(--accent)); color: var(--dark); font-weight: 700; }
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
.btn-ghost { background: rgba(255,255,255,0.06); color: var(--text); border: 1px solid var(--border); }
.btn-ghost:hover { background: rgba(255,255,255,0.1); }
.btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.btn-danger:hover { background: rgba(239,68,68,0.25); }
.btn-success { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.btn-success:hover { background: rgba(16,185,129,0.25); }
.btn-warning { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.btn-warning:hover { background: rgba(245,158,11,0.25); }
.btn-blue { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
.btn-blue:hover { background: rgba(59,130,246,0.25); }
.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
.btn-xs { padding: 4px 9px; font-size: 11px; border-radius: 6px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.form-input { width: 100%; padding: 10px 13px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'Cairo', sans-serif; font-size: 14px; transition: all 0.2s; outline: none; text-align: right; }
.form-input:focus { border-color: var(--primary-light); background: rgba(26,86,219,0.06); box-shadow: 0 0 0 3px rgba(26,86,219,0.1); }
.form-input.error { border-color: var(--danger); }
select { width: 100%; padding: 10px 13px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'Cairo', sans-serif; font-size: 14px; transition: all 0.2s; outline: none; text-align: right; }
select:focus { border-color: var(--primary-light); background: rgba(26,86,219,0.06); box-shadow: 0 0 0 3px rgba(26,86,219,0.1); }
select option { background: var(--dark-2); color: var(--text); }
.form-error { font-size: 11px; color: var(--danger); margin-top: 4px; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-success { background: rgba(16,185,129,0.15); color: #10b981; }
.badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; }
.badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
.badge-blue { background: rgba(59,130,246,0.15); color: #3b82f6; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: var(--dark-2); border: 1px solid var(--border); border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
.modal-header { padding: 22px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.modal-title { font-size: 17px; font-weight: 700; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; }
.close-btn { background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text-muted); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s; }
.close-btn:hover { background: rgba(239,68,68,0.15); color: var(--danger); }
.toast-container { position: fixed; bottom: 24px; left: 24px; z-index: 999; display: flex; flex-direction: column; gap: 10px; }
.toast { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; min-width: 260px; animation: slideIn 0.3s ease; border: 1px solid; }
.toast-success { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #10b981; }
.toast-error { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
.toast-warning { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: #f59e0b; }
.toast-info { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); color: #3b82f6; }
@keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.loader-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); z-index: 150; display: flex; align-items: center; justify-content: center; }
.spinner { width: 46px; height: 46px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--primary-light); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes warningPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); } }
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--dark); position: relative; overflow: hidden; }
.login-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(26,86,219,0.2) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(245,158,11,0.1) 0%, transparent 50%); }
.login-card { width: 100%; max-width: 420px; position: relative; z-index: 1; }
.login-logo { width: 70px; height: 70px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 16px; box-shadow: 0 8px 32px rgba(26,86,219,0.3); }

/* Worker Selector */
.worker-selector { background: var(--dark-2); border: 2px solid var(--border); border-radius: 20px; padding: 26px; margin-bottom: 26px; }
.worker-dropdown { position: relative; }
.worker-dropdown-btn { width: 100%; padding: 14px 18px; background: rgba(255,255,255,0.05); border: 2px solid var(--border); border-radius: 14px; color: var(--text); font-family: 'Cairo', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; text-align: right; }
.worker-dropdown-btn:hover, .worker-dropdown-btn.open { border-color: var(--primary-light); background: rgba(26,86,219,0.07); }
.worker-dropdown-menu { position: absolute; top: calc(100% + 8px); right: 0; left: 0; background: var(--dark-2); border: 1px solid var(--border); border-radius: 14px; z-index: 50; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); max-height: 300px; overflow-y: auto; }
.worker-dropdown-item { display: flex; align-items: center; gap: 14px; padding: 13px 18px; cursor: pointer; transition: all 0.15s; border-bottom: 1px solid var(--border); }
.worker-dropdown-item:last-child { border-bottom: none; }
.worker-dropdown-item:hover { background: rgba(26,86,219,0.1); }
.worker-dropdown-item.selected { background: rgba(26,86,219,0.15); }
.w-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }

/* Worker Detail */
.worker-detail { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.detail-header { background: linear-gradient(135deg, rgba(26,86,219,0.15), rgba(245,158,11,0.08)); border: 1px solid rgba(26,86,219,0.2); border-radius: 18px; padding: 22px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.detail-avatar { width: 68px; height: 68px; border-radius: 18px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; flex-shrink: 0; }
.detail-section { background: var(--card); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 18px; overflow: hidden; }
.detail-section-hdr { padding: 15px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.detail-section-title { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.detail-body { padding: 20px; }
.entries-tbl { width: 100%; border-collapse: collapse; }
.entries-tbl th { background: rgba(255,255,255,0.03); padding: 9px 13px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-align: right; border-bottom: 1px solid var(--border); }
.entries-tbl td { padding: 10px 13px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; font-weight: 500; }
.entries-tbl tr:last-child td { border-bottom: none; }
.entries-tbl tr:hover td { background: rgba(255,255,255,0.02); }
.net-card { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04)); border: 2px solid rgba(16,185,129,0.25); border-radius: 18px; padding: 22px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 16px; }
.net-amount { font-size: 36px; font-weight: 900; color: #10b981; }
.fuel-bar { height: 5px; background: var(--dark-3); border-radius: 3px; overflow: hidden; }
.fuel-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 3px; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.empty-icon { font-size: 52px; margin-bottom: 14px; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.hamburger { display: none; background: none; border: 1px solid var(--border); border-radius: 8px; padding: 8px; cursor: pointer; color: var(--text); }
.mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
.mobile-overlay.show { display: block; }
table { width: 100%; border-collapse: collapse; }
th { background: rgba(255,255,255,0.03); padding: 11px 14px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-align: right; border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid var(--border); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,0.02); }
.table-container { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.table-hdr { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }

@media (max-width: 768px) {
  .sidebar { transform: translateX(100%); } .sidebar.open { transform: translateX(0); }
  .main-content { margin-right: 0; } .hamburger { display: flex; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .form-grid-2 { grid-template-columns: 1fr; }
  .page-content { padding: 16px; } .topbar { padding: 12px 16px; }
  .net-amount { font-size: 26px; }
}
@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
@media print {
  .sidebar, .topbar, .no-print { display: none !important; }
  .main-content { margin-right: 0; }
  body { background: white; color: black; }
  .card, .detail-section, .net-card { background: white !important; border: 1px solid #ddd; }
}


/* ===== SALARY PAYMENT REPORT ===== */
.payment-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--border); transition: background .15s; }
.payment-row:last-child { border-bottom: none; }
.payment-row:hover { background: rgba(255,255,255,0.02); }
.payment-row.paid { background: rgba(16,185,129,0.04); }
.payment-worker-info { flex: 1; display: flex; align-items: center; gap: 12px; }
.payment-net { font-size: 17px; font-weight: 800; color: #10b981; min-width: 120px; text-align: left; }
.pay-btn { background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1)); border: 1px solid rgba(16,185,129,0.4); color: #10b981; padding: 8px 18px; border-radius: 10px; font-family: 'Cairo',sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s; white-space: nowrap; }
.pay-btn:hover { background: rgba(16,185,129,0.3); transform: translateY(-1px); }
.pay-btn.paid-btn { background: rgba(100,116,139,0.1); border-color: rgba(100,116,139,0.2); color: #64748b; cursor: default; }
.pay-btn.paid-btn:hover { transform: none; }
.paid-stamp { display: inline-flex; align-items: center; gap: 5px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.salary-summary-bar { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03)); border: 1px solid rgba(16,185,129,0.2); border-radius: 16px; padding: 18px 24px; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.progress-bar-wrap { height: 10px; background: rgba(255,255,255,0.07); border-radius: 5px; overflow: hidden; flex: 1; min-width: 120px; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 5px; transition: width .5s ease; }

/* ===== MONTH RESET ===== */
.month-reset-card { background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03)); border: 2px solid rgba(239,68,68,0.2); border-radius: 18px; padding: 22px 26px; }
.month-archive-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }

/* ===== ADMIN PANEL ===== */
.admin-wrap { max-width: 780px; margin: 0 auto; animation: fadeIn .3s ease; }
.admin-header { background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04)); border: 2px solid rgba(239,68,68,0.3); border-radius: 20px; padding: 26px 30px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; }
.admin-badge { background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
.announce-form { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 26px; margin-bottom: 22px; }
.announce-preview { background: linear-gradient(135deg, rgba(26,86,219,0.1), rgba(245,158,11,0.05)); border: 1px solid rgba(26,86,219,0.25); border-radius: 14px; padding: 18px 22px; margin: 16px 0; }
.owner-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.owner-row:last-child { border-bottom: none; }
.owner-row:hover { background: rgba(255,255,255,0.02); }
.admin-stat { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px 22px; text-align: center; }
.admin-tab { padding: 9px 20px; border-radius: 10px; border: 1px solid var(--border); background: none; color: var(--text-muted); font-family: 'Cairo',sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
.admin-tab.active { background: linear-gradient(135deg,rgba(26,86,219,0.25),rgba(26,86,219,0.1)); color: var(--primary-light); border-color: rgba(26,86,219,0.4); }

/* ===== OWNER PHONE BANNER ===== */
.owner-phone-banner { background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04)); border-bottom: 2px solid rgba(245,158,11,0.3); padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.owner-phone-banner-text { font-size: 13px; font-weight: 600; color: #f59e0b; display: flex; align-items: center; gap: 8px; }

/* ===== WHATSAPP NOTIFY ===== */
.wa-btn { display: inline-flex; align-items: center; gap: 7px; background: #25d366; color: white; border: none; padding: 7px 16px; border-radius: 9px; font-family: 'Cairo',sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s; white-space: nowrap; }
.wa-btn:hover { background: #1da851; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
.wa-btn-sm { padding: 5px 11px; font-size: 11px; border-radius: 7px; }

/* ===== NOTIFICATION BELL ===== */
.notif-bell-wrap { position: relative; }
.notif-bell-btn { position: relative; width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s; color: var(--text); }
.notif-bell-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--primary-light); }
.notif-bell-btn.has-notif { animation: bellShake 3s ease-in-out infinite; }
@keyframes bellShake { 0%,85%,100%{transform:rotate(0)} 87%{transform:rotate(-9deg)} 89%{transform:rotate(9deg)} 91%{transform:rotate(-6deg)} 93%{transform:rotate(5deg)} 95%{transform:rotate(-3deg)} }
.notif-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; min-width: 18px; height: 18px; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid var(--dark-2); animation: popIn .3s cubic-bezier(.175,.885,.32,1.275); }
@keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }
.notif-dropdown { position: absolute; top: calc(100% + 10px); left: 0; width: 340px; background: var(--dark-2); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 300; overflow: hidden; animation: fadeIn .2s ease; }
@media(max-width:480px){ .notif-dropdown { right: -60px; left: auto; width: 290px; } }
.notif-hdr { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.notif-hdr-title { font-size: 14px; font-weight: 700; }
.notif-clear-btn { font-size: 11px; color: var(--text-muted); background: none; border: none; cursor: pointer; font-family: 'Cairo',sans-serif; padding: 3px 8px; border-radius: 6px; transition: all .2s; }
.notif-clear-btn:hover { background: rgba(255,255,255,0.07); color: var(--text); }
.notif-list { max-height: 400px; overflow-y: auto; }
.notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background .15s; }
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: rgba(255,255,255,0.04); }
.notif-item.unread { background: rgba(26,86,219,0.06); }
.notif-item.unread:hover { background: rgba(26,86,219,0.1); }
.notif-item.clickable:hover { background: rgba(59,130,246,0.1); }
.notif-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
.notif-icon-wrap.type-warning { background: rgba(245,158,11,0.15); }
.notif-icon-wrap.type-info { background: rgba(59,130,246,0.15); }
.notif-icon-wrap.type-success { background: rgba(16,185,129,0.15); }
.notif-icon-wrap.type-danger { background: rgba(239,68,68,0.15); }
.notif-text { flex: 1; min-width: 0; }
.notif-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
.notif-sub { font-size: 11px; color: var(--text-muted); line-height: 1.5; }
.notif-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; }
.notif-nav-hint { font-size: 10px; color: var(--primary-light); margin-top: 3px; opacity: 0.8; }
.notif-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--primary-light); flex-shrink: 0; margin-top: 5px; }
.notif-empty { padding: 36px 20px; text-align: center; color: var(--text-muted); font-size: 13px; }
.notif-empty-icon { font-size: 36px; margin-bottom: 10px; }

/* ===== TRIAL BANNER ===== */
.trial-banner { background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04)); border-bottom: 1px solid rgba(245,158,11,0.25); padding: 9px 28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.trial-banner-text { font-size: 13px; font-weight: 600; color: #f59e0b; display: flex; align-items: center; gap: 8px; }
.trial-days-badge { background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.4); padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; color: #f59e0b; }
.trial-days-badge.urgent { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); color: #ef4444; animation: urgentPulse 1.5s ease-in-out infinite; }
@keyframes urgentPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }

/* ===== EXPIRED / PRICING SCREEN ===== */
.expired-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--dark); position: relative; overflow-y: auto; padding: 30px 20px; }
.expired-screen::before { content:''; position:fixed; inset:0; background: radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(245,158,11,0.07) 0%, transparent 50%); pointer-events:none; z-index:0; }
.pricing-wrap { width: 100%; max-width: 1000px; position: relative; z-index: 1; }
.pricing-header { text-align: center; margin-bottom: 40px; }
.pricing-icon { width: 70px; height: 70px; background: linear-gradient(135deg, #ef4444, #f59e0b); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 18px; box-shadow: 0 8px 32px rgba(239,68,68,0.3); }
.pricing-title { font-size: 28px; font-weight: 900; margin-bottom: 10px; }
.pricing-sub { font-size: 14px; color: var(--text-muted); line-height: 1.8; max-width: 500px; margin: 0 auto; }
.plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 28px; }
@media(max-width:900px){ .plans-grid { grid-template-columns: repeat(2,1fr); } }
@media(max-width:540px){ .plans-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto 28px; } }
.plan-card { background: var(--card); border: 2px solid var(--border); border-radius: 20px; padding: 26px 22px; display: flex; flex-direction: column; position: relative; transition: all 0.3s; }
.plan-card:hover { transform: translateY(-4px); background: var(--card-hover); }
.plan-card.popular { border-color: var(--primary-light); background: linear-gradient(160deg, rgba(26,86,219,0.1), rgba(26,86,219,0.03)); box-shadow: 0 0 0 1px rgba(59,130,246,0.2), 0 20px 40px rgba(26,86,219,0.12); }
.plan-card.gold { border-color: rgba(245,158,11,0.5); background: linear-gradient(160deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02)); }
.popular-badge { position: absolute; top: -13px; right: 50%; transform: translateX(50%); background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; font-size: 11px; font-weight: 800; padding: 4px 16px; border-radius: 20px; white-space: nowrap; letter-spacing: 0.3px; }
.plan-emoji { font-size: 32px; margin-bottom: 10px; }
.plan-name { font-size: 19px; font-weight: 800; margin-bottom: 4px; }
.plan-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.6; }
.plan-price { font-size: 40px; font-weight: 900; line-height: 1; color: var(--text); }
.plan-price sup { font-size: 16px; font-weight: 700; color: var(--text-muted); vertical-align: super; }
.plan-price sub { font-size: 14px; font-weight: 600; color: var(--text-muted); }
.plan-period { font-size: 11px; color: var(--text-muted); margin-top: 4px; margin-bottom: 18px; }
.plan-divider { height: 1px; background: var(--border); margin: 14px 0; }
.plan-features { flex: 1; display: flex; flex-direction: column; gap: 2px; margin-bottom: 20px; }
.plan-feature { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; padding: 5px 0; }
.plan-feature.yes { color: var(--text); }
.plan-feature.no { color: var(--text-muted); opacity: 0.45; }
.feat-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
.plan-card.lifetime { border-color: rgba(168,85,247,0.6); background: linear-gradient(160deg, rgba(168,85,247,0.12), rgba(168,85,247,0.03)); box-shadow: 0 0 0 1px rgba(168,85,247,0.2), 0 20px 40px rgba(168,85,247,0.12); }
.plan-card.lifetime:hover { box-shadow: 0 0 0 1px rgba(168,85,247,0.4), 0 24px 50px rgba(168,85,247,0.2); }
.plan-card.free { border-color: rgba(16,185,129,0.4); background: linear-gradient(160deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02)); }
.plan-card.free:hover { box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 20px 40px rgba(16,185,129,0.1); }
.free-badge { position: absolute; top: -10px; right: 18px; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; }
.lifetime-badge { position: absolute; top: -13px; right: 50%; transform: translateX(50%); background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-size: 11px; font-weight: 800; padding: 4px 16px; border-radius: 20px; white-space: nowrap; letter-spacing: 0.3px; }
.btn-lifetime { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; }
.btn-lifetime:hover { background: linear-gradient(135deg, #6d28d9, #9333ea); transform: translateY(-1px); box-shadow: 0 4px 15px rgba(124,58,237,0.4); }
.contact-strip p { color: var(--text-muted); font-size: 13px; margin-bottom: 14px; line-height: 1.7; }
.whatsapp-btn { display: inline-flex; align-items: center; gap: 10px; background: #25d366; color: white; padding: 13px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; font-family: 'Cairo',sans-serif; transition: all 0.2s; text-decoration: none; box-shadow: 0 4px 15px rgba(37,211,102,0.3); }
.whatsapp-btn:hover { background: #1da851; transform: translateY(-1px); }
`;

// ==================== DATA ====================
const WORK_PLACES = ['الطرمبة 1', 'الطرمبة 2', 'الطرمبة 3', 'الطرمبة 4', 'المكتب', 'الورشة', 'البوابة'];

const MOCK_WORKERS = [
  { id: 1, name: 'أحمد محمد علي', pump: 'طرمبة 1', workDays: 26, salary: 3500, avatar: 'أ',
    delays: [{ id: 1, date: '2025-02-03', minutes: 30, deduction: 25 }, { id: 2, date: '2025-02-11', minutes: 45, deduction: 37 }],
    absences: [{ id: 1, date: '2025-02-07', reason: 'مرض', deduction: 116 }],
    absences_no_reason: [{ id: 1, date: '2025-02-08', deduction: 50 }, { id: 2, date: '2025-02-15', deduction: 75 }],
    discipline: [{ id: 1, date: '2025-02-10', stars: 5, reward: 100 }, { id: 2, date: '2025-02-20', stars: 4, reward: 80 }] },
  { id: 2, name: 'محمود إبراهيم', pump: 'طرمبة 2', workDays: 28, salary: 3500, avatar: 'م', 
    delays: [], absences: [],
    absences_no_reason: [],
    discipline: [{ id: 1, date: '2025-02-12', stars: 5, reward: 100 }] },
  { id: 3, name: 'عبد الله حسن', pump: 'طرمبة 3', workDays: 24, salary: 3500, avatar: 'ع',
    delays: [{ id: 1, date: '2025-02-05', minutes: 60, deduction: 50 }, { id: 2, date: '2025-02-18', minutes: 20, deduction: 16 }, { id: 3, date: '2025-02-22', minutes: 90, deduction: 75 }],
    absences: [{ id: 1, date: '2025-02-10', reason: 'ظروف شخصية', deduction: 116 }, { id: 2, date: '2025-02-15', reason: 'مرض', deduction: 116 }],
    absences_no_reason: [{ id: 1, date: '2025-02-25', deduction: 60 }],
    discipline: [{ id: 1, date: '2025-02-14', stars: 3, reward: 50 }] },
  { id: 5, name: 'سامي خالد', pump: 'طرمبة 2', workDays: 25, salary: 3800, avatar: 'س',
    delays: [{ id: 1, date: '2025-02-01', minutes: 40, deduction: 32 }, { id: 2, date: '2025-02-14', minutes: 25, deduction: 20 }],
    absences: [{ id: 1, date: '2025-02-20', reason: 'إجازة طارئة', deduction: 126 }],
    absences_no_reason: [],
    discipline: [{ id: 1, date: '2025-02-17', stars: 4, reward: 80 }] },
  { id: 6, name: 'حسام الدين', pump: 'طرمبة 4', workDays: 28, salary: 3800, avatar: 'ح', 
    delays: [], absences: [],
    absences_no_reason: [{ id: 1, date: '2025-02-21', deduction: 90 }],
    discipline: [{ id: 1, date: '2025-02-16', stars: 5, reward: 100 }] },
];

// مسح الداتا القديمة المشتركة (مرة واحدة عند التحديث)
if (!localStorage.getItem('app_v2_clean')) {
  ['users_data', 'workers_data', 'workplaces_data'].forEach(k => localStorage.removeItem(k));
  localStorage.setItem('app_v2_clean', '1');
}

// حسابات افتراضية - فارغة
const DEFAULT_USERS = [];

// ==================== UTILS ====================
const totalDed = (w) => [...w.delays, ...w.absences, ...(w.absences_no_reason || [])].reduce((s, e) => s + (e.deduction || 0), 0);
const totalRewards = (w) => ((w.discipline || []).reduce((s, e) => s + (e.reward || 0), 0));
const totalCash = (w) => ((w.cash_withdrawals || []).reduce((s, e) => s + (e.amount || 0), 0));
const calcNet = (w) => w.salary - totalDed(w) + totalRewards(w) - totalCash(w);
const fmt = (n) => `${Number(n).toLocaleString('ar-EG')} ج.م`;

// إرسال Browser Notification للعامل
const sendWorkerNotification = (workerName, type, amount, net) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const typeLabels = {
    delay:             'تأخير',
    absence:           'غياب',
    absence_no_reason: 'عجز / غياب بدون سبب',
    cash:              'سحب نقدي',
  };
  const label = typeLabels[type] || type;
  const title = `💸 تنبيه مالي — ${workerName}`;
  const body  = `تم خصم ${fmt(amount)} بسبب ${label}\nصافي الراتب المتبقي: ${fmt(net)}`;
  new Notification(title, { body, icon: '/favicon.ico' });
};

// ==================== WHATSAPP NOTIFY ====================
const sendWhatsAppNotify = (worker, type, entry) => {
  if (!worker.phone) return;
  const typeLabels = {
    delay:             'تأخير',
    absence:           'غياب',
    absence_no_reason: 'عجز / غياب بدون سبب',
    cash:              'سحب نقدي',
    discipline:        'مكافأة انضباط',
  };
  const label = typeLabels[type] || type;
  const amount = entry.deduction || entry.amount || entry.reward || 0;
  const net = calcNet(worker);
  const isPositive = type === 'discipline';

  let msg = '⛽ محطة بترومين\n';
  msg += '─────────────────\n';
  msg += 'مرحباً يا ' + worker.name + ' 👋\n\n';
  if (isPositive) {
    msg += '🎉 تم تسجيل مكافأة انضباط بتاريخ ' + entry.date + '\n';
    msg += '💰 المكافأة: +' + amount + ' ج.م\n';
  } else {
    msg += '⚠️ تم تسجيل ' + label + ' بتاريخ ' + entry.date + '\n';
    if (type === 'delay') msg += '⏰ المدة: ' + entry.minutes + ' دقيقة\n';
    if (type === 'absence') msg += '📝 السبب: ' + entry.reason + '\n';
    msg += '💸 الخصم: -' + amount + ' ج.م\n';
  }
  msg += '─────────────────\n';
  msg += '💵 صافي راتبك المتبقي: ' + fmt(net) + '\n';
  msg += '─────────────────\n';
  msg += 'للاستفسار تواصل مع المالك مباشرة.';

  const phone = worker.phone.startsWith('0') ? '2' + worker.phone : worker.phone;
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
};

// ==================== MONTH ARCHIVE UTILS ====================
const getMonthArchives = (ownerId) => {
  try { return JSON.parse(localStorage.getItem('owner_' + ownerId + '_month_archives') || '[]'); } catch { return []; }
};
const saveMonthArchives = async (ownerId, list) => {
  localStorage.setItem('owner_' + ownerId + '_month_archives', JSON.stringify(list));
  try { await setDoc(doc(db, 'owners', ownerId, 'meta', 'monthArchives'), { list }); } catch {}
};

// ==================== SALARY PAYMENT UTILS ====================
const getPaymentRecords = (ownerId) => {
  try { return JSON.parse(localStorage.getItem('owner_' + ownerId + '_payments') || '[]'); } catch { return []; }
};
const savePaymentRecords = async (ownerId, list) => {
  localStorage.setItem('owner_' + ownerId + '_payments', JSON.stringify(list));
  try { await setDoc(doc(db, 'owners', ownerId, 'meta', 'payments'), { list }); } catch {}
};

// التحقق من الأرقام المُدخلة: بين 0 و 1,000,000
const validateNum = (val, label) => {
  const n = Number(val);
  if (val === '' || val === null || val === undefined) return `${label} مطلوب`;
  if (isNaN(n)) return `${label} يجب أن يكون رقماً`;
  if (n < 0) return `${label} لا يمكن أن يكون أقل من 0`;
  if (n > 1000000) return `${label} لا يمكن أن يتجاوز 1,000,000`;
  return '';
};

// مفاتيح localStorage الخاصة بكل مالك
// ==================== FIRESTORE UTILS ====================
const ownerDoc  = (ownerId)          => doc(db, 'owners', ownerId);
const subDoc    = (ownerId, col, id) => doc(db, 'owners', ownerId, col, id);
const subCol    = (ownerId, col)     => collection(db, 'owners', ownerId, col);

// ── الدوال دي بتستخدم localStorage كـ cache سريع + بتحفظ في Firestore في الخلفية ──
// عشان كده الكود القديم اللي بيستدعيها sync هيشتغل عادي

const _lsKey = (ownerId, type) => `owner_${ownerId}_${type}`;

// Invites
const getInvites = (ownerId) => {
  try { return JSON.parse(localStorage.getItem(_lsKey(ownerId,'invites')) || '[]'); } catch { return []; }
};
const saveInvites = async (ownerId, list) => {
  localStorage.setItem(_lsKey(ownerId,'invites'), JSON.stringify(list));
  try { await setDoc(doc(db,'owners',ownerId,'meta','invites'), { list }); } catch {}
};
// مزامنة من Firestore للـ cache
const syncInvites = async (ownerId) => {
  try {
    const d = await getDoc(doc(db,'owners',ownerId,'meta','invites'));
    if (d.exists()) localStorage.setItem(_lsKey(ownerId,'invites'), JSON.stringify(d.data().list || []));
  } catch {}
};


// ==================== TOAST ====================
let tid = 0;
const ToastCtx = createContext(null);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++tid; setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}><span style={{ fontWeight: 800, fontSize: 16 }}>{icons[t.type]}</span>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => useContext(ToastCtx);

// ==================== LOADER ====================
const Loader = () => <div className="loader-overlay"><div className="spinner" /></div>;

// ==================== CONFIRM ====================
const ConfirmModal = ({ message, onConfirm, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" style={{ maxWidth: 400, animation: 'fadeIn .2s ease' }}>
      <div className="modal-header"><div className="modal-title">⚠️ تأكيد</div><button className="close-btn" onClick={onClose}>×</button></div>
      <div className="modal-body"><p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8 }}>{message}</p></div>
      <div className="modal-footer">
        <button className="btn btn-danger" onClick={onConfirm}>✓ تأكيد</button>
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
      </div>
    </div>
  </div>
);

// ==================== WORK PLACES MANAGER ====================
const WorkPlacesManager = ({ workPlaces, onAdd, onEdit, onDelete, onClose }) => {
  const [newPlace, setNewPlace] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const handleAdd = () => {
    if (newPlace.trim()) { onAdd(newPlace.trim()); setNewPlace(''); }
  };

  const handleEdit = (id, value) => {
    if (value.trim()) { onEdit(id, value.trim()); setEditId(null); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header"><div className="modal-title">🏢 إدارة أماكن العمل</div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">إضافة مكان عمل جديد</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" className="form-input" placeholder="أدخل مكان العمل" value={newPlace} onChange={e => setNewPlace(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdd()} />
              <button className="btn btn-primary btn-sm" onClick={handleAdd}>➕</button>
            </div>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {workPlaces.map((place, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                {editId === idx ? (
                  <>
                    <input type="text" className="form-input" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-success btn-xs" onClick={() => handleEdit(idx, editValue)}>✓</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 500 }}>{place}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => { setEditId(idx); setEditValue(place); }}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => onDelete(idx)}>🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>💾 حفظ وإغلاق</button></div>
      </div>
    </div>
  );
};

// ==================== WORKER MODAL ====================
const WorkerModal = ({ worker, onSave, onClose }) => {
  const [form, setForm] = useState(worker || { name: '', pump: '', workDays: '', salary: '', phone: '' });
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.pump.trim()) e.pump = 'مكان العمل مطلوب';
    const wdErr = validateNum(form.workDays, 'أيام العمل');
    if (wdErr) e.workDays = wdErr;
    const salErr = validateNum(form.salary, 'الراتب');
    if (salErr) e.salary = salErr;
    return e;
  };
  const submit = (e) => {
    e.preventDefault(); const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, workDays: +form.workDays, salary: +form.salary, phone: form.phone || '', id: worker?.id || Date.now(), avatar: form.name[0] || '؟', delays: worker?.delays || [], absences: worker?.absences || [], absences_no_reason: worker?.absences_no_reason || [], discipline: worker?.discipline || [] });
    toast(worker ? 'تم تعديل البيانات' : 'تمت الإضافة', 'success');
  };
  const f = k => ({ value: form[k] || '', onChange: e => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); }, className: `form-input ${errors[k] ? 'error' : ''}` });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ animation: 'fadeIn .2s ease' }}>
        <div className="modal-header"><div className="modal-title">{worker ? '✏️ تعديل العامل' : '➕ إضافة عامل جديد'}</div><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">الاسم الكامل</label><input placeholder="أدخل الاسم" {...f('name')} />{errors.name && <div className="form-error">{errors.name}</div>}</div>
              <div className="form-group"><label className="form-label">مكان العمل</label><input type="text" placeholder="مثال: الطرمبة 1، المكتب..." {...f('pump')} />{errors.pump && <div className="form-error">{errors.pump}</div>}</div>
              <div className="form-group"><label className="form-label">أيام العمل</label><input type="number" min="0" max="1000000" placeholder="28" {...f('workDays')} />{errors.workDays && <div className="form-error">{errors.workDays}</div>}</div>
              <div className="form-group"><label className="form-label">الراتب (ج.م)</label><input type="number" min="0" max="1000000" placeholder="3500" {...f('salary')} />{errors.salary && <div className="form-error">{errors.salary}</div>}</div>
            </div>
            <div className="form-group"><label className="form-label">📱 رقم التليفون</label><input type="tel" placeholder="مثال: 01012345678" maxLength={11} onInput={e => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11); }} {...f('phone')} /></div>
          </div>
          <div className="modal-footer"><button type="submit" className="btn btn-primary">💾 حفظ</button><button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button></div>
        </form>
      </div>
    </div>
  );
};

// ==================== ENTRY MODAL ====================
const TODAY = new Date().toISOString().split('T')[0];
const EntryModal = ({ type, onSave, onClose }) => {
  const isDelay = type === 'delay';
  const [form, setForm] = useState({ date: '', minutes: '', reason: '', deduction: '' });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'التاريخ مطلوب';
    if (isDelay) { const err = validateNum(form.minutes, 'الدقائق'); if (err) e.minutes = err; }
    if (!isDelay && !form.reason.trim()) e.reason = 'السبب مطلوب';
    const dedErr = validateNum(form.deduction, 'قيمة الخصم'); if (dedErr) e.deduction = dedErr;
    return e;
  };
  const submit = (e) => {
    e.preventDefault(); const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: Date.now(), date: form.date, ...(isDelay ? { minutes: +form.minutes } : { reason: form.reason }), deduction: +form.deduction });
  };
  const f = k => ({ value: form[k], onChange: e => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); }, className: `form-input ${errors[k] ? 'error' : ''}` });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header"><div className="modal-title">{isDelay ? '⏰ إضافة تأخير' : '❌ إضافة غياب'}</div><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">التاريخ</label><input type="date" max={TODAY} {...f('date')} />{errors.date && <div className="form-error">{errors.date}</div>}</div>
            {isDelay
              ? <div className="form-group"><label className="form-label">مدة التأخير (دقيقة)</label><input type="number" min="0" max="1000000" placeholder="30" {...f('minutes')} />{errors.minutes && <div className="form-error">{errors.minutes}</div>}</div>
              : <div className="form-group"><label className="form-label">سبب الغياب</label><input placeholder="مرض / ظروف شخصية..." {...f('reason')} />{errors.reason && <div className="form-error">{errors.reason}</div>}</div>}
            <div className="form-group"><label className="form-label">قيمة الخصم (ج.م)</label><input type="number" min="0" max="1000000" placeholder="50" {...f('deduction')} />{errors.deduction && <div className="form-error">{errors.deduction}</div>}</div>
          </div>
          <div className="modal-footer"><button type="submit" className="btn btn-primary">➕ إضافة</button><button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button></div>
        </form>
      </div>
    </div>
  );
};

// ==================== ABSENCE NO REASON MODAL (العجز) ====================
const AbsenceNoReasonModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ date: '', deduction: '' });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'التاريخ مطلوب';
    const dedErr = validateNum(form.deduction, 'قيمة العجز'); if (dedErr) e.deduction = dedErr;
    return e;
  };
  const submit = (e) => {
    e.preventDefault(); const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: Date.now(), date: form.date, deduction: +form.deduction });
  };
  const f = k => ({ value: form[k], onChange: e => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); }, className: `form-input ${errors[k] ? 'error' : ''}` });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header"><div className="modal-title">📦 إضافة عجز</div><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">التاريخ</label><input type="date" max={TODAY} {...f('date')} />{errors.date && <div className="form-error">{errors.date}</div>}</div>
            <div className="form-group"><label className="form-label">قيمة العجز / الخصم (ج.م)</label><input type="number" min="0" max="1000000" placeholder="50" {...f('deduction')} />{errors.deduction && <div className="form-error">{errors.deduction}</div>}</div>
          </div>
          <div className="modal-footer"><button type="submit" className="btn btn-primary">➕ إضافة</button><button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button></div>
        </form>
      </div>
    </div>
  );
};

// ==================== DISCIPLINE MODAL ====================
const DisciplineModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ date: '', stars: '5', reward: '' });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'التاريخ مطلوب';
    if (!form.stars || isNaN(form.stars) || +form.stars < 1 || +form.stars > 5) e.stars = 'النجوم يجب أن تكون من 1 إلى 5';
    const rewErr = validateNum(form.reward, 'قيمة الحافز'); if (rewErr) e.reward = rewErr;
    return e;
  };
  const submit = (e) => {
    e.preventDefault(); const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: Date.now(), date: form.date, stars: +form.stars, reward: +form.reward });
  };
  const f = k => ({ value: form[k], onChange: e => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); }, className: `form-input ${errors[k] ? 'error' : ''}` });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header"><div className="modal-title">⭐ إضافة انضباط يومي</div><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">التاريخ</label><input type="date" max={TODAY} {...f('date')} />{errors.date && <div className="form-error">{errors.date}</div>}</div>
            <div className="form-group"><label className="form-label">عدد النجوم (1-5)</label><input type="number" min="1" max="5" placeholder="5" {...f('stars')} />{errors.stars && <div className="form-error">{errors.stars}</div>}</div>
            <div className="form-group"><label className="form-label">قيمة الحافز (ج.م)</label><input type="number" min="0" max="1000000" placeholder="100" {...f('reward')} />{errors.reward && <div className="form-error">{errors.reward}</div>}</div>
          </div>
          <div className="modal-footer"><button type="submit" className="btn btn-primary">➕ إضافة</button><button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button></div>
        </form>
      </div>
    </div>
  );
};

// ==================== CASH WITHDRAWAL MODAL ====================
const CashWithdrawalModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ date: '', amount: '', note: '' });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'التاريخ مطلوب';
    const amtErr = validateNum(form.amount, 'المبلغ'); if (amtErr) e.amount = amtErr;
    if (+form.amount === 0) e.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    return e;
  };
  const submit = (ev) => {
    ev.preventDefault(); const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: Date.now(), date: form.date, amount: +form.amount, note: form.note.trim() });
  };
  const f = k => ({ value: form[k], onChange: e => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); }, className: `form-input ${errors[k] ? 'error' : ''}` });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header">
          <div className="modal-title">💵 تسجيل سحب نقدي</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">التاريخ</label>
              <input type="date" max={TODAY} {...f('date')} />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">المبلغ المسحوب (ج.م)</label>
              <input type="number" min="1" max="1000000" placeholder="مثال: 500" {...f('amount')} />
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظة (اختياري)</label>
              <input placeholder="مثال: سلفة — إيجار — طوارئ..." {...f('note')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">💾 تسجيل</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== WORKER DETAIL ====================
const WorkerDetail = ({ worker, onUpdate, isWorkerView = false, canEdit = true }) => {
  const toast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: worker.name, pump: worker.pump, workDays: worker.workDays, salary: worker.salary, phone: worker.phone || '' });
  const [entryModal, setEntryModal] = useState(null);
  const [absenceNoReasonModal, setAbsenceNoReasonModal] = useState(false);
  const [disciplineModal, setDisciplineModal] = useState(false);
  const [cashModal, setCashModal] = useState(false);
  const [delEntry, setDelEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  const w = worker;
  const ded = totalDed(w);
  const net = calcNet(w);

  const saveEdit = async () => {
    if (isWorkerView) {
      if (!editForm.name.trim()) { toast('الاسم مطلوب', 'error'); return; }
      setLoading(true); await new Promise(r => setTimeout(r, 500));
      onUpdate({ ...w, name: editForm.name });
      setEditMode(false); setLoading(false); toast('تم حفظ اسمك ✓', 'success');
    } else {
      if (!editForm.name.trim() || !editForm.pump || !editForm.workDays || !editForm.salary) { toast('يرجى ملء جميع الحقول', 'error'); return; }
      setLoading(true); await new Promise(r => setTimeout(r, 500));
      onUpdate({ ...w, ...editForm, workDays: +editForm.workDays, salary: +editForm.salary });
      setEditMode(false); setLoading(false); toast('تم حفظ التعديلات ✓', 'success');    }
  };

  const addEntry = async (type, entry) => {
    setLoading(true); await new Promise(r => setTimeout(r, 400));
    let updatedWorker = w;
    if (type === 'delay') updatedWorker = { ...w, delays: [...w.delays, entry] };
    else if (type === 'absence') updatedWorker = { ...w, absences: [...w.absences, entry] };
    else if (type === 'absence_no_reason') updatedWorker = { ...w, absences_no_reason: [...(w.absences_no_reason || []), entry] };
    else if (type === 'discipline') updatedWorker = { ...w, discipline: [...(w.discipline || []), entry] };
    else if (type === 'cash') updatedWorker = { ...w, cash_withdrawals: [...(w.cash_withdrawals || []), entry] };
    onUpdate(updatedWorker);

    // إرسال Browser Notification للعامل لو في خصم أو سحب
    if (['delay', 'absence', 'absence_no_reason', 'cash'].includes(type)) {
      const amount = entry.deduction || entry.amount || 0;
      const net = calcNet(updatedWorker);
      sendWorkerNotification(w.name, type, amount, net);
    }

    setEntryModal(null); setAbsenceNoReasonModal(false); setDisciplineModal(false); setCashModal(false); setLoading(false);
    // لو العامل عنده تليفون — اعرض toast بزرار واتساب
    if (updatedWorker.phone && ['delay','absence','absence_no_reason','cash','discipline'].includes(type)) {
      const amount = entry.deduction || entry.amount || entry.reward || 0;
      toast('تم الإضافة ✓ — ' + (updatedWorker.phone ? 'يمكنك إبلاغ العامل عبر واتساب' : ''), 'success');
      // حفظ entry الأخيرة عشان يبعتها لو ضغط الزرار
      window.__lastWaEntry = { worker: updatedWorker, type, entry };
    } else {
      toast('تم الإضافة ✓', 'success');
    }
  };

  const removeEntry = async (type, id) => {
    setLoading(true); await new Promise(r => setTimeout(r, 400));
    if (type === 'delay') onUpdate({ ...w, delays: w.delays.filter(d => d.id !== id) });
    else if (type === 'absence') onUpdate({ ...w, absences: w.absences.filter(a => a.id !== id) });
    else if (type === 'absence_no_reason') onUpdate({ ...w, absences_no_reason: w.absences_no_reason.filter(a => a.id !== id) });
    else if (type === 'discipline') onUpdate({ ...w, discipline: w.discipline.filter(d => d.id !== id) });
    else if (type === 'cash') onUpdate({ ...w, cash_withdrawals: (w.cash_withdrawals || []).filter(c => c.id !== id) });
    setDelEntry(null); setLoading(false); toast('تم الحذف', 'success');
  };

  const ef = k => ({ value: editForm[k], onChange: e => setEditForm({ ...editForm, [k]: e.target.value }), className: 'form-input' });

  const absNoReasonDed = (w.absences_no_reason || []).reduce((s, a) => s + (a.deduction || 0), 0);

  return (
    <div className="worker-detail">
      {loading && <Loader />}
      {entryModal && <EntryModal type={entryModal} onSave={entry => addEntry(entryModal, entry)} onClose={() => setEntryModal(null)} />}
      {absenceNoReasonModal && <AbsenceNoReasonModal onSave={entry => addEntry('absence_no_reason', entry)} onClose={() => setAbsenceNoReasonModal(false)} />}
      {disciplineModal && <DisciplineModal onSave={entry => addEntry('discipline', entry)} onClose={() => setDisciplineModal(false)} />}
      {cashModal && <CashWithdrawalModal onSave={entry => addEntry('cash', entry)} onClose={() => setCashModal(false)} />}
      {delEntry && <ConfirmModal message="هل تريد حذف هذا السجل نهائياً؟" onConfirm={() => removeEntry(delEntry.type, delEntry.id)} onClose={() => setDelEntry(null)} />}

      {/* Header */}
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="detail-avatar">{w.avatar}</div>
          <div>
            {editMode
              ? <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, padding: '7px 12px' }} />
              : <div style={{ fontSize: 21, fontWeight: 800 }}>{w.name}</div>}
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{w.pump} · عامل في المحطة</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEdit && (editMode ? (
            <><button className="btn btn-success btn-sm" onClick={saveEdit}>💾 حفظ</button><button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(false); setEditForm({ name: w.name, pump: w.pump, workDays: w.workDays, salary: w.salary }); }}>إلغاء</button></>
          ) : (
            <button className="btn btn-accent btn-sm" onClick={() => setEditMode(true)}>✏️ تعديل</button>
          ))}
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateReport(w); toast('جاري التحميل', 'info'); }}>📄{!planHasExcelAdv(getPlan()) && '🔒'}</button>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️</button>
        </div>
      </div>

      {/* Basic Info */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr"><div className="detail-section-title">⚙️ البيانات الأساسية</div></div>
        <div className="detail-body">
          <div className="form-grid-2" style={{ gap: 16 }}>
            <div>
              <div className="form-label">مكان العمل</div>
              {editMode
                ? <input type="text" {...ef('pump')} placeholder="مثال: الطرمبة 1، المكتب، الورشة" />
                : <span className="badge badge-blue" style={{ fontSize: 13, padding: '5px 14px' }}>{w.pump}</span>}
            </div>
            <div>
              <div className="form-label">أيام العمل</div>
              {editMode ? <input type="number" min="0" max="1000000" {...ef('workDays')} /> : <span style={{ fontWeight: 700, fontSize: 16 }}>{w.workDays} يوم</span>}
            </div>
            <div>
              <div className="form-label">الراتب الأساسي</div>
              {editMode ? <input type="number" min="0" max="1000000" {...ef('salary')} /> : <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{fmt(w.salary)}</span>}
            </div>
            <div>
              <div className="form-label">إجمالي الخصومات</div>
              <span style={{ fontWeight: 700, fontSize: 16, color: ded > 0 ? '#ef4444' : 'var(--text-muted)' }}>{ded > 0 ? `-${fmt(ded)}` : 'لا يوجد'}</span>
            </div>
            <div>
              <div className="form-label">📱 رقم التليفون</div>
              {editMode
                ? <input type="tel" {...ef('phone')} placeholder="01012345678" maxLength={11} onInput={e => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11); }} />
                : <span style={{ fontWeight: 600, fontSize: 15, color: w.phone ? 'var(--text)' : 'var(--text-muted)' }}>{w.phone || '—'}</span>}
            </div>
          </div>
        </div>
      </div>}

      {/* Delays */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">⏰ التأخيرات <span className="badge badge-warning">{w.delays.length} مرة</span></div>
          <button className="btn btn-warning btn-sm no-print" onClick={() => setEntryModal('delay')}>➕ إضافة تأخير</button>
        </div>
        {w.delays.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد تأخيرات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المدة</th><th>الخصم</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.delays.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{d.minutes} دقيقة</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(d.deduction)}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'delay', id: d.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w, delays:[...w.delays]}, 'delay', d)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم التأخيرات</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.delays.reduce((s, d) => s + d.deduction, 0))}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* Absences */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">❌ الغيابات <span className="badge badge-danger">{w.absences.length} يوم</span></div>
          <button className="btn btn-danger btn-sm no-print" onClick={() => setEntryModal('absence')}>➕ إضافة غياب</button>
        </div>
        {w.absences.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد غيابات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>السبب</th><th>الخصم</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.absences.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td><span className="badge badge-danger">{a.reason}</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'absence', id: a.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w}, 'absence', a)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم الغياب</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.absences.reduce((s, a) => s + a.deduction, 0))}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* العجز - FIX: now shows deduction not reward */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">📦 العجز <span className="badge badge-danger">{(w.absences_no_reason || []).length} مرة</span></div>
          <button className="btn btn-blue btn-sm no-print" onClick={() => setAbsenceNoReasonModal(true)}>➕ إضافة عجز</button>
        </div>
        {(!w.absences_no_reason || w.absences_no_reason.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد عجز مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>قيمة العجز</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.absences_no_reason.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'absence_no_reason', id: a.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w}, 'absence_no_reason', a)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصومات العجز</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(absNoReasonDed)}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* Discipline */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">⭐ الانضباط اليومي <span className="badge badge-warning">{(w.discipline || []).length} مرة</span></div>
          <button className="btn btn-warning btn-sm no-print" onClick={() => setDisciplineModal(true)}>➕ إضافة انضباط</button>
        </div>
        {(!w.discipline || w.discipline.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سجل انضباط</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>النجوم</th><th>الحوافز</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.discipline.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{'⭐'.repeat(d.stars)}</span></td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(d.reward)}</td>
                    <td className="no-print"><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'discipline', id: d.id })}>🗑️ حذف</button></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي مكافآت الانضباط</td>
                  <td style={{ fontWeight: 800, color: '#10b981' }}>+{fmt((w.discipline || []).reduce((s, d) => s + d.reward, 0))}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* السحب النقدي */}
      {!isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{(w.cash_withdrawals || []).length} مرة</span></div>
          <button className="btn btn-primary btn-sm no-print" onClick={() => setCashModal(true)}>➕ تسجيل سحب</button>
        </div>
        {(!w.cash_withdrawals || w.cash_withdrawals.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سحب نقدي مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th><th className="no-print">إجراء</th></tr></thead>
              <tbody>
                {w.cash_withdrawals.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.date}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 700 }}>−{fmt(c.amount)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.note || '—'}</td>
                    <td className="no-print"><div style={{display:'flex',gap:5}}><button className="btn btn-xs btn-danger" onClick={() => setDelEntry({ type: 'cash', id: c.id })}>🗑️</button>{w.phone && planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" onClick={() => sendWhatsAppNotify({...w}, 'cash', c)}>💬</button>}{w.phone && !planHasWhatsApp(getPlan()) && <button className="wa-btn wa-btn-sm" style={{opacity:.5,cursor:'default'}} title='متاح في المميزة فقط 👑'>💬🔒</button>}</div></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي السحوبات</td>
                  <td style={{ fontWeight: 800, color: '#3b82f6' }}>−{fmt(totalCash(w))}</td>
                  <td /><td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>}
      </div>}

      {/* السحب النقدي - عرض للعامل */}
      {isWorkerView && (w.cash_withdrawals || []).length > 0 && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{(w.cash_withdrawals || []).length} مرة</span></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="entries-tbl">
            <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead>
            <tbody>
              {w.cash_withdrawals.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.date}</td>
                  <td style={{ color: '#3b82f6', fontWeight: 700 }}>−{fmt(c.amount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.note || '—'}</td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي السحوبات</td>
                <td style={{ fontWeight: 800, color: '#3b82f6' }}>−{fmt(totalCash(w))}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>}

      {/* Net */}
      <div className="net-card">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>💰 صافي المدفوعات</div>
          <div className="net-amount">{fmt(net)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 2 }}>
            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(w.salary)} ← الراتب الأساسي</div>
            <div style={{ color: '#ef4444' }}>−{fmt(ded)} ← إجمالي الخصومات</div>
            <div style={{ color: '#10b981' }}>+{fmt(totalRewards(w))} ← الحوافز</div>
            {totalCash(w) > 0 && <div style={{ color: '#3b82f6' }}>−{fmt(totalCash(w))} ← السحب النقدي</div>}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4, fontWeight: 700, fontSize: 13, color: '#10b981' }}>= {fmt(net)} صافي المدفوعات</div>
          </div>
          <div style={{ marginTop: 10, width: 200 }}>
            <div className="fuel-bar"><div className="fuel-fill" style={{ width: `${Math.max(0, Math.min(100, (net / w.salary) * 100))}%`, background: net >= w.salary * 0.9 ? '#10b981' : net >= w.salary * 0.75 ? '#f59e0b' : '#ef4444' }} /></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{Math.round((net / w.salary) * 100)}% من الراتب الأساسي</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>💵</div>
          <span className={`badge ${net >= w.salary * 0.9 ? 'badge-success' : net >= w.salary * 0.75 ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: 8, fontSize: 12 }}>
            {net >= w.salary * 0.9 ? '✅ ممتاز' : net >= w.salary * 0.75 ? '⚠️ جيد' : '❗ خصومات عالية'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== WORKERS PAGE ====================
const WorkersPage = ({ workers, setWorkers }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [ddOpen, setDdOpen] = useState(false);
  const [workerModal, setWorkerModal] = useState(null);
  const [deleteW, setDeleteW] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const selected = workers.find(w => w.id === selectedId);

  const saveWorker = async (data) => {
    // تحقق من حد الباقة المجانية
    const isNewWorker = !workers.find(w => w.id === data.id);
    const _plan = getPlan();
    const _limit = getWorkerLimit(_plan);
    if (isNewWorker && workers.length >= _limit && _limit !== Infinity) {
      toast(`باقتك الحالية تسمح بـ ${_limit} عمال فقط — قم بالترقية لإضافة المزيد 🔒`, 'warning');
      setWorkerModal(null);
      return;
    }
    setLoading(true); await new Promise(r => setTimeout(r, 600));
    if (workers.find(w => w.id === data.id)) setWorkers(workers.map(w => w.id === data.id ? data : w));
    else { setWorkers([...workers, data]); setSelectedId(data.id); }
    setWorkerModal(null); setLoading(false);
  };

  const deleteWorker = async () => {
    setLoading(true); await new Promise(r => setTimeout(r, 500));
    setWorkers(workers.filter(w => w.id !== deleteW.id));
    if (selectedId === deleteW.id) setSelectedId(null);
    toast('تم حذف العامل', 'success'); setDeleteW(null); setLoading(false);
  };

  const updateWorker = (updated) => setWorkers(workers.map(w => w.id === updated.id ? updated : w));

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {loading && <Loader />}
      {workerModal !== null && <WorkerModal worker={workerModal === 'add' ? null : workerModal} onSave={saveWorker} onClose={() => setWorkerModal(null)} />}
      {deleteW && <ConfirmModal message={`هل تريد حذف "${deleteW.name}" نهائياً؟`} onConfirm={deleteWorker} onClose={() => setDeleteW(null)} />}

      <div className="worker-selector">
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          👷 اختر عاملاً لعرض بياناته التفصيلية
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="worker-dropdown" style={{ flex: 1, minWidth: 240 }}>
            <button className={`worker-dropdown-btn ${ddOpen ? 'open' : ''}`} onClick={() => setDdOpen(!ddOpen)}>
              {selected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="w-avatar" style={{ width: 34, height: 34, fontSize: 14 }}>{selected.avatar}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.pump} · صافي: {fmt(calcNet(selected))}</div>
                  </div>
                </div>
              ) : <span style={{ color: 'var(--text-muted)' }}>— اختر عاملاً —</span>}
              <span style={{ color: 'var(--text-muted)', display: 'inline-block', transition: 'transform .2s', transform: ddOpen ? 'rotate(180deg)' : 'none', fontSize: 12 }}>▾</span>
            </button>
            {ddOpen && (
              <div className="worker-dropdown-menu">
                {workers.map(w => (
                  <div key={w.id} className={`worker-dropdown-item ${w.id === selectedId ? 'selected' : ''}`}
                    onClick={() => { setSelectedId(w.id); setDdOpen(false); }}>
                    <div className="w-avatar">{w.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.pump} · {w.delays.length} تأخير · {w.absences.length} غياب · صافي: {fmt(calcNet(w))}</div>
                    </div>
                    {w.id === selectedId && <span style={{ color: 'var(--primary-light)', fontWeight: 800, fontSize: 16 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setWorkerModal('add')}>➕ عامل جديد</button>
            {selected && <>
              <button className="btn btn-ghost" onClick={() => setWorkerModal(selected)}>✏️ تعديل</button>
              <button className="btn btn-danger" onClick={() => setDeleteW(selected)}>🗑️ حذف</button>
            </>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {workers.map(w => (
            <button key={w.id} onClick={() => { setSelectedId(w.id); setDdOpen(false); }}
              style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all .15s', fontFamily: 'Cairo,sans-serif', background: w.id === selectedId ? 'rgba(26,86,219,0.2)' : 'rgba(255,255,255,0.04)', borderColor: w.id === selectedId ? 'var(--primary-light)' : 'var(--border)', color: w.id === selectedId ? 'var(--primary-light)' : 'var(--text-muted)' }}>
              {w.avatar} {w.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {selected
        ? <WorkerDetail key={selected.id} worker={selected} onUpdate={updateWorker} />
        : <div className="empty-state">
          <div className="empty-icon">👆</div>
          <div className="empty-title">اختر عاملاً من القائمة أعلاه</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>سيتم عرض بياناته الكاملة</div>
        </div>}
    </div>
  );
};

// ==================== OWNER DASHBOARD ====================
const OwnerDashboard = ({ workers, workPlaces, onAddPlace, onEditPlace, onDeletePlace }) => {
  const [showPlacesManager, setShowPlacesManager] = useState(false);
  const totalSal = workers.reduce((s, w) => s + w.salary, 0);
  const allDed = workers.reduce((s, w) => s + totalDed(w), 0);
  const totalRewardsVal = workers.reduce((s, w) => s + totalRewards(w), 0);
  const allCash = workers.reduce((s, w) => s + totalCash(w), 0);
  const totalNet = workers.reduce((s, w) => s + calcNet(w), 0);
  const totalAbs = workers.reduce((s, w) => s + w.absences.length, 0);
  const totalDel = workers.reduce((s, w) => s + w.delays.length, 0);
  const totalAbsNoReason = workers.reduce((s, w) => s + (w.absences_no_reason || []).length, 0);
  const avgDiscipline = workers.length > 0 ? (workers.reduce((s, w) => s + (w.discipline || []).reduce((ds, d) => ds + d.stars, 0), 0) / Math.max(workers.reduce((c, w) => c + (w.discipline || []).length, 0), 1)).toFixed(1) : 0;
  
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {showPlacesManager && <WorkPlacesManager workPlaces={workPlaces} onAdd={onAddPlace} onEdit={onEditPlace} onDelete={onDeletePlace} onClose={() => setShowPlacesManager(false)} />}
      <div className="stats-grid">
        {[
          { icon: '👷', label: 'إجمالي العمال', value: workers.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { icon: '💵', label: 'إجمالي الرواتب', value: fmt(totalSal), color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { icon: '✅', label: 'صافي المدفوعات', value: fmt(totalNet), color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
          { icon: '➖', label: 'إجمالي الخصومات', value: fmt(allDed), color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          { icon: '💵', label: 'إجمالي السحوبات', value: fmt(allCash), color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
          { icon: '📦', label: 'حالات العجز', value: `${totalAbsNoReason}`, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          { icon: '⭐', label: 'متوسط الانضباط', value: `${avgDiscipline} نجم`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { icon: '🎁', label: 'إجمالي الحوافز', value: fmt(totalRewardsVal), color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: s.value.toString().length > 9 ? '16px' : '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>💹 ملخص الرواتب</div>
          {[
            { label: 'إجمالي الرواتب', val: totalSal, color: '#3b82f6', pct: 100 },
            { label: 'الخصومات', val: allDed, color: '#ef4444', pct: totalSal ? (allDed / totalSal) * 100 : 0 },
            { label: 'الحوافز', val: totalRewardsVal, color: '#10b981', pct: totalSal ? (totalRewardsVal / totalSal) * 100 : 0 },
            { label: 'السحب النقدي', val: allCash, color: '#3b82f6', pct: totalSal ? (allCash / totalSal) * 100 : 0 },
            { label: 'صافي المدفوع', val: totalNet, color: '#10b981', pct: totalSal ? (totalNet / totalSal) * 100 : 0 }
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{fmt(item.val)}</span>
              </div>
              <div className="fuel-bar"><div className="fuel-fill" style={{ width: `${item.pct}%`, background: item.color }} /></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>👷 العمال بمكان العمل</span>
            <button className="btn btn-primary btn-sm no-print" onClick={() => setShowPlacesManager(true)}>🏢 إدارة</button>
          </div>
          {workPlaces.map(p => { const c = workers.filter(w => w.pump === p).length; return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 68, fontSize: 12, color: 'var(--text-muted)' }}>{p}</div>
              <div className="fuel-bar" style={{ flex: 1 }}><div className="fuel-fill" style={{ width: workers.length > 0 ? `${(c / workers.length) * 100}%` : '0%' }} /></div>
              <div style={{ width: 52, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{c} عامل</div>
            </div>
          ); })}
          {/* العمال اللي عندهم مكان عمل مش في القائمة */}
          {[...new Set(workers.map(w => w.pump).filter(p => p && p !== 'غير محدد' && !workPlaces.includes(p)))].map(p => {
            const c = workers.filter(w => w.pump === p).length;
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 68, fontSize: 12, color: 'var(--text-muted)' }}>{p}</div>
                <div className="fuel-bar" style={{ flex: 1 }}><div className="fuel-fill" style={{ width: workers.length > 0 ? `${(c / workers.length) * 100}%` : '0%' }} /></div>
                <div style={{ width: 52, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{c} عامل</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="table-container">
        <div className="table-hdr"><div style={{ fontSize: 15, fontWeight: 700 }}>👷 ملخص جميع العمال</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>العامل</th><th>مكان العمل</th><th>أيام العمل</th><th>تأخيرات</th><th>غيابات</th><th>عجز</th><th>انضباط</th><th>خصومات</th><th>سحب نقدي</th><th>صافي المدفوعات</th></tr></thead>
            <tbody>
              {workers.map(w => {
                const discAvg = (w.discipline || []).length > 0 ? (w.discipline.reduce((s, d) => s + d.stars, 0) / w.discipline.length).toFixed(1) : '—';
                return (
                <tr key={w.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{w.avatar}</div><span style={{ fontWeight: 600 }}>{w.name}</span></div></td>
                  <td><span className="badge badge-blue">{w.pump}</span></td>
                  <td>{w.workDays} يوم</td>
                  <td>{w.delays.length > 0 ? <span className="badge badge-warning">{w.delays.length} مرة</span> : <span className="badge badge-success">لا يوجد</span>}</td>
                  <td>{w.absences.length > 0 ? <span className="badge badge-danger">{w.absences.length} يوم</span> : <span className="badge badge-success">لا يوجد</span>}</td>
                  <td>{(w.absences_no_reason || []).length > 0 ? <span className="badge badge-danger">{(w.absences_no_reason || []).length}</span> : <span className="badge badge-success">—</span>}</td>
                  <td>{discAvg !== '—' ? <span className="badge badge-warning">{discAvg} ⭐</span> : <span className="badge badge-success">—</span>}</td>
                  <td style={{ color: totalDed(w) > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>{totalDed(w) > 0 ? `-${fmt(totalDed(w))}` : '—'}</td>
                  <td style={{ color: totalCash(w) > 0 ? '#3b82f6' : 'var(--text-muted)', fontWeight: 700 }}>{totalCash(w) > 0 ? `-${fmt(totalCash(w))}` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>{fmt(calcNet(w))}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== REPORTS ====================
const generateMonthlyReport = (workers, month, year, monthName) => {
  const C = (v, s, t) => ({ v, s: s ?? 0, t: t ?? (typeof v === 'number' ? 'n' : 's') });
  const E = (s) => C('', s ?? 0);

  const totalSal = workers.reduce((s, w) => s + w.salary, 0);
  const allDed   = workers.reduce((s, w) => s + totalDed(w), 0);
  const allRew   = workers.reduce((s, w) => s + totalRewards(w), 0);
  const totalNet = workers.reduce((s, w) => s + calcNet(w), 0);

  // ── Sheet 1: ملخص الشهر ──
  const summaryRows = [
    { cells: [C(`التقرير الشهري - ${monthName} ${year}`,1),E(1),E(1),E(1),E(1),E(1),E(1),E(1)], ht: 32 },
    { cells: [C('محطة بترومين 10000',15),E(15),E(15),E(15),E(15),E(15),E(15),E(15)], ht: 26 },
    { cells: Array(8).fill(E(0)) },
    { cells: [C('العامل',1),C('مكان العمل',1),C('ايام العمل',1),C('التاخيرات',1),C('الغيابات',1),C('الخصومات',1),C('الحوافز',1),C('السحب النقدي',1),C('صافي المدفوع',1)], ht: 24 },
    ...workers.map((w, i) => {
      const ev = i % 2 === 0;
      const net = calcNet(w);
      return { cells: [
        C(w.name, ev?6:7), C(w.pump, ev?6:7), C(w.workDays, ev?6:7, 'n'),
        C(w.delays.length, ev?6:7, 'n'), C(w.absences.length, ev?6:7, 'n'),
        C(totalDed(w), ev?10:12, 'n'), C(totalRewards(w), ev?11:13, 'n'),
        C(totalCash(w), ev?10:12, 'n'),
        C(net, net >= w.salary*0.9 ? (ev?11:13) : (ev?10:12), 'n'),
      ]};
    }),
    { cells: Array(9).fill(E(0)) },
    { cells: [
      C('الاجمالي',8), E(8),
      C(workers.reduce((s,w)=>s+w.workDays,0),8,'n'),
      C(workers.reduce((s,w)=>s+w.delays.length,0),8,'n'),
      C(workers.reduce((s,w)=>s+w.absences.length,0),8,'n'),
      C(allDed,9,'n'), C(allRew,8,'n'),
      C(workers.reduce((s,w)=>s+totalCash(w),0),9,'n'),
      C(totalNet,8,'n'),
    ], ht: 26 },
  ];
  const summarySheet = {
    name: 'ملخص الشهر',
    colWidths: [22,16,13,13,13,18,16,18,20],
    merges: ['A1:I1','A2:I2'],
    rows: summaryRows,
  };

  // ── Sheets per worker ──
  const workerSheets = workers.map(w => {
    const net = calcNet(w);
    const absNR = w.absences_no_reason || [];
    const disc  = w.discipline || [];
    const delDed  = w.delays.reduce((s,d)=>s+d.deduction,0);
    const absDed  = w.absences.reduce((s,a)=>s+a.deduction,0);
    const absNRDed= absNR.reduce((s,a)=>s+a.deduction,0);
    const rewTotal= disc.reduce((s,d)=>s+d.reward,0);

    const rows = [
      { cells: [C(`تقرير العامل: ${w.name}`,1),E(1),E(1),E(1)], ht: 30 },
      { cells: [C(`${monthName} ${year} - ${w.pump}`,15),E(15),E(15),E(15)], ht: 24 },
      { cells: [E(0),E(0),E(0),E(0)] },
      { cells: [C('البيان',1),C('التفاصيل',1),E(1),E(1)], ht: 22 },
      { cells: [C('ايام العمل',6),C(w.workDays,6,'n'),E(6),E(6)] },
      { cells: [C('الراتب الاساسي',7),C(w.salary,14,'n'),E(7),E(7)] },
      { cells: [C('اجمالي خصم التاخيرات',6),C(delDed,10,'n'),E(6),E(6)] },
      { cells: [C('اجمالي خصم الغيابات',7),C(absDed,10,'n'),E(7),E(7)] },
      { cells: [C('اجمالي خصم العجز',6),C(absNRDed,10,'n'),E(6),E(6)] },
      { cells: [C('اجمالي الحوافز',7),C(rewTotal,11,'n'),E(7),E(7)] },
      { cells: [C('السحب النقدي',6),C(totalCash(w),10,'n'),E(6),E(6)] },
      { cells: [C('صافي المدفوعات',16),C(net,16,'n'),E(16),E(16)], ht: 26 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // delays section
      { cells: [C('--- التاخيرات ---',5),E(5),E(5),E(5)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('المدة (دقيقة)',1),C('الخصم',1)], ht: 20 },
      ...w.delays.map((d,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(d.date,ev?6:7),C(d.minutes,ev?6:7,'n'),C(d.deduction,ev?10:12,'n')] }; }),
      { cells: [E(9),E(9),C('الاجمالي',9),C(delDed,9,'n')], ht: 20 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // absences section
      { cells: [C('--- الغيابات ---',2),E(2),E(2),E(2)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('السبب',1),C('الخصم',1)], ht: 20 },
      ...w.absences.map((a,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(a.date,ev?6:7),C(a.reason,ev?6:7),C(a.deduction,ev?10:12,'n')] }; }),
      { cells: [E(9),E(9),C('الاجمالي',9),C(absDed,9,'n')], ht: 20 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // absNR section
      { cells: [C('--- العجز ---',4),E(4),E(4),E(4)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('قيمة العجز',1),E(1)], ht: 20 },
      ...absNR.map((a,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(a.date,ev?6:7),C(a.deduction,ev?10:12,'n'),E(ev?6:7)] }; }),
      { cells: [E(9),E(9),C(absNRDed,9,'n'),E(9)], ht: 20 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // discipline section
      { cells: [C('--- الانضباط ---',3),E(3),E(3),E(3)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('النجوم',1),C('الحافز',1)], ht: 20 },
      ...disc.map((d,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(d.date,ev?6:7),C('★'.repeat(d.stars)+'☆'.repeat(5-d.stars),ev?6:7),C(d.reward,ev?11:13,'n')] }; }),
      { cells: [E(8),E(8),C('اجمالي الحوافز',8),C(rewTotal,8,'n')], ht: 20 },
    ];

    return {
      name: w.name.slice(0,28),
      colWidths: [26,16,18,16],
      merges: ['A1:D1','A2:D2','A11:D11'],
      rows,
    };
  });

  const { runWithJSZip } = buildXlsxBlob([summarySheet, ...workerSheets]);
  loadJSZip(JSZip => runWithJSZip(JSZip, `التقرير-الشهري-${monthName}-${year}.xlsx`));
};


// ==================== MONTH RESET MODAL ====================
const MonthResetModal = ({ workers, ownerId, onReset, onClose }) => {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const now = new Date();
  const monthLabel = months[now.getMonth()] + ' ' + now.getFullYear();

  const totalDedAll = workers.reduce((s,w) => s + totalDed(w), 0);
  const totalCashAll = workers.reduce((s,w) => s + totalCash(w), 0);
  const totalRewAll = workers.reduce((s,w) => s + totalRewards(w), 0);
  const totalNetAll = workers.reduce((s,w) => s + calcNet(w), 0);

  const handleReset = async () => {
    setLoading(true);
    // أرشفة الشهر الحالي
    const archive = {
      id: Date.now(),
      month: now.getMonth(),
      year: now.getFullYear(),
      label: monthLabel,
      archivedAt: new Date().toISOString(),
      summary: {
        workers: workers.length,
        totalSalary: workers.reduce((s,w) => s+w.salary, 0),
        totalDeductions: totalDedAll,
        totalRewards: totalRewAll,
        totalCash: totalCashAll,
        totalNet: totalNetAll,
      },
      workerSnapshots: workers.map(w => ({
        id: w.id, name: w.name, pump: w.pump, salary: w.salary,
        delays: w.delays || [], absences: w.absences || [],
        absences_no_reason: w.absences_no_reason || [],
        discipline: w.discipline || [],
        cash_withdrawals: w.cash_withdrawals || [],
        net: calcNet(w),
      })),
    };
    const archives = getMonthArchives(ownerId);
    await saveMonthArchives(ownerId, [...archives, archive]);
    // مسح كل البيانات الشهرية لكل العمال
    await onReset(workers.map(w => ({
      ...w,
      delays: [],
      absences: [],
      absences_no_reason: [],
      discipline: [],
      cash_withdrawals: [],
    })));
    setLoading(false);
    toast('تم إغلاق الشهر وحفظ الأرشيف ✓', 'success');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540, animation: 'fadeIn .2s ease' }}>
        <div className="modal-header">
          <div className="modal-title">🔄 إغلاق الشهر وبدء شهر جديد</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading && <Loader />}
          <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: '#3b82f6' }}>📊 ملخص شهر {monthLabel}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'إجمالي الرواتب', val: workers.reduce((s,w)=>s+w.salary,0), color: '#f59e0b' },
                { label: 'إجمالي الخصومات', val: totalDedAll, color: '#ef4444' },
                { label: 'إجمالي الحوافز', val: totalRewAll, color: '#10b981' },
                { label: 'إجمالي السحوبات', val: totalCashAll, color: '#3b82f6' },
              ].map((item,i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{fmt(item.val)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>💵 إجمالي صافي المدفوعات</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{fmt(totalNetAll)}</span>
            </div>
          </div>
          {!confirm ? (
            <div className="month-reset-card">
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>⚠️ ماذا سيحدث؟</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 2.2 }}>
                <div>📦 <b>حفظ الأرشيف:</b> كل بيانات الشهر هتتحفظ في الأرشيف</div>
                <div>🗑️ <b>مسح الشهري:</b> التأخيرات، الغيابات، العجز، الحوافز، والسحوبات</div>
                <div>✅ <b>البيانات الثابتة:</b> الراتب، أيام العمل، ومكان العمل — هتفضل</div>
                <div>🔄 <b>شهر جديد:</b> يبدأ بصفحة بيضاء نظيفة</div>
              </div>
              <button className="btn btn-danger" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => setConfirm(true)}>
                🔄 متابعة إغلاق الشهر
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>تأكيد إغلاق شهر {monthLabel}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>هذا الإجراء لا يمكن التراجع عنه — تأكد من تحميل تقرير Excel قبل المتابعة</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={handleReset} disabled={loading}>
                  {loading ? '⏳ جاري الإغلاق...' : '✅ نعم، أغلق الشهر'}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirm(false)}>رجوع</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MONTH ARCHIVE PAGE ====================
const MonthArchivePage = ({ ownerId }) => {
  const [archives, setArchives] = useState(() => getMonthArchives(ownerId));
  const [selected, setSelected] = useState(null);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {archives.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">لا يوجد أرشيف بعد</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>بعد إغلاق الشهر الأول هيظهر هنا</div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {[...archives].reverse().map(arch => (
              <div key={arch.id} className="month-archive-item" onClick={() => setSelected(selected?.id === arch.id ? null : arch)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{arch.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>أُغلق {new Date(arch.archivedAt).toLocaleDateString('ar-EG')} · {arch.summary.workers} عامل</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>صافي المدفوع</div>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: 14 }}>{fmt(arch.summary.totalNet)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>الخصومات</div>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 14 }}>{fmt(arch.summary.totalDeductions)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>السحوبات</div>
                    <div style={{ fontWeight: 800, color: '#3b82f6', fontSize: 14 }}>{fmt(arch.summary.totalCash)}</div>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{selected?.id === arch.id ? '▲' : '▼'}</span>
              </div>
            ))}
          </div>
          {/* تفاصيل الشهر المختار */}
          {selected && (
            <div className="table-container" style={{ animation: 'fadeIn .2s ease' }}>
              <div className="table-hdr">
                <div style={{ fontSize: 15, fontWeight: 700 }}>📋 تفاصيل {selected.label}</div>
                <button className="btn btn-accent btn-sm" onClick={() => {
                  const workers = selected.workerSnapshots || [];
                  const months2 = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
                  generateMonthlyReport(workers, selected.month, selected.year, months2[selected.month]);
                }}>📊 تحميل Excel</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>العامل</th><th>مكان العمل</th><th>الراتب</th><th>الخصومات</th><th>الحوافز</th><th>السحوبات</th><th>صافي المدفوع</th></tr></thead>
                  <tbody>
                    {(selected.workerSnapshots || []).map(w => (
                      <tr key={w.id}>
                        <td style={{ fontWeight: 700 }}>{w.name}</td>
                        <td><span className="badge badge-blue">{w.pump}</span></td>
                        <td style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(w.salary)}</td>
                        <td style={{ color: '#ef4444', fontWeight: 700 }}>{totalDed(w) > 0 ? `-${fmt(totalDed(w))}` : '—'}</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>{totalRewards(w) > 0 ? `+${fmt(totalRewards(w))}` : '—'}</td>
                        <td style={{ color: '#3b82f6', fontWeight: 700 }}>{totalCash(w) > 0 ? `-${fmt(totalCash(w))}` : '—'}</td>
                        <td style={{ color: '#10b981', fontWeight: 800, fontSize: 14 }}>{fmt(w.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== SALARY PAYMENT PAGE ====================
const SalaryPaymentPage = ({ workers, ownerId }) => {
  const toast = useToast();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const [payments, setPayments] = useState(() => getPaymentRecords(ownerId));
  const [confirmPay, setConfirmPay] = useState(null);
  const [confirmUnpay, setConfirmUnpay] = useState(null);
  const [payAllConfirm, setPayAllConfirm] = useState(false);

  const getPaidKey = (workerId) => `${currentMonthKey}_${workerId}`;
  const isPaid = (workerId) => payments.some(p => p.key === getPaidKey(workerId));
  const getPaidRecord = (workerId) => payments.find(p => p.key === getPaidKey(workerId));

  const markPaid = async (worker) => {
    const newRec = {
      key: getPaidKey(worker.id),
      workerId: worker.id,
      workerName: worker.name,
      month: currentMonthKey,
      net: calcNet(worker),
      paidAt: new Date().toISOString(),
    };
    const updated = [...payments.filter(p => p.key !== getPaidKey(worker.id)), newRec];
    setPayments(updated);
    await savePaymentRecords(ownerId, updated);
    toast(`تم تسجيل صرف راتب ${worker.name} ✓`, 'success');
    setConfirmPay(null);
  };

  const unmarkPaid = async (worker) => {
    const updated = payments.filter(p => p.key !== getPaidKey(worker.id));
    setPayments(updated);
    await savePaymentRecords(ownerId, updated);
    toast(`تم إلغاء تسجيل الصرف لـ ${worker.name}`, 'info');
    setConfirmUnpay(null);
  };

  const markAllPaid = async () => {
    const newRecs = workers.filter(w => !isPaid(w.id)).map(w => ({
      key: getPaidKey(w.id),
      workerId: w.id,
      workerName: w.name,
      month: currentMonthKey,
      net: calcNet(w),
      paidAt: new Date().toISOString(),
    }));
    const updated = [...payments, ...newRecs];
    setPayments(updated);
    await savePaymentRecords(ownerId, updated);
    toast('تم تسجيل صرف جميع الرواتب ✓', 'success');
    setPayAllConfirm(false);
  };

  const paidCount = workers.filter(w => isPaid(w.id)).length;
  const unpaidCount = workers.length - paidCount;
  const totalPaid = workers.filter(w => isPaid(w.id)).reduce((s,w) => s + calcNet(w), 0);
  const totalUnpaid = workers.filter(w => !isPaid(w.id)).reduce((s,w) => s + calcNet(w), 0);
  const paidPct = workers.length > 0 ? Math.round((paidCount / workers.length) * 100) : 0;

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      {/* Confirm single pay */}
      {confirmPay && (
        <ConfirmModal
          message={`تأكيد صرف راتب "${confirmPay.name}" — ${fmt(calcNet(confirmPay))} ج.م ؟`}
          onConfirm={() => markPaid(confirmPay)}
          onClose={() => setConfirmPay(null)}
        />
      )}
      {confirmUnpay && (
        <ConfirmModal
          message={`إلغاء تسجيل صرف راتب "${confirmUnpay.name}"؟`}
          onConfirm={() => unmarkPaid(confirmUnpay)}
          onClose={() => setConfirmUnpay(null)}
        />
      )}
      {payAllConfirm && (
        <ConfirmModal
          message={`صرف رواتب جميع العمال غير المصروفين (${unpaidCount} عامل — ${fmt(totalUnpaid)})؟`}
          onConfirm={markAllPaid}
          onClose={() => setPayAllConfirm(false)}
        />
      )}

      {/* Summary bar */}
      <div className="salary-summary-bar">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>شهر {months[now.getMonth()]} {now.getFullYear()}</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{paidCount} من {workers.length} عامل تم صرف رواتبهم</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            تم الصرف: <b style={{ color: '#10b981' }}>{fmt(totalPaid)}</b> · متبقي: <b style={{ color: '#f59e0b' }}>{fmt(totalUnpaid)}</b>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{paidPct}%</span>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${paidPct}%` }} />
            </div>
          </div>
          {unpaidCount > 0 && (
            <button className="btn btn-success btn-sm" onClick={() => setPayAllConfirm(true)}>
              ✅ صرف الكل ({unpaidCount} عامل)
            </button>
          )}
          {paidCount === workers.length && workers.length > 0 && (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>🎉 تم صرف جميع الرواتب!</div>
          )}
        </div>
      </div>

      {/* Workers list */}
      <div className="table-container">
        <div className="table-hdr">
          <div style={{ fontSize: 15, fontWeight: 700 }}>💵 سجل صرف الرواتب</div>
          <span className="badge badge-blue">{workers.length} عامل</span>
        </div>
        {workers.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">👷</div>
            <div className="empty-title">لا يوجد عمال بعد</div>
          </div>
        ) : (
          <div>
            {/* غير مصروف أولاً */}
            {workers.filter(w => !isPaid(w.id)).map(w => (
              <div key={w.id} className="payment-row">
                <div className="payment-worker-info">
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{w.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{w.pump} · {w.delays.length} تأخير · {w.absences.length} غياب</div>
                  </div>
                </div>
                <div className="payment-net">{fmt(calcNet(w))}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {w.phone && planHasWhatsApp(getPlan()) && (
                    <button className="wa-btn wa-btn-sm" onClick={() => {
                      const net = calcNet(w);
                      const phone = w.phone.startsWith('0') ? '2' + w.phone : w.phone;
                      const msg = encodeURIComponent(
                        'مرحباً يا ' + w.name + ' 👋\n\n⛽ محطة بترومين\n─────────────────\n' +
                        '💵 راتب شهر ' + months[now.getMonth()] + ' ' + now.getFullYear() + '\n' +
                        '─────────────────\n' +
                        '💰 الراتب الأساسي: ' + fmt(w.salary) + '\n' +
                        '➖ الخصومات: -' + fmt(totalDed(w)) + '\n' +
                        (totalRewards(w) > 0 ? '🎁 الحوافز: +' + fmt(totalRewards(w)) + '\n' : '') +
                        (totalCash(w) > 0 ? '💸 السحوبات: -' + fmt(totalCash(w)) + '\n' : '') +
                        '─────────────────\n' +
                        '✅ صافي المدفوع: ' + fmt(net) + '\n─────────────────\nشكراً على مجهودك! 🙏'
                      );
                      window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
                    }}>💬 أبلغه</button>
                  )}
                  <button className="pay-btn" onClick={() => setConfirmPay(w)}>✅ تم الصرف</button>
                </div>
              </div>
            ))}
            {/* مصروف */}
            {workers.filter(w => isPaid(w.id)).map(w => {
              const rec = getPaidRecord(w.id);
              return (
                <div key={w.id} className="payment-row paid">
                  <div className="payment-worker-info">
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,rgba(16,185,129,0.4),rgba(16,185,129,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{w.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-muted)' }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {w.pump} · صُرف {rec ? new Date(rec.paidAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>
                  </div>
                  <div className="payment-net" style={{ color: 'var(--text-muted)' }}>{fmt(calcNet(w))}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="paid-stamp">✅ تم الصرف</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setConfirmUnpay(w)}>↩️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};



const ReportsPage = ({ workers, ownerId, onResetMonth }) => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [showReset, setShowReset] = useState(false);
  const toast = useToast();
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const totalSal = workers.reduce((s, w) => s + w.salary, 0);
  const allDed = workers.reduce((s, w) => s + totalDed(w), 0);
  const allRewards = workers.reduce((s, w) => s + totalRewards(w), 0);
  const allCash = workers.reduce((s, w) => s + totalCash(w), 0);
  const totalNet = workers.reduce((s, w) => s + calcNet(w), 0);
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }} className="no-print">
        <select className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
        <select className="form-input" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>{[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}</select>
        <button className="btn btn-accent" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateMonthlyReport(workers, month, year, months[month]); toast('جاري تحميل ملف Excel', 'info'); }}>📊 تحميل Excel {!planHasExcelAdv(getPlan()) && '🔒'}</button>
        <button className="btn btn-ghost" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️ طباعة</button>
        {onResetMonth && planHasMonthReset(getPlan()) && <button className="btn btn-danger" style={{marginRight:'auto'}} onClick={() => setShowReset(true)}>🔄 إغلاق الشهر وبدء شهر جديد</button>}{onResetMonth && !planHasMonthReset(getPlan()) && <button className="btn btn-ghost" style={{marginRight:'auto', opacity:.6}} onClick={() => toast('أرشفة الشهور متاحة في الباقة المميزة فقط 👑','warning')}>🔄 إغلاق الشهر 🔒</button>}
      </div>
      {showReset && <MonthResetModal workers={workers} ownerId={ownerId} onReset={onResetMonth} onClose={() => setShowReset(false)} />}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>التقرير الشهري — {months[month]} {year}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>محطة بترومين 10000</div>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 22 }}>
        {[
          { label: 'العمال', value: workers.length, icon: '👷', color: '#3b82f6' },
          { label: 'إجمالي الرواتب', value: fmt(totalSal), icon: '💵', color: '#f59e0b' },
          { label: 'الخصومات', value: fmt(allDed), icon: '➖', color: '#ef4444' },
          { label: 'الحوافز', value: fmt(allRewards), icon: '🎁', color: '#10b981' },
          { label: 'السحب النقدي', value: fmt(allCash), icon: '💵', color: '#3b82f6' },
          { label: 'صافي المدفوع', value: fmt(totalNet), icon: '✅', color: '#10b981' }
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="table-container">
        <div className="table-hdr"><div style={{ fontSize: 15, fontWeight: 700 }}>تفاصيل العمال</div></div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>العامل</th><th>مكان العمل</th><th>أيام العمل</th><th>التأخيرات</th><th>الغيابات</th><th>الخصومات</th><th>الحوافز</th><th>السحب النقدي</th><th>صافي المدفوع</th></tr></thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 600 }}>{w.name}</td>
                  <td><span className="badge badge-blue">{w.pump}</span></td>
                  <td>{w.workDays}</td>
                  <td>{w.delays.length}</td>
                  <td>{w.absences.length}</td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>{totalDed(w) > 0 ? `-${fmt(totalDed(w))}` : '—'}</td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>{totalRewards(w) > 0 ? `+${fmt(totalRewards(w))}` : '—'}</td>
                  <td style={{ color: '#3b82f6', fontWeight: 700 }}>{totalCash(w) > 0 ? `-${fmt(totalCash(w))}` : '—'}</td>
                  <td style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>{fmt(calcNet(w))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== WORKER PROFILE (self) ====================
const WorkerProfile = ({ worker, onUpdate }) => {
  const toast = useToast();
  const w = worker;
  const ded = totalDed(w);
  const net = calcNet(w);
  const absNoReasonDed = (w.absences_no_reason || []).reduce((s, a) => s + (a.deduction || 0), 0);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', animation: 'fadeIn .3s ease' }}>
      {/* Header */}
      <div className="detail-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="detail-avatar">{w.avatar}</div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{w.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{w.pump} · عامل في المحطة</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateReport(w); toast('جاري تحميل ملف Excel', 'info'); }}>📊 تقريري Excel {!planHasExcelAdv(getPlan()) && '🔒'}</button>
          <button className="btn btn-ghost btn-sm no-print" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️</button>
        </div>
      </div>

      {/* البيانات الأساسية */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr"><div className="detail-section-title">⚙️ البيانات الأساسية</div></div>
        <div className="detail-body">
          <div className="form-grid-2" style={{ gap: 16 }}>
            <div><div className="form-label">مكان العمل</div><span className="badge badge-blue" style={{ fontSize: 13, padding: '5px 14px' }}>{w.pump}</span></div>
            <div><div className="form-label">أيام العمل</div><span style={{ fontWeight: 700, fontSize: 16 }}>{w.workDays} يوم</span></div>
            <div><div className="form-label">الراتب الأساسي</div><span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{fmt(w.salary)}</span></div>
            <div><div className="form-label">إجمالي الخصومات</div><span style={{ fontWeight: 700, fontSize: 16, color: ded > 0 ? '#ef4444' : 'var(--text-muted)' }}>{ded > 0 ? `-${fmt(ded)}` : 'لا يوجد'}</span></div>
            <div><div className="form-label">📱 رقم التليفون</div><span style={{ fontWeight: 600, fontSize: 15, color: w.phone ? 'var(--text)' : 'var(--text-muted)' }}>{w.phone || '—'}</span></div>
          </div>
        </div>
      </div>

      {/* التأخيرات */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">⏰ التأخيرات <span className="badge badge-warning">{w.delays.length} مرة</span></div>
        </div>
        {w.delays.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد تأخيرات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>المدة</th><th>الخصم</th></tr></thead>
              <tbody>
                {w.delays.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{d.minutes} دقيقة</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(d.deduction)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم التأخيرات</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.delays.reduce((s, d) => s + d.deduction, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* الغيابات */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">❌ الغيابات <span className="badge badge-danger">{w.absences.length} يوم</span></div>
        </div>
        {w.absences.length === 0
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا توجد غيابات مسجلة</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>السبب</th><th>الخصم</th></tr></thead>
              <tbody>
                {w.absences.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td><span className="badge badge-danger">{a.reason}</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصم الغياب</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(w.absences.reduce((s, a) => s + a.deduction, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* العجز */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">📦 العجز <span className="badge badge-danger">{(w.absences_no_reason || []).length} مرة</span></div>
        </div>
        {(!w.absences_no_reason || w.absences_no_reason.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد عجز مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>قيمة العجز</th></tr></thead>
              <tbody>
                {w.absences_no_reason.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{a.date}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>-{fmt(a.deduction)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                  <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي خصومات العجز</td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>-{fmt(absNoReasonDed)}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* الانضباط */}
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">⭐ الانضباط اليومي <span className="badge badge-warning">{(w.discipline || []).length} مرة</span></div>
        </div>
        {(!w.discipline || w.discipline.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سجل انضباط</div>
          : <div style={{ overflowX: 'auto' }}>
            <table className="entries-tbl">
              <thead><tr><th>#</th><th>التاريخ</th><th>النجوم</th><th>الحوافز</th></tr></thead>
              <tbody>
                {w.discipline.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.date}</td>
                    <td><span className="badge badge-warning">{'⭐'.repeat(d.stars)}</span></td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(d.reward)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي مكافآت الانضباط</td>
                  <td style={{ fontWeight: 800, color: '#10b981' }}>+{fmt((w.discipline || []).reduce((s, d) => s + d.reward, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>}
      </div>

      {/* السحب النقدي */}
      {(w.cash_withdrawals || []).length > 0 && <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{w.cash_withdrawals.length} مرة</span></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="entries-tbl">
            <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead>
            <tbody>
              {w.cash_withdrawals.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', width: 36 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.date}</td>
                  <td style={{ color: '#3b82f6', fontWeight: 700 }}>−{fmt(c.amount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.note || '—'}</td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                <td colSpan={2} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12, paddingTop: 10 }}>إجمالي السحوبات</td>
                <td style={{ fontWeight: 800, color: '#3b82f6' }}>−{fmt(totalCash(w))}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>}

      {/* صافي المدفوعات */}
      <div className="net-card">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>💰 صافي المدفوعات</div>
          <div className="net-amount">{fmt(net)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 2 }}>
            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(w.salary)} ← الراتب الأساسي</div>
            <div style={{ color: '#ef4444' }}>−{fmt(ded)} ← إجمالي الخصومات</div>
            <div style={{ color: '#10b981' }}>+{fmt(totalRewards(w))} ← الحوافز</div>
            {totalCash(w) > 0 && <div style={{ color: '#3b82f6' }}>−{fmt(totalCash(w))} ← السحب النقدي</div>}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4, fontWeight: 700, fontSize: 13, color: '#10b981' }}>= {fmt(net)} صافي المدفوعات</div>
          </div>
          <div style={{ marginTop: 10, width: 200 }}>
            <div className="fuel-bar"><div className="fuel-fill" style={{ width: `${Math.max(0, Math.min(100, (net / w.salary) * 100))}%`, background: net >= w.salary * 0.9 ? '#10b981' : net >= w.salary * 0.75 ? '#f59e0b' : '#ef4444' }} /></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{Math.round((net / w.salary) * 100)}% من الراتب الأساسي</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>💵</div>
          <span className={`badge ${net >= w.salary * 0.9 ? 'badge-success' : net >= w.salary * 0.75 ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: 8, fontSize: 12 }}>
            {net >= w.salary * 0.9 ? '✅ ممتاز' : net >= w.salary * 0.75 ? '⚠️ جيد' : '❗ خصومات عالية'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== ACCOUNTS PAGE ====================
// الآن تدعم: مالك، مدير، عامل
// المالك يقدر يشيل المدير ويغير كلمة سره
// لما تضيف عامل من هنا، يتضاف في قائمة العمال تلقائياً
const AccountsPage = ({ users, onAddUser, onEditUser, onDeleteUser, currentUser, workers, onAddWorker }) => {
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'manager' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [changePassId, setChangePassId] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [newPassErr, setNewPassErr] = useState('');
  const [inviteWorkerName, setInviteWorkerName] = useState('');
  const [invites, setInvites] = useState([]);

  // جيب الدعوات من Firebase عند فتح الصفحة
  useEffect(() => {
    const loadInvites = async () => {
      try {
        const d = await getDoc(doc(db, 'owners', currentUser.id, 'meta', 'invites'));
        if (d.exists()) setInvites(d.data().list || []);
      } catch {}
    };
    loadInvites();
  }, []);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const toast = useToast();
  const ownerCode = currentUser.ownerCode || 'STAT-????';
  const appUrl = window.location.origin;

  const roleLabels = { owner: 'المالك', manager: 'مدير', worker: 'عامل' };

  const validateUser = (u) => {
    const e = {};
    if (!u.username?.trim()) e.username = 'اسم المستخدم مطلوب';
    if (!u.password || u.password.length < 6) e.password = 'كلمة المرور 6 أحرف على الأقل';
    if (!u.name?.trim()) e.name = 'الاسم مطلوب';
    if (users.find(x => x.username === u.username && x.id !== u.id)) e.username = 'اسم المستخدم موجود مسبقاً';
    return e;
  };

  const handleAdd = () => {
    const errs = validateUser(newUser);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const newId = Date.now();
    const fullUser = { ...newUser, id: newId, roleLabel: roleLabels[newUser.role], ownerId: currentUser.id };
    onAddUser(fullUser);
    // احفظه في users_data عشان يقدر يسجل دخول
    const savedGlobal = localStorage.getItem("users_data");
    const globalUsers = savedGlobal ? JSON.parse(savedGlobal) : [];
    localStorage.setItem("users_data", JSON.stringify([...globalUsers, fullUser]));
    // لو role عامل، يتضاف في قائمة العمال بنفس الـ id
    if (newUser.role === 'worker' && onAddWorker) {
      onAddWorker({
        id: newId,
        name: newUser.name,
        pump: 'غير محدد',
        workDays: 0,
        salary: 0,
        phone: '',
        avatar: newUser.name[0] || '؟',
        delays: [], absences: [], absences_no_reason: [], discipline: [], cash_withdrawals: []
      });
    }
    setNewUser({ username: '', password: '', name: '', role: 'manager' });
    setErrors({});
    toast('تم إضافة الحساب ✓', 'success');
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
    saveInvites(currentUser.id, updated);

    // فتح واتساب برسالة جاهزة باسم العامل والكود
    const msg = encodeURIComponent(
      `أهلاً يا ${workerName} 👋

تم تسجيلك في منظومة بترومين لإدارة المحطة ⛽

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
    saveInvites(currentUser.id, updated);
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
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>➕ إضافة حساب جديد</div>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">اسم المستخدم</label>
            <input type="text" className={`form-input ${errors.username ? 'error' : ''}`} placeholder="أدخل اسم المستخدم" value={newUser.username} onChange={e => { setNewUser({...newUser, username: e.target.value}); setErrors({...errors, username: ''});}} />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="6 أحرف على الأقل" value={newUser.password} onChange={e => { setNewUser({...newUser, password: e.target.value}); setErrors({...errors, password: ''});}} />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">الاسم الكامل</label>
            <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="أدخل الاسم الكامل" value={newUser.name} onChange={e => { setNewUser({...newUser, name: e.target.value}); setErrors({...errors, name: ''});}} />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">الصلاحية</label>
            <select className="form-input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
              <option value="manager">مدير</option>
              <option value="worker">عامل</option>
              <option value="owner">مالك</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: 12 }}>➕ إضافة الحساب</button>
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
                        <option value="manager">مدير</option>
                        <option value="worker">عامل</option>
                        <option value="owner">مالك</option>
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

تذكير بخطوات التسجيل في منظومة بترومين ⛽

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
const LoginPage = ({ onLogin, onRegisterWorker }) => {
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

      // لو عامل، حول الـ username لـ fake email
      if (loginForm.loginRole === 'worker') {
        const uname = loginForm.emailOrUsername.trim().toLowerCase().replace(/\s+/g, '_');
        emailToUse = `${uname}@petromin.worker`;
      }

      const cred = await signInWithEmailAndPassword(auth, emailToUse, loginForm.password);
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
        // ابحث عن المالك بالكود في Firestore
        try {
          const ownerSnap = await getDocs(collection(db, 'users'));
          ownerData = null;
          ownerSnap.forEach(d => {
            const u = d.data();
            if (u.role === 'owner' && u.ownerCode === regForm.ownerCode.trim()) {
              ownerData = { id: d.id, ...u };
            }
          });
          if (!ownerData) { errs.reg_ownerCode = 'كود المالك غير صحيح'; }
          else {
            // مزامنة الدعوات من Firestore ثم تحقق بالاسم
            await syncInvites(ownerData.id);
            const inviteList = getInvites(ownerData.id);
            if (!inviteList.includes(regForm.name.trim())) {
              errs.reg_name = 'الاسم ده مش موجود في قائمة الدعوات — تأكد إن المالك كتب اسمك بالظبط';
            }
          }
        } catch { errs.reg_ownerCode = 'حدث خطأ في التحقق من الكود'; }
      }
    }

    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const roleLabels = { owner: 'المالك', worker: 'عامل' };
      // العامل يستخدم fake email من username
      const emailForAuth = regForm.role === 'worker'
        ? `${regForm.username.trim().toLowerCase().replace(/\s+/g, '_')}@petromin.worker`
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
        await setDoc(doc(db, 'owners', uid, 'settings', 'subscription'), {
          trialStart: new Date().toISOString(),
          plan: 'trial',
        });
        // احفظ في localStorage برضو
        localStorage.setItem('app_trial_start', new Date().toISOString());
        localStorage.removeItem('app_plan');
      }

      // لو عامل، يتضاف في داتا المالك
      if (regForm.role === 'worker' && ownerData && onRegisterWorker) {
        await onRegisterWorker(newUser, ownerData.id);
        // امسح الدعوة من Firebase مباشرة
        try {
          const inviteDoc = await getDoc(doc(db, 'owners', ownerData.id, 'meta', 'invites'));
          const currentList = inviteDoc.exists() ? (inviteDoc.data().list || []) : [];
          const updatedList = currentList.filter(x => x !== regForm.name.trim());
          await setDoc(doc(db, 'owners', ownerData.id, 'meta', 'invites'), { list: updatedList });
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
          <div style={{ fontSize: 26, fontWeight: 800 }}>محطة بترومين 10000</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>نظام إدارة العمال</div>
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
const Sidebar = ({ user, page, setPage, onLogout, isOpen, onClose }) => {
  const navs = {
    owner: [
      { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
      { id: 'workers', icon: '👷', label: 'إدارة العمال' },
      { id: 'reports', icon: '📋', label: 'التقارير' },
      { id: 'salary_payment', icon: '💵', label: 'صرف الرواتب' },
      { id: 'month_archive', icon: '📦', label: 'أرشيف الشهور' },
      { id: 'accounts', icon: '🔐', label: 'إدارة الحسابات' },
      { id: 'owner_profile', icon: '👤', label: 'ملفي الشخصي' }
    ],
    manager: [
      { id: 'workers', icon: '👷', label: 'إدارة العمال' },
      { id: 'reports', icon: '📋', label: 'التقارير' }
    ],
    worker: [
      { id: 'profile', icon: '👤', label: 'ملفي الشخصي' }
    ],
  };
  return (
    <>
      <div className={`mobile-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo"><div className="logo-icon">⛽</div><div><div className="logo-text">محطة بترومين</div><div className="logo-sub">نظام إدارة العمال</div></div></div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">القائمة الرئيسية</div>
          {(navs[user.role] || []).map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); onClose(); }}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user.name[0]}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.roleLabel}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>🚪 تسجيل الخروج</button>
        </div>
      </div>
    </>
  );
};

// ==================== TRIAL SYSTEM ====================
const TRIAL_DAYS = 15;
const WHATSAPP_NUMBER = '201220523598';

// ---- Firebase-based trial & plan helpers ----
const getOwnerTrialDoc = (ownerId) => doc(db, 'owners', ownerId, 'settings', 'subscription');

const initTrialIfNeeded = async (ownerId) => {
  const ref = getOwnerTrialDoc(ownerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      trialStart: new Date().toISOString(),
      plan: 'trial',
    });
  }
};

const getTrialInfoFromDB = async (ownerId) => {
  const ref = getOwnerTrialDoc(ownerId);
  const snap = await getDoc(ref);
  let data = snap.exists() ? snap.data() : null;
  if (!data) {
    const startDate = new Date().toISOString();
    await setDoc(ref, { trialStart: startDate, plan: 'trial' });
    data = { trialStart: startDate, plan: 'trial' };
  }
  const start = new Date(data.trialStart);
  const now = new Date();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  const expired = elapsedDays >= TRIAL_DAYS;
  return { remaining, expired, elapsedDays, startDate: data.trialStart, plan: data.plan || 'trial' };
};

const setPlanInDB = async (ownerId, plan) => {
  const ref = getOwnerTrialDoc(ownerId);
  await updateDoc(ref, { plan });
};

// legacy fallback (غير مستخدم للمستخدمين المسجلين)
const getTrialInfo = () => {
  let startDate = localStorage.getItem('app_trial_start');
  if (!startDate) {
    startDate = new Date().toISOString();
    localStorage.setItem('app_trial_start', startDate);
  }
  const start = new Date(startDate);
  const now = new Date();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  const expired = elapsedDays >= TRIAL_DAYS;
  return { remaining, expired, elapsedDays, startDate };
};

// ==================== PLAN SYSTEM ====================
const getPlan = () => {
  // لو في باقة محددة في localStorage (lifetime/enterprise/starter) → استخدمها أولاً
  const p = localStorage.getItem('app_plan');
  if (p && p !== 'trial' && p !== 'free') return p; // باقة مدفوعة → override كل حاجة
  // لو الـ trial لسه شغال → رجّع trial (كل المميزات مفتوحة)
  const trialStart = localStorage.getItem('app_trial_start');
  if (trialStart) {
    const elapsed = Math.floor((Date.now() - new Date(trialStart)) / (1000 * 60 * 60 * 24));
    if (elapsed < 15) return 'trial';
  }
  if (!p || p === 'trial') return 'free'; // trial خلص بدون اختيار → مجاني
  return p;
};
// trial = كل المميزات مفتوحة، free = محدود
// حدود العمال لكل باقة
// free=5, basic=10, pro=20, enterprise=∞, lifetime=∞, trial=∞
const WORKER_LIMITS = { free: 5, basic: 10, pro: 20, enterprise: Infinity, lifetime: Infinity, trial: Infinity };
const getWorkerLimit  = (plan) => WORKER_LIMITS[plan] ?? 5;
const FREE_WORKER_LIMIT = 5;

// ===== الـ features حسب كل باقة بالظبط =====
// | Feature          | free | basic | pro | enterprise | lifetime | trial |
// | عدد العمال       |  5   |  10   | 20  |     ∞      |    ∞     |   ∞   |
// | رواتب وخصومات   |  ✅  |  ✅   | ✅  |    ✅      |   ✅     |  ✅   |
// | Excel            |  ❌  |  ✅   | ✅  |    ✅      |   ✅     |  ✅   |
// | واتساب للعمال   |  ❌  |  ❌   | ✅  |    ✅      |   ✅     |  ✅   |
// | صرف الرواتب     |  ❌  |  ❌   | ❌  |    ✅      |   ✅     |  ✅   |
// | أرشيف الشهور    |  ❌  |  ❌   | ❌  |    ✅      |   ✅     |  ✅   |
const planIsFree        = (plan) => plan === 'free';
const planHasExcelAdv   = (plan) => ['basic', 'pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
const planHasWhatsApp   = (plan) => ['pro', 'enterprise', 'lifetime', 'trial'].includes(plan);
const planHasSalaryPay  = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);
const planHasMonthReset = (plan) => ['enterprise', 'lifetime', 'trial'].includes(plan);

// ===== شاشة انتهاء التجربة / الخطط =====
const PricingScreen = ({ onBack, onSelectFree }) => {
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
      price: '5,000',
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

  const msg = encodeURIComponent(`مرحباً، أريد الاشتراك في تطبيق بترومين لإدارة المحطة 🚀`);
  const wa = (plan) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`مرحباً، أريد الاشتراك في خطة "${plan}" — تطبيق بترومين ⛽`)}`;

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

// ===== شريط التجربة المجانية =====
const TrialBanner = ({ remaining, onViewPlans, userName }) => {
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
        const subSnap = await getDoc(doc(db, 'owners', o.id, 'settings', 'subscription'));
        const plan = subSnap.exists() ? (subSnap.data().plan || 'trial') : 'trial';
        return { ...o, plan };
      } catch { return { ...o, plan: 'trial' }; }
    }));
    return withPlans;
  } catch { return []; }
};

// ==================== OWNER PROFILE PAGE ====================
const OwnerProfilePage = ({ user, onUpdate, onShowPricing }) => {
  const toast = useToast();
  const [phone, setPhone] = useState(user.phone || '');
  const [name, setName] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  // Password change
  const [showPassSection, setShowPassSection] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const planLabels = { free: '🆓 المجانية', starter: '⭐ الأساسية', enterprise: '👑 المميزة', lifetime: '♾️ مدى الحياة', trial: '🎯 تجريبية' };
  const currentPlan = getPlan();
  const planLabel = planLabels[currentPlan] || currentPlan;
  const isPremium = currentPlan === 'enterprise' || currentPlan === 'lifetime';

  const save = async () => {
    if (!name.trim()) { toast('الاسم مطلوب', 'error'); return; }
    setSaving(true);
    const updated = { ...user, name: name.trim(), phone: phone.trim() };
    try {
      await updateDoc(doc(db, 'users', user.id), { name: updated.name, phone: updated.phone });
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

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', animation: 'fadeIn .3s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* بطاقة البيانات الشخصية */}
      <div className="card" style={{ padding: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>{(user.name||'?')[0]}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>مالك المحطة</div>
          </div>
        </div>

        {/* الإيميل - عرض فقط */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>📧 البريد الإلكتروني</label>
          <div style={{ padding: '10px 13px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-muted)', direction: 'ltr', textAlign: 'left' }}>
            {user.email || '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>الإيميل لا يمكن تغييره</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>👤 الاسم</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك الكامل" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            📱 رقم التليفون
            {!user.phone && <span style={{ marginRight: 8, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>⚠️ غير مكتمل</span>}
          </label>
          <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" type="tel" dir="ltr" />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>📌 رقمك بيُستخدم لإرسال الإشعارات عبر واتساب</div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={save} disabled={saving}>
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ البيانات'}
        </button>
      </div>

      {/* بطاقة الباقة */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📦 باقتك الحالية</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '8px 18px', borderRadius: 20, fontWeight: 700, fontSize: 14, background: isPremium ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.12)', color: isPremium ? '#f59e0b' : 'var(--text-muted)', border: `1px solid ${isPremium ? 'rgba(245,158,11,0.3)' : 'var(--border)'}` }}>
              {planLabel}
            </div>
          </div>
          {!isPremium && (
            <button className="btn btn-accent btn-sm" onClick={() => onShowPricing && onShowPricing()}>
              👑 ترقية الباقة
            </button>
          )}
          {isPremium && <span style={{ fontSize: 12, color: 'var(--success)' }}>✅ أنت على أعلى باقة</span>}
        </div>
      </div>

      {/* بطاقة تغيير كلمة المرور */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPassSection ? 20 : 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>🔐 تغيير كلمة المرور</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPassSection(v => !v)}>
            {showPassSection ? '✕ إغلاق' : '✏️ تغيير'}
          </button>
        </div>
        {showPassSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>كلمة المرور الحالية</label>
              <input className="form-input" type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="••••••••" dir="ltr" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>كلمة المرور الجديدة</label>
              <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>تأكيد كلمة المرور الجديدة</label>
              <input className="form-input" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" dir="ltr" />
            </div>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={changePassword} disabled={savingPass}>
              {savingPass ? '⏳ جاري التغيير...' : '🔐 تأكيد تغيير كلمة المرور'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// ==================== ADMIN LOGIN PAGE ====================
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
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>محطة بترومين — Admin Only</div>
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
const AdminPanel = () => {
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
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>إدارة الإشعارات والملاك — محطة بترومين</div>
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
              <textarea className="form-input" rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="اكتب تفاصيل الإشعار هنا..." maxLength={400} style={{ resize: 'vertical', minHeight: 100 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'left' }}>{body.length}/400</div>
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
                      ? encodeURIComponent(`⛽ محطة بترومين
مرحباً يا ${o.name} 👋

${typeIcons[latestAnn.type] || 'ℹ️'} ${latestAnn.title}
─────────────────
${latestAnn.body}
─────────────────
فريق بترومين 🚀`)
                      : encodeURIComponent(`⛽ محطة بترومين
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
                        const ref = doc(db, 'owners', o.id, 'settings', 'subscription');
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
  const [announcements, setAnnouncements] = useState([]);
  const ref = useRef(null);

  // تحميل الإشعارات من Admin عند فتح التطبيق (للملاك فقط)
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

    // 0) إشعارات المطور (announcements) — للملاك فقط
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
      // 1) عمال خصوماتهم عالية
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

      // 5) عمال بيانات ناقصة
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
          notifs.push({
            id: `worker_delays`,
            type: 'warning', icon: '⏰',
            title: `${workerRecord.delays.length} تأخير مسجل هذا الشهر`,
            sub: `إجمالي الخصم: ${fmt(workerRecord.delays.reduce((s,d)=>s+(d.deduction||0),0))}`,
            time: '', ts: now - 2000,
            page: 'profile', hint: '← عرض ملفك الشخصي',
          });
        }
        if (workerRecord.absences?.length > 0) {
          notifs.push({
            id: `worker_absences`,
            type: 'danger', icon: '📅',
            title: `${workerRecord.absences.length} غياب مسجل`,
            sub: `إجمالي الخصم: ${fmt(workerRecord.absences.reduce((s,a)=>s+(a.deduction||0),0))}`,
            time: '', ts: now - 3000,
            page: 'profile', hint: '← عرض ملفك الشخصي',
          });
        }
        const rewards = (workerRecord.discipline||[]).filter(d=>d.reward>0);
        if (rewards.length > 0) {
          notifs.push({
            id: `worker_rewards`,
            type: 'success', icon: '⭐',
            title: `${rewards.length} مكافأة انضباط`,
            sub: `إجمالي المكافآت: ${fmt(rewards.reduce((s,d)=>s+(d.reward||0),0))}`,
            time: '', ts: now - 4000,
            page: 'profile', hint: '← عرض ملفك الشخصي',
          });
        }
        const net = calcNet(workerRecord);
        const pct = workerRecord.salary > 0 ? Math.round((net/workerRecord.salary)*100) : 100;
        if (pct < 80 && workerRecord.salary > 0) {
          notifs.push({
            id: `worker_net_low`,
            type: 'danger', icon: '💰',
            title: `صافي راتبك ${pct}% هذا الشهر`,
            sub: `${fmt(net)} من أصل ${fmt(workerRecord.salary)}`,
            time: '', ts: now - 10000,
            page: 'profile', hint: '← عرض ملفك الشخصي',
          });
        }
      }
    }

    return notifs.sort((a,b) => b.ts - a.ts);
  }, [user, workers, ownerId, announcements]);

  const notifications = buildNotifications();
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem(`notif_read_${user?.id}`, JSON.stringify(allIds));
  };

  const handleNotifClick = (n) => {
    // تعليم كمقروء
    if (!readIds.includes(n.id)) {
      const updated = [...readIds, n.id];
      setReadIds(updated);
      localStorage.setItem(`notif_read_${user?.id}`, JSON.stringify(updated));
    }
    // الانتقال للصفحة
    if (n.page && onNavigate) {
      onNavigate(n.page, n);
      setOpen(false);
    }
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-notif' : ''}`}
        onClick={() => setOpen(!open)}
        title="الإشعارات"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-hdr">
            <div className="notif-hdr-title">
              🔔 الإشعارات
              {unreadCount > 0 && <span style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 600, marginRight: 6 }}>({unreadCount} جديد)</span>}
            </div>
            {unreadCount > 0 && (
              <button className="notif-clear-btn" onClick={markAllRead}>تحديد الكل كمقروء</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔕</div>
                <div>لا توجد إشعارات حالياً</div>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!readIds.includes(n.id) ? 'unread' : ''} ${n.page ? 'clickable' : ''}`}
                onClick={() => handleNotifClick(n)}
              >
                <div className={`notif-icon-wrap type-${n.type}`}>{n.icon}</div>
                <div className="notif-text">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-sub">{n.sub}</div>
                  {n.time && <div className="notif-time">🕐 {n.time}</div>}
                  {n.page && <div className="notif-nav-hint">{n.hint} ↗</div>}
                </div>
                {!readIds.includes(n.id) && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== APP ====================
const App = ({ onShowPricing }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [workers, setWorkers] = useState([]);
  const [workPlaces, setWorkPlaces] = useState([]);
  const [ownerUsers, setOwnerUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      collection(db, 'owners', oid, 'workers'),
      (snap) => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // workplaces
    const unsubPlaces = onSnapshot(
      collection(db, 'owners', oid, 'workplaces'),
      (snap) => setWorkPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    // users
    const unsubUsers = onSnapshot(
      collection(db, 'owners', oid, 'members'),
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
    return () => {
      unsubWorkers(); unsubPlaces(); unsubUsers();
      unsubscribeListeners.current = [];
    };
  }, [user]);

  const saveWorkers = async (list, ownerId) => {
    // حفظ كل عامل كـ document منفصل
    for (const w of list) {
      await setDoc(doc(db, 'owners', ownerId, 'workers', String(w.id)), w);
    }
  };

  const setWorkersAndSave = async (updater) => {
    const oid = getOwnerId(user);
    if (!oid) return;
    const newList = typeof updater === 'function' ? updater(workers) : updater;
    setWorkers(newList);
    for (const w of newList) {
      await setDoc(doc(db, 'owners', oid, 'workers', String(w.id)), w);
    }
  };

  const defaults = { owner: 'dashboard', manager: 'workers', worker: 'profile' };

  const handleLogin = (u) => {
    setUser(u);
    setPage(defaults[u.role] || 'workers');
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
      try { await deleteDoc(doc(db, 'owners', oid, 'members', uid)); } catch(e) { console.warn('members delete:', e); }
      // 3) امسحه من workers
      try { await deleteDoc(doc(db, 'owners', oid, 'workers', uid)); } catch(e) { console.warn('workers delete:', e); }
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
    await setDoc(doc(db, 'owners', ownerId, 'workers', String(newUser.id)), newWorker);
    await setDoc(doc(db, 'owners', ownerId, 'members', String(newUser.id)), newUser);
  };

  const titles = { dashboard: '📊 لوحة التحكم', workers: '👷 إدارة العمال', reports: '📋 التقارير الشهرية', profile: '👤 ملفي الشخصي', accounts: '🔐 إدارة الحسابات', salary_payment: '💵 صرف الرواتب', month_archive: '📦 أرشيف الشهور', owner_profile: '👤 ملفي الشخصي' };
  const workerRecord = user?.role === 'worker' ? workers.find(w => w.id === user.id) : null;

  const updateWorker = async (updated) => {
    const oid = getOwnerId(user);
    if (!oid) return;
    await setDoc(doc(db, 'owners', oid, 'workers', String(updated.id)), updated);
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
      <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <div className="topbar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="topbar-title">{titles[page]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell user={user} workers={workers} onNavigate={handleNavigate} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
              <div>{user.roleLabel}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{user.name[0]}</div>
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
            <WorkersPage workers={workers} setWorkers={async (updater) => {
              const oid = getOwnerId(user);
              const newList = typeof updater === 'function' ? updater(workers) : updater;
              // اعرف مين اتحذف
              const deletedWorkers = workers.filter(w => !newList.find(n => n.id === w.id));
              // احذفهم من Firebase
              for (const w of deletedWorkers) {
                await deleteDoc(doc(db, 'owners', oid, 'workers', String(w.id)));
              }
              // حدّث الباقيين
              for (const w of newList) {
                await setDoc(doc(db, 'owners', oid, 'workers', String(w.id)), w);
              }
            }} />
          )}
          {page === 'reports' && <ReportsPage workers={workers} ownerId={getOwnerId(user)} onResetMonth={(resetWorkers) => {
              const oid = getOwnerId(user);
              resetWorkers.forEach(async w => {
                await setDoc(doc(db, 'owners', oid, 'workers', String(w.id)), w);
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
            <OwnerProfilePage user={user} onUpdate={(updated) => setUser(updated)} onShowPricing={() => onShowPricing && onShowPricing()} />
          )}
          {page === 'accounts' && user.role === 'owner' && (
            <AccountsPage
              users={ownerUsers}
              currentUser={user}
              workers={workers}
              onAddWorker={async (w) => {
                const oid = getOwnerId(user);
                await setDoc(doc(db, 'owners', oid, 'workers', String(w.id)), w);
              }}
              onAddUser={async (u) => {
                const oid = getOwnerId(user);
                await setDoc(doc(db, 'owners', oid, 'members', String(u.id)), u);
                await setDoc(doc(db, 'users', String(u.id)), u);
                setOwnerUsers(prev => [...prev, u]);
              }}
              onEditUser={async (id, updated) => {
                const oid = getOwnerId(user);
                await updateDoc(doc(db, 'owners', oid, 'members', String(id)), updated);
                await updateDoc(doc(db, 'users', String(id)), updated);
                setOwnerUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
              }}
              onDeleteUser={handleDeleteUser}
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
