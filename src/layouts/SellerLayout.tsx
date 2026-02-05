// Seller Dashboard Layout
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as SaleIcon,
  Inventory as InventoryIcon,
  LocalShipping as RequestIcon,
  History as HistoryIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
  DirectionsBike as BikeIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/authSlice';

const DRAWER_WIDTH = 260;

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/seller/dashboard', icon: <DashboardIcon /> },
  { title: 'Record Sale', path: '/seller/record-sale', icon: <SaleIcon /> },
  { title: 'My Inventory', path: '/seller/inventory', icon: <InventoryIcon /> },
  { title: 'Inventory Requests', path: '/seller/requests', icon: <RequestIcon /> },
  { title: 'Sales History', path: '/seller/sales', icon: <HistoryIcon /> },
  { title: 'My Shop Profile', path: '/seller/profile', icon: <StoreIcon /> },
];

export default function SellerLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BikeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            E-Bike Shop
          </Typography>
          <Chip label="Seller" size="small" color="secondary" sx={{ mt: 0.5 }} />
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                  },
                  py: 1.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                  }}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="error"
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* User Profile */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleMenuOpen}
          sx={{
            borderRadius: 2,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'secondary.main',
                fontSize: 14,
              }}
            >
              {user?.displayName?.charAt(0) || 'S'}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={user?.displayName || 'Seller'}
            secondary={user?.email}
            primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
            secondaryTypographyProps={{ fontSize: 12 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {navItems.find(item => item.path === location.pathname)?.title || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 7, sm: 8 },
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
