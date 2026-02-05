// Firebase Sales Service
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
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// Sale interface
export interface Sale {
  id: string;
  bikeId: string;
  bikeName: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'financing';
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'sales';

// Convert Firestore document to Sale type
const convertSale = (doc: any): Sale => {
  const data = doc.data();
  return {
    id: doc.id,
    bikeId: data.bikeId,
    bikeName: data.bikeName,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    shopName: data.shopName,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    totalPrice: data.totalPrice,
    paymentMethod: data.paymentMethod,
    status: data.status,
    notes: data.notes,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Get all sales
export const getAllSales = async (): Promise<Sale[]> => {
  try {
    const salesRef = collection(db, COLLECTION_NAME);
    const q = query(salesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertSale);
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

// Get sales by seller
export const getSalesBySeller = async (sellerId: string): Promise<Sale[]> => {
  try {
    const salesRef = collection(db, COLLECTION_NAME);
    const q = query(
      salesRef,
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertSale);
  } catch (error) {
    console.error('Error fetching sales by seller:', error);
    throw error;
  }
};

// Get sales by date range
export const getSalesByDateRange = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  try {
    const salesRef = collection(db, COLLECTION_NAME);
    const q = query(
      salesRef,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertSale);
  } catch (error) {
    console.error('Error fetching sales by date range:', error);
    throw error;
  }
};

// Get sale by ID
export const getSaleById = async (id: string): Promise<Sale | null> => {
  try {
    const saleRef = doc(db, COLLECTION_NAME, id);
    const saleDoc = await getDoc(saleRef);
    
    if (saleDoc.exists()) {
      return convertSale(saleDoc);
    }
    return null;
  } catch (error) {
    console.error('Error fetching sale:', error);
    throw error;
  }
};

// Create sale data interface
export interface CreateSaleData {
  bikeId: string;
  bikeName: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'financing';
  status?: 'completed' | 'pending' | 'cancelled' | 'refunded';
  notes?: string;
}

// Create new sale
export const createSale = async (data: CreateSaleData): Promise<string> => {
  try {
    const salesRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(salesRef, {
      ...data,
      status: data.status || 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

// Update sale
export const updateSale = async (id: string, data: Partial<CreateSaleData>): Promise<void> => {
  try {
    const saleRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(saleRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    throw error;
  }
};

// Delete sale
export const deleteSale = async (id: string): Promise<void> => {
  try {
    const saleRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(saleRef);
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
};

// Analytics helper functions
export const calculateSalesStats = (sales: Sale[]) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalSales = sales.length;
  const completedSales = sales.filter(s => s.status === 'completed').length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  // Sales by payment method
  const byPaymentMethod = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  // Sales by seller
  const bySeller = sales.reduce((acc, sale) => {
    if (!acc[sale.sellerName]) {
      acc[sale.sellerName] = { count: 0, revenue: 0 };
    }
    acc[sale.sellerName].count++;
    acc[sale.sellerName].revenue += sale.totalPrice;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  // Sales by bike
  const byBike = sales.reduce((acc, sale) => {
    if (!acc[sale.bikeName]) {
      acc[sale.bikeName] = { count: 0, revenue: 0 };
    }
    acc[sale.bikeName].count += sale.quantity;
    acc[sale.bikeName].revenue += sale.totalPrice;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  return {
    totalRevenue,
    totalSales,
    completedSales,
    averageOrderValue,
    byPaymentMethod,
    bySeller,
    byBike,
  };
};
