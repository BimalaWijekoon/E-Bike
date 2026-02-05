// Sellers Management Page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Avatar,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Store,
  CheckCircle,
  Cancel,
  Block,
  Refresh,
  Email,
  Phone,
  CalendarToday,
  Person,
  Close,
  Warning,
} from '@mui/icons-material';
import {
  getAllSellers,
  approveSeller,
  rejectSeller,
  suspendSeller,
  reactivateSeller,
  deleteSeller,
  type Seller,
} from '../services/firebase/sellers';
import type { UserStatus } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const STATUS_CONFIG: Record<UserStatus | 'rejected', { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: 'Active', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  suspended: { label: 'Suspended', color: 'error' },
  rejected: { label: 'Rejected', color: 'error' },
};

const SellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete' | null;
    seller: Seller | null;
  }>({ open: false, action: null, seller: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const data = await getAllSellers();
      setSellers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sellers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!confirmDialog.seller || !confirmDialog.action) return;

    try {
      setActionLoading(true);
      const { action, seller } = confirmDialog;

      switch (action) {
        case 'approve':
          await approveSeller(seller.uid);
          break;
        case 'reject':
          await rejectSeller(seller.uid);
          break;
        case 'suspend':
          await suspendSeller(seller.uid);
          break;
        case 'reactivate':
          await reactivateSeller(seller.uid);
          break;
        case 'delete':
          await deleteSeller(seller.uid);
          break;
      }

      await fetchSellers();
      setConfirmDialog({ open: false, action: null, seller: null });
      setDetailsOpen(false);
    } catch (err) {
      setError(`Failed to ${confirmDialog.action} seller`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmDialog = (action: typeof confirmDialog.action, seller: Seller) => {
    setConfirmDialog({ open: true, action, seller });
  };

  const getFilteredSellers = (status?: string) => {
    if (!status || status === 'all') return sellers;
    return sellers.filter((s) => s.status === status);
  };

  const pendingSellers = getFilteredSellers('pending');
  const activeSellers = getFilteredSellers('active');
  const suspendedSellers = sellers.filter((s) => s.status === 'suspended' || s.status === 'rejected');

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const SellerCard: React.FC<{ seller: Seller; showActions?: boolean }> = ({ seller, showActions = true }) => (
    <Card
      sx={{
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: seller.status === 'active' ? 'success.main' : 
                       seller.status === 'pending' ? 'warning.main' : 'error.main',
              fontSize: 24,
            }}
          >
            {seller.displayName?.charAt(0) || 'S'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={600} noWrap>
              {seller.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {seller.shopName || 'No shop name'}
            </Typography>
          </Box>
          <Chip
            label={STATUS_CONFIG[seller.status as keyof typeof STATUS_CONFIG]?.label || seller.status}
            color={STATUS_CONFIG[seller.status as keyof typeof STATUS_CONFIG]?.color || 'default'}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Contact Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" noWrap>{seller.email}</Typography>
          </Box>
          {seller.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2">{seller.phone}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">Joined: {formatDate(seller.createdAt)}</Typography>
          </Box>
        </Box>

        {/* Actions */}
        {showActions && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedSeller(seller);
                  setDetailsOpen(true);
                }}
              >
                View Details
              </Button>
              
              {seller.status === 'pending' && (
                <>
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => openConfirmDialog('approve', seller)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => openConfirmDialog('reject', seller)}
                  >
                    Reject
                  </Button>
                </>
              )}
              
              {seller.status === 'active' && (
                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  startIcon={<Block />}
                  onClick={() => openConfirmDialog('suspend', seller)}
                >
                  Suspend
                </Button>
              )}
              
              {(seller.status === 'suspended' || seller.status === 'rejected') && (
                <Button
                  size="small"
                  color="success"
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => openConfirmDialog('reactivate', seller)}
                >
                  Reactivate
                </Button>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sellers Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage seller accounts and approvals
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchSellers}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="h3" fontWeight={700}>{pendingSellers.length}</Typography>
            <Typography variant="body1">Pending Approvals</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="h3" fontWeight={700}>{activeSellers.length}</Typography>
            <Typography variant="body1">Active Sellers</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
            <Typography variant="h3" fontWeight={700}>{suspendedSellers.length}</Typography>
            <Typography variant="body1">Suspended/Rejected</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="fullWidth"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Pending
                {pendingSellers.length > 0 && (
                  <Chip label={pendingSellers.length} size="small" color="warning" />
                )}
              </Box>
            }
          />
          <Tab label={`Active (${activeSellers.length})`} />
          <Tab label={`Suspended (${suspendedSellers.length})`} />
          <Tab label={`All (${sellers.length})`} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {pendingSellers.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No pending approvals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All seller registrations have been processed
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {pendingSellers.map((seller) => (
              <Grid key={seller.uid} size={{ xs: 12, md: 6, lg: 4 }}>
                <SellerCard seller={seller} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {activeSellers.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Store sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No active sellers
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {activeSellers.map((seller) => (
              <Grid key={seller.uid} size={{ xs: 12, md: 6, lg: 4 }}>
                <SellerCard seller={seller} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {suspendedSellers.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No suspended or rejected sellers
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {suspendedSellers.map((seller) => (
              <Grid key={seller.uid} size={{ xs: 12, md: 6, lg: 4 }}>
                <SellerCard seller={seller} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {sellers.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Store sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No sellers registered
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {sellers.map((seller) => (
              <Grid key={seller.uid} size={{ xs: 12, md: 6, lg: 4 }}>
                <SellerCard seller={seller} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Seller Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedSeller && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  Seller Details
                </Typography>
                <IconButton onClick={() => setDetailsOpen(false)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    fontSize: 28,
                  }}
                >
                  {selectedSeller.displayName?.charAt(0) || 'S'}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {selectedSeller.displayName}
                  </Typography>
                  <Chip
                    label={STATUS_CONFIG[selectedSeller.status as keyof typeof STATUS_CONFIG]?.label}
                    color={STATUS_CONFIG[selectedSeller.status as keyof typeof STATUS_CONFIG]?.color}
                    size="small"
                  />
                </Box>
              </Box>

              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <Store />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Shop Name"
                    secondary={selectedSeller.shopName || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <Email />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={selectedSeller.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <Phone />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Phone"
                    secondary={selectedSeller.phone || 'Not provided'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <CalendarToday />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Registered"
                    secondary={formatDate(selectedSeller.createdAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Last Login"
                    secondary={formatDate(selectedSeller.lastLogin)}
                  />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              {selectedSeller.status === 'pending' && (
                <>
                  <Button
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => openConfirmDialog('approve', selectedSeller)}
                  >
                    Approve
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => openConfirmDialog('reject', selectedSeller)}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedSeller.status === 'active' && (
                <Button
                  color="warning"
                  variant="outlined"
                  startIcon={<Block />}
                  onClick={() => openConfirmDialog('suspend', selectedSeller)}
                >
                  Suspend
                </Button>
              )}
              {(selectedSeller.status === 'suspended' || selectedSeller.status === 'rejected') && (
                <Button
                  color="success"
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => openConfirmDialog('reactivate', selectedSeller)}
                >
                  Reactivate
                </Button>
              )}
              <Button
                color="error"
                variant="text"
                onClick={() => openConfirmDialog('delete', selectedSeller)}
              >
                Delete Account
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, seller: null })}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{' '}
            <strong>{confirmDialog.action}</strong>{' '}
            <strong>{confirmDialog.seller?.displayName}</strong>?
          </Typography>
          {confirmDialog.action === 'delete' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              This action cannot be undone. The seller account will be permanently deleted.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, action: null, seller: null })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'approve' || confirmDialog.action === 'reactivate' ? 'success' : 'error'}
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : confirmDialog.action}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellersPage;
