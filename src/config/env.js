const IS_STAGING = import.meta.env.VITE_APP_ENV === 'staging' ||
  (typeof window !== 'undefined' && localStorage.getItem('app_mode') === 'staging');

export const COLLECTION_PREFIX = IS_STAGING ? 'test_' : '';

if (typeof window !== 'undefined') {
  console.log(`🔥 App Mode: ${IS_STAGING ? 'STAGING 🧪' : 'PRODUCTION 🚀'}`);
  console.log(`📦 Using collections: ${COLLECTION_PREFIX}owners, ${COLLECTION_PREFIX}workers`);
}
