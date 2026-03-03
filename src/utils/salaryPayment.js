import { doc, getDoc, setDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../config/env';
import { db } from '../firebase';

// ==================== SALARY PAYMENT UTILS ====================
export const getPaymentRecords = (ownerId) => {
  try { return JSON.parse(localStorage.getItem('owner_' + ownerId + '_payments') || '[]'); } catch { return []; }
};
export const savePaymentRecords = async (ownerId, list) => {
  localStorage.setItem('owner_' + ownerId + '_payments', JSON.stringify(list));
  try { await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}meta`, 'payments'), { list }); } catch {}
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