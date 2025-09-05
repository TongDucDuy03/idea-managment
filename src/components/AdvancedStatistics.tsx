import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
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
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { Idea } from '../types';

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

interface AdvancedStatisticsProps {
  ideas: Idea[];
  timeRange: string;
  departmentFilter: string;
}

const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({ 
  ideas, 
  timeRange, 
  departmentFilter 
}) => {
  const [selectedMetric, setSelectedMetric] = useState('ideas');

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

  // Calculate advanced statistics
  const totalIdeas = filteredIdeas.length;
  const pendingIdeas = filteredIdeas.filter(idea => idea.status === 'pending').length;
  const rewardedIdeas = filteredIdeas.filter(idea => idea.status === 'rewarded').length;
  const rejectedIdeas = filteredIdeas.filter(idea => idea.status === 'rejected').length;

  // Department performance analysis
  const departmentPerformance = filteredIdeas.reduce((acc, idea) => {
    if (!acc[idea.department]) {
      acc[idea.department] = {
        total: 0,
        rewarded: 0,
        pending: 0,
        rejected: 0,
        rewardRate: 0
      };
    }
    acc[idea.department].total++;
    acc[idea.department][idea.status]++;
    return acc;
  }, {} as Record<string, { total: number; rewarded: number; pending: number; rejected: number; rewardRate: number }>);

  // Calculate reward rates
  Object.keys(departmentPerformance).forEach(dept => {
    const deptData = departmentPerformance[dept];
    deptData.rewardRate = deptData.total > 0 ? (deptData.rewarded / deptData.total) * 100 : 0;
  });

  // Sort departments by performance
  const sortedDepartments = Object.entries(departmentPerformance)
    .sort(([,a], [,b]) => b.rewardRate - a.rewardRate);

  // Weekly trend data
  const weeklyData = filteredIdeas.reduce((acc, idea) => {
    const date = new Date(idea.submissionDate);
    const weekKey = `${date.getFullYear()}-W${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}`;
    if (!acc[weekKey]) {
      acc[weekKey] = { total: 0, rewarded: 0, rejected: 0, pending: 0 };
    }
    acc[weekKey].total++;
    acc[weekKey][idea.status]++;
    return acc;
  }, {} as Record<string, { total: number; rewarded: number; rejected: number; pending: number }>);

  const weeklyLabels = Object.keys(weeklyData).sort();
  const weeklyTotals = weeklyLabels.map(label => weeklyData[label].total);

  // Monthly performance comparison
  const monthlyPerformance = filteredIdeas.reduce((acc, idea) => {
    const date = new Date(idea.submissionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, rewarded: 0, pending: 0, rejected: 0 };
    }
    acc[monthKey].total++;
    acc[monthKey][idea.status]++;
    return acc;
  }, {} as Record<string, { total: number; rewarded: number; pending: number; rejected: number }>);

  const monthlyLabels = Object.keys(monthlyPerformance).sort();
  const monthlyRewardRates = monthlyLabels.map(label => {
    const data = monthlyPerformance[label];
    return data.total > 0 ? (data.rewarded / data.total) * 100 : 0;
  });

  // Chart configurations
  const departmentPerformanceData = {
    labels: sortedDepartments.slice(0, 8).map(([dept]) => 
      dept.length > 15 ? dept.substring(0, 15) + '...' : dept
    ),
    datasets: [
      {
        label: 'Tỷ lệ khen thưởng (%)',
        data: sortedDepartments.slice(0, 8).map(([, data]) => data.rewardRate.toFixed(1)),
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1
      }
    ]
  };

  const weeklyTrendData = {
    labels: weeklyLabels.map(label => `Tuần ${label.split('-W')[1]}`),
    datasets: [
      {
        label: 'Số ý tưởng',
        data: weeklyTotals,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const monthlyRewardRateData = {
    labels: monthlyLabels.map(label => {
      const [year, month] = label.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Tỷ lệ khen thưởng (%)',
        data: monthlyRewardRates,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const statusDistributionData = {
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* Department Performance Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Hiệu suất Phòng ban (Top 8)
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar data={departmentPerformanceData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Status Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Phân bố Trạng thái
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Pie data={statusDistributionData} options={pieOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Weekly Trend Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Xu hướng Theo Tuần
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Line data={weeklyTrendData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Monthly Reward Rate Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Tỷ lệ Khen thưởng Theo Tháng
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Line data={monthlyRewardRateData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Department Performance Table */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Bảng Xếp hạng Phòng ban
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Xếp hạng</strong></TableCell>
                    <TableCell><strong>Phòng ban</strong></TableCell>
                    <TableCell align="center"><strong>Tổng ý tưởng</strong></TableCell>
                    <TableCell align="center"><strong>Đã khen thưởng</strong></TableCell>
                    <TableCell align="center"><strong>Chưa xem xét</strong></TableCell>
                    <TableCell align="center"><strong>Không khen thưởng</strong></TableCell>
                    <TableCell align="center"><strong>Tỷ lệ khen thưởng</strong></TableCell>
                    <TableCell align="center"><strong>Thanh tiến độ</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedDepartments.map(([dept, data], index) => (
                    <TableRow key={dept}>
                      <TableCell>
                        <Chip 
                          label={index + 1} 
                          color={index < 3 ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dept.length > 40 ? dept.substring(0, 40) + '...' : dept}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={data.total} color="primary" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={data.rewarded} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={data.pending} color="warning" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={data.rejected} color="error" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {data.rewardRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 150 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={data.rewardRate} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: data.rewardRate > 50 ? '#4CAF50' : data.rewardRate > 25 ? '#FF9800' : '#F44336'
                            }
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdvancedStatistics;
