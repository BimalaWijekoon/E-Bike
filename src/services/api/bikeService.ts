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
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { Bike, BikeFormData } from '../../types';
import { COLLECTIONS, DEFAULT_PAGE_SIZE } from '../../constants';

// Convert Firestore document to Bike type
const convertToBike = (doc: QueryDocumentSnapshot<DocumentData>): Bike => {
  const data = doc.data();
  return {
    bikeId: doc.id,
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    basePrice: data.basePrice,
    specifications: data.specifications,
    description: data.description,
    images: data.images || [],
    features: data.features || [],
    colors: data.colors || [],
    stock: data.stock,
    isActive: data.isActive,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
};

// Get all bikes
export const getAllBikes = async (): Promise<Bike[]> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  const q = query(bikesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToBike);
};

// Get active bikes only
export const getActiveBikes = async (): Promise<Bike[]> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  const q = query(
    bikesRef,
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToBike);
};

// Get bikes with pagination
export const getBikesPaginated = async (
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  category?: string,
  isActive?: boolean
): Promise<{ bikes: Bike[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  let q = query(bikesRef, orderBy('createdAt', 'desc'), limit(pageSize));

  if (category) {
    q = query(q, where('category', '==', category));
  }

  if (isActive !== undefined) {
    q = query(q, where('isActive', '==', isActive));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const bikes = snapshot.docs.map(convertToBike);
  const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { bikes, lastDoc: newLastDoc };
};

// Get single bike by ID
export const getBikeById = async (bikeId: string): Promise<Bike | null> => {
  const bikeRef = doc(db, COLLECTIONS.BIKES, bikeId);
  const bikeDoc = await getDoc(bikeRef);
  
  if (!bikeDoc.exists()) {
    return null;
  }

  const data = bikeDoc.data();
  return {
    bikeId: bikeDoc.id,
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    basePrice: data.basePrice,
    specifications: data.specifications,
    description: data.description,
    images: data.images || [],
    features: data.features || [],
    colors: data.colors || [],
    stock: data.stock,
    isActive: data.isActive,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
};

// Get bikes by category
export const getBikesByCategory = async (category: string): Promise<Bike[]> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  const q = query(
    bikesRef,
    where('category', '==', category),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToBike);
};

// Get low stock bikes
export const getLowStockBikes = async (threshold: number = 5): Promise<Bike[]> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  const q = query(
    bikesRef,
    where('stock', '<=', threshold),
    where('isActive', '==', true),
    orderBy('stock', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToBike);
};

// Upload bike images
export const uploadBikeImages = async (bikeId: string, files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const fileName = `${Date.now()}_${index}_${file.name}`;
    const storageRef = ref(storage, `bikes/${bikeId}/${fileName}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });

  return Promise.all(uploadPromises);
};

// Delete bike image
export const deleteBikeImage = async (imageUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

// Add new bike
export const addBike = async (bikeData: BikeFormData, imageFiles?: File[]): Promise<string> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  
  const newBikeRef = await addDoc(bikesRef, {
    ...bikeData,
    images: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Upload images if provided
  if (imageFiles && imageFiles.length > 0) {
    const imageUrls = await uploadBikeImages(newBikeRef.id, imageFiles);
    await updateDoc(newBikeRef, { images: imageUrls });
  }

  return newBikeRef.id;
};

// Update bike
export const updateBike = async (
  bikeId: string,
  bikeData: Partial<BikeFormData>,
  newImageFiles?: File[]
): Promise<void> => {
  const bikeRef = doc(db, COLLECTIONS.BIKES, bikeId);
  
  const updateData: Record<string, unknown> = {
    ...bikeData,
    updatedAt: serverTimestamp(),
  };

  // Upload new images if provided
  if (newImageFiles && newImageFiles.length > 0) {
    const currentBike = await getBikeById(bikeId);
    const newImageUrls = await uploadBikeImages(bikeId, newImageFiles);
    updateData.images = [...(currentBike?.images || []), ...newImageUrls];
  }

  await updateDoc(bikeRef, updateData);
};

// Update bike stock
export const updateBikeStock = async (bikeId: string, newStock: number): Promise<void> => {
  const bikeRef = doc(db, COLLECTIONS.BIKES, bikeId);
  await updateDoc(bikeRef, {
    stock: newStock,
    updatedAt: serverTimestamp(),
  });
};

// Toggle bike active status
export const toggleBikeActive = async (bikeId: string, isActive: boolean): Promise<void> => {
  const bikeRef = doc(db, COLLECTIONS.BIKES, bikeId);
  await updateDoc(bikeRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
};

// Delete bike
export const deleteBike = async (bikeId: string): Promise<void> => {
  // Get bike to delete images
  const bike = await getBikeById(bikeId);
  
  // Delete all images
  if (bike?.images) {
    await Promise.all(bike.images.map(deleteBikeImage));
  }

  // Delete bike document
  const bikeRef = doc(db, COLLECTIONS.BIKES, bikeId);
  await deleteDoc(bikeRef);
};

// Search bikes
export const searchBikes = async (searchTerm: string): Promise<Bike[]> => {
  // Note: Firestore doesn't support full-text search
  // For production, consider using Algolia or Elasticsearch
  const bikes = await getAllBikes();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return bikes.filter(
    (bike) =>
      bike.name.toLowerCase().includes(lowerSearchTerm) ||
      bike.brand.toLowerCase().includes(lowerSearchTerm) ||
      bike.model.toLowerCase().includes(lowerSearchTerm) ||
      bike.category.toLowerCase().includes(lowerSearchTerm)
  );
};

// Get bike count
export const getBikeCount = async (isActive?: boolean): Promise<number> => {
  const bikesRef = collection(db, COLLECTIONS.BIKES);
  let q = query(bikesRef);

  if (isActive !== undefined) {
    q = query(q, where('isActive', '==', isActive));
  }

  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Get total stock
export const getTotalStock = async (): Promise<number> => {
  const bikes = await getAllBikes();
  return bikes.reduce((total, bike) => total + bike.stock, 0);
};
