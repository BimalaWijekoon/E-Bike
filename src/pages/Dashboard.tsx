// Admin Dashboard Page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  TwoWheeler,
  Store,
  AttachMoney,
  Inventory,
  TrendingUp,
  Warning,
  Add,
  ArrowForward,
  CheckCircle,
  Person,
  Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAllBikes } from '../services/firebase/bikes';
import { getAllSellers, getPendingSellers, approveSeller, rejectSeller, type Seller } from '../services/firebase/sellers';
import { getAllSales, type Sale } from '../services/firebase/sales';
import { getPendingRequests, type InventoryRequest } from '../services/firebase/inventoryRequests';
import type { Bike } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, trendUp = true }) => (
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {value}
          </Typography>
          {trend && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: trendUp ? 'success.main' : 'error.main' 
              }}
            >
              <TrendingUp 
                sx={{ 
                  fontSize: 16, 
                  mr: 0.5,
                  transform: trendUp ? 'none' : 'rotate(180deg)',
                }} 
              />
              <Typography variant="body2" fontWeight={500}>{trend}</Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 28 },
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBikes: 0,
    totalSellers: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    lowStockBikes: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: 'sale' | 'request' | 'seller';
    message: string;
    time: string;
  }>>([]);
  const [pendingSellers, setPendingSellers] = useState<Seller[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [bikes, sellers, sales, pendingReqs, pendingSellersList] = await Promise.all([
        getAllBikes().catch(() => [] as Bike[]),
        getAllSellers().catch(() => [] as Seller[]),
        getAllSales().catch(() => [] as Sale[]),
        getPendingRequests().catch(() => [] as InventoryRequest[]),
        getPendingSellers().catch(() => [] as Seller[]),
      ]);

      // Calculate stats
      const activeSellers = sellers.filter(s => s.status === 'active');
      const lowStockBikes = bikes.filter(b => b.stock <= 5 && b.status === 'active');
      const totalRevenue = sales
        .filter(s => s.status === 'completed')
        .reduce((sum, sale) => sum + sale.totalPrice, 0);

      setStats({
        totalBikes: bikes.length,
        totalSellers: activeSellers.length,
        totalSales: sales.length,
        totalRevenue,
        pendingRequests: pendingReqs.length,
        lowStockBikes: lowStockBikes.length,
      });

      // Build recent activities from real data
      const activities: Array<{
        id: string;
        type: 'sale' | 'request' | 'seller';
        message: string;
        time: string;
        date: Date;
      }> = [];

      // Add recent sales
      sales.slice(0, 3).forEach(sale => {
        activities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          message: `Sale: ${sale.bikeName} - ${formatCurrency(sale.totalPrice)}`,
          time: getTimeAgo(sale.createdAt),
          date: new Date(sale.createdAt),
        });
      });

      // Add recent requests
      pendingReqs.slice(0, 2).forEach(req => {
        activities.push({
          id: `req-${req.id}`,
          type: 'request',
          message: `Inventory request: ${req.bikeName} (${req.requestedQuantity} units)`,
          time: getTimeAgo(req.createdAt),
          date: new Date(req.createdAt),
        });
      });

      // Add pending sellers
      pendingSellersList.slice(0, 2).forEach(seller => {
        activities.push({
          id: `seller-${seller.uid}`,
          type: 'seller',
          message: `New seller registration: ${seller.displayName}`,
          time: getTimeAgo(seller.createdAt),
          date: new Date(seller.createdAt),
        });
      });

      // Sort by date and take top 5
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivities(activities.slice(0, 5).map(({ date, ...rest }) => rest));

      setPendingSellers(pendingSellersList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleApproveSeller = async (sellerId: string) => {
    try {
      setProcessingId(sellerId);
      await approveSeller(sellerId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving seller:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    try {
      setProcessingId(sellerId);
      await rejectSeller(sellerId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting seller:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening with your business.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Total Bikes"
              value={stats.totalBikes}
              icon={<TwoWheeler />}
              color="#3b82f6"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Active Sellers"
              value={stats.totalSellers}
              icon={<Store />}
              color="#10b981"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={<AttachMoney />}
              color="#f59e0b"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Total Sales"
              value={stats.totalSales}
              icon={<TrendingUp />}
              color="#8b5cf6"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              icon={<Inventory />}
              color="#06b6d4"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Low Stock Alert"
              value={stats.lowStockBikes}
              icon={<Warning />}
              color={stats.lowStockBikes > 0 ? "#ef4444" : "#10b981"}
            />
          )}
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Activity
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/admin/analytics')}>
                  View All
                </Button>
              </Box>
              {loading ? (
                <Box sx={{ px: 2, pb: 2 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : recentActivities.length > 0 ? (
                <List sx={{ px: 1 }}>
                  {recentActivities.map((activity) => (
                    <ListItem key={activity.id} sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: activity.type === 'sale' 
                              ? 'success.main' 
                              : activity.type === 'request' 
                                ? 'warning.main' 
                                : 'info.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {activity.type === 'sale' && <AttachMoney />}
                          {activity.type === 'request' && <Inventory />}
                          {activity.type === 'seller' && <Person />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Seller Approvals */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Pending Approvals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sellers waiting for approval
                  </Typography>
                </Box>
                <Chip 
                  label={`${pendingSellers.length} pending`} 
                  color="warning" 
                  size="small" 
                />
              </Box>
              
              {loading ? (
                <Box sx={{ px: 2, pb: 2 }}>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : pendingSellers.length > 0 ? (
                <List sx={{ px: 1 }}>
                  {pendingSellers.slice(0, 5).map((seller) => (
                    <ListItem 
                      key={seller.uid}
                      secondaryAction={
                        processingId === seller.uid ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              color="success" 
                              size="small"
                              onClick={() => handleApproveSeller(seller.uid)}
                              title="Approve"
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleRejectSeller(seller.uid)}
                              title="Reject"
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        )
                      }
                      sx={{ py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          {seller.displayName?.charAt(0) || 'S'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={seller.displayName}
                        secondary={`${seller.shopName || 'No shop'} • ${seller.email}`}
                        primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography color="text.secondary">
                    No pending approvals
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/bikes')}>
                Add New Bike
              </Button>
              <Button variant="outlined" startIcon={<Store />} onClick={() => navigate('/admin/sellers')}>
                Manage Sellers
              </Button>
              <Button variant="outlined" startIcon={<Inventory />} onClick={() => navigate('/admin/requests')}>
                View Requests
              </Button>
              <Button variant="outlined" startIcon={<TrendingUp />} onClick={() => navigate('/admin/analytics')}>
                Sales Report
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
