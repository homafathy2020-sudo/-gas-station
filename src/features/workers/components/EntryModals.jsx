import { useState } from 'react';
import { validateNum } from '../../../utils/helpers';

// ==================== ENTRY MODAL ====================
const TODAY = new Date().toISOString().split('T')[0];
export const EntryModal = ({ type, onSave, onClose }) => {
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
export const AbsenceNoReasonModal = ({ onSave, onClose }) => {
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
export const DisciplineModal = ({ onSave, onClose }) => {
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
export const CashWithdrawalModal = ({ onSave, onClose }) => {
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