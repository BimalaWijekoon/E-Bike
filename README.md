# E-Bike Sales Management System

A comprehensive web-based platform for managing electric bike sales across multiple retail locations with real-time analytics and inventory management.

![E-Bike Sales Management](https://img.shields.io/badge/React-18+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![MUI](https://img.shields.io/badge/MUI-v5+-purple) ![Firebase](https://img.shields.io/badge/Firebase-v10+-orange)

## 🚀 Features

### Admin Panel
- **Dashboard**: Overview of total sales, revenue, inventory stats
- **Bike Management**: Add, edit, delete bikes with full specifications
- **Seller Management**: Approve/suspend sellers, view seller details
- **Sales Analytics**: Charts and reports for sales trends
- **Inventory Requests**: Approve/reject seller inventory requests
- **System Settings**: Configure system-wide settings

### Seller Panel
- **Dashboard**: Shop-specific sales and inventory overview
- **Shop Profile**: Manage shop information
- **Inventory Management**: View and manage shop inventory
- **Record Sales**: POS-style interface for recording sales
- **Sales History**: View all sales with filtering and search
- **Request Inventory**: Request bikes from admin

### Authentication
- Email/Password authentication
- Google OAuth integration
- Role-based access control (Admin, Seller, Staff)
- Protected routes

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Build Tool**: Vite
- **Date Handling**: date-fns

## 📁 Project Structure

```
src/
├── assets/          # Images, fonts, static files
├── components/      # Reusable components
│   ├── common/      # Shared components (Button, Card, Modal)
│   ├── charts/      # Chart components
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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ebike-sales.git
cd ebike-sales
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Firebase configuration to `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database
4. Set up Firestore security rules (see below)
5. Copy your Firebase config to `.env`

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isSeller() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'seller';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Bikes collection
    match /bikes/{bikeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Shops collection
    match /shops/{shopId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || 
        (isSeller() && resource.data.userId == request.auth.uid);
      allow delete: if isAdmin();
    }

    // Sales collection
    match /sales/{saleId} {
      allow read: if isAdmin() || 
        (isSeller() && resource.data.shopId == 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.shopId);
      allow create: if isSeller() || isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Shop Inventory collection
    match /shopInventory/{inventoryId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Inventory Requests collection
    match /inventoryRequests/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isSeller();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAdmin();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 User Roles

| Role | Description | Access |
|------|-------------|--------|
| Admin | System administrator | Full access to all features |
| Seller | Shop owner/manager | Shop-specific data and sales |
| Staff | Shop employee (optional) | Limited sales recording access |

## 📊 Firebase Collections

| Collection | Description |
|------------|-------------|
| `users` | User account information |
| `shops` | Shop/seller information |
| `bikes` | Master bike inventory |
| `shopInventory` | Bikes available in each shop |
| `sales` | All sales transactions |
| `notifications` | System notifications |
| `inventoryRequests` | Seller requests for bikes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Material-UI](https://mui.com/) for the beautiful UI components
- [Firebase](https://firebase.google.com/) for the backend services
- [Recharts](https://recharts.org/) for the charting library
- [React Hook Form](https://react-hook-form.com/) for form handling

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
#   E - B i k e  
 