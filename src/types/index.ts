// ============================================
// E-Bike Admin System - Type Definitions
// ============================================

// User Types
export type UserRole = 'admin' | 'seller';
export type UserStatus = 'active' | 'suspended' | 'pending' | 'rejected';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Bike Types
export type BikeCategory = 'mountain' | 'road' | 'city' | 'hybrid' | 'electric' | 'folding';
export type BikeStatus = 'active' | 'inactive' | 'out_of_stock';

export interface Bike {
  id: string;
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
  images: string[];
  status: BikeStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Shop/Seller Types
export type ShopStatus = 'pending' | 'approved' | 'suspended';

export interface Shop {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  shopName: string;
  phone: string;
  address: string;
  city: string;
  status: ShopStatus;
  totalSales: number;
  createdAt: Date;
}

// Sale Types
export type PaymentMethod = 'cash' | 'card' | 'financing';

export interface Sale {
  id: string;
  shopId: string;
  shopName: string;
  bikeId: string;
  bikeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  saleDate: Date;
}

// Inventory Request Types
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface InventoryRequest {
  id: string;
  shopId: string;
  shopName: string;
  bikeId: string;
  bikeName: string;
  quantity: number;
  status: RequestStatus;
  requestDate: Date;
  processedDate?: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalBikes: number;
  totalSellers: number;
  totalSales: number;
  totalRevenue: number;
  pendingRequests: number;
  lowStockBikes: number;
}
