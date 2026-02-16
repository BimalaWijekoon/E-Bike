// Firebase Shop Inventory Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import type { Bike } from '../../types';

// Shop Inventory Item - extends Bike with shop-specific data
export interface ShopInventoryItem extends Bike {
  sellerId: string;
  shopStock: number; // Stock available in this specific shop
  totalSold: number; // Total sold from this shop
  lastRestocked?: Date;
}

const COLLECTION_NAME = 'shopInventory';

// Convert Firestore document to ShopInventoryItem
const convertInventoryItem = (doc: any): ShopInventoryItem => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    price: data.price,
    stock: data.stock, // Master stock (not used here)
    shopStock: data.shopStock, // Shop-specific stock
    totalSold: data.totalSold || 0,
    description: data.description,
    specifications: data.specifications || {
      motorPower: '',
      batteryCapacity: '',
      range: '',
      maxSpeed: '',
      weight: '',
    },
    images: data.images || [],
    status: data.status,
    sellerId: data.sellerId,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastRestocked: data.lastRestocked?.toDate(),
  };
};

// Get all inventory for a specific seller
export const getSellerInventory = async (sellerId: string): Promise<ShopInventoryItem[]> => {
  try {
    const inventoryRef = collection(db, COLLECTION_NAME);
    const q = query(
      inventoryRef,
      where('sellerId', '==', sellerId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertInventoryItem);
  } catch (error) {
    console.error('Error fetching seller inventory:', error);
    throw error;
  }
};

// Get single inventory item
export const getInventoryItem = async (itemId: string): Promise<ShopInventoryItem | null> => {
  try {
    const itemRef = doc(db, COLLECTION_NAME, itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (itemDoc.exists()) {
      return convertInventoryItem(itemDoc);
    }
    return null;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    throw error;
  }
};

// Add bike to shop inventory (called when admin approves inventory request)
export const addToShopInventory = async (
  sellerId: string,
  bikeId: string,
  bikeData: Bike,
  quantity: number
): Promise<string> => {
  try {
    // Create unique inventory item ID: sellerId_bikeId
    const inventoryItemId = `${sellerId}_${bikeId}`;
    const inventoryRef = doc(db, COLLECTION_NAME, inventoryItemId);
    
    // Check if item already exists
    const existingItem = await getDoc(inventoryRef);
    
    if (existingItem.exists()) {
      // Update existing inventory
      await updateDoc(inventoryRef, {
        shopStock: increment(quantity),
        lastRestocked: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new inventory item
      await setDoc(inventoryRef, {
        ...bikeData,
        sellerId,
        shopStock: quantity,
        totalSold: 0,
        lastRestocked: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    return inventoryItemId;
  } catch (error) {
    console.error('Error adding to shop inventory:', error);
    throw error;
  }
};

// Reduce inventory after sale
export const reduceInventoryStock = async (
  inventoryItemId: string,
  quantity: number
): Promise<void> => {
  try {
    const inventoryRef = doc(db, COLLECTION_NAME, inventoryItemId);
    await updateDoc(inventoryRef, {
      shopStock: increment(-quantity),
      totalSold: increment(quantity),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error reducing inventory stock:', error);
    throw error;
  }
};

// Get low stock items (shopStock <= threshold)
export const getLowStockItems = async (
  sellerId: string,
  threshold: number = 5
): Promise<ShopInventoryItem[]> => {
  try {
    const inventoryRef = collection(db, COLLECTION_NAME);
    const q = query(
      inventoryRef,
      where('sellerId', '==', sellerId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(convertInventoryItem);
    
    // Filter for low stock items
    return items.filter(item => item.shopStock <= threshold);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
};

// Get inventory statistics
export const getInventoryStats = async (sellerId: string) => {
  try {
    const inventory = await getSellerInventory(sellerId);
    
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.shopStock, 0);
    const totalSold = inventory.reduce((sum, item) => sum + item.totalSold, 0);
    const lowStockCount = inventory.filter(item => item.shopStock <= 5).length;
    const outOfStockCount = inventory.filter(item => item.shopStock === 0).length;
    
    return {
      totalItems,
      totalStock,
      totalSold,
      lowStockCount,
      outOfStockCount,
    };
  } catch (error) {
    console.error('Error calculating inventory stats:', error);
    throw error;
  }
};
