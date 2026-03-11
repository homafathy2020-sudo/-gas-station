import { useState, useCallback, useContext, createContext, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, getDocs, query, where } from "firebase/firestore";

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
/* ===== STATION SWITCHER ===== */
.station-switcher { position: relative; }
.station-switcher-btn { display: flex; align-items: center; gap: 8px; padding: 7px 13px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-family: 'Cairo',sans-serif; font-size: 13px; font-weight: 600; color: var(--text); transition: all .2s; white-space: nowrap; max-width: 200px; }
.station-switcher-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--primary-light); }
.station-switcher-btn .st-name { overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: right; }
.station-switcher-btn .st-arrow { font-size: 10px; color: var(--text-muted); flex-shrink: 0; transition: transform .2s; }
.station-switcher-btn.open .st-arrow { transform: rotate(180deg); }
.station-switcher-dropdown { position: absolute; top: calc(100% + 8px); left: 0; min-width: 240px; background: var(--dark-2); border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 300; overflow: hidden; animation: fadeIn .18s ease; }
.station-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background .15s; border-bottom: 1px solid rgba(255,255,255,0.04); }
.station-item:last-child { border-bottom: none; }
.station-item:hover { background: rgba(26,86,219,0.1); }
.station-item.active { background: rgba(26,86,219,0.15); }
.station-item-icon { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg,var(--primary),var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.station-item-name { font-size: 13px; font-weight: 700; }
.station-item-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.station-item-check { margin-right: auto; color: var(--primary-light); font-size: 15px; }
.station-switcher-footer { padding: 10px 14px; border-top: 1px solid var(--border); }
.stations-page { max-width: 760px; margin: 0 auto; animation: fadeIn .3s ease; }
.station-card { background: var(--card); border: 2px solid var(--border); border-radius: 18px; padding: 22px; display: flex; align-items: center; gap: 16px; transition: all .2s; margin-bottom: 14px; }
.station-card:hover { background: var(--card-hover); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.station-card.active-station { border-color: rgba(26,86,219,0.4); background: linear-gradient(135deg,rgba(26,86,219,0.07),rgba(26,86,219,0.02)); }
.station-card-icon { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg,var(--primary),var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.station-card-name { font-size: 16px; font-weight: 800; }
.station-card-meta { font-size: 12px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap; }
.station-limit-bar { background: linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03)); border: 1px solid rgba(245,158,11,0.25); border-radius: 14px; padding: 16px 20px; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }


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

  let msg = '⛽ WaqoudPro\n';
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

// ── الدوال دي بتستخدم localStorage كـ cache سريع + بتحفظ في Firestore في الخلفية ──
// عشان كده الكود القديم اللي بيستدعيها sync هيشتغل عادي

const _lsKey = (ownerId, type) => `owner_${ownerId}_${type}`;

// Invites
const getInvites = (ownerId) => {
  try { return JSON.parse(localStorage.getItem(_lsKey(ownerId,'invites')) || '[]'); } catch { return []; }
};
const saveInvites = async (ownerId, list, ownerCode) => {
  localStorage.setItem(_lsKey(ownerId,'invites'), JSON.stringify(list));
  try { await setDoc(doc(db,'owners',ownerId,'meta','invites'), { list }); } catch {}
  if (ownerCode) {
    try { await setDoc(doc(db,'ownerCodes',ownerCode), { ownerId, inviteList: list }, { merge: true }); } catch(e) { console.warn('ownerCodes inviteList update failed:', e.code); }
  }
};
// مزامنة من Firestore للـ cache
const syncInvites = async (ownerId) => {
  try {
    if (d.exists()) localStorage.setItem(_lsKey(ownerId,'invites'), JSON.stringify(d.data().list || []));
  } catch {}
};


// ==================== BACKUP SYSTEM ====================
const MAX_BACKUPS = 30;
const BACKUP_INTERVAL_HOURS = 24;

// جلب كل الـ backups مرتبة من الأحدث للأقدم
const getBackupsList = async (ownerId) => {
  try {
    const snap = await getDocs(backupsCol(ownerId));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  } catch { return []; }
};

// إنشاء backup جديد
const createBackup = async (ownerId, workers, workPlaces, members, label = 'تلقائي') => {
  const now = new Date().toISOString();
  const backupId = `backup_${Date.now()}`;

  const snapshot = {
    id: backupId,
    label,
    createdAt: now,
    workersCount: workers.length,
    data: {
      workers,
      workPlaces,
      members,
    }
  };

  // احفظ الـ backup
  await setDoc(backupDoc(ownerId, backupId), snapshot);

  // حدّث آخر وقت backup
  await setDoc(backupMetaDoc(ownerId), { lastBackupAt: now }, { merge: true });

  // لو عدد الـ backups أكبر من الحد → احذف الأقدم
  const allBackups = await getBackupsList(ownerId);
  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(MAX_BACKUPS);
    for (const b of toDelete) {
      try { await deleteDoc(backupDoc(ownerId, b.id)); } catch {}
    }
  }

  return backupId;
};

// استعادة backup — بيكتب فوق البيانات الحالية
const restoreBackup = async (ownerId, backup) => {
  const { workers = [], workPlaces = [], members = [] } = backup.data || {};

  // 1) احذف كل العمال الحاليين
  for (const d of currentWorkers.docs) {
    try { await deleteDoc(doc(db, 'owners', ownerId, 'workers', d.id)); } catch {}
  }
  // 2) احذف كل الـ workplaces الحالية
  for (const d of currentPlaces.docs) {
    try { await deleteDoc(doc(db, 'owners', ownerId, 'workplaces', d.id)); } catch {}
  }
  // 3) احذف كل الـ members الحاليين
  for (const d of currentMembers.docs) {
    try { await deleteDoc(doc(db, 'owners', ownerId, 'members', d.id)); } catch {}
  }

  // 4) أعد كتابة البيانات من الـ backup
  for (const w of workers) {
    await setDoc(doc(db, 'owners', ownerId, 'workers', String(w.id)), w);
  }
  for (const p of workPlaces) {
    await setDoc(doc(db, 'owners', ownerId, 'workplaces', String(p.id)), p);
  }
  for (const m of members) {
    await setDoc(doc(db, 'owners', ownerId, 'members', String(m.id)), m);
  }
};

