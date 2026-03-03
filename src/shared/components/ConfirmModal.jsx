export const ConfirmModal = ({ message, onConfirm, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" style={{ maxWidth: 400, animation: 'fadeIn .2s ease' }}>
      <div className="modal-header">
        <div className="modal-title">⚠️ تأكيد</div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8 }}>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-danger" onClick={onConfirm}>✓ تأكيد</button>
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
      </div>
    </div>
  </div>
);
