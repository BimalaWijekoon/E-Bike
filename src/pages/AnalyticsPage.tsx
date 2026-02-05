import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Payments as PaymentsIcon,
  DirectionsBike as BikeIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { getAllSales, calculateSalesStats, type Sale } from '../services/firebase/sales';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: trend >= 0 ? 'success.main' : 'error.main',
                    transform: trend < 0 ? 'rotate(180deg)' : 'none'
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trend >= 0 ? 'success.main' : 'error.main',
                    ml: 0.5
                  }}
                >
                  {Math.abs(trend)}% vs last period
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getAllSales();
      setSales(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  // Filter sales by date
  const filteredSales = useMemo(() => {
    if (dateFilter === 'all') return sales;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return sales;
    }
    
    return sales.filter(sale => new Date(sale.createdAt) >= startDate);
  }, [sales, dateFilter]);

  // Calculate statistics
  const stats = useMemo(() => calculateSalesStats(filteredSales), [filteredSales]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get top sellers
  const topSellers = useMemo(() => {
    return Object.entries(stats.bySeller)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [stats]);

  // Get top bikes
  const topBikes = useMemo(() => {
    return Object.entries(stats.byBike)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats]);

  // Payment method labels
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    financing: 'Financing',
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sales Analytics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track your sales performance and revenue metrics
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Time</MenuItem>
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="week">Last 7 Days</MenuItem>
          <MenuItem value="month">Last 30 Days</MenuItem>
          <MenuItem value="quarter">Last 3 Months</MenuItem>
          <MenuItem value="year">Last Year</MenuItem>
        </TextField>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<MoneyIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            subtitle={`${stats.completedSales} completed`}
            icon={<CartIcon />}
            color="#2196f3"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Average Order"
            value={formatCurrency(stats.averageOrderValue)}
            icon={<TrendingUpIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Sellers"
            value={Object.keys(stats.bySeller).length}
            icon={<PersonIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" icon={<TrendingUpIcon />} iconPosition="start" />
            <Tab label="By Payment" icon={<PaymentsIcon />} iconPosition="start" />
            <Tab label="By Bike" icon={<BikeIcon />} iconPosition="start" />
            <Tab label="By Seller" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Recent Sales" icon={<CalendarIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Grid container spacing={3}>
              {/* Top Sellers */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Top Sellers by Revenue
                </Typography>
                {topSellers.length > 0 ? (
                  <Box>
                    {topSellers.map((seller, index) => {
                      const maxRevenue = topSellers[0]?.revenue || 1;
                      const percentage = (seller.revenue / maxRevenue) * 100;
                      return (
                        <Box key={seller.name} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {index + 1}. {seller.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(seller.revenue)} ({seller.count} sales)
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                              }
                            }} 
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography color="textSecondary">No sales data available</Typography>
                )}
              </Grid>

              {/* Top Bikes */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Top Selling Bikes
                </Typography>
                {topBikes.length > 0 ? (
                  <Box>
                    {topBikes.map((bike, index) => {
                      const maxCount = topBikes[0]?.count || 1;
                      const percentage = (bike.count / maxCount) * 100;
                      return (
                        <Box key={bike.name} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {index + 1}. {bike.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {bike.count} units ({formatCurrency(bike.revenue)})
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: '#4caf50',
                              }
                            }} 
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography color="textSecondary">No sales data available</Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Payment Methods Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Revenue by Payment Method
            </Typography>
            {Object.keys(stats.byPaymentMethod).length > 0 ? (
              <Grid container spacing={2}>
                {Object.entries(stats.byPaymentMethod).map(([method, amount]) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={method}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          {paymentMethodLabels[method] || method}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {formatCurrency(amount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {((amount / stats.totalRevenue) * 100).toFixed(1)}% of total
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="textSecondary">No payment data available</Typography>
            )}
          </CardContent>
        </TabPanel>

        {/* By Bike Tab */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sales by Bike Model
            </Typography>
            {Object.keys(stats.byBike).length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bike Model</TableCell>
                      <TableCell align="right">Units Sold</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(stats.byBike)
                      .sort(([, a], [, b]) => b.revenue - a.revenue)
                      .map(([name, data]) => (
                        <TableRow key={name}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BikeIcon color="primary" />
                              {name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{data.count}</TableCell>
                          <TableCell align="right">{formatCurrency(data.revenue)}</TableCell>
                          <TableCell align="right">
                            {((data.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary">No bike sales data available</Typography>
            )}
          </CardContent>
        </TabPanel>

        {/* By Seller Tab */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sales by Seller
            </Typography>
            {Object.keys(stats.bySeller).length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Seller</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Avg. Sale Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(stats.bySeller)
                      .sort(([, a], [, b]) => b.revenue - a.revenue)
                      .map(([name, data]) => (
                        <TableRow key={name}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon color="primary" />
                              {name}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{data.count}</TableCell>
                          <TableCell align="right">{formatCurrency(data.revenue)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(data.revenue / data.count)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary">No seller data available</Typography>
            )}
          </CardContent>
        </TabPanel>

        {/* Recent Sales Tab */}
        <TabPanel value={tabValue} index={4}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Sales
            </Typography>
            {filteredSales.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Bike</TableCell>
                      <TableCell>Seller</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSales.slice(0, 20).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.bikeName}</TableCell>
                        <TableCell>{sale.sellerName}</TableCell>
                        <TableCell align="right">{formatCurrency(sale.totalPrice)}</TableCell>
                        <TableCell>
                          <Chip
                            label={sale.status}
                            size="small"
                            color={
                              sale.status === 'completed' ? 'success' :
                              sale.status === 'pending' ? 'warning' :
                              sale.status === 'cancelled' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary">No sales data available</Typography>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* Empty State */}
      {sales.length === 0 && (
        <Card sx={{ mt: 3, textAlign: 'center', py: 6 }}>
          <ShippingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Sales Data Yet
          </Typography>
          <Typography color="textSecondary">
            Sales will appear here once sellers start recording transactions.
          </Typography>
        </Card>
      )}
    </Box>
  );
}
