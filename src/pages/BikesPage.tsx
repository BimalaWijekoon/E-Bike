// Bikes Management Page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Fab,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  TwoWheeler,
  Inventory,
  AttachMoney,
  Speed,
  Battery90,
  DirectionsBike,
  Close,
} from '@mui/icons-material';
import {
  getAllBikes,
  createBike,
  updateBike,
  deleteBike,
  type CreateBikeData,
} from '../services/firebase/bikes';
import type { Bike, BikeCategory, BikeStatus, VehicleCategory } from '../types';

const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: 'luxury-vehicle', label: 'Luxury Vehicle Series' },
  { value: 'national-standard-q', label: 'National Standard Vehicle Q Series' },
  { value: 'electric-motorcycle', label: 'Electric Motorcycle Series' },
  { value: 'special-offer', label: 'Special Offer Series' },
  { value: 'electric-bicycle', label: 'Electric Bicycle Series' },
  { value: 'tianjin-tricycle', label: 'Tianjin Tricycle Model' },
  { value: 'scooter', label: 'Scooter' },
];

const VEHICLE_NAMES: Record<VehicleCategory, string[]> = {
  'luxury-vehicle': [
    'PHANTOM MAX',
    'WAICHAN',
    'EX007 (Lithium Version)',
    'EX007 (Lead-acid Version)',
    'ETERNITY',
  ],
  'national-standard-q': [
    'Quest Q (72V24AH – 1000W Model)',
    'BullKing Q (72V30AH / 72V24AH Dual Battery Model)',
    'Coco Q (60V24AH – 450W Model)',
    'FULING Q',
    'LUNA Q',
    'FORTUNE Q',
    'X-ONE Q',
  ],
  'electric-motorcycle': [
    'SWEET TEA',
    'MILK SHAKE',
    'GRACEFULNESS',
    'CLOUD',
    'LINGYUE',
    'FLORA',
    'Q8',
    'NOV9',
    'FULING',
    'MELODY',
    'NAVIGATOR',
    'TANTOUR',
    'LAND BOUNDARY',
    'VAST UNIVERSE',
    'PATHFINDER',
    'BLITZ',
    'STARRY',
    'ADVENTURE',
    'SPARK',
    'STAR RIVER',
    'Crazy Battle',
    'DAWN',
    'DAWN II',
    'STARSHIP',
    'LIGHTNING',
    'THUNDER',
    'VICTORIA (Lithium Version)',
    'VICTORIA (Lead-acid Version)',
    'X-ONE DT (Lead-acid Version)',
    'X-ONE DT (Lithium Version)',
    'BULL KING',
    'DAWNRAY',
    'X-MAX',
    'COWBOY',
  ],
  'special-offer': [
    'FUMEI',
    'LYFEI II',
  ],
  'electric-bicycle': [
    'GENIUS',
    'YOUMMY',
    'LYFEI',
    'YOLIGHT',
    'YOHA 2.0',
    'YOKUO',
    'NY1',
    'SHADOW',
    'CHEETAH',
    'ICE CREAM',
    'BRONCO PRO',
    'CONFIDANT',
    'WARRIOR',
    'Striker',
    'YOGA Pro',
    'FALCON',
    'HUNTER',
    '137',
    'BULL',
    'M8',
    'EAGLE',
  ],
  'tianjin-tricycle': [
    'QQ II',
    'Q-CANDY',
    'MINI',
    'NIMBUS',
    'TRICLOUD II',
    'Q-STAR II',
    'STARBEAN',
    'STARMAY',
    'STARLORD',
    'STARPULSE II',
    'NEBULA II',
    'STARLORD PRO',
    'T-REX 1.8',
    'Vance 1.6',
    'Drake 1.6',
  ],
  'scooter': [
    'U1',
  ],
};

const CATEGORIES: { value: BikeCategory; label: string }[] = [
  { value: 'mountain', label: 'Mountain' },
  { value: 'road', label: 'Road' },
  { value: 'city', label: 'City' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
  { value: 'folding', label: 'Folding' },
];

const STATUS_OPTIONS: { value: BikeStatus; label: string; color: 'success' | 'error' | 'warning' }[] = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'warning' },
];

const initialFormData: CreateBikeData = {
  vehicleCategory: 'luxury-vehicle',
  name: '',
  brand: '',
  model: '',
  category: 'electric',
  price: 0,
  stock: 0,
  description: '',
  specifications: {
    motorPower: '',
    batteryCapacity: '',
    range: '',
    maxSpeed: '',
    weight: '',
  },
  status: 'active',
};

