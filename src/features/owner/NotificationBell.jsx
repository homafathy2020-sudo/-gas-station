import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { COLLECTION_PREFIX } from '../../config/env';
import { db } from '../../firebase';

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
        const subSnap = await getDoc(doc(db, `${COLLECTION_PREFIX}owners`, o.id, `${COLLECTION_PREFIX}settings`, 'subscription'));
        const plan = subSnap.exists() ? (subSnap.data().plan || 'trial') : 'trial';
        return { ...o, plan };
      } catch { return { ...o, plan: 'trial' }; }
    }));
    return withPlans;
  } catch { return []; }
};

// ==================== OWNER PROFILE PAGE ====================