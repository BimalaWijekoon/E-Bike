import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Sale, SaleFormData, DateRange } from '../../types';
import { COLLECTIONS, DEFAULT_PAGE_SIZE } from '../../constants';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// Convert Firestore document to Sale type
const convertToSale = (doc: QueryDocumentSnapshot<DocumentData>): Sale => {
  const data = doc.data();
  const totalPrice = data.totalPrice || (data.unitPrice * data.quantity);
  const discountAmount = ((totalPrice * (data.discount || 0)) / 100);
  return {
    saleId: doc.id,
    shopId: data.shopId,
    sellerId: data.sellerId,
    bikeId: data.bikeId,
    bikeName: data.bikeName,
    bikeCategory: data.bikeCategory,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    discount: data.discount || 0,
    totalPrice: totalPrice,
    finalPrice: data.finalPrice || (totalPrice - discountAmount),
    paymentMethod: data.paymentMethod,
    customerInfo: data.customerInfo,
    customerName: data.customerName || data.customerInfo?.name,
    invoiceNumber: data.invoiceNumber,
    status: data.status,
    saleDate: data.saleDate instanceof Timestamp ? data.saleDate.toDate() : new Date(data.saleDate),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
};

// Generate invoice number
const generateInvoiceNumber = (): string => {
  const date = format(new Date(), 'yyyyMMdd');
  const uniqueId = uuidv4().substring(0, 8).toUpperCase();
  return `INV-${date}-${uniqueId}`;
};

// Get all sales
export const getAllSales = async (): Promise<Sale[]> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  const q = query(salesRef, orderBy('saleDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToSale);
};

// Get sales with pagination
export const getSalesPaginated = async (
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  filters?: {
    shopId?: string;
    sellerId?: string;
    bikeId?: string;
    status?: string;
    dateRange?: DateRange;
  }
): Promise<{ sales: Sale[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  let q = query(salesRef, orderBy('saleDate', 'desc'), limit(pageSize));

  if (filters?.shopId) {
    q = query(q, where('shopId', '==', filters.shopId));
  }

  if (filters?.sellerId) {
    q = query(q, where('sellerId', '==', filters.sellerId));
  }

  if (filters?.bikeId) {
    q = query(q, where('bikeId', '==', filters.bikeId));
  }

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const sales = snapshot.docs.map(convertToSale);
  const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { sales, lastDoc: newLastDoc };
};

// Get sales by shop
export const getSalesByShop = async (shopId: string): Promise<Sale[]> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  const q = query(
    salesRef,
    where('shopId', '==', shopId),
    orderBy('saleDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToSale);
};

// Get sales by seller
export const getSalesBySeller = async (sellerId: string): Promise<Sale[]> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  const q = query(
    salesRef,
    where('sellerId', '==', sellerId),
    orderBy('saleDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToSale);
};

// Get sales by date range
export const getSalesByDateRange = async (
  startDate: Date,
  endDate: Date,
  shopId?: string
): Promise<Sale[]> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  let q = query(
    salesRef,
    where('saleDate', '>=', Timestamp.fromDate(startDate)),
    where('saleDate', '<=', Timestamp.fromDate(endDate)),
    orderBy('saleDate', 'desc')
  );

  if (shopId) {
    q = query(q, where('shopId', '==', shopId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToSale);
};

// Get single sale by ID
export const getSaleById = async (saleId: string): Promise<Sale | null> => {
  const saleRef = doc(db, COLLECTIONS.SALES, saleId);
  const saleDoc = await getDoc(saleRef);
  
  if (!saleDoc.exists()) {
    return null;
  }

  const data = saleDoc.data();
  const totalPrice = data.totalPrice || (data.unitPrice * data.quantity);
  const discountAmount = ((totalPrice * (data.discount || 0)) / 100);
  return {
    saleId: saleDoc.id,
    shopId: data.shopId,
    sellerId: data.sellerId,
    bikeId: data.bikeId,
    bikeName: data.bikeName,
    bikeCategory: data.bikeCategory,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    discount: data.discount || 0,
    totalPrice: totalPrice,
    finalPrice: data.finalPrice || (totalPrice - discountAmount),
    paymentMethod: data.paymentMethod,
    customerInfo: data.customerInfo,
    customerName: data.customerName || data.customerInfo?.name,
    invoiceNumber: data.invoiceNumber,
    status: data.status,
    saleDate: data.saleDate instanceof Timestamp ? data.saleDate.toDate() : new Date(data.saleDate),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
};

// Record a new sale
export const recordSale = async (
  saleData: SaleFormData,
  shopId: string,
  sellerId: string,
  bikeName: string
): Promise<string> => {
  const batch = writeBatch(db);
  
  // Calculate total price
  const subtotal = saleData.unitPrice * saleData.quantity;
  const discountAmount = (subtotal * saleData.discount) / 100;
  const totalPrice = subtotal - discountAmount;

  // Create sale document
  const salesRef = collection(db, COLLECTIONS.SALES);
  const newSaleRef = doc(salesRef);
  
  batch.set(newSaleRef, {
    shopId,
    sellerId,
    bikeId: saleData.bikeId,
    bikeName,
    quantity: saleData.quantity,
    unitPrice: saleData.unitPrice,
    discount: saleData.discount,
    totalPrice,
    paymentMethod: saleData.paymentMethod,
    customerInfo: saleData.customerInfo || null,
    invoiceNumber: generateInvoiceNumber(),
    status: 'completed',
    saleDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update shop inventory stock
  const inventoryRef = collection(db, COLLECTIONS.SHOP_INVENTORY);
  const inventoryQuery = query(
    inventoryRef,
    where('shopId', '==', shopId),
    where('bikeId', '==', saleData.bikeId)
  );
  const inventorySnapshot = await getDocs(inventoryQuery);
  
  if (!inventorySnapshot.empty) {
    const inventoryDoc = inventorySnapshot.docs[0];
    const currentStock = inventoryDoc.data().stock;
    batch.update(inventoryDoc.ref, {
      stock: Math.max(0, currentStock - saleData.quantity),
      updatedAt: serverTimestamp(),
    });
  }

  // Update shop total sales and revenue
  const shopRef = doc(db, COLLECTIONS.SHOPS, shopId);
  const shopDoc = await getDoc(shopRef);
  if (shopDoc.exists()) {
    const shopData = shopDoc.data();
    batch.update(shopRef, {
      totalSales: (shopData.totalSales || 0) + saleData.quantity,
      totalRevenue: (shopData.totalRevenue || 0) + totalPrice,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return newSaleRef.id;
};

// Update sale status
export const updateSaleStatus = async (
  saleId: string,
  status: 'completed' | 'refunded' | 'cancelled'
): Promise<void> => {
  const saleRef = doc(db, COLLECTIONS.SALES, saleId);
  await updateDoc(saleRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// Get sales statistics
export const getSalesStats = async (
  shopId?: string,
  dateRange?: DateRange
): Promise<{
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  totalQuantity: number;
}> => {
  let sales: Sale[];

  if (dateRange?.startDate && dateRange?.endDate) {
    sales = await getSalesByDateRange(dateRange.startDate, dateRange.endDate, shopId);
  } else if (shopId) {
    sales = await getSalesByShop(shopId);
  } else {
    sales = await getAllSales();
  }

  // Filter only completed sales
  const completedSales = sales.filter((sale) => sale.status === 'completed');

  const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const totalQuantity = completedSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalSales = completedSales.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return {
    totalRevenue,
    totalSales,
    averageOrderValue,
    totalQuantity,
  };
};

// Get today's sales
export const getTodaySales = async (shopId?: string): Promise<Sale[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getSalesByDateRange(today, tomorrow, shopId);
};

// Get this week's sales
export const getWeekSales = async (shopId?: string): Promise<Sale[]> => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return getSalesByDateRange(startOfWeek, endOfWeek, shopId);
};

// Get this month's sales
export const getMonthSales = async (shopId?: string): Promise<Sale[]> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return getSalesByDateRange(startOfMonth, endOfMonth, shopId);
};

// Get sales by bike
export const getSalesByBike = async (bikeId: string): Promise<Sale[]> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  const q = query(
    salesRef,
    where('bikeId', '==', bikeId),
    orderBy('saleDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToSale);
};

// Get top selling bikes
export const getTopSellingBikes = async (
  limitCount: number = 10,
  shopId?: string
): Promise<{ bikeId: string; bikeName: string; totalSold: number; totalRevenue: number }[]> => {
  let sales: Sale[];
  
  if (shopId) {
    sales = await getSalesByShop(shopId);
  } else {
    sales = await getAllSales();
  }

  // Filter completed sales
  const completedSales = sales.filter((sale) => sale.status === 'completed');

  // Aggregate by bike
  const bikeStats = new Map<string, { bikeName: string; totalSold: number; totalRevenue: number }>();

  completedSales.forEach((sale) => {
    const existing = bikeStats.get(sale.bikeId);
    if (existing) {
      existing.totalSold += sale.quantity;
      existing.totalRevenue += sale.totalPrice;
    } else {
      bikeStats.set(sale.bikeId, {
        bikeName: sale.bikeName,
        totalSold: sale.quantity,
        totalRevenue: sale.totalPrice,
      });
    }
  });

  // Sort by total sold and limit
  return Array.from(bikeStats.entries())
    .map(([bikeId, stats]) => ({ bikeId, ...stats }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, limitCount);
};

// Get recent sales
export const getRecentSales = async (
  limitCount: number = 10,
  shopId?: string
): Promise<Sale[]> => {
  const salesRef = collection(db, COLLECTIONS.SALES);
  let q = query(salesRef, orderBy('saleDate', 'desc'), limit(limitCount));

  if (shopId) {
    q = query(q, where('shopId', '==', shopId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToSale);
};

// Alias for backward compatibility
export const createSale = recordSale;
