import { useState } from 'react';
import { useToast } from '../../../shared/components/Toast';
import { validateNum } from '../../../utils/helpers';

// ==================== WORKER MODAL ====================
export const WorkerModal = ({ worker, onSave, onClose }) => {
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