// هل محتاج backup تلقائي؟ (لو آخر backup أكثر من 24 ساعة)
const shouldAutoBackup = async (ownerId) => {
  try {
    const metaSnap = await getDoc(backupMetaDoc(ownerId));
    if (!metaSnap.exists()) return true;
    const lastAt = metaSnap.data().lastBackupAt;
    if (!lastAt) return true;
    const hoursSinceLast = (Date.now() - new Date(lastAt)) / (1000 * 60 * 60);
    return hoursSinceLast >= BACKUP_INTERVAL_HOURS;
  } catch { return false; }
};

// ==================== BACKUP CARD (UI) ====================
const BackupCard = ({ ownerId, workers, workPlaces, ownerUsers }) => {
  const toast = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null); // backup id
  const [confirmRestore, setConfirmRestore] = useState(null); // backup object
  const [expandedId, setExpandedId] = useState(null);

  const loadBackups = async () => {
    setLoading(true);
    const list = await getBackupsList(ownerId);
    setBackups(list);
    setLoading(false);
  };

  useEffect(() => { loadBackups(); }, [ownerId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createBackup(ownerId, workers, workPlaces, ownerUsers, 'يدوي');
      toast('✅ تم إنشاء النسخة الاحتياطية بنجاح', 'success');
      await loadBackups();
    } catch { toast('❌ فشل إنشاء النسخة الاحتياطية', 'error'); }
    setCreating(false);
  };

  const handleRestore = async (backup) => {
    setRestoring(backup.id);
    try {
      // أولاً: احفظ backup من الحالة الحالية قبل الاستعادة
      await createBackup(ownerId, workers, workPlaces, ownerUsers, `قبل استعادة ${fmtBackupDate(backup.createdAt)}`);
      // ثانياً: استعد البيانات
      await restoreBackup(ownerId, backup);
      toast('✅ تمت الاستعادة — سيتم تحديث البيانات تلقائياً', 'success');
      await loadBackups();
    } catch { toast('❌ فشلت الاستعادة، حاول مرة أخرى', 'error'); }
    setRestoring(null);
    setConfirmRestore(null);
  };

  const handleDelete = async (backupId) => {
    try {
      await deleteDoc(backupDoc(ownerId, backupId));
      toast('تم حذف النسخة', 'info');
      setBackups(prev => prev.filter(b => b.id !== backupId));
    } catch { toast('فشل الحذف', 'error'); }
  };

  const fmtBackupDate = (iso) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return `${date} — ${time}`;
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡️ النسخ الاحتياطية
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            نسخة تلقائية كل 24 ساعة • آخر {MAX_BACKUPS} نسخة محفوظة
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={creating}>
          {creating ? '⏳ جاري الحفظ...' : '➕ نسخة الآن'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 100, background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary-light)' }}>{backups.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>نسخة محفوظة</div>
        </div>
        <div style={{ flex: 1, minWidth: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{backups[0] ? timeAgo(backups[0].createdAt) : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>آخر نسخة</div>
        </div>
        <div style={{ flex: 1, minWidth: 100, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{workers.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>عامل حالياً</div>
        </div>
      </div>

      {/* Backups list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>⏳ جاري التحميل...</div>
      ) : backups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
          <div style={{ fontWeight: 600 }}>لا توجد نسخ احتياطية بعد</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>اضغط "نسخة الآن" لإنشاء أول نسخة</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {backups.map((b, idx) => (
            <div key={b.id} style={{
              background: idx === 0 ? 'rgba(26,86,219,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${idx === 0 ? 'rgba(26,86,219,0.2)' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                <div style={{ fontSize: 20 }}>{b.label === 'يدوي' ? '✋' : b.label?.startsWith('قبل') ? '🔄' : '🤖'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtBackupDate(b.createdAt)}</span>
                    {idx === 0 && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>الأحدث</span>}
                    <span style={{ fontSize: 10, background: b.label === 'يدوي' ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.1)', color: b.label === 'يدوي' ? '#3b82f6' : 'var(--text-muted)', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{b.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {b.workersCount} عامل • {timeAgo(b.createdAt)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{expandedId === b.id ? '▲' : '▼'}</div>
              </div>

              {/* Expanded actions */}
              {expandedId === b.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)' }}>
                  <button className="btn btn-success btn-sm"
                    onClick={() => setConfirmRestore(b)}
                    disabled={!!restoring}>
                    {restoring === b.id ? '⏳ جاري الاستعادة...' : '♻️ استعادة هذه النسخة'}
                  </button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(b.id)}
                    disabled={!!restoring}>
                    🗑️ حذف
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 'auto' }}>
                    📦 {b.workersCount} عامل • {(b.data?.workPlaces || []).length} مكان عمل
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm restore modal */}
      {confirmRestore && (
        <div className="modal-overlay" onClick={() => !restoring && setConfirmRestore(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">♻️ تأكيد الاستعادة</div>
              <button className="close-btn" onClick={() => !restoring && setConfirmRestore(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>⚠️ تحذير مهم</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                  سيتم <b style={{ color: 'var(--text)' }}>استبدال كل البيانات الحالية</b> ببيانات هذه النسخة.
                  سيتم حفظ نسخة من الحالة الحالية تلقائياً قبل الاستعادة.
                </div>
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <b>النسخة المختارة:</b> {fmtBackupDate(confirmRestore.createdAt)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                تحتوي على <b style={{ color: 'var(--text)' }}>{confirmRestore.workersCount} عامل</b>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-success" onClick={() => handleRestore(confirmRestore)} disabled={!!restoring} style={{ flex: 1, justifyContent: 'center' }}>
                {restoring ? '⏳ جاري الاستعادة...' : '✅ نعم، استعد البيانات'}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmRestore(null)} disabled={!!restoring}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
const WorkerModal = ({ worker, onSave, onClose, activeStationId }) => {
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
    onSave({ ...form, workDays: +form.workDays, salary: +form.salary, phone: form.phone || '', id: worker?.id || Date.now(), avatar: form.name[0] || '؟', delays: worker?.delays || [], absences: worker?.absences || [], absences_no_reason: worker?.absences_no_reason || [], discipline: worker?.discipline || [], stationId: worker?.stationId || activeStationId });
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
const TODAY = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })).toISOString().split('T')[0];
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
const WorkerDetail = ({ worker, onUpdate, isWorkerView = false, canEdit = true, ownerId }) => {
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
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>⛽ {w.pump || 'غير محدد'}</div>
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

      {/* تصفية الوردية - للمالك فقط (إذا كان ownerId موجود) */}
      {!isWorkerView && ownerId && <ShiftSettlement worker={w} ownerId={ownerId} />}

      {/* السحب النقدي - عرض للعامل */}
      {isWorkerView && <div className="detail-section">
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{(w.cash_withdrawals || []).length} مرة</span></div>
        </div>
        {(!w.cash_withdrawals || w.cash_withdrawals.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سحب نقدي مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
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
          </div>}
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
const WorkersPage = ({ workers, setWorkers, ownerId, activeStationId }) => {
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
      {workerModal !== null && <WorkerModal worker={workerModal === 'add' ? null : workerModal} onSave={saveWorker} onClose={() => setWorkerModal(null)} activeStationId={activeStationId} />}
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
        ? <WorkerDetail key={selected.id} worker={selected} onUpdate={updateWorker} ownerId={ownerId} />
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

// ==================== XLSX BUILDER ====================
const loadJSZip = (cb) => {
  if (window.JSZip) { cb(window.JSZip); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  s.onload = () => cb(window.JSZip);
  document.head.appendChild(s);
};

const buildXlsxBlob = (sheets) => {
  const runWithJSZip = (JSZip, filename) => {
    const zip = new JSZip();

    const STYLES = {
      // 0=default, 1=title, 2=header-blue, 3=header-green, 4=header-red, 5=header-orange
      // 6=row-even, 7=row-odd, 8=total, 9=total-red, 10=num-red, 11=num-green, 12=num-red-odd, 13=num-green-odd
      // 14=salary, 15=subtitle, 16=net
      fills: ['none','#1a56db','#1a56db','#059669','#dc2626','#d97706','#f0f4ff','#e8edf8','#1e293b','#1e293b','#f0f4ff','#f0fdf4','#e8edf8','#f0fdf4','#fff8e1','#334155','#064e3b'],
      fgColors: ['000000','ffffff','ffffff','ffffff','ffffff','ffffff','1e293b','1e293b','f8fafc','ef4444','ef4444','10b981','ef4444','10b981','d97706','f8fafc','ffffff'],
      bold: [false,true,true,true,true,true,false,false,true,true,false,false,false,false,true,true,true],
      sz: [11,14,11,11,11,11,11,11,12,12,11,11,11,11,13,12,13],
      align: ['right','center','center','center','center','center','right','right','center','center','right','right','right','right','right','center','center'],
    };

    const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const colLetter = n => {
      let r = ''; n++;
      while (n > 0) { r = String.fromCharCode(65 + ((n-1)%26)) + r; n = Math.floor((n-1)/26); }
      return r;
    };

    sheets.forEach((sh, si) => {
      const rows = sh.rows || [];
      const colWidths = sh.colWidths || [];
      const merges = sh.merges || [];

      let sharedStrings = [];
      let ssMap = {};
      const addSS = v => { const s = String(v); if (ssMap[s] === undefined) { ssMap[s] = sharedStrings.length; sharedStrings.push(s); } return ssMap[s]; };

      let wsRows = '';
      rows.forEach((row, ri) => {
        const ht = row.ht ? ` ht="${row.ht}" customHeight="1"` : '';
        wsRows += `<row r="${ri+1}"${ht}>`;
        (row.cells || []).forEach((cell, ci) => {
          if (!cell) return;
          const addr = colLetter(ci) + (ri+1);
          const si2 = cell.s ?? 0;
          if (cell.t === 'n' && cell.v !== '' && cell.v !== undefined) {
            wsRows += `<c r="${addr}" s="${si2}" t="n"><v>${cell.v}</v></c>`;
          } else if (cell.v !== '' && cell.v !== undefined) {
            const idx = addSS(cell.v);
            wsRows += `<c r="${addr}" s="${si2}" t="s"><v>${idx}</v></c>`;
          } else {
            wsRows += `<c r="${addr}" s="${si2}"/>`;
          }
        });
        wsRows += '</row>';
      });

      const maxCol = Math.max(...rows.map(r => (r.cells||[]).length)) - 1;
      const colDefs = colWidths.map((w,i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
      const mergeDefs = merges.length ? `<mergeCells>${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
      const sheetRef = `A1:${colLetter(maxCol)}${rows.length}`;

      const wsXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${colDefs}</cols>
<sheetData>${wsRows}</sheetData>
${mergeDefs}
</worksheet>`;

      zip.file(`xl/worksheets/sheet${si+1}.xml`, wsXml);

      // shared strings per sheet — collect all
      sh._ss = sharedStrings;
      sh._ssMap = ssMap;
    });

    // merge all shared strings
    let allSS = [];
    let allSSMap = {};
    sheets.forEach(sh => {
      (sh._ss||[]).forEach(s => { if (allSSMap[s] === undefined) { allSSMap[s] = allSS.length; allSS.push(s); } });
    });

    // rebuild sheets with unified shared string indices
    sheets.forEach((sh, si) => {
      const rows = sh.rows || [];
      let wsRows = '';
      rows.forEach((row, ri) => {
        const ht = row.ht ? ` ht="${row.ht}" customHeight="1"` : '';
        wsRows += `<row r="${ri+1}"${ht}>`;
        (row.cells||[]).forEach((cell, ci) => {
          if (!cell) return;
          const addr = colLetter(ci) + (ri+1);
          const s = cell.s ?? 0;
          if (cell.t === 'n' && cell.v !== '' && cell.v !== undefined) {
            wsRows += `<c r="${addr}" s="${s}" t="n"><v>${cell.v}</v></c>`;
          } else if (cell.v !== '' && cell.v !== undefined) {
            const idx = allSSMap[String(cell.v)];
            wsRows += `<c r="${addr}" s="${s}" t="s"><v>${idx}</v></c>`;
          } else {
            wsRows += `<c r="${addr}" s="${s}"/>`;
          }
        });
        wsRows += '</row>';
      });

      const colWidths = sh.colWidths || [];
      const merges = sh.merges || [];
      const maxCol = Math.max(...rows.map(r => (r.cells||[]).length)) - 1;
      const colDefs = colWidths.map((w,i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
      const mergeDefs = merges.length ? `<mergeCells>${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';

      const wsXml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${colDefs}</cols>
<sheetData>${wsRows}</sheetData>
${mergeDefs}
</worksheet>`;
      zip.file(`xl/worksheets/sheet${si+1}.xml`, wsXml);
    });

    // shared strings xml
    const ssXml = `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${allSS.length}" uniqueCount="${allSS.length}">
${allSS.map(s=>`<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}
</sst>`;
    zip.file('xl/sharedStrings.xml', ssXml);

    // styles
    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="${STYLES.sz.length}">
${STYLES.sz.map((sz,i)=>`<font><sz val="${sz}"/><name val="Cairo"/>${STYLES.bold[i]?'<b/>':''}<color rgb="FF${STYLES.fgColors[i]}"/></font>`).join('')}
</fonts>
<fills count="${STYLES.fills.length+2}">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
${STYLES.fills.map(f=>f==='none'?'<fill><patternFill patternType="none"/></fill>':`<fill><patternFill patternType="solid"><fgColor rgb="FF${f.replace('#','')}"/></patternFill></fill>`).join('')}
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${STYLES.sz.length}">
${STYLES.sz.map((_,i)=>`<xf numFmtId="${i>=10&&i<=13?4:0}" fontId="${i}" fillId="${i+2}" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="${STYLES.align[i]}" vertical="center" wrapText="1"/></xf>`).join('')}
</cellXfs>
</styleSheet>`;
    zip.file('xl/styles.xml', stylesXml);

    // workbook
    const wbXml = `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
${sheets.map((sh,i)=>`<sheet name="${esc(sh.name||('Sheet'+(i+1)))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}
</sheets>
</workbook>`;
    zip.file('xl/workbook.xml', wbXml);

    // rels
    const wbRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}
<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId${sheets.length+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    zip.file('xl/_rels/workbook.xml.rels', wbRels);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);

    zip.generateAsync({ type: 'blob' }).then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };
  return { runWithJSZip };
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
    { cells: [C('WaqoudPro',15),E(15),E(15),E(15),E(15),E(15),E(15),E(15)], ht: 26 },
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
                        'مرحباً يا ' + w.name + ' 👋\n' +
                        'أرسلت إليك WaqoudPro تفاصيل راتبك ⛽\n' +
                        '─────────────────\n' +
                        '📅 راتب شهر ' + months[now.getMonth()] + ' ' + now.getFullYear() + '\n' +
                        '📍 مكان العمل: ' + (w.pump || '—') + '\n' +
                        '─────────────────\n' +
                        '💰 الراتب الأساسي: ' + fmt(w.salary) + '\n' +
                        (w.delays.length > 0 ? '\n⏰ التأخيرات:\n' + w.delays.map(d => '   • ' + (d.date || '—') + ' ← -' + fmt(d.deduction||0)).join('\n') + '\n' : '') +
                        (w.absences.length > 0 ? '\n🚫 الغيابات:\n' + w.absences.map(a => '   • ' + (a.date || '—') + ' ← -' + fmt(a.deduction||0)).join('\n') + '\n' : '') +
                        ((w.absences_no_reason||[]).length > 0 ? '\n⚠️ العجز:\n' + (w.absences_no_reason||[]).map(a => '   • ' + (a.date || '—') + ' ← -' + fmt(a.deduction||0)).join('\n') + '\n' : '') +
                        ((w.discipline||[]).filter(d=>d.reward>0).length > 0 ? '\n🎁 الحوافز:\n' + (w.discipline||[]).filter(d=>d.reward>0).map(d => '   • ' + (d.date || '—') + ' ← +' + fmt(d.reward||0)).join('\n') + '\n' : '') +
                        ((w.cash_withdrawals||[]).length > 0 ? '\n💵 السحوبات النقدية:\n' + (w.cash_withdrawals||[]).map(c => '   • ' + (c.date || '—') + ' ← -' + fmt(c.amount||0)).join('\n') + '\n' : '') +
                        '\n─────────────────\n' +
                        '✅ صافي المدفوع: ' + fmt(net) + '\n' +
                        '─────────────────\n' +
                        '🕐 تاريخ الصرف: ' + new Date().toLocaleDateString('ar-EG') + '\n\n' +
                        'شكراً على مجهودك وتفانيك في العمل 💪\n' +
                        '_تم الإرسال عبر WaqoudPro_'
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
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [showReset, setShowReset] = useState(false);
  const toast = useToast();
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const archives = getMonthArchives(ownerId);
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
  const archivedMonth = !isCurrentMonth ? archives.find(a => a.month === month && a.year === year) : null;
  const displayWorkers = archivedMonth ? (archivedMonth.workerSnapshots || []) : workers;
  const totalSal = displayWorkers.reduce((s, w) => s + w.salary, 0);
  const allDed = displayWorkers.reduce((s, w) => s + totalDed(w), 0);
  const allRewards = displayWorkers.reduce((s, w) => s + totalRewards(w), 0);
  const allCash = displayWorkers.reduce((s, w) => s + totalCash(w), 0);
  const totalNet = displayWorkers.reduce((s, w) => s + calcNet(w), 0);
  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }} className="no-print">
        <select className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
        <select className="form-input" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>{[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}</select>
        <button className="btn btn-accent" onClick={() => { if (!planHasExcelAdv(getPlan())) { toast('تقارير Excel المتقدمة متاحة في الباقة المميزة فقط 👑', 'warning'); return; } generateMonthlyReport(displayWorkers, month, year, months[month]); toast('جاري تحميل ملف Excel', 'info'); }}>📊 تحميل Excel {!planHasExcelAdv(getPlan()) && '🔒'}</button>
        <button className="btn btn-ghost" onClick={() => { window.print(); toast('جاري الطباعة', 'info'); }}>🖨️ طباعة</button>
        {onResetMonth && planHasMonthReset(getPlan()) && <button className="btn btn-danger" style={{marginRight:'auto'}} onClick={() => setShowReset(true)}>🔄 إغلاق الشهر وبدء شهر جديد</button>}{onResetMonth && !planHasMonthReset(getPlan()) && <button className="btn btn-ghost" style={{marginRight:'auto', opacity:.6}} onClick={() => toast('أرشفة الشهور متاحة في الباقة المميزة فقط 👑','warning')}>🔄 إغلاق الشهر 🔒</button>}
      </div>
      {showReset && <MonthResetModal workers={workers} ownerId={ownerId} onReset={onResetMonth} onClose={() => setShowReset(false)} />}
      {archivedMonth && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }} className="no-print">
          <span style={{ fontSize: 18 }}>📦</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>بيانات مؤرشفة — {months[month]} {year}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>أُغلق {new Date(archivedMonth.archivedAt).toLocaleDateString('ar-EG')}</span>
        </div>
      )}
      {!isCurrentMonth && !archivedMonth && (
        <div style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }} className="no-print">
          <span style={{ fontSize: 18 }}>📭</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>لا يوجد أرشيف محفوظ لـ {months[month]} {year}</span>
        </div>
      )}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>التقرير الشهري — {months[month]} {year}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>WaqoudPro</div>
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
              {displayWorkers.map(w => (
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

// ==================== SHIFT SETTLEMENT COMPONENT ====================
const ShiftSettlement = ({ worker, ownerId }) => {
  if (!ownerId) return null;

  const [tab, setTab] = useState('calc');
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');
  const [price, setPrice] = useState('');
  const [received, setReceived] = useState('');
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('morning');
  const [fuelType, setFuelType] = useState('بنزين 92');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`shift_history_${ownerId}_${worker.id}`) || '[]');
    } catch { return []; }
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const shiftLabels = { morning: '🌅 صباحية', evening: '🌆 مسائية', night: '🌙 ليلية' };
  const fuelTypes = ['بنزين 80', 'بنزين 92', 'بنزين 95', 'سولار'];

  const validate = () => {
    const e = {};
    if (!morning) e.morning = 'مطلوب';
    if (!evening) e.evening = 'مطلوب';
    if (!price || parseFloat(price) <= 0) e.price = 'مطلوب';
    if (!received) e.received = 'مطلوب';
    if (morning && evening && parseFloat(evening) <= parseFloat(morning)) e.evening = 'يجب أن تكون أكبر من البداية';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const calculate = () => {
    if (!validate()) return;
    setSaved(false);
    const qty = parseFloat(evening) - parseFloat(morning);
    const required = qty * parseFloat(price);
    const recv = parseFloat(received);
    const diff = recv - required;
    setResult({ qty, required, recv, diff, date: shiftDate, shiftType, fuelType, note });
  };

  const saveToHistory = () => {
    if (!result) return;
    const entry = {
      id: Date.now(), ...result,
      morning: parseFloat(morning), evening: parseFloat(evening), price: parseFloat(price),
      workerName: worker.name, savedAt: new Date().toLocaleString('ar-EG'),
    };
    const newHistory = [entry, ...history].slice(0, 50);
    setHistory(newHistory);
    try { localStorage.setItem(`shift_history_${ownerId}_${worker.id}`, JSON.stringify(newHistory)); } catch {}
    setSaved(true);
  };

  const deleteEntry = (id) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    try { localStorage.setItem(`shift_history_${ownerId}_${worker.id}`, JSON.stringify(newHistory)); } catch {}
  };

  const reset = () => {
    setMorning(''); setEvening(''); setReceived('');
    setNote(''); setResult(null); setSaved(false); setErrors({});
  };

  const stats = history.length > 0 ? {
    totalShifts: history.length,
    totalSurplus: history.filter(h => h.diff > 0).reduce((s, h) => s + h.diff, 0),
    totalDeficit: history.filter(h => h.diff < 0).reduce((s, h) => s + Math.abs(h.diff), 0),
  } : null;

  const inp = (field) => ({
    width: '100%', padding: '10px 13px',
    background: errors[field] ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${errors[field] ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, color: 'var(--text)', fontFamily: "'Cairo', sans-serif",
    fontSize: 14, outline: 'none', textAlign: 'right', transition: 'all 0.2s',
  });

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, marginBottom: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⛽</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>تصفية الوردية</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{worker.name} · {worker.pump}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10 }}>
          {[['calc', '🧮 الحساب'], ['history', `📋 السجل${history.length > 0 ? ` (${history.length})` : ''}`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, background: tab === key ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent', color: tab === key ? '#0f172a' : 'var(--text-muted)', transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ===== TAB: الحساب ===== */}
      {tab === 'calc' && (
        <div style={{ padding: '20px 22px' }}>
          {/* التاريخ + نوع الوردية */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 تاريخ الوردية</div>
              <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} max={new Date().toISOString().split('T')[0]} style={inp()} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🕐 نوع الوردية</div>
              <select value={shiftType} onChange={e => setShiftType(e.target.value)} style={inp()}>
                <option value="morning">🌅 صباحية</option>
                <option value="evening">🌆 مسائية</option>
                <option value="night">🌙 ليلية</option>
              </select>
            </div>
          </div>

          {/* قراءات العداد */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ قراءات العداد (لتر)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>قراءة البداية</div>
                <input type="number" min="0" max="99999999" placeholder="مثال: 12450" value={morning} onChange={e => { const v = e.target.value; if (v === '' || parseFloat(v) <= 99999999) { setMorning(v); setErrors(p => ({ ...p, morning: '' })); } }} style={inp('morning')} />
                {errors.morning && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.morning}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>قراءة النهاية</div>
                <input type="number" min="0" max="99999999" placeholder="مثال: 15320" value={evening} onChange={e => { const v = e.target.value; if (v === '' || parseFloat(v) <= 99999999) { setEvening(v); setErrors(p => ({ ...p, evening: '' })); } }} style={inp('evening')} />
                {errors.evening && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.evening}</div>}
              </div>
            </div>
            {morning && evening && parseFloat(evening) > parseFloat(morning) && (
              <div style={{ marginTop: 8, padding: '7px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                ⚡ الكمية: {(parseFloat(evening) - parseFloat(morning)).toFixed(2)} لتر
              </div>
            )}
          </div>

          {/* نوع الوقود + السعر */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛢️ نوع الوقود</div>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={inp()}>
                {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 سعر اللتر (ج.م)</div>
              <input type="number" step="0.01" placeholder="مثال: 8.75" value={price} onChange={e => { setPrice(e.target.value); setErrors(p => ({ ...p, price: '' })); }} style={inp('price')} />
              {errors.price && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.price}</div>}
            </div>
          </div>

          {/* الواصل من العامل */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💵 المبلغ الواصل من العامل (ج.م)</div>
            <input type="number" placeholder="المبلغ الفعلي اللي سلّمه العامل" value={received} onChange={e => { setReceived(e.target.value); setErrors(p => ({ ...p, received: '' })); }} style={{ ...inp('received'), fontSize: 15, padding: '12px 15px' }} />
            {errors.received && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors.received}</div>}
          </div>

          {/* ملاحظة */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 ملاحظة (اختياري)</div>
            <input type="text" placeholder="مثال: مشكلة في الطلمبة..." value={note} onChange={e => setNote(e.target.value)} style={inp()} />
          </div>

          {/* أزرار */}
          <div style={{ display: 'flex', gap: 10, marginBottom: result ? 20 : 0 }}>
            <button onClick={calculate} style={{ flex: 1, padding: '11px 20px', borderRadius: 11, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: 800 }}>🧮 احسب التصفية</button>
            <button onClick={reset} style={{ padding: '11px 16px', borderRadius: 11, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 600 }}>↺ مسح</button>
          </div>

          {/* النتيجة */}
          {result && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${result.diff > 0 ? 'rgba(16,185,129,0.35)' : result.diff < 0 ? 'rgba(239,68,68,0.35)' : 'rgba(148,163,184,0.3)'}`, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ padding: '16px 20px', background: result.diff > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' : result.diff < 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))' : 'linear-gradient(135deg, rgba(148,163,184,0.1), rgba(148,163,184,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{shiftLabels[result.shiftType]} · {result.date} · {result.fuelType}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{result.diff > 0 ? '✅ زيادة' : result.diff < 0 ? '❌ عجز' : '✔️ تمام بالظبط'}</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: result.diff > 0 ? '#10b981' : result.diff < 0 ? '#ef4444' : '#94a3b8' }}>
                  {result.diff > 0 ? '+' : ''}{result.diff.toFixed(2)} ج
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'الكمية المباعة', value: `${result.qty.toFixed(2)} لتر`, icon: '⚡' },
                  { label: 'المبلغ المطلوب', value: `${result.required.toFixed(2)} ج`, icon: '🎯', color: '#f59e0b' },
                  { label: 'الواصل فعلياً', value: `${result.recv.toFixed(2)} ج`, icon: '💵', color: '#3b82f6' },
                  { label: result.diff >= 0 ? 'الزيادة' : 'العجز', value: `${Math.abs(result.diff).toFixed(2)} ج`, icon: result.diff >= 0 ? '📈' : '📉', color: result.diff >= 0 ? '#10b981' : '#ef4444' },
                ].map(({ label, value, icon, color }, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderLeft: i % 2 === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>{icon} {label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {result.note && <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.1)' }}>📝 {result.note}</div>}
              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                {!saved ? (
                  <button onClick={saveToHistory} style={{ padding: '8px 18px', borderRadius: 9, cursor: 'pointer', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700 }}>💾 حفظ في السجل</button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 13, fontWeight: 700 }}>✅ تم الحفظ في السجل</span>
                )}
                <button onClick={() => window.print()} style={{ padding: '8px 14px', borderRadius: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>🖨️ طباعة</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: السجل ===== */}
      {tab === 'history' && (
        <div style={{ padding: '20px 22px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>لا يوجد سجل بعد</div>
              <div style={{ fontSize: 13 }}>احسب تصفية واحفظها وهتظهر هنا</div>
            </div>
          ) : (
            <>
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'إجمالي الورديات', value: stats.totalShifts, color: '#3b82f6', icon: '📊' },
                    { label: 'إجمالي الزيادات', value: `${stats.totalSurplus.toFixed(0)} ج`, color: '#10b981', icon: '📈' },
                    { label: 'إجمالي العجز', value: `${stats.totalDeficit.toFixed(0)} ج`, color: '#ef4444', icon: '📉' },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h) => (
                  <div key={h.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '13px 16px', border: `1px solid ${h.diff > 0 ? 'rgba(16,185,129,0.2)' : h.diff < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{shiftLabels[h.shiftType] || '⛽ وردية'} · {h.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.fuelType} · {h.qty?.toFixed(1)} لتر · المطلوب: {h.required?.toFixed(0)} ج · الواصل: {h.recv?.toFixed(0)} ج</div>
                      {h.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📝 {h.note}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, minWidth: 90, textAlign: 'left', color: h.diff > 0 ? '#10b981' : h.diff < 0 ? '#ef4444' : '#94a3b8' }}>
                        {h.diff > 0 ? '+' : ''}{h.diff.toFixed(2)} ج
                      </div>
                      <button onClick={() => deleteEntry(h.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 7, cursor: 'pointer', padding: '5px 9px', fontSize: 13 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== END SHIFT SETTLEMENT ====================

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
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>⛽ {w.pump || 'غير محدد'}</div>
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
      <div className="detail-section" style={{ marginBottom: 18 }}>
        <div className="detail-section-hdr">
          <div className="detail-section-title">💵 السحب النقدي <span className="badge badge-blue">{(w.cash_withdrawals || []).length} مرة</span></div>
        </div>
        {(!w.cash_withdrawals || w.cash_withdrawals.length === 0)
          ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✅ لا يوجد سحب نقدي مسجل</div>
          : <div style={{ overflowX: 'auto' }}>
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
          </div>}
      </div>

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
      await setDoc(doc(db, 'owners', currentUser.id, 'members', uid), fullUser);

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
        await setDoc(doc(db, 'owners', currentUser.id, 'workers', uid), workerEntry);
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
          const codeDoc = await getDoc(doc(db, 'ownerCodes', cleanCode));
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
        await setDoc(doc(db, 'owners', uid, 'settings', 'subscription'), {
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
          const currentList = inviteDoc.exists() ? (inviteDoc.data().list || []) : [];
          const updatedList = currentList.filter(x => norm(x) !== workerNorm);
          await setDoc(doc(db, 'owners', ownerData.id, 'meta', 'invites'), { list: updatedList });
          await setDoc(doc(db, 'ownerCodes', ownerData.ownerCode), { inviteList: updatedList }, { merge: true });
        } catch (e) {}
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
const Sidebar = ({ user, page, setPage, onLogout, isOpen, onClose, collapsed }) => {
  const navs = {
    owner: [
      { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
      { id: 'workers', icon: '👷', label: 'إدارة العمال' },
      { id: 'reports', icon: '📋', label: 'التقارير' },
      { id: 'salary_payment', icon: '💵', label: 'صرف الرواتب' },
      { id: 'month_archive', icon: '📦', label: 'أرشيف الشهور' },
      { id: 'stations', icon: '⛽', label: 'محطاتي' },
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
      <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ transform: collapsed ? 'translateX(100%)' : undefined, transition: 'transform 0.3s ease' }}>
        <div className="sidebar-logo"><div className="logo-icon">⛽</div><div><div className="logo-text">WaqoudPro</div><div className="logo-sub">نظام المحطات الذكي</div></div></div>
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

// ==================== TRIAL SYSTEM ====================
const TRIAL_DAYS = 15;
const WHATSAPP_NUMBER = '201220523598';

// ---- Firebase-based trial & plan helpers ----

const getOwnerTrialDoc = (ownerId) => doc(db, 'owners', ownerId, 'meta', 'trial');

const initTrialIfNeeded = async (ownerId) => {
  try {
    const ref = getOwnerTrialDoc(ownerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        trialStart: new Date().toISOString(),
        plan: 'trial',
      });
    }
  } catch(e) {
    // العامل ممكن ما يكونش عنده صلاحية كتابة — مش مشكلة
    if (e.code !== 'permission-denied') console.error('initTrial error:', e.code);
  }
};

const getTrialInfoFromDB = async (ownerId) => {
  try {
    const ref = getOwnerTrialDoc(ownerId);
    const snap = await getDoc(ref);
    let data = snap.exists() ? snap.data() : null;
    if (!data) {
      // لو مش موجود وعنده صلاحية كتابة، ابدأ trial جديد
      try {
        const startDate = new Date().toISOString();
        await setDoc(ref, { trialStart: startDate, plan: 'trial' });
        data = { trialStart: startDate, plan: 'trial' };
      } catch(writeErr) {
        // العامل ما عندوش صلاحية كتابة — استخدم بيانات افتراضية
        data = { trialStart: new Date().toISOString(), plan: 'trial' };
      }
    }
    const start = new Date(data.trialStart);
    const now = new Date();
    const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
    const expired = elapsedDays >= TRIAL_DAYS;
    return { remaining, expired, elapsedDays, startDate: data.trialStart, plan: data.plan || 'trial' };
  } catch(e) {
    if (e.code !== 'permission-denied') console.error('getTrialInfo error:', e.code);
    return { remaining: 0, expired: false, elapsedDays: 0, startDate: null, plan: 'trial' };
  }
};

const setPlanInDB = async (ownerId, plan) => {
  const ref = getOwnerTrialDoc(ownerId);
  await updateDoc(ref, { plan });
};

// legacy fallback (غير مستخدم للمستخدمين المسجلين)
const getTrialInfo = () => {
  const startDate = localStorage.getItem('app_trial_start');
  // لو مفيش تاريخ → رجّع قيم افتراضية بدون ما نكتب تاريخ جديد
  // التاريخ الحقيقي بييجي من Firebase عن طريق getTrialInfoFromDB
  if (!startDate) {
    return { remaining: TRIAL_DAYS, expired: false, elapsedDays: 0, startDate: null };
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

// حدود المحطات
const STATION_LIMITS = { free: 1, basic: 1, pro: 3, enterprise: 3, lifetime: Infinity, trial: Infinity };
const getStationLimit = (plan) => STATION_LIMITS[plan] ?? 1;

// Firestore helpers للمحطات
const getStations = async (ownerId) => {
  try {
    const snap = await getDocs(collection(db, 'owners', ownerId, 'stations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('getStations error:', e);
    return [];
  }
};
const saveStation = async (ownerId, station) => {
  await setDoc(doc(db, 'owners', ownerId, `stations`, String(station.id)), station);
};
const deleteStation = async (ownerId, stationId) => {
  await deleteDoc(doc(db, 'owners', ownerId, `stations`, String(stationId)));
};
const ACTIVE_STATION_KEY = (ownerId) => `owner_${ownerId}_active_station`;

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


// ===== STATION SWITCHER COMPONENT =====
const StationSwitcher = ({ stations, activeStation, onSwitch, onManage }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  if (!stations || stations.length === 0) return null;
  const current = stations.find(s => s.id === activeStation) || stations[0];
  return (
    <div className="station-switcher" ref={ref}>
      <button className={`station-switcher-btn ${open ? 'open' : ''}`} onClick={() => setOpen(v => !v)}>
        <span style={{ fontSize: 16 }}>⛽</span>
        <span className="st-name">{current?.name || 'اختر محطة'}</span>
        <span className="st-arrow">▼</span>
      </button>
      {open && (
        <div className="station-switcher-dropdown">
          {stations.map(s => (
            <div key={s.id} className={`station-item ${s.id === activeStation ? 'active' : ''}`}
              onClick={() => { onSwitch(s.id); setOpen(false); }}>
              <div className="station-item-icon">⛽</div>
              <div style={{ flex: 1 }}>
                <div className="station-item-name">{s.name}</div>
                <div className="station-item-sub">{s.address || 'لا يوجد عنوان'}</div>
              </div>
              {s.id === activeStation && <span className="station-item-check">✓</span>}
            </div>
          ))}
          <div className="station-switcher-footer">
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { onManage(); setOpen(false); }}>⚙️ إدارة المحطات</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== STATIONS MANAGEMENT PAGE =====
const StationsPage = ({ ownerId, stations, activeStation, onSetActive, onRefresh }) => {
  const toast = useToast();
  const plan = getPlan();
  const limit = getStationLimit(plan);
  const [showModal, setShowModal] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const openAdd = () => {
    if (stations.length >= limit && limit !== Infinity) { toast(`باقتك تسمح بـ ${limit} محطة فقط — قم بالترقية لإضافة المزيد 🔒`, 'warning'); return; }
    setEditStation(null); setForm({ name: '', address: '' }); setShowModal(true);
  };
  const openEdit = (s) => { setEditStation(s); setForm({ name: s.name, address: s.address || '' }); setShowModal(true); };
  const save = async () => {
    if (!form.name.trim()) { toast('اسم المحطة مطلوب', 'error'); return; }
    setSaving(true);
    try {
      if (editStation) {
        await saveStation(ownerId, { ...editStation, name: form.name.trim(), address: form.address.trim() });
        toast('تم تعديل المحطة ✓', 'success');
      } else {
        const ns = { id: String(Date.now()), name: form.name.trim(), address: form.address.trim(), createdAt: new Date().toISOString() };
        await saveStation(ownerId, ns);
        if (stations.length === 0) onSetActive(ns.id);
        toast('تم إضافة المحطة ✓', 'success');
      }
      await onRefresh(); setShowModal(false);
    } catch { toast('حدث خطأ، حاول مرة أخرى', 'error'); }
    setSaving(false);
  };
  const handleDelete = async (s) => {
    if (stations.length <= 1) { toast('لا يمكن حذف المحطة الوحيدة', 'warning'); return; }
    if (!window.confirm(`هل أنت متأكد من حذف "${s.name}"؟`)) return;
    setDeleting(s.id);
    try {
      await deleteStation(ownerId, s.id);
      if (activeStation === s.id) { const r = stations.filter(x => x.id !== s.id); if (r.length) onSetActive(r[0].id); }
      await onRefresh(); toast('تم حذف المحطة', 'info');
    } catch { toast('حدث خطأ في الحذف', 'error'); }
    setDeleting(null);
  };
  const planLabels = { free: 'مجانية', basic: 'أساسية', pro: 'احترافية', enterprise: 'مميزة', lifetime: 'مدى الحياة', trial: 'تجريبية' };
  return (
    <div className="stations-page">
      <div className="station-limit-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛽</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>محطاتك</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stations.length} من {limit === Infinity ? 'غير محدود' : limit} محطات — باقة {planLabels[plan] || plan}</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ إضافة محطة {stations.length >= limit && limit !== Infinity ? '🔒' : ''}</button>
      </div>
      {stations.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⛽</div><div className="empty-title">لا توجد محطات بعد</div><button className="btn btn-primary" style={{marginTop:16}} onClick={openAdd}>+ إضافة أول محطة</button></div>
      ) : stations.map(s => (
        <div key={s.id} className={`station-card ${s.id === activeStation ? 'active-station' : ''}`}>
          <div className="station-card-icon">⛽</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="station-card-name">{s.name}</div>
              {s.id === activeStation && <span style={{ background: 'rgba(26,86,219,0.2)', color: 'var(--primary-light)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ نشطة</span>}
            </div>
            <div className="station-card-meta">{s.address && <span>📍 {s.address}</span>}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {s.id !== activeStation && <button className="btn btn-blue btn-sm" onClick={() => onSetActive(s.id)}>⚡ تفعيل</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️</button>
            {stations.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)} disabled={deleting === s.id}>{deleting === s.id ? '...' : '🗑️'}</button>}
          </div>
        </div>
      ))}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{editStation ? '✏️ تعديل المحطة' : '⛽ إضافة محطة'}</div><button className="close-btn" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">اسم المحطة *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: محطة المنصورة" /></div>
              <div className="form-group"><label className="form-label">العنوان (اختياري)</label><input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="مثال: شارع النيل" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : editStation ? '💾 حفظ' : '✅ إضافة'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
      price: '4,999',
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

  const msg = encodeURIComponent(`مرحباً، أريد الاشتراك في WaqoudPro لإدارة المحطة 🚀`);
  const wa = (plan) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`مرحباً، أريد الاشتراك في خطة "${plan}" — WaqoudPro ⛽`)}`;

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
              if (info?.startDate) { localStorage.setItem('app_trial_start', info.startDate); }
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
            try {
              const [wSnap, pSnap, mSnap] = await Promise.all([
                getDocs(collection(db, 'owners', oid, 'workers')),
                getDocs(collection(db, 'owners', oid, 'workplaces')),
                getDocs(collection(db, 'owners', oid, 'members')),
              ]);
              const ws = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              const ps = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              const ms = mSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => !m.deleted);
              await createBackup(oid, ws, ps, ms, 'تلقائي');
            } catch {}
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
    if (u.role === 'owner' && u.ownerCode) {
      Promise.all([
        getDoc(doc(db, 'ownerCodes', u.ownerCode)),
        getDoc(doc(db, 'owners', u.id, 'meta', 'invites'))
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
    let workerWriteOk = false;
    let memberWriteOk = false;
    try {
      await setDoc(doc(db, 'owners', ownerId, 'workers', String(newUser.id)), newWorker);
      workerWriteOk = true;
    } catch(e) {
      console.error('[DEBUG] workers write FAILED:', e.code, e.message);
      try {
        await setDoc(doc(db, 'owners', ownerId, `pendingWorkers`, String(newUser.id)), {
          ...newWorker, pendingAt: new Date().toISOString(), reason: e.code
        });
      } catch(e2) { console.error('[DEBUG] pendingWorkers fallback FAILED:', e2.code); }
    }
    try {
      await setDoc(doc(db, 'owners', ownerId, 'members', String(newUser.id)), newUser);
      memberWriteOk = true;
    } catch(e) {
      console.error('[DEBUG] members write FAILED:', e.code, e.message);
    }
  };

  const titles = { dashboard: '📊 لوحة التحكم', workers: '👷 إدارة العمال', reports: '📋 التقارير الشهرية', profile: '👤 ملفي الشخصي', accounts: '🔐 إدارة الحسابات', salary_payment: '💵 صرف الرواتب', month_archive: '📦 أرشيف الشهور', owner_profile: '👤 ملفي الشخصي', stations: '⛽ إدارة المحطات' };
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
            <WorkersPage workers={workers.filter(w => !w.stationId || w.stationId === activeStation)} activeStationId={activeStation} ownerId={getOwnerId(user)} setWorkers={async (updater) => {
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
          {page === 'reports' && <ReportsPage workers={workers.filter(w => !w.stationId || w.stationId === activeStation)} ownerId={getOwnerId(user)} onResetMonth={(resetWorkers) => {
              const oid = getOwnerId(user);
              resetWorkers.forEach(async w => {
                await setDoc(doc(db, 'owners', oid, 'workers', String(w.id)), w);
              });
            }} />}
          {page === 'salary_payment' && user.role === 'owner' && (
            planHasSalaryPay(getPlan())
              ? <SalaryPaymentPage workers={workers.filter(w => !w.stationId || w.stationId === activeStation)} ownerId={getOwnerId(user)} />
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
            // مزامنة الباقة وتاريخ بداية الـ trial من Firestore مع localStorage
            if (info?.plan) {
              localStorage.setItem('app_plan', info.plan);
            }
            if (info?.startDate) {
              localStorage.setItem('app_trial_start', info.startDate);
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
