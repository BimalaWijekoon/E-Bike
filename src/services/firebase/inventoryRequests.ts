// Firebase Inventory Requests Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { addToShopInventory } from './shopInventory';
import { getBikeById } from './bikes';

// Inventory Request interface
export interface InventoryRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  bikeId: string;
  bikeName: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

const COLLECTION_NAME = 'inventoryRequests';

// Convert Firestore document to InventoryRequest type
const convertRequest = (doc: any): InventoryRequest => {
  const data = doc.data();
  return {
    id: doc.id,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    shopName: data.shopName,
    bikeId: data.bikeId,
    bikeName: data.bikeName,
    requestedQuantity: data.requestedQuantity,
    approvedQuantity: data.approvedQuantity,
    status: data.status,
    priority: data.priority || 'medium',
    notes: data.notes,
    adminNotes: data.adminNotes,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    processedAt: data.processedAt?.toDate(),
    processedBy: data.processedBy,
  };
};

// Get all inventory requests
export const getAllInventoryRequests = async (): Promise<InventoryRequest[]> => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertRequest);
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    throw error;
  }
};

// Get pending inventory requests
export const getPendingRequests = async (): Promise<InventoryRequest[]> => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    const q = query(
      requestsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertRequest);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw error;
  }
};

// Get requests by seller
export const getRequestsBySeller = async (sellerId: string): Promise<InventoryRequest[]> => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    const q = query(
      requestsRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertRequest);
  } catch (error) {
    console.error('Error fetching requests by seller:', error);
    throw error;
  }
};

// Get request by ID
export const getRequestById = async (id: string): Promise<InventoryRequest | null> => {
  try {
    const requestRef = doc(db, COLLECTION_NAME, id);
    const requestDoc = await getDoc(requestRef);
    
    if (requestDoc.exists()) {
      return convertRequest(requestDoc);
    }
    return null;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw error;
  }
};

// Create request data interface
export interface CreateRequestData {
  sellerId: string;
  sellerName: string;
  shopName: string;
  bikeId: string;
  bikeName: string;
  requestedQuantity: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

// Create new inventory request
export const createInventoryRequest = async (data: CreateRequestData): Promise<string> => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(requestsRef, {
      ...data,
      status: 'pending',
      priority: data.priority || 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating inventory request:', error);
    throw error;
  }
};

// Approve request and add bikes to seller's inventory
export const approveRequest = async (
  id: string, 
  approvedQuantity: number, 
  adminNotes?: string,
  processedBy?: string
): Promise<void> => {
  try {
    // Get the request details
    const request = await getRequestById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    // Get the bike details
    const bike = await getBikeById(request.bikeId);
    if (!bike) {
      throw new Error('Bike not found');
    }

    // Add bikes to seller's shop inventory
    await addToShopInventory(
      request.sellerId,
      request.bikeId,
      bike,
      approvedQuantity
    );

    // Update request status to fulfilled (since we're adding inventory immediately)
    const requestRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(requestRef, {
      status: 'fulfilled',
      approvedQuantity,
      adminNotes,
      processedBy,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
};

// Reject request
export const rejectRequest = async (
  id: string, 
  adminNotes?: string,
  processedBy?: string
): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(requestRef, {
      status: 'rejected',
      adminNotes,
      processedBy,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};

// Mark as fulfilled
export const fulfillRequest = async (id: string): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(requestRef, {
      status: 'fulfilled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error fulfilling request:', error);
    throw error;
  }
};

// Process approved request to add bikes to inventory (for migrating old approved requests)
export const processApprovedRequest = async (id: string): Promise<void> => {
  try {
    // Get the request details
    const request = await getRequestById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'approved') {
      throw new Error('Request is not in approved status');
    }

    if (!request.approvedQuantity) {
      throw new Error('No approved quantity found');
    }

    // Get the bike details
    const bike = await getBikeById(request.bikeId);
    if (!bike) {
      throw new Error('Bike not found');
    }

    // Add bikes to seller's shop inventory
    await addToShopInventory(
      request.sellerId,
      request.bikeId,
      bike,
      request.approvedQuantity
    );

    // Update request status to fulfilled
    const requestRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(requestRef, {
      status: 'fulfilled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error processing approved request:', error);
    throw error;
  }
};

// Delete request
export const deleteRequest = async (id: string): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};
