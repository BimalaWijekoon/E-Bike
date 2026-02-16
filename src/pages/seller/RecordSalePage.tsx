// Record Sale Page
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  ShoppingCart as SaleIcon,
  CheckCircle as SuccessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DirectionsBike as BikeIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { getSellerInventory, reduceInventoryStock, type ShopInventoryItem } from '../../services/firebase/shopInventory';
import { createSale } from '../../services/firebase/sales';

export default function RecordSalePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bikeId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'financing',
    notes: '',
  });

  const selectedBike = inventory.find(bike => bike.id === formData.bikeId);
  const totalPrice = formData.unitPrice * formData.quantity;

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const items = await getSellerInventory(user.uid);
      // Filter only items with stock
      const inStock = items.filter(item => item.shopStock > 0);
      setInventory(inStock);
    } catch (err: any) {
      setError('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBikeChange = (bikeId: string) => {
    const bike = inventory.find(b => b.id === bikeId);
    setFormData(prev => ({
      ...prev,
      bikeId,
      unitPrice: bike?.price || 0,
      quantity: 1,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!user?.uid || !user?.displayName) {
        throw new Error('User information not found');
      }

      if (!selectedBike) {
        throw new Error('Please select a bike');
      }

      // Validate quantity
      if (formData.quantity > selectedBike.shopStock) {
        throw new Error(`Only ${selectedBike.shopStock} units available in stock`);
      }

      if (formData.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Create sale record
      await createSale({
        bikeId: selectedBike.id,
        bikeName: selectedBike.name,
        sellerId: user.uid,
        sellerName: user.displayName,
        shopName: (user as any).shopName || 'Shop',
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalPrice,
        paymentMethod: formData.paymentMethod,
        status: 'completed',
        notes: formData.notes,
      });

      // Reduce inventory
      await reduceInventoryStock(selectedBike.id, formData.quantity);

      // Success
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          bikeId: '',
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          quantity: 1,
          unitPrice: 0,
          paymentMethod: 'cash',
          notes: '',
        });
        fetchInventory(); // Refresh inventory
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to record sale');
      console.error('Sale error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent sx={{ py: 6 }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Sale Recorded!
            </Typography>
            <Typography color="textSecondary">
              Transaction completed successfully
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Record New Sale
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Record a new bike sale transaction
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {inventory.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <SaleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Inventory Available
              </Typography>
              <Typography color="textSecondary">
                You need to request bikes from admin before recording sales
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Bike Selection */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <BikeIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Select Bike
                    </Typography>
                  </Box>

                  <TextField
                    select
                    fullWidth
                    label="Bike Model"
                    value={formData.bikeId}
                    onChange={(e) => handleBikeChange(e.target.value)}
                    required
                    disabled={submitting}
                  >
                    <MenuItem value="">
                      <em>Select a bike</em>
                    </MenuItem>
                    {inventory.map((bike) => (
                      <MenuItem key={bike.id} value={bike.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span>{bike.name} - ${bike.price.toLocaleString()}</span>
                          <Chip 
                            label={`Stock: ${bike.shopStock}`} 
                            size="small"
                            color={bike.shopStock <= 5 ? 'warning' : 'success'}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>

                  {selectedBike && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" color="textSecondary">Brand</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedBike.brand}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" color="textSecondary">Model</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedBike.model}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" color="textSecondary">Available Stock</Typography>
                          <Typography variant="body1" fontWeight={500} color="primary.main">
                            {selectedBike.shopStock} units
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" color="textSecondary">Unit Price</Typography>
                          <Typography variant="body1" fontWeight={500}>
                            ${selectedBike.price.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Information */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Customer Information
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Customer Name"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Email (Optional)"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Sale Details */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Sale Details
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          quantity: parseInt(e.target.value) || 1 
                        }))}
                        required
                        disabled={submitting || !selectedBike}
                        inputProps={{ 
                          min: 1, 
                          max: selectedBike?.shopStock || 1 
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          unitPrice: parseFloat(e.target.value) || 0 
                        }))}
                        required
                        disabled={submitting || !selectedBike}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Total Price"
                        value={totalPrice.toFixed(2)}
                        disabled
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Payment Method"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          paymentMethod: e.target.value as any 
                        }))}
                        required
                        disabled={submitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PaymentIcon />
                            </InputAdornment>
                          ),
                        }}
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Credit/Debit Card</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                        <MenuItem value="financing">Financing</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Notes (Optional)"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        disabled={submitting}
                        multiline
                        rows={1}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Summary & Submit */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Transaction Summary
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      ${totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Items:</Typography>
                    <Typography fontWeight={500}>
                      {formData.quantity} × ${formData.unitPrice}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography>Payment:</Typography>
                    <Typography fontWeight={500}>
                      {formData.paymentMethod.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={submitting || !formData.bikeId}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Complete Sale'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      )}
    </Box>
  );
}
