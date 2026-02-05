import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import type { User, UserRole } from '../../types';
import { COLLECTIONS } from '../../constants';

const googleProvider = new GoogleAuthProvider();

// Convert Firebase User to App User
export const getUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: firebaseUser.uid,
        email: data.email || firebaseUser.email || '',
        role: data.role || 'seller',
        displayName: data.displayName || firebaseUser.displayName || '',
        photoURL: data.photoURL || firebaseUser.photoURL,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        lastLogin: data.lastLogin instanceof Timestamp ? data.lastLogin.toDate() : new Date(),
        status: data.status || 'active',
        shopId: data.shopId,
      };
    }
    
    // If user document doesn't exist, create it from Firebase Auth data
    console.log('User document not found, creating from Firebase Auth data...');
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: 'seller',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      lastLogin: new Date(),
      status: 'active',
    };
    
    // Create the user document
    await createUserDocument(
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.displayName || 'User'
    );
    
    return newUser;
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Return basic user data from Firebase Auth as fallback
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: 'seller',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      lastLogin: new Date(),
      status: 'active',
    };
  }
};

// Create user document in Firestore
export const createUserDocument = async (
  uid: string,
  email: string,
  displayName: string,
  role: UserRole = 'seller',
  shopId?: string
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(userRef, {
    uid,
    email,
    displayName,
    role,
    photoURL: null,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    status: role === 'seller' ? 'pending' : 'active',
    shopId: shopId || null,
  });
};

// Register with email and password
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'seller'
): Promise<FirebaseUser> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update profile with display name
  await updateProfile(user, { displayName });
  
  // Create user document in Firestore
  await createUserDocument(user.uid, email, displayName, role);
  
  // Send email verification
  await sendEmailVerification(user);
  
  return user;
};

// Login with email and password
export const loginWithEmail = async (email: string, password: string): Promise<User | null> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  await updateDoc(userRef, {
    lastLogin: serverTimestamp(),
  });
  
  return getUserData(user);
};

// Login with Google
export const loginWithGoogle = async (): Promise<User | null> => {
  const { user } = await signInWithPopup(auth, googleProvider);
  
  // Check if user document exists
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
  
  if (!userDoc.exists()) {
    // Create user document for new Google users
    await createUserDocument(
      user.uid,
      user.email || '',
      user.displayName || 'User',
      'seller'
    );
  } else {
    // Update last login
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
  }
  
  return getUserData(user);
};

// Logout
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  const user = auth.currentUser;
  if (user) {
    await sendEmailVerification(user);
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Pick<User, 'displayName' | 'photoURL'>>
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  
  // Update Firebase Auth profile
  const user = auth.currentUser;
  if (user) {
    await updateProfile(user, updates);
  }
};

// Auth state listener
export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Check if email is verified
export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified || false;
};
