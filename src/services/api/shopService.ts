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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { Shop, ShopAddress, ShopStatus } from '../../types';
import { COLLECTIONS } from '../../constants';

// Convert Firestore document to Shop type
const convertToShop = (doc: QueryDocumentSnapshot<DocumentData>): Shop => {
  const data = doc.data();
  return {
    shopId: doc.id,
    ownerId: data.ownerId,
    ownerName: data.ownerName || '',
    shopName: data.shopName,
    businessLicense: data.businessLicense,
    address: data.address,
    city: data.address?.city || data.city || '',
    phone: data.phone,
    email: data.email,
    logo: data.logo,
    images: data.images || [],
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    totalSales: data.totalSales || 0,
    totalRevenue: data.totalRevenue || 0,
  };
};

// Get all shops
export const getAllShops = async (): Promise<Shop[]> => {
  const shopsRef = collection(db, COLLECTIONS.SHOPS);
  const q = query(shopsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToShop);
};

// Get shops by status
export const getShopsByStatus = async (status: ShopStatus): Promise<Shop[]> => {
  const shopsRef = collection(db, COLLECTIONS.SHOPS);
  const q = query(
    shopsRef,
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToShop);
};

// Get approved shops
export const getApprovedShops = async (): Promise<Shop[]> => {
  return getShopsByStatus('approved');
};

// Get pending shops
export const getPendingShops = async (): Promise<Shop[]> => {
  return getShopsByStatus('pending');
};

// Get shop by ID
export const getShopById = async (shopId: string): Promise<Shop | null> => {
  const shopRef = doc(db, COLLECTIONS.SHOPS, shopId);
  const shopDoc = await getDoc(shopRef);
  
  if (!shopDoc.exists()) {
    return null;
  }

  const data = shopDoc.data();
  return {
    shopId: shopDoc.id,
    ownerId: data.ownerId,
    ownerName: data.ownerName || '',
    shopName: data.shopName,
    businessLicense: data.businessLicense,
    address: data.address,
    city: data.address?.city || data.city || '',
    phone: data.phone,
    email: data.email,
    logo: data.logo,
    images: data.images || [],
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    totalSales: data.totalSales || 0,
    totalRevenue: data.totalRevenue || 0,
  };
};

// Get shop by owner ID
export const getShopByOwnerId = async (ownerId: string): Promise<Shop | null> => {
  const shopsRef = collection(db, COLLECTIONS.SHOPS);
  const q = query(shopsRef, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  return convertToShop(snapshot.docs[0]);
};

// Upload shop logo
export const uploadShopLogo = async (shopId: string, file: File): Promise<string> => {
  const fileName = `logo_${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `shops/${shopId}/${fileName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Upload shop images
export const uploadShopImages = async (shopId: string, files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const fileName = `${Date.now()}_${index}_${file.name}`;
    const storageRef = ref(storage, `shops/${shopId}/images/${fileName}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });

  return Promise.all(uploadPromises);
};

// Delete shop image
export const deleteShopImage = async (imageUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

// Create new shop
export const createShop = async (
  ownerId: string,
  shopData: {
    shopName: string;
    businessLicense: string;
    address: ShopAddress;
    phone: string;
    email: string;
  },
  logoFile?: File
): Promise<string> => {
  const shopsRef = collection(db, COLLECTIONS.SHOPS);
  
  const newShopRef = await addDoc(shopsRef, {
    ownerId,
    ...shopData,
    logo: null,
    images: [],
    status: 'pending',
    totalSales: 0,
    totalRevenue: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Upload logo if provided
  if (logoFile) {
    const logoUrl = await uploadShopLogo(newShopRef.id, logoFile);
    await updateDoc(newShopRef, { logo: logoUrl });
  }

  // Update user with shop ID
  const userRef = doc(db, COLLECTIONS.USERS, ownerId);
  await updateDoc(userRef, { shopId: newShopRef.id });

  return newShopRef.id;
};

// Update shop
export const updateShop = async (
  shopId: string,
  updates: Partial<{
    shopName: string;
    businessLicense: string;
    address: ShopAddress;
    phone: string;
    email: string;
  }>,
  newLogoFile?: File,
  newImageFiles?: File[]
): Promise<void> => {
  const shopRef = doc(db, COLLECTIONS.SHOPS, shopId);
  
  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // Upload new logo if provided
  if (newLogoFile) {
    const logoUrl = await uploadShopLogo(shopId, newLogoFile);
    updateData.logo = logoUrl;
  }

  // Upload new images if provided
  if (newImageFiles && newImageFiles.length > 0) {
    const currentShop = await getShopById(shopId);
    const newImageUrls = await uploadShopImages(shopId, newImageFiles);
    updateData.images = [...(currentShop?.images || []), ...newImageUrls];
  }

  await updateDoc(shopRef, updateData);
};

// Update shop status
export const updateShopStatus = async (shopId: string, status: ShopStatus): Promise<void> => {
  const shopRef = doc(db, COLLECTIONS.SHOPS, shopId);
  await updateDoc(shopRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  // Also update the user status based on shop status
  const shop = await getShopById(shopId);
  if (shop) {
    const userRef = doc(db, COLLECTIONS.USERS, shop.ownerId);
    await updateDoc(userRef, {
      status: status === 'approved' ? 'active' : status === 'suspended' ? 'suspended' : 'pending',
      updatedAt: serverTimestamp(),
    });
  }
};

// Approve shop
export const approveShop = async (shopId: string): Promise<void> => {
  return updateShopStatus(shopId, 'approved');
};

// Suspend shop
export const suspendShop = async (shopId: string): Promise<void> => {
  return updateShopStatus(shopId, 'suspended');
};

// Delete shop
export const deleteShop = async (shopId: string): Promise<void> => {
  // Get shop to delete images
  const shop = await getShopById(shopId);
  
  // Delete logo and images
  if (shop?.logo) {
    await deleteShopImage(shop.logo);
  }
  if (shop?.images) {
    await Promise.all(shop.images.map(deleteShopImage));
  }

  // Delete shop document
  const shopRef = doc(db, COLLECTIONS.SHOPS, shopId);
  await deleteDoc(shopRef);

  // Remove shop ID from user
  if (shop) {
    const userRef = doc(db, COLLECTIONS.USERS, shop.ownerId);
    await updateDoc(userRef, { shopId: null });
  }
};

// Get shop count
export const getShopCount = async (status?: ShopStatus): Promise<number> => {
  const shopsRef = collection(db, COLLECTIONS.SHOPS);
  let q = query(shopsRef);

  if (status) {
    q = query(q, where('status', '==', status));
  }

  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Get top performing shops
export const getTopPerformingShops = async (limitCount: number = 10): Promise<Shop[]> => {
  const shops = await getApprovedShops();
  return shops
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limitCount);
};

// Search shops
export const searchShops = async (searchTerm: string): Promise<Shop[]> => {
  const shops = await getAllShops();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return shops.filter(
    (shop) =>
      shop.shopName.toLowerCase().includes(lowerSearchTerm) ||
      shop.email.toLowerCase().includes(lowerSearchTerm) ||
      shop.address.city.toLowerCase().includes(lowerSearchTerm)
  );
};
