// Seller Inventory Requests Page
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { LocalShipping as ShippingIcon, Add as AddIcon } from '@mui/icons-material';

export default function SellerRequestsPage() {
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
        <Button variant="contained" startIcon={<AddIcon />}>
          New Request
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ShippingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Requests Yet
            </Typography>
            <Typography color="textSecondary">
              Create your first inventory request to get bikes for your shop
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
