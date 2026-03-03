import { doc, setDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../config/env';
import { db } from '../firebase';

export const getMonthArchives = (ownerId) => {
  try { return JSON.parse(localStorage.getItem('owner_' + ownerId + '_month_archives') || '[]'); } catch { return []; }
};
export const saveMonthArchives = async (ownerId, list) => {
  localStorage.setItem('owner_' + ownerId + '_month_archives', JSON.stringify(list));
  try { await setDoc(doc(db, `${COLLECTION_PREFIX}owners`, ownerId, `${COLLECTION_PREFIX}meta`, 'monthArchives'), { list }); } catch {}
};
