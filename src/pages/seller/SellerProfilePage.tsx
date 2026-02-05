// Seller Profile Page - Shop Information
import { Box, Typography, Card, CardContent, Grid, Avatar, Divider } from '@mui/material';
import { Store as StoreIcon, Email, Phone, LocationOn } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

export default function SellerProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Shop Profile
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage your shop information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: 40,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user?.displayName?.charAt(0) || 'S'}
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {user?.displayName || 'Shop Owner'}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Shop Manager
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Shop Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <StoreIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Shop Information
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Email color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {user?.email || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Phone color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        Not provided
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <LocationOn color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Address
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        Not provided
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Account Status
                </Typography>
                <Typography variant="body1" fontWeight={500} color="success.main">
                  Active
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Info */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Business Hours
              </Typography>
              <Typography color="textSecondary">
                Business hours information will be displayed here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
