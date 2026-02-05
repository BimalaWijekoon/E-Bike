// Admin Setup Page - One-time first admin creation
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsBike,
  AdminPanelSettings,
  ArrowBack,
  CheckCircle,
  Block,
} from '@mui/icons-material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { useNavigate } from 'react-router-dom';

const AdminSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if admin already exists
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'));
        const snapshot = await getDocs(q);
        setAdminExists(!snapshot.empty);
      } catch (err) {
        console.error('Error checking admin:', err);
      } finally {
        setChecking(false);
      }
    };

    checkAdminExists();
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Double-check if admin exists
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'admin'));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setError('An admin account already exists. Only one admin is allowed.');
        setAdminExists(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error checking admin:', err);
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create Firebase Auth user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create admin user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: formData.email,
        displayName: formData.displayName,
        role: 'admin',
        status: 'active', // Admin is active immediately
        photoURL: null,
        createdAt: serverTimestamp(),
        lastLogin: null,
      });

      // Sign out (they can login normally now)
      await auth.signOut();

      setSuccess(true);
    } catch (err: any) {
      console.error('Admin setup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Setup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checking) {
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

  // Admin already exists
  if (adminExists && !success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 450, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Block sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Setup Not Available
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              An administrator account already exists. 
              Only one admin account is allowed in the system.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              startIcon={<ArrowBack />}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Success Screen
  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 450, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Admin Account Created!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your administrator account has been set up successfully.
              You can now login with your credentials.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsBike sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" fontWeight={700} color="primary.main">
                E-Bike
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AdminPanelSettings sx={{ color: 'primary.main' }} />
              <Typography variant="h6" color="text.secondary">
                Initial Admin Setup
              </Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Warning Alert */}
          <Alert severity="warning" sx={{ mb: 3 }}>
            This is a one-time setup. Only one admin account can be created.
          </Alert>

          {/* Setup Form */}
          <form onSubmit={handleSignup}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.displayName}
              onChange={handleChange('displayName')}
              sx={{ mb: 2 }}
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              sx={{ mb: 2 }}
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              sx={{ mb: 2 }}
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              sx={{ mb: 3 }}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Admin Account'}
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={() => navigate('/login')}
              startIcon={<ArrowBack />}
              disabled={loading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminSetupPage;
