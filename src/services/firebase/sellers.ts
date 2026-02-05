// Firebase Sellers Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { User, UserStatus } from '../../types';

const COLLECTION_NAME = 'users';

// Convert Firestore document to Seller type
const convertSeller = (doc: any): User => {
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    status: data.status,
    photoURL: data.photoURL || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLogin: data.lastLogin?.toDate() || null,
    // Additional seller fields
    phone: data.phone,
    shopName: data.shopName,
  } as User & { phone?: string; shopName?: string };
};

// Extended seller type with additional fields
export interface Seller extends User {
  phone?: string;
  shopName?: string;
}

// Get all sellers
export const getAllSellers = async (): Promise<Seller[]> => {
  try {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(
      usersRef,
      where('role', '==', 'seller'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertSeller) as Seller[];
  } catch (error) {
    console.error('Error fetching sellers:', error);
    throw error;
  }
};

// Get pending sellers
export const getPendingSellers = async (): Promise<Seller[]> => {
  try {
    const usersRef = collection(db, COLLECTION_NAME);
    const q = query(
      usersRef,
      where('role', '==', 'seller'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertSeller) as Seller[];
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    throw error;
  }
};

// Get seller by ID
export const getSellerById = async (uid: string): Promise<Seller | null> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    const sellerDoc = await getDoc(sellerRef);
    
    if (sellerDoc.exists() && sellerDoc.data().role === 'seller') {
      return convertSeller(sellerDoc) as Seller;
    }
    return null;
  } catch (error) {
    console.error('Error fetching seller:', error);
    throw error;
  }
};

// Approve seller
export const approveSeller = async (uid: string): Promise<void> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(sellerRef, {
      status: 'active',
      approvedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving seller:', error);
    throw error;
  }
};

// Reject seller
export const rejectSeller = async (uid: string): Promise<void> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(sellerRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting seller:', error);
    throw error;
  }
};

// Suspend seller
export const suspendSeller = async (uid: string): Promise<void> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(sellerRef, {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error suspending seller:', error);
    throw error;
  }
};

// Reactivate seller
export const reactivateSeller = async (uid: string): Promise<void> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(sellerRef, {
      status: 'active',
      reactivatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error reactivating seller:', error);
    throw error;
  }
};

// Update seller status
export const updateSellerStatus = async (uid: string, status: UserStatus): Promise<void> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(sellerRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating seller status:', error);
    throw error;
  }
};

// Delete seller (use with caution)
export const deleteSeller = async (uid: string): Promise<void> => {
  try {
    const sellerRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(sellerRef);
  } catch (error) {
    console.error('Error deleting seller:', error);
    throw error;
  }
};
