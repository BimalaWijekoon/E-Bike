import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  LocalShipping as FulfillIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Inventory as InventoryIcon,
  Schedule as PendingIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import {
  getAllInventoryRequests,
  approveRequest,
  rejectRequest,
  fulfillRequest,
  deleteRequest,
  type InventoryRequest,
} from '../services/firebase/inventoryRequests';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

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
      aria-labelledby={`request-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const priorityColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'success',
  high: 'warning',
  urgent: 'error',
};

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  fulfilled: 'success',
};

export default function InventoryRequestsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'fulfill' | 'delete' | null;
    request: InventoryRequest | null;
  }>({ open: false, type: null, request: null });
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllInventoryRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests by status
  const getFilteredRequests = (status?: string) => {
    if (!status || status === 'all') return requests;
    return requests.filter(r => r.status === status);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const fulfilledCount = requests.filter(r => r.status === 'fulfilled').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  // Handle view details
  const handleViewDetails = (request: InventoryRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  // Handle action dialog
  const handleOpenActionDialog = (type: 'approve' | 'reject' | 'fulfill' | 'delete', request: InventoryRequest) => {
    setActionDialog({ open: true, type, request });
    if (type === 'approve') {
      setApprovedQuantity(request.requestedQuantity);
    }
    setAdminNotes('');
  };

  const handleCloseActionDialog = () => {
    setActionDialog({ open: false, type: null, request: null });
    setApprovedQuantity(0);
    setAdminNotes('');
  };

  // Handle actions
  const handleAction = async () => {
    if (!actionDialog.request) return;
    
    setProcessing(true);
    try {
      const { type, request } = actionDialog;
      
      switch (type) {
        case 'approve':
          await approveRequest(request.id, approvedQuantity, adminNotes, user?.displayName);
          break;
        case 'reject':
          await rejectRequest(request.id, adminNotes, user?.displayName);
          break;
        case 'fulfill':
          await fulfillRequest(request.id);
          break;
        case 'delete':
          await deleteRequest(request.id);
          break;
      }
      
      handleCloseActionDialog();
      fetchRequests();
    } catch (err: any) {
      setError(err.message || `Failed to ${actionDialog.type} request`);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Request Card Component
  const RequestCard = ({ request }: { request: InventoryRequest }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {request.bikeName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {request.shopName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Chip
              label={request.priority}
              size="small"
              color={priorityColors[request.priority]}
            />
            <Chip
              label={request.status}
              size="small"
              color={statusColors[request.status]}
            />
          </Box>
        </Box>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="textSecondary">
              Requested Qty
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {request.requestedQuantity}
            </Typography>
          </Grid>
          {request.approvedQuantity !== undefined && (
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="textSecondary">
                Approved Qty
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {request.approvedQuantity}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Requested by: {request.sellerName}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {formatDate(request.createdAt)}
        </Typography>

        {request.notes && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Notes: {request.notes}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => handleViewDetails(request)}
          >
            Details
          </Button>
          <Box>
            {request.status === 'pending' && (
              <>
                <Tooltip title="Approve">
                  <IconButton
                    color="success"
                    size="small"
                    onClick={() => handleOpenActionDialog('approve', request)}
                  >
                    <ApproveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleOpenActionDialog('reject', request)}
                  >
                    <RejectIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {request.status === 'approved' && (
              <Tooltip title="Mark as Fulfilled">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => handleOpenActionDialog('fulfill', request)}
                >
                  <FulfillIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton
                color="error"
                size="small"
                onClick={() => handleOpenActionDialog('delete', request)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Stats Cards
  const StatsSection = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'warning.contrastText' }}>
          <PendingIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">{pendingCount}</Typography>
          <Typography variant="body2">Pending</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'info.contrastText' }}>
          <ApproveIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">{approvedCount}</Typography>
          <Typography variant="body2">Approved</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
          <DoneIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">{fulfilledCount}</Typography>
          <Typography variant="body2">Fulfilled</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'error.contrastText' }}>
          <RejectIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold">{rejectedCount}</Typography>
          <Typography variant="body2">Rejected</Typography>
        </Paper>
      </Grid>
    </Grid>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Inventory Requests
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage bike inventory requests from sellers
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <StatsSection />

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
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                    <RequestCard request={request} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">No inventory requests yet</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">Bike</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedRequest.bikeName}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">Seller</Typography>
                  <Typography variant="body1">{selectedRequest.sellerName}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">Shop</Typography>
                  <Typography variant="body1">{selectedRequest.shopName}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">Requested Quantity</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedRequest.requestedQuantity}</Typography>
                </Grid>
                {selectedRequest.approvedQuantity !== undefined && (
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">Approved Quantity</Typography>
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
                  <Typography variant="subtitle2" color="textSecondary">Requested At</Typography>
                  <Typography variant="body1">{formatDate(selectedRequest.createdAt)}</Typography>
                </Grid>
                {selectedRequest.processedAt && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">Processed At</Typography>
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
                    <Typography variant="subtitle2" color="textSecondary">Seller Notes</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                      <Typography variant="body2">{selectedRequest.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedRequest.adminNotes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">Admin Notes</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                      <Typography variant="body2">{selectedRequest.adminNotes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={handleCloseActionDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'approve' && 'Approve Request'}
          {actionDialog.type === 'reject' && 'Reject Request'}
          {actionDialog.type === 'fulfill' && 'Mark as Fulfilled'}
          {actionDialog.type === 'delete' && 'Delete Request'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.type === 'approve' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Approved Quantity"
                type="number"
                value={approvedQuantity}
                onChange={(e) => setApprovedQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1, max: actionDialog.request?.requestedQuantity }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </Box>
          )}
          {actionDialog.type === 'reject' && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you sure you want to reject this request?
              </Alert>
              <TextField
                fullWidth
                label="Reason (Optional)"
                multiline
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </Box>
          )}
          {actionDialog.type === 'fulfill' && (
            <Alert severity="info">
              This will mark the request as fulfilled, indicating the bikes have been delivered.
            </Alert>
          )}
          {actionDialog.type === 'delete' && (
            <Alert severity="error">
              Are you sure you want to delete this request? This action cannot be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            variant="contained"
            color={actionDialog.type === 'delete' || actionDialog.type === 'reject' ? 'error' : 'primary'}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
