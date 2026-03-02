import { useCallback, useContext, useState } from 'react';

// ==================== TOAST ====================
let tid = 0;
const ToastCtx = createContext(null);
export const ToastProvider = ({ children }) => {
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
export const useToast = () => useContext(ToastCtx);

// ==================== LOADER ====================
const Loader = () => <div className="loader-overlay"><div className="spinner" /></div>;
