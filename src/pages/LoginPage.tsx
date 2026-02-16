// Login Page with Role Selection
import React, { useState } from 'react';
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
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsBike,
  AdminPanelSettings,
  Store,
  ArrowBack,
} from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { useAppDispatch } from '../hooks';
import { setUser, setError } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

type RoleType = 'admin' | 'seller' | null;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user role matches selected role
        if (userData.role !== selectedRole) {
          setLocalError(`Access denied. This account is not a ${selectedRole}.`);
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Check if seller account is pending approval
        if (userData.role === 'seller' && userData.status === 'pending') {
          setLocalError(
            'Your account is pending approval. Please wait for an administrator to approve your account. You will receive an email notification once approved.'
          );
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Check if account is rejected
        if (userData.status === 'rejected') {
          setLocalError('Your account application was rejected. Please contact administrator for more information.');
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Check if account is suspended
        if (userData.status === 'suspended') {
          setLocalError('Your account has been suspended. Please contact administrator.');
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Check if account is inactive
        if (userData.status === 'inactive') {
          setLocalError('Your account is inactive. Please contact administrator.');
          await auth.signOut();
          setLoading(false);
          return;
        }

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
        setLocalError('User not found in database');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential') {
        setLocalError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setLocalError('User not found');
      } else {
        setLocalError(err.message || 'Login failed');
      }
      dispatch(setError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setLocalError(null);
  };

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
          {/* Role Selection Screen */}
          {!selectedRole && (
            <Fade in={!selectedRole}>
              <Box>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                    <DirectionsBike sx={{ fontSize: 48, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      E-Bike Sales
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Select your account type to continue
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Admin Option */}
                  <Card
                    onClick={() => setSelectedRole('admin')}
                    sx={{
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AdminPanelSettings sx={{ fontSize: 32, color: 'white' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          Admin
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          System administrator access
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Seller Option */}
                  <Card
                    onClick={() => setSelectedRole('seller')}
                    sx={{
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          bgcolor: 'secondary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Store sx={{ fontSize: 32, color: 'white' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          Shop Seller
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage your shop and sales
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Login Form */}
          {selectedRole && (
            <Fade in={!!selectedRole}>
              <Box>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                    <DirectionsBike sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      E-Bike
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {selectedRole === 'admin' ? (
                      <AdminPanelSettings sx={{ color: 'primary.main' }} />
                    ) : (
                      <Store sx={{ color: 'secondary.main' }} />
                    )}
                    <Typography variant="h6" color="text.secondary">
                      {selectedRole === 'admin' ? 'Admin Login' : 'Seller Login'}
                    </Typography>
                  </Box>
                </Box>

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLocalError(null)}>
                    {error}
                  </Alert>
                )}

                {/* Info for new sellers */}
                {selectedRole === 'seller' && !error && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>New seller?</strong> Your account must be approved by an administrator before you can login.
                    </Typography>
                  </Alert>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                    disabled={loading}
                    autoFocus
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 3 }}
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

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 2,
                      bgcolor: selectedRole === 'admin' ? 'primary.main' : 'secondary.main',
                      '&:hover': {
                        bgcolor: selectedRole === 'admin' ? 'primary.dark' : 'secondary.dark',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>

                  <Button
                    variant="text"
                    fullWidth
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    disabled={loading}
                  >
                    Back to role selection
                  </Button>

                  {/* Signup Links */}
                  {selectedRole === 'seller' && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                      Don't have an account?{' '}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/seller/signup')}
                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                      >
                        Sign up as Seller
                      </Button>
                    </Typography>
                  )}

                  {selectedRole === 'admin' && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                      First time setup?{' '}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/admin/setup')}
                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                      >
                        Create Admin Account
                      </Button>
                    </Typography>
                  )}
                </form>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
