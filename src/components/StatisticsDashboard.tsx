import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CompareArrows as CompareArrowsIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import axios from 'axios';
import { Idea } from '../types';
import AdvancedStatistics from './AdvancedStatistics';
import ReportGenerator from './ReportGenerator';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const StatisticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [comparisonType, setComparisonType] = useState<'month' | 'year' | 'none'>('none');
  const [showComparison, setShowComparison] = useState(false);

  const fetchIdeas = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('https://idea-managment.onrender.com/api/ideas', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setIdeas(response.data);
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Không thể tải dữ liệu thống kê');
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  // Filter data based on time range and department
  const getFilteredIdeas = () => {
    let filtered = [...ideas];

    // Filter by time range
    const now = new Date();
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(idea => new Date(idea.submissionDate) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(idea => new Date(idea.submissionDate) >= monthAgo);
    } else if (timeRange === 'quarter') {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(idea => new Date(idea.submissionDate) >= quarterAgo);
    } else if (timeRange === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(idea => new Date(idea.submissionDate) >= yearAgo);
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(idea => idea.department === departmentFilter);
    }

    return filtered;
  };

  const filteredIdeas = getFilteredIdeas();

  // Comparison calculation functions
  const getCurrentMonthData = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return ideas.filter(idea => {
      const submissionDate = new Date(idea.submissionDate);
      return submissionDate >= startOfMonth && submissionDate <= endOfMonth;
    });
  };

  const getPreviousMonthData = () => {
    const now = new Date();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    return ideas.filter(idea => {
      const submissionDate = new Date(idea.submissionDate);
      return submissionDate >= startOfPrevMonth && submissionDate <= endOfPrevMonth;
    });
  };

  const getCurrentYearData = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    return ideas.filter(idea => {
      const submissionDate = new Date(idea.submissionDate);
      return submissionDate >= startOfYear && submissionDate <= endOfYear;
    });
  };

  const getPreviousYearData = () => {
    const now = new Date();
    const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfPrevYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    
    return ideas.filter(idea => {
      const submissionDate = new Date(idea.submissionDate);
      return submissionDate >= startOfPrevYear && submissionDate <= endOfPrevYear;
    });
  };

  const calculateComparisonData = () => {
    if (comparisonType === 'month') {
      const currentData = getCurrentMonthData();
      const previousData = getPreviousMonthData();
      
      return {
        current: currentData,
        previous: previousData,
        period: 'tháng',
        currentLabel: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        previousLabel: `Tháng ${new Date().getMonth() === 0 ? 12 : new Date().getMonth()}/${new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()}`
      };
    } else if (comparisonType === 'year') {
      const currentData = getCurrentYearData();
      const previousData = getPreviousYearData();
      
      return {
        current: currentData,
        previous: previousData,
        period: 'năm',
        currentLabel: `Năm ${new Date().getFullYear()}`,
        previousLabel: `Năm ${new Date().getFullYear() - 1}`
      };
    }
    return null;
  };

  const getComparisonStats = () => {
    const comparisonData = calculateComparisonData();
    if (!comparisonData) return null;

    const { current, previous, period, currentLabel, previousLabel } = comparisonData;

    const currentTotal = current.length;
    const previousTotal = previous.length;
    const totalChange = currentTotal - previousTotal;
    const totalChangePercent = previousTotal > 0 ? ((totalChange / previousTotal) * 100) : 0;

    const currentRewarded = current.filter(idea => idea.status === 'rewarded').length;
    const previousRewarded = previous.filter(idea => idea.status === 'rewarded').length;
    const rewardedChange = currentRewarded - previousRewarded;
    const rewardedChangePercent = previousRewarded > 0 ? ((rewardedChange / previousRewarded) * 100) : 0;

    const currentRewardRate = currentTotal > 0 ? (currentRewarded / currentTotal) * 100 : 0;
    const previousRewardRate = previousTotal > 0 ? (previousRewarded / previousTotal) * 100 : 0;
    const rewardRateChange = currentRewardRate - previousRewardRate;

    return {
      currentLabel,
      previousLabel,
      period,
      total: {
        current: currentTotal,
        previous: previousTotal,
        change: totalChange,
        changePercent: totalChangePercent
      },
      rewarded: {
        current: currentRewarded,
        previous: previousRewarded,
        change: rewardedChange,
        changePercent: rewardedChangePercent
      },
      rewardRate: {
        current: currentRewardRate,
        previous: previousRewardRate,
        change: rewardRateChange
      }
    };
  };

  const handleComparisonTypeChange = (event: React.MouseEvent<HTMLElement>, newType: 'month' | 'year' | 'none') => {
    if (newType !== null) {
      setComparisonType(newType);
      setShowComparison(newType !== 'none');
    }
  };

  // Calculate statistics
  const totalIdeas = filteredIdeas.length;
  const pendingIdeas = filteredIdeas.filter(idea => idea.status === 'pending').length;
  const rewardedIdeas = filteredIdeas.filter(idea => idea.status === 'rewarded').length;
  const rejectedIdeas = filteredIdeas.filter(idea => idea.status === 'rejected').length;
  const rewardRate = totalIdeas > 0 ? ((rewardedIdeas / totalIdeas) * 100).toFixed(1) : '0';

  // Department statistics
  const departmentStats = filteredIdeas.reduce((acc, idea) => {
    acc[idea.department] = (acc[idea.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepartments = Object.entries(departmentStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // User ranking statistics
  const userStats = filteredIdeas.reduce((acc, idea) => {
    const userName = idea.fullName || 'Không xác định';
    if (!acc[userName]) {
      acc[userName] = {
        name: userName,
        total: 0,
        rewarded: 0,
        pending: 0,
        rejected: 0,
        department: idea.department
      };
    }
    acc[userName].total++;
    acc[userName][idea.status]++;
    return acc;
  }, {} as Record<string, { name: string; total: number; rewarded: number; pending: number; rejected: number; department: string }>);

  const topUsers = Object.values(userStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15); // Top 15 users

  // Monthly trend data
  const monthlyData = filteredIdeas.reduce((acc, idea) => {
    const date = new Date(idea.submissionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, rewarded: 0, rejected: 0, pending: 0 };
    }
    acc[monthKey].total++;
    acc[monthKey][idea.status]++;
    return acc;
  }, {} as Record<string, { total: number; rewarded: number; rejected: number; pending: number }>);

  const monthlyLabels = Object.keys(monthlyData).sort();
  const monthlyTotals = monthlyLabels.map(label => monthlyData[label].total);
  const monthlyRewarded = monthlyLabels.map(label => monthlyData[label].rewarded);
  const monthlyRejected = monthlyLabels.map(label => monthlyData[label].rejected);

  // Chart configurations
  const statusChartData = {
    labels: ['Chưa xem xét', 'Đã khen thưởng', 'Không khen thưởng'],
    datasets: [
      {
        data: [pendingIdeas, rewardedIdeas, rejectedIdeas],
        backgroundColor: [
          '#FFA726',
          '#66BB6A',
          '#EF5350'
        ],
        borderColor: [
          '#FF9800',
          '#4CAF50',
          '#F44336'
        ],
        borderWidth: 2
      }
    ]
  };

  const departmentChartData = {
    labels: topDepartments.map(([dept]) => dept.length > 20 ? dept.substring(0, 20) + '...' : dept),
    datasets: [
      {
        label: 'Số lượng ý tưởng',
        data: topDepartments.map(([, count]) => count),
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1
      }
    ]
  };

  const trendChartData = {
    labels: monthlyLabels.map(label => {
      const [year, month] = label.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Tổng số ý tưởng',
        data: monthlyTotals,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Đã khen thưởng',
        data: monthlyRewarded,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Không khen thưởng',
        data: monthlyRejected,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        fill: false,
        tension: 0.4
      }
    ]
  };

  // User ranking chart data
  const userRankingChartData = {
    labels: topUsers.map(user => user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name),
    datasets: [
      {
        label: 'Tổng số ý tưởng',
        data: topUsers.map(user => user.total),
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const userRankingOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // Horizontal bar chart
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 15 Người có nhiều ý tưởng nhất'
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      },
      y: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          align: 'start' as const,
          font: {
            family: 'monospace'
          }
        },
        grid: {
          display: false
        }
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20
      }
    },
    elements: {
      bar: {
        borderSkipped: false
      }
    }
  };

  // Comparison Card Component
  const ComparisonCard: React.FC<{ 
    title: string; 
    currentValue: number; 
    previousValue: number; 
    change: number; 
    changePercent: number;
    icon: React.ReactNode;
  }> = ({ title, currentValue, previousValue, change, changePercent, icon }) => {
    const isPositive = change >= 0;
    const isSignificant = Math.abs(changePercent) >= 5; // 5% threshold for significant change
    
    return (
      <Card sx={{ 
        p: 2, 
        height: '100%',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        boxShadow: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold', color: '#1976d2' }}>
            {title}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
            {currentValue}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isPositive ? (
              <TrendingUpIcon sx={{ color: '#2e7d32', mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#d32f2f', mr: 0.5 }} />
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                color: isPositive ? '#2e7d32' : '#d32f2f',
                fontWeight: 'bold',
                fontSize: isSignificant ? '1rem' : '0.875rem'
              }}
            >
              {change > 0 ? '+' : ''}{change} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          So với kỳ trước: {previousValue}
        </Typography>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Dashboard Thống kê Ý tưởng Cải tiến
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBackToAdmin}
                sx={{ textTransform: 'none' }}
              >
                Quay lại Admin
              </Button>
              <Button
                variant={showAdvanced ? "contained" : "outlined"}
                onClick={() => setShowAdvanced(!showAdvanced)}
                sx={{ textTransform: 'none' }}
              >
                {showAdvanced ? 'Ẩn Thống kê Nâng cao' : 'Hiện Thống kê Nâng cao'}
              </Button>
              <ReportGenerator 
                ideas={ideas}
                timeRange={timeRange}
                departmentFilter={departmentFilter}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={handleLogout}
                sx={{ textTransform: 'none' }}
              >
                Đăng xuất
              </Button>
            </Box>
          </Box>
          <Divider />
          
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Khoảng thời gian"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="week">7 ngày qua</MenuItem>
                <MenuItem value="month">30 ngày qua</MenuItem>
                <MenuItem value="quarter">3 tháng qua</MenuItem>
                <MenuItem value="year">1 năm qua</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Phòng ban</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Phòng ban"
              >
                <MenuItem value="all">Tất cả phòng ban</MenuItem>
                {Array.from(new Set(ideas.map(i => i.department))).map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={comparisonType}
              exclusive
              onChange={handleComparisonTypeChange}
              size="small"
              sx={{ 
                border: '1px solid #1976d2',
                borderRadius: 1,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  px: 2,
                  py: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#1976d2',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="none">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Không so sánh
                </Typography>
              </ToggleButton>
              <ToggleButton value="month">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  So sánh tháng
                </Typography>
              </ToggleButton>
              <ToggleButton value="year">
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  So sánh năm
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Comparison Section */}
      {showComparison && (() => {
        const stats = getComparisonStats();
        if (!stats) return null;

        return (
          <Card elevation={3} sx={{ mb: 4, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CompareArrowsIcon sx={{ color: 'white', mr: 1, fontSize: '2rem' }} />
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  So sánh {stats.period}: {stats.currentLabel} vs {stats.previousLabel}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <ComparisonCard
                    title="Tổng số ý tưởng"
                    currentValue={stats.total.current}
                    previousValue={stats.total.previous}
                    change={stats.total.change}
                    changePercent={stats.total.changePercent}
                    icon={<BarChartIcon sx={{ color: '#1976d2', fontSize: '1.5rem' }} />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ComparisonCard
                    title="Ý tưởng được khen thưởng"
                    currentValue={stats.rewarded.current}
                    previousValue={stats.rewarded.previous}
                    change={stats.rewarded.change}
                    changePercent={stats.rewarded.changePercent}
                    icon={<TrendingUpIcon sx={{ color: '#2e7d32', fontSize: '1.5rem' }} />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ 
                    p: 2, 
                    height: '100%',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    boxShadow: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUpIcon sx={{ color: '#1976d2', fontSize: '1.5rem' }} />
                      <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold', color: '#1976d2' }}>
                        Tỷ lệ khen thưởng
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        {stats.rewardRate.current.toFixed(1)}%
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {stats.rewardRate.change >= 0 ? (
                          <TrendingUpIcon sx={{ color: '#2e7d32', mr: 0.5 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: '#d32f2f', mr: 0.5 }} />
                        )}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: stats.rewardRate.change >= 0 ? '#2e7d32' : '#d32f2f',
                            fontWeight: 'bold'
                          }}
                        >
                          {stats.rewardRate.change > 0 ? '+' : ''}{stats.rewardRate.change.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      So với kỳ trước: {stats.rewardRate.previous.toFixed(1)}%
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      })()}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                {totalIdeas}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tổng số ý tưởng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                {rewardedIdeas}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Đã khen thưởng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {pendingIdeas}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Chưa xem xét
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h3" color="error.main" sx={{ fontWeight: 'bold' }}>
                {rewardRate}%
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tỷ lệ khen thưởng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Status Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Phân bố Trạng thái Ý tưởng
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Doughnut data={statusChartData} options={doughnutOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Top Departments Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Top 10 Phòng ban có nhiều ý tưởng nhất
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar data={departmentChartData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Monthly Trend Chart */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Xu hướng Ý tưởng theo Tháng
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Line data={trendChartData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* User Ranking Chart */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Xếp hạng Người có nhiều ý tưởng nhất
            </Typography>
            <Box sx={{ height: 400, mt: 2 }}>
              <Bar data={userRankingChartData} options={userRankingOptions} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Statistics */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Thống kê Chi tiết
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Tổng số ý tưởng:</Typography>
                <Chip label={totalIdeas} color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Đã khen thưởng:</Typography>
                <Chip label={rewardedIdeas} color="success" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Chưa xem xét:</Typography>
                <Chip label={pendingIdeas} color="warning" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Không khen thưởng:</Typography>
                <Chip label={rejectedIdeas} color="error" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Tỷ lệ khen thưởng:</Typography>
                <Chip label={`${rewardRate}%`} color="info" />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Top Phòng ban
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {topDepartments.slice(0, 5).map(([dept, count], index) => (
                <Box key={dept} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>
                    {index + 1}. {dept.length > 30 ? dept.substring(0, 30) + '...' : dept}
                  </Typography>
                  <Chip label={count} size="small" color="primary" />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Top 10 Người có nhiều ý tưởng nhất
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
              {topUsers.slice(0, 10).map((user, index) => (
                <Box key={user.name} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: index < 3 ? '#f5f5f5' : 'transparent',
                  border: index < 3 ? '1px solid #e0e0e0' : 'none'
                }}>
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                      {index + 1}. {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.department}
                    </Typography>
                  </Box>
                  <Chip label={user.total} size="small" color="primary" />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Statistics */}
      {showAdvanced && (
        <Box sx={{ mt: 4 }}>
          <AdvancedStatistics 
            ideas={ideas}
            timeRange={timeRange}
            departmentFilter={departmentFilter}
          />
        </Box>
      )}
    </Container>
  );
};

export default StatisticsDashboard;
