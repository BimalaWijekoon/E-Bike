// Placeholder Pages for Admin Section
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { TwoWheeler, Store, Assessment, Inventory } from '@mui/icons-material';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description, icon }) => (
  <Box>
    <Typography variant="h4" fontWeight={700} gutterBottom>
      {title}
    </Typography>
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ color: 'primary.main', opacity: 0.5 }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary">
        {description}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This page will be implemented next.
      </Typography>
    </Paper>
  </Box>
);

export const BikesPage: React.FC = () => (
  <PlaceholderPage
    title="Bike Management"
    description="Manage your bike inventory, add new bikes, and update existing ones."
    icon={<TwoWheeler sx={{ fontSize: 80 }} />}
  />
);

export const SellersPage: React.FC = () => (
  <PlaceholderPage
    title="Seller Management"
    description="Manage sellers, their shops, and monitor their performance."
    icon={<Store sx={{ fontSize: 80 }} />}
  />
);

export const AnalyticsPage: React.FC = () => (
  <PlaceholderPage
    title="Sales Analytics"
    description="View detailed sales analytics, revenue trends, and performance metrics."
    icon={<Assessment sx={{ fontSize: 80 }} />}
  />
);

export const RequestsPage: React.FC = () => (
  <PlaceholderPage
    title="Inventory Requests"
    description="Review and approve inventory requests from sellers."
    icon={<Inventory sx={{ fontSize: 80 }} />}
  />
);
