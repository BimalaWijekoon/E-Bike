// Seller Inventory Page - My Shop's Bikes
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  CardMedia,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  AddShoppingCart as RequestIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { getSellerInventory, type ShopInventoryItem } from '../../services/firebase/shopInventory';

export default function SellerInventoryPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<ShopInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [user]);

  useEffect(() => {
    // Filter inventory based on search
    if (searchQuery.trim() === '') {
      setFilteredInventory(inventory);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredInventory(
        inventory.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.brand.toLowerCase().includes(query) ||
            item.model.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getSellerInventory(user.uid);
      setInventory(data);
      setFilteredInventory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, item) => sum + item.shopStock, 0);
  const totalSold = inventory.reduce((sum, item) => sum + item.totalSold, 0);
  const lowStockCount = inventory.filter((item) => item.shopStock <= 5 && item.shopStock > 0).length;
  const outOfStockCount = inventory.filter((item) => item.shopStock === 0).length;

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (stock <= 5) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Inventory
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage bikes available in your shop
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RequestIcon />}
          onClick={() => navigate('/seller/requests')}
        >
          Request More Bikes
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {totalItems}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Bikes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {totalStock}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {totalSold}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Sold
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {lowStockCount + outOfStockCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Low/Out Stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, brand, model, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Inventory Grid */}
      {filteredInventory.length > 0 ? (
        <Grid container spacing={3}>
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item.shopStock);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {item.images && item.images.length > 0 && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.images[0]}
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Chip
                        label={stockStatus.label}
                        size="small"
                        color={stockStatus.color}
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {item.brand} • {item.model}
                    </Typography>

                    <Chip label={item.category} size="small" sx={{ mb: 2 }} />

                    <Box sx={{ my: 2 }}>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        ${item.price.toLocaleString()}
                      </Typography>
                    </Box>

                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="textSecondary">
                          In Stock
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {item.shopStock}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="textSecondary">
                          Sold
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {item.totalSold}
                        </Typography>
                      </Grid>
                    </Grid>

                    {item.lastRestocked && (
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Last restocked: {new Date(item.lastRestocked).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : inventory.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Inventory Yet
              </Typography>
              <Typography color="textSecondary" sx={{ mb: 3 }}>
                Request bikes from admin to start building your inventory
              </Typography>
              <Button
                variant="contained"
                startIcon={<RequestIcon />}
                onClick={() => navigate('/seller/requests')}
              >
                Request Bikes
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Results Found
              </Typography>
              <Typography color="textSecondary">
                Try adjusting your search query
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
