// Seller Inventory Requests Page
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  Add as AddIcon,
  Close as CloseIcon,
  DirectionsBike as BikeIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Done as FulfilledIcon,
  Schedule as PendingIcon,
  Visibility as ViewIcon,
  GetApp as ClaimIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { getAllBikes, type Bike } from '../../services/firebase/bikes';
import {
  getRequestsBySeller,
  createInventoryRequest,
  processApprovedRequest,
  type InventoryRequest,
} from '../../services/firebase/inventoryRequests';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`request-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  fulfilled: 'success',
};

const priorityColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'success',
  high: 'warning',
  urgent: 'error',
};

export default function SellerRequestsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [availableBikes, setAvailableBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);

  // New request form
  const [formData, setFormData] = useState({
    bikeId: '',
    requestedQuantity: 1,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    // Auto-process old approved requests (from before code update)
    autoProcessApprovedRequests();
  }, [requests]);

  const fetchData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [requestsData, bikesData] = await Promise.all([
        getRequestsBySeller(user.uid),
        getAllBikes(),
      ]);
      setRequests(requestsData);
      // Only show active bikes
      setAvailableBikes(bikesData.filter(b => b.status === 'active'));
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const autoProcessApprovedRequests = async () => {
    // Find any approved requests (old ones that need inventory added)
    const approvedRequests = requests.filter(r => r.status === 'approved');
    
    if (approvedRequests.length > 0) {
      console.log(`Auto-processing ${approvedRequests.length} approved request(s)...`);
      
      for (const request of approvedRequests) {
        try {
          if (request.id) {
            await processApprovedRequest(request.id);
            console.log(`Processed request ${request.id}`);
          }
        } catch (err) {
          console.error(`Failed to auto-process request ${request.id}:`, err);
        }
      }
      
      // Refresh data after processing
      if (approvedRequests.length > 0) {
        setTimeout(() => fetchData(), 1000);
      }
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
    setFormData({
      bikeId: '',
      requestedQuantity: 1,
      priority: 'medium',
      notes: '',
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user?.uid || !user?.displayName) {
      setError('User information not found');
      return;
    }

    const selectedBike = availableBikes.find(b => b.id === formData.bikeId);
    if (!selectedBike) {
      setError('Please select a bike');
      return;
    }

    if (formData.requestedQuantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createInventoryRequest({
        sellerId: user.uid,
        sellerName: user.displayName,
        shopName: (user as any).shopName || 'Shop',
        bikeId: selectedBike.id,
        bikeName: selectedBike.name,
        requestedQuantity: formData.requestedQuantity,
        priority: formData.priority,
        notes: formData.notes,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleCloseDialog();
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRequest = (request: InventoryRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleClaimInventory = async (request: InventoryRequest) => {
    if (!request.id) return;
    
    try {
      setError(null);
      await processApprovedRequest(request.id);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to claim inventory');
      console.error(err);
    }
  };

  const getFilteredRequests = (status?: string) => {
    if (!status || status === 'all') return requests;
    return requests.filter(r => r.status === status);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const fulfilledCount = requests.filter(r => r.status === 'fulfilled').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  // Request Card Component
  const RequestCard = ({ request }: { request: InventoryRequest }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {request.bikeName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Requested: {formatDate(request.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
            <Chip
              label={request.status}
              size="small"
              color={statusColors[request.status]}
            />
            <Chip
              label={request.priority}
              size="small"
              color={priorityColors[request.priority]}
            />
          </Box>
        </Box>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="textSecondary">
              Requested Qty
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {request.requestedQuantity}
            </Typography>
          </Grid>
          {request.approvedQuantity !== undefined && (
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="textSecondary">
                Approved Qty
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {request.approvedQuantity}
              </Typography>
            </Grid>
          )}
        </Grid>

        {request.notes && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary" display="block">
              Your Notes:
            </Typography>
            <Typography variant="body2">{request.notes}</Typography>
          </Box>
        )}

        {request.adminNotes && (
          <Alert severity={request.status === 'rejected' ? 'error' : 'info'} sx={{ mb: 2 }}>
            <Typography variant="caption" display="block" fontWeight={600}>
              Admin Response:
            </Typography>
            <Typography variant="body2">{request.adminNotes}</Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box>
            {request.processedAt && (
              <Typography variant="caption" color="textSecondary">
                Processed: {formatDate(request.processedAt)}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {request.status === 'approved' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<ClaimIcon />}
                onClick={() => handleClaimInventory(request)}
              >
                Claim Bikes
              </Button>
            )}
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => handleViewRequest(request)}
            >
              View Details
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Inventory Requests
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Request bikes from admin inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          size="large"
        >
          New Request
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <PendingIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{pendingCount}</Typography>
              <Typography variant="body2">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ApprovedIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{approvedCount}</Typography>
              <Typography variant="body2">Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <FulfilledIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{fulfilledCount}</Typography>
              <Typography variant="body2">Fulfilled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <RejectedIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{rejectedCount}</Typography>
              <Typography variant="body2">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Approved (${approvedCount})`} />
            <Tab label={`Fulfilled (${fulfilledCount})`} />
            <Tab label={`Rejected (${rejectedCount})`} />
            <Tab label="All" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {getFilteredRequests('pending').length > 0 ? (
              <Grid container spacing={2}>
                {getFilteredRequests('pending').map((request) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShippingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">No pending requests</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {getFilteredRequests('approved').length > 0 ? (
              <Grid container spacing={2}>
                {getFilteredRequests('approved').map((request) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShippingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">No approved requests</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {getFilteredRequests('fulfilled').length > 0 ? (
              <Grid container spacing={2}>
                {getFilteredRequests('fulfilled').map((request) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShippingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">No fulfilled requests</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            {getFilteredRequests('rejected').length > 0 ? (
              <Grid container spacing={2}>
                {getFilteredRequests('rejected').map((request) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShippingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">No rejected requests</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            {requests.length > 0 ? (
              <Grid container spacing={2}>
                {requests.map((request) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShippingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Requests Yet
                </Typography>
                <Typography color="textSecondary">
                  Create your first inventory request to get bikes for your shop
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              New Inventory Request
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Request created successfully!
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Select Bike"
                value={formData.bikeId}
                onChange={(e) => setFormData(prev => ({ ...prev, bikeId: e.target.value }))}
                required
                disabled={submitting}
              >
                <MenuItem value="">
                  <em>Select a bike</em>
                </MenuItem>
                {availableBikes.map((bike) => (
                  <MenuItem key={bike.id} value={bike.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{bike.name}</span>
                      <Chip 
                        label={`$${bike.price.toLocaleString()}`} 
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.requestedQuantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  requestedQuantity: parseInt(e.target.value) || 1 
                }))}
                required
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  priority: e.target.value as any 
                }))}
                required
                disabled={submitting}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={submitting}
                placeholder="Add any additional information..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !formData.bikeId}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="textSecondary">Bike</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedRequest.bikeName}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Requested Qty</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedRequest.requestedQuantity}</Typography>
              </Grid>
              {selectedRequest.approvedQuantity !== undefined && (
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">Approved Qty</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {selectedRequest.approvedQuantity}
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
                <Chip label={selectedRequest.priority} size="small" color={priorityColors[selectedRequest.priority]} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip label={selectedRequest.status} size="small" color={statusColors[selectedRequest.status]} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="textSecondary">Created</Typography>
                <Typography variant="body1">{formatDate(selectedRequest.createdAt)}</Typography>
              </Grid>
              {selectedRequest.processedAt && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Processed</Typography>
                  <Typography variant="body1">{formatDate(selectedRequest.processedAt)}</Typography>
                  {selectedRequest.processedBy && (
                    <Typography variant="caption" color="textSecondary">
                      by {selectedRequest.processedBy}
                    </Typography>
                  )}
                </Grid>
              )}
              {selectedRequest.notes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Your Notes</Typography>
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, mt: 0.5 }}>
                    <Typography variant="body2">{selectedRequest.notes}</Typography>
                  </Box>
                </Grid>
              )}
              {selectedRequest.adminNotes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Admin Response</Typography>
                  <Alert severity={selectedRequest.status === 'rejected' ? 'error' : 'info'} sx={{ mt: 0.5 }}>
                    {selectedRequest.adminNotes}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
