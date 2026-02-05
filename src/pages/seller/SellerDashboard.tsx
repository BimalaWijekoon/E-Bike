// Seller Dashboard - Overview Page
import { Box, Typography, Grid, Card, CardContent, Skeleton } from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  ShoppingCart as SaleIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
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

export default function SellerDashboard() {
  // Will be replaced with real data
  const loading = false;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome Back!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's an overview of your shop's performance
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Total Revenue"
              value="$0"
              icon={<MoneyIcon />}
              color="#4caf50"
              subtitle="All time earnings"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="This Month"
              value="$0"
              icon={<TrendingIcon />}
              color="#2196f3"
              subtitle="Current month sales"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Total Sales"
              value="0"
              icon={<SaleIcon />}
              color="#ff9800"
              subtitle="Orders completed"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="My Inventory"
              value="0"
              icon={<InventoryIcon />}
              color="#9c27b0"
              subtitle="Bikes in stock"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Pending Requests"
              value="0"
              icon={<ShippingIcon />}
              color="#00bcd4"
              subtitle="Awaiting approval"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <StatCard
              title="Low Stock"
              value="0"
              icon={<WarningIcon />}
              color="#f44336"
              subtitle="Need restock"
            />
          )}
        </Grid>
      </Grid>

      {/* Recent Activity and Quick Actions will be added here */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Sales
              </Typography>
              <Typography color="textSecondary">
                No sales recorded yet. Start by recording your first sale!
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Inventory Alerts
              </Typography>
              <Typography color="textSecondary">
                No low stock alerts at the moment.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
