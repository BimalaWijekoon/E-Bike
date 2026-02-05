// Record Sale Page
import { Box, Typography, Card, CardContent } from '@mui/material';
import { ShoppingCart as SaleIcon } from '@mui/icons-material';

export default function RecordSalePage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Record New Sale
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Record a new bike sale to a customer
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <SaleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Sale Recording Form
            </Typography>
            <Typography color="textSecondary">
              Form will be implemented here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
