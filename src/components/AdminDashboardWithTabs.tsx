import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Logout as LogoutIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';


const AdminDashboardWithTabs: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleGoToStatistics = () => {
    navigate('/statistics');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Card elevation={3} sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Hệ thống Quản lý Ý tưởng Cải tiến
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="info"
                startIcon={<BarChartIcon />}
                onClick={handleGoToStatistics}
                sx={{
                  py: 1.0,
                  px: 2.0,
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Dashboard Thống kê
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  py: 1.0,
                  px: 2.0,
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  textTransform: 'none'
                }}
              >
                Đăng xuất
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <AdminDashboard />
    </Container>
  );
};

export default AdminDashboardWithTabs;
