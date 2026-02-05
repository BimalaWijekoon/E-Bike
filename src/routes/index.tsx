// App Routes Configuration
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';

// Pages
import LoginPage from '../pages/LoginPage';
import SellerSignupPage from '../pages/SellerSignupPage';
import AdminSetupPage from '../pages/AdminSetupPage';
import Dashboard from '../pages/Dashboard';
import BikesPage from '../pages/BikesPage';
import SellersPage from '../pages/SellersPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import InventoryRequestsPage from '../pages/InventoryRequestsPage';

// Seller Pages
import SellerDashboard from '../pages/seller/SellerDashboard';
import RecordSalePage from '../pages/seller/RecordSalePage';
import SellerInventoryPage from '../pages/seller/SellerInventoryPage';
import SellerRequestsPage from '../pages/seller/SellerRequestsPage';
import SalesHistoryPage from '../pages/seller/SalesHistoryPage';
import SellerProfilePage from '../pages/seller/SellerProfilePage';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import SellerLayout from '../layouts/SellerLayout';

// Protected Route for Admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return <>{children}</>;
};

// Protected Route for Seller
const SellerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'seller') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects if logged in based on role)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return null;
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      {/* Seller Signup - Public */}
      <Route
        path="/seller/signup"
        element={
          <PublicRoute>
            <SellerSignupPage />
          </PublicRoute>
        }
      />

      {/* Admin Setup - Public (one-time) */}
      <Route
        path="/admin/setup"
        element={
          <PublicRoute>
            <AdminSetupPage />
          </PublicRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="bikes" element={<BikesPage />} />
        <Route path="sellers" element={<SellersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="requests" element={<InventoryRequestsPage />} />
      </Route>

      {/* Seller Routes */}
      <Route
        path="/seller"
        element={
          <SellerRoute>
            <SellerLayout />
          </SellerRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="record-sale" element={<RecordSalePage />} />
        <Route path="inventory" element={<SellerInventoryPage />} />
        <Route path="requests" element={<SellerRequestsPage />} />
        <Route path="sales" element={<SalesHistoryPage />} />
        <Route path="profile" element={<SellerProfilePage />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
