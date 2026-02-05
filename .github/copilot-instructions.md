# E-Bike Sales Management System - Copilot Instructions

## Project Overview
A comprehensive web-based platform for managing electric bike sales across multiple retail locations with real-time analytics and inventory management.

## Tech Stack
- **Frontend**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Tables**: TanStack Table (React Table v8)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Build Tool**: Vite
- **Date Handling**: date-fns

## User Roles
1. **Admin**: Full system access, manage inventory, sellers, view analytics
2. **Seller**: Manage shop, record sales, view shop-specific data
3. **Shop Staff** (Optional): Limited access to record sales

## Coding Guidelines
- Use TypeScript for all components and services
- Use functional components with hooks exclusively
- Implement proper error handling with try-catch blocks
- Add loading states for all async operations
- Use Firebase SDK v9+ modular syntax
- Follow the established folder structure
- Implement proper form validation using React Hook Form and Zod
- Add accessibility attributes (ARIA) where needed
- Use environment variables for Firebase config

## Folder Structure
```
src/
├── assets/          # Images, fonts, static files
├── components/      # Reusable components
│   ├── common/      # Shared components (Button, Card, Modal)
│   ├── admin/       # Admin-specific components
│   ├── seller/      # Seller-specific components
│   ├── charts/      # Chart components
│   ├── tables/      # Table components
│   └── forms/       # Form components
├── pages/           # Page components
│   ├── admin/       # Admin panel pages
│   ├── seller/      # Seller panel pages
│   ├── auth/        # Authentication pages
│   └── common/      # Shared pages
├── layouts/         # Layout components
├── hooks/           # Custom React hooks
├── services/        # Firebase and API services
│   ├── firebase/    # Firebase configuration
│   └── api/         # API service functions
├── store/           # Redux store and slices
├── utils/           # Utility functions
├── constants/       # Constants and enums
├── types/           # TypeScript type definitions
├── routes/          # Route configuration
└── styles/          # Global styles and theme
```

## Firebase Collections
- `users` - User account information
- `shops` - Shop/seller information
- `bikes` - Master bike inventory
- `shopInventory` - Bikes available in each shop
- `sales` - All sales transactions
- `notifications` - System notifications
- `inventoryRequests` - Seller requests for bikes
- `systemSettings` - Global configuration

## Best Practices
- Implement proper Firestore security rules
- Use React Query patterns for data fetching
- Implement proper pagination for large datasets
- Use lazy loading for better performance
- Follow responsive design principles
- Use semantic HTML and accessibility best practices
