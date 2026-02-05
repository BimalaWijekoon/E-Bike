// Seller Inventory Page - My Shop's Bikes
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';

export default function SellerInventoryPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Inventory
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage bikes available in your shop
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Inventory Yet
            </Typography>
            <Typography color="textSecondary">
              Request bikes from admin to start building your inventory
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
