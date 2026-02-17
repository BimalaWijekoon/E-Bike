// Firebase Bikes Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Bike, BikeCategory, BikeStatus, VehicleCategory } from '../../types';

const COLLECTION_NAME = 'bikes';

// Convert Firestore document to Bike type
const convertBike = (doc: any): Bike => {
  const data = doc.data();
  return {
    id: doc.id,
    vehicleCategory: data.vehicleCategory || 'luxury-vehicle',
    name: data.name,
    brand: data.brand,
    model: data.model,
    category: data.category,
    price: data.price,
    stock: data.stock,
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
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Get all bikes
export const getAllBikes = async (): Promise<Bike[]> => {
  try {
    const bikesRef = collection(db, COLLECTION_NAME);
    const q = query(bikesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(convertBike);
  } catch (error) {
    console.error('Error fetching bikes:', error);
    throw error;
  }
};

// Get single bike by ID
export const getBikeById = async (id: string): Promise<Bike | null> => {
  try {
    const bikeRef = doc(db, COLLECTION_NAME, id);
    const bikeDoc = await getDoc(bikeRef);
    
    if (bikeDoc.exists()) {
      return convertBike(bikeDoc);
    }
    return null;
  } catch (error) {
    console.error('Error fetching bike:', error);
    throw error;
  }
};

// Create new bike
export interface CreateBikeData {
  vehicleCategory: VehicleCategory;
  name: string;
  brand: string;
  model: string;
  category: BikeCategory;
  price: number;
  stock: number;
  description: string;
  specifications: {
    motorPower: string;
    batteryCapacity: string;
    range: string;
    maxSpeed: string;
    weight: string;
  };
  images?: string[];
  status?: BikeStatus;
}

export const createBike = async (data: CreateBikeData): Promise<string> => {
  try {
    const bikesRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(bikesRef, {
      ...data,
      images: data.images || [],
      status: data.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating bike:', error);
    throw error;
  }
};

// Update bike
export const updateBike = async (id: string, data: Partial<CreateBikeData>): Promise<void> => {
  try {
    const bikeRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(bikeRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating bike:', error);
    throw error;
  }
};

// Delete bike
export const deleteBike = async (id: string): Promise<void> => {
  try {
    const bikeRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(bikeRef);
  } catch (error) {
    console.error('Error deleting bike:', error);
    throw error;
  }
};

// Update bike stock
export const updateBikeStock = async (id: string, stock: number): Promise<void> => {
  try {
    const bikeRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(bikeRef, {
      stock,
      status: stock === 0 ? 'out_of_stock' : 'active',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating bike stock:', error);
    throw error;
  }
};
