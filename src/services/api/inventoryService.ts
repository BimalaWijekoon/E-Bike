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
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ShopInventory, ShopInventoryWithBike, InventoryRequest, RequestStatus } from '../../types';
import { COLLECTIONS, LOW_STOCK_THRESHOLD } from '../../constants';
import { getBikeById } from './bikeService';

// Convert Firestore document to ShopInventory type
const convertToInventory = (doc: QueryDocumentSnapshot<DocumentData>): ShopInventory => {
  const data = doc.data();
  const stock = data.stock || 0;
  return {
    inventoryId: doc.id,
    shopId: data.shopId,
    bikeId: data.bikeId,
    stock: stock,
    quantity: stock,  // Alias for backward compatibility
    shopPrice: data.shopPrice,
    isActive: data.isActive,
    addedAt: data.addedAt instanceof Timestamp ? data.addedAt.toDate() : new Date(data.addedAt),
    lastRestocked: data.lastRestocked instanceof Timestamp ? data.lastRestocked.toDate() : new Date(data.lastRestocked),
  };
};

// Get shop inventory by shop ID
export const getShopInventory = async (shopId: string): Promise<ShopInventory[]> => {
  const inventoryRef = collection(db, COLLECTIONS.SHOP_INVENTORY);
  const q = query(
    inventoryRef,
    where('shopId', '==', shopId),
    orderBy('addedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToInventory);
};

// Get shop inventory with bike details
export const getShopInventoryWithBikes = async (shopId: string): Promise<ShopInventoryWithBike[]> => {
  const inventory = await getShopInventory(shopId);
  
  const inventoryWithBikes = await Promise.all(
    inventory.map(async (item) => {
      const bike = await getBikeById(item.bikeId);
      return {
        ...item,
        bike: bike!,
      };
    })
  );

  return inventoryWithBikes.filter((item) => item.bike);
};

// Get active inventory for shop
export const getActiveShopInventory = async (shopId: string): Promise<ShopInventoryWithBike[]> => {
  const inventoryWithBikes = await getShopInventoryWithBikes(shopId);
  return inventoryWithBikes.filter((item) => item.isActive && item.bike.isActive);
};

// Get inventory item by ID
export const getInventoryById = async (inventoryId: string): Promise<ShopInventory | null> => {
  const inventoryRef = doc(db, COLLECTIONS.SHOP_INVENTORY, inventoryId);
  const inventoryDoc = await getDoc(inventoryRef);
  
  if (!inventoryDoc.exists()) {
    return null;
  }

  const data = inventoryDoc.data();
  const stock = data.stock || 0;
  return {
    inventoryId: inventoryDoc.id,
    shopId: data.shopId,
    bikeId: data.bikeId,
    stock: stock,
    quantity: stock,  // Alias for backward compatibility
    shopPrice: data.shopPrice,
    isActive: data.isActive,
    addedAt: data.addedAt instanceof Timestamp ? data.addedAt.toDate() : new Date(data.addedAt),
    lastRestocked: data.lastRestocked instanceof Timestamp ? data.lastRestocked.toDate() : new Date(data.lastRestocked),
  };
};

// Check if bike exists in shop inventory
export const getBikeInShopInventory = async (
  shopId: string,
  bikeId: string
): Promise<ShopInventory | null> => {
  const inventoryRef = collection(db, COLLECTIONS.SHOP_INVENTORY);
  const q = query(
    inventoryRef,
    where('shopId', '==', shopId),
    where('bikeId', '==', bikeId)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  return convertToInventory(snapshot.docs[0]);
};

// Add bike to shop inventory
export const addBikeToShopInventory = async (
  shopId: string,
  bikeId: string,
  stock: number,
  shopPrice: number
): Promise<string> => {
  // Check if bike already exists in inventory
  const existingInventory = await getBikeInShopInventory(shopId, bikeId);
  
  if (existingInventory) {
    // Update existing inventory
    await updateInventoryStock(existingInventory.inventoryId, existingInventory.stock + stock);
    return existingInventory.inventoryId;
  }

  // Add new inventory item
  const inventoryRef = collection(db, COLLECTIONS.SHOP_INVENTORY);
  const newInventoryRef = await addDoc(inventoryRef, {
    shopId,
    bikeId,
    stock,
    shopPrice,
    isActive: true,
    addedAt: serverTimestamp(),
    lastRestocked: serverTimestamp(),
  });

  return newInventoryRef.id;
};

// Update inventory stock
export const updateInventoryStock = async (
  inventoryId: string,
  newStock: number
): Promise<void> => {
  const inventoryRef = doc(db, COLLECTIONS.SHOP_INVENTORY, inventoryId);
  await updateDoc(inventoryRef, {
    stock: newStock,
    lastRestocked: serverTimestamp(),
  });
};

// Update inventory price
export const updateInventoryPrice = async (
  inventoryId: string,
  newPrice: number
): Promise<void> => {
  const inventoryRef = doc(db, COLLECTIONS.SHOP_INVENTORY, inventoryId);
  await updateDoc(inventoryRef, {
    shopPrice: newPrice,
  });
};

// Toggle inventory active status
export const toggleInventoryActive = async (
  inventoryId: string,
  isActive: boolean
): Promise<void> => {
  const inventoryRef = doc(db, COLLECTIONS.SHOP_INVENTORY, inventoryId);
  await updateDoc(inventoryRef, {
    isActive,
  });
};

// Remove bike from shop inventory
export const removeFromShopInventory = async (inventoryId: string): Promise<void> => {
  const inventoryRef = doc(db, COLLECTIONS.SHOP_INVENTORY, inventoryId);
  await deleteDoc(inventoryRef);
};

// Get low stock items for shop
export const getLowStockItems = async (
  shopId: string,
  threshold: number = LOW_STOCK_THRESHOLD
): Promise<ShopInventoryWithBike[]> => {
  const inventory = await getShopInventoryWithBikes(shopId);
  return inventory.filter((item) => item.stock <= threshold && item.isActive);
};

// Get out of stock items for shop
export const getOutOfStockItems = async (shopId: string): Promise<ShopInventoryWithBike[]> => {
  const inventory = await getShopInventoryWithBikes(shopId);
  return inventory.filter((item) => item.stock === 0 && item.isActive);
};

// Get inventory count for shop
export const getInventoryCount = async (shopId: string): Promise<number> => {
  const inventoryRef = collection(db, COLLECTIONS.SHOP_INVENTORY);
  const q = query(inventoryRef, where('shopId', '==', shopId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Get total stock for shop
export const getTotalShopStock = async (shopId: string): Promise<number> => {
  const inventory = await getShopInventory(shopId);
  return inventory.reduce((total, item) => total + item.stock, 0);
};

// Restock inventory item
export const restockInventory = async (
  inventoryId: string,
  additionalStock: number
): Promise<void> => {
  const inventory = await getInventoryById(inventoryId);
  if (inventory) {
    await updateInventoryStock(inventoryId, inventory.stock + additionalStock);
  }
};

// Bulk update inventory prices
export const bulkUpdatePrices = async (
  shopId: string,
  priceAdjustmentPercent: number
): Promise<void> => {
  const inventory = await getShopInventory(shopId);
  
  await Promise.all(
    inventory.map(async (item) => {
      const newPrice = item.shopPrice * (1 + priceAdjustmentPercent / 100);
      await updateInventoryPrice(item.inventoryId, Math.round(newPrice * 100) / 100);
    })
  );
};

// Get all inventory requests
export const getAllInventoryRequests = async (): Promise<InventoryRequest[]> => {
  const requestsRef = collection(db, COLLECTIONS.INVENTORY_REQUESTS);
  const q = query(requestsRef, orderBy('requestDate', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({
    requestId: docSnap.id,
    ...docSnap.data(),
    requestDate: (docSnap.data().requestDate as Timestamp)?.toDate() || new Date(),
    createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
    processedDate: (docSnap.data().processedDate as Timestamp)?.toDate(),
  })) as InventoryRequest[];
};

// Update inventory request status
export const updateInventoryRequestStatus = async (
  requestId: string,
  status: RequestStatus
): Promise<void> => {
  const requestRef = doc(db, COLLECTIONS.INVENTORY_REQUESTS, requestId);
  await updateDoc(requestRef, {
    status,
    processedDate: serverTimestamp(),
  });
};

// Create a new inventory request
export const createInventoryRequest = async (requestData: {
  shopId: string;
  shopName: string;
  bikeId: string;
  bikeName: string;
  quantity: number;
  notes?: string;
  status: RequestStatus;
}): Promise<string> => {
  const requestsRef = collection(db, COLLECTIONS.INVENTORY_REQUESTS);
  const newRequestRef = await addDoc(requestsRef, {
    ...requestData,
    requestDate: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  
  return newRequestRef.id;
};