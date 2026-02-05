import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import { setUser, setLoading } from './store/authSlice';
import { auth, db } from './services/firebase/config';
import { theme } from './theme';
import AppRoutes from './routes';
import './index.css';
import type { User } from './types';

// Auth State Listener Component
const AuthStateListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Allow admin and seller users with active status
            const isValidRole = userData.role === 'admin' || userData.role === 'seller';
            const isActiveStatus = userData.status === 'active';
            
            if (isValidRole && isActiveStatus) {
              const user: User = {
                uid: firebaseUser.uid,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                status: userData.status,
                photoURL: userData.photoURL,
                createdAt: userData.createdAt?.toDate() || new Date(),
                lastLogin: new Date(),
              };
              dispatch(setUser(user));
            } else {
              // Invalid role or inactive status, sign them out
              await auth.signOut();
              dispatch(setUser(null));
            }
          } else {
            dispatch(setUser(null));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          dispatch(setUser(null));
        }
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return <>{children}</>;
};

// Main App Content
const AppContent: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthStateListener>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthStateListener>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
