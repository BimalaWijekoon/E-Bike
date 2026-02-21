// Firebase Connection Test
// Run this in browser console after starting dev server

console.log('🔍 Testing Firebase Connection...\n');

// Check environment variables
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

console.log('📋 Configuration Check:');
console.log('✅ API Key:', config.apiKey ? 'Loaded' : '❌ Missing');
console.log('✅ Auth Domain:', config.authDomain || '❌ Missing');
console.log('✅ Project ID:', config.projectId || '❌ Missing');
console.log('✅ Storage Bucket:', config.storageBucket || '❌ Missing');

// Test Firebase services
import { db, storage, auth } from './src/services/firebase/config';

console.log('\n🔧 Services Check:');
console.log('✅ Firestore:', db ? 'Initialized' : '❌ Failed');
console.log('✅ Storage:', storage ? 'Initialized' : '❌ Failed');
console.log('✅ Auth:', auth ? 'Initialized' : '❌ Failed');

// Test Firestore read
import { collection, getDocs } from 'firebase/firestore';

async function testFirestore() {
  try {
    console.log('\n🗄️  Testing Firestore...');
    const bikesRef = collection(db, 'bikes');
    const snapshot = await getDocs(bikesRef);
    console.log('✅ Firestore connection successful!');
    console.log(`📊 Found ${snapshot.size} bikes in database`);
    return true;
  } catch (error) {
    console.error('❌ Firestore error:', error.message);
    return false;
  }
}

// Test Storage
import { ref, listAll } from 'firebase/storage';

async function testStorage() {
  try {
    console.log('\n📦 Testing Storage...');
    const storageRef = ref(storage, 'bikes');
    await listAll(storageRef);
    console.log('✅ Storage connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Storage error:', error.message);
    if (error.code === 'storage/unauthorized') {
      console.log('⚠️  Deploy storage rules: firebase deploy --only storage');
    }
    return false;
  }
}

// Run tests
(async () => {
  await testFirestore();
  await testStorage();
  console.log('\n✅ Firebase setup verification complete!');
})();