const BikesPage: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [formData, setFormData] = useState<CreateBikeData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Fetch bikes on mount
  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const data = await getAllBikes();
      setBikes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load bikes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bike?: Bike) => {
    if (bike) {
      setSelectedBike(bike);
      setFormData({
        vehicleCategory: bike.vehicleCategory,
        name: bike.name,
        brand: bike.brand,
        model: bike.model,
        category: bike.category,
        price: bike.price,
        stock: bike.stock,
        description: bike.description,
        specifications: bike.specifications,
        status: bike.status,
      });
    } else {
      setSelectedBike(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBike(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'vehicleCategory') {
      // Reset vehicle name when category changes
      setFormData((prev) => ({ ...prev, [field]: value, name: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Get available vehicle names for selected category
  const getAvailableVehicleNames = () => {
    return VEHICLE_NAMES[formData.vehicleCategory] || [];
  };

  const handleSpecChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (selectedBike) {
        await updateBike(selectedBike.id, formData);
      } else {
        await createBike(formData);
      }
      await fetchBikes();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save bike');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (bike: Bike) => {
    setSelectedBike(bike);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBike) return;
    try {
      setSaving(true);
      await deleteBike(selectedBike.id);
      await fetchBikes();
      setDeleteDialogOpen(false);
      setSelectedBike(null);
    } catch (err) {
      setError('Failed to delete bike');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: BikeStatus) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.color || 'default';
  };

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
            Bikes Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your e-bike inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add New Bike
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Bikes Grid */}
      {bikes.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <TwoWheeler sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bikes found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first bike to the inventory
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add First Bike
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {bikes.map((bike) => (
            <Grid key={bike.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                {/* Bike Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <TwoWheeler sx={{ fontSize: 32 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={600} noWrap>
                      {bike.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {bike.brand} • {bike.model}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flex: 1, p: 3 }}>
                  {/* Status & Category */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={STATUS_OPTIONS.find((s) => s.value === bike.status)?.label}
                      color={getStatusColor(bike.status)}
                      size="small"
                    />
                    <Chip
                      label={CATEGORIES.find((c) => c.value === bike.category)?.label}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {/* Price & Stock */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ color: 'success.main' }} />
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        ${bike.price.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory sx={{ color: bike.stock > 0 ? 'info.main' : 'error.main' }} />
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color={bike.stock > 0 ? 'info.main' : 'error.main'}
                      >
                        {bike.stock} in stock
                      </Typography>
                    </Box>
                  </Box>

                  {/* Specifications */}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Specifications
                  </Typography>
                  <Grid container spacing={1}>
                    {bike.specifications.motorPower && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{bike.specifications.motorPower}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {bike.specifications.batteryCapacity && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Battery90 sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{bike.specifications.batteryCapacity}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {bike.specifications.range && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DirectionsBike sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{bike.specifications.range}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {bike.specifications.maxSpeed && (
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          Max: {bike.specifications.maxSpeed}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Description */}
                  {bike.description && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {bike.description}
                      </Typography>
                    </>
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(bike)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteClick(bike)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {selectedBike ? 'Edit Bike' : 'Add New Bike'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                select
                label="Vehicle Category"
                value={formData.vehicleCategory}
                onChange={(e) => handleInputChange('vehicleCategory', e.target.value)}
                required
              >
                {VEHICLE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Vehicle Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              >
                {getAvailableVehicleNames().map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            {/* Specifications */}
            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Specifications
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Motor Power"
                value={formData.specifications.motorPower}
                onChange={(e) => handleSpecChange('motorPower', e.target.value)}
                placeholder="e.g., 750W"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Battery Capacity"
                value={formData.specifications.batteryCapacity}
                onChange={(e) => handleSpecChange('batteryCapacity', e.target.value)}
                placeholder="e.g., 48V 14Ah"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Range"
                value={formData.specifications.range}
                onChange={(e) => handleSpecChange('range', e.target.value)}
                placeholder="e.g., 50-60 km"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Max Speed"
                value={formData.specifications.maxSpeed}
                onChange={(e) => handleSpecChange('maxSpeed', e.target.value)}
                placeholder="e.g., 45 km/h"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Weight"
                value={formData.specifications.weight}
                onChange={(e) => handleSpecChange('weight', e.target.value)}
                placeholder="e.g., 25 kg"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.brand || !formData.model}
          >
            {saving ? <CircularProgress size={24} /> : selectedBike ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Bike</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedBike?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default BikesPage;
