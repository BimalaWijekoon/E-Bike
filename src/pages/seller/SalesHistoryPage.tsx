// Sales History Page
import { Box, Typography, Card, CardContent, TextField, MenuItem } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';

export default function SalesHistoryPage() {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Sales History
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage all your sales transactions
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          defaultValue="all"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Time</MenuItem>
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="week">This Week</MenuItem>
          <MenuItem value="month">This Month</MenuItem>
        </TextField>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Sales Yet
            </Typography>
            <Typography color="textSecondary">
              Your sales history will appear here once you start recording sales
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
