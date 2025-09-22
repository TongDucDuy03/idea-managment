import React, { useState, useEffect, useRef } from 'react';
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
import { Bar, Doughnut, Line, Pie, getElementAtEvent } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('ideas');
  
  // Refs for charts to detect clicked elements
  const monthlyCountBarRef = useRef<any>(null);
  const departmentTotalCountRef = useRef<any>(null);
  const departmentBenefitRef = useRef<any>(null);
  const departmentRewardRef = useRef<any>(null);
  const userRewardRef = useRef<any>(null);
  const monthlyRewardRef = useRef<any>(null);
  const departmentPerformanceRef = useRef<any>(null);
  const monthlySuccessRateRef = useRef<any>(null);

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
  const newIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Đề xuất mới').length;
  const reviewingIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Xem xét').length;
  const approvedIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Phê duyệt').length;
  const feedbackIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Phản hồi phê duyệt').length;
  const implementingIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Đang triển khai').length;
  const a3Ideas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Lập báo cáo A3').length;
  const rewardApprovedIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Phê duyệt khen thưởng').length;
  const rewardedIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Đã khen thưởng').length;
  const failedIdeas = filteredIdeas.filter(idea => (idea as any).implementationStatus === 'Không đạt').length;

  // Helpers for implementation status (defined early for reuse)
  const isImplemented = (status?: string) => status === 'Đang triển khai' || status === 'Lập báo cáo A3' || status === 'Phê duyệt khen thưởng' || status === 'Đã khen thưởng';
  const isSuccessful = (status?: string) => status === 'Lập báo cáo A3' || status === 'Phê duyệt khen thưởng' || status === 'Đã khen thưởng';

  // Department performance analysis (quality-focused) - based on implementation success
  const departmentPerformance = filteredIdeas.reduce((acc, idea) => {
    const dept = idea.department || 'Khác';
    if (!acc[dept]) {
      acc[dept] = {
        total: 0,
        implemented: 0,
        successful: 0,
        successRate: 0
      } as any;
    }
    acc[dept].total++;
    if (isImplemented((idea as any).implementationStatus)) acc[dept].implemented++;
    if (isSuccessful((idea as any).implementationStatus)) acc[dept].successful++;
    return acc;
  }, {} as Record<string, { total: number; implemented: number; successful: number; successRate: number }>);

  // Calculate implementation success rates
  Object.keys(departmentPerformance).forEach(dept => {
    const deptData = departmentPerformance[dept];
    deptData.successRate = deptData.total > 0 ? (deptData.successful / deptData.total) * 100 : 0;
  });

  // Sort departments by performance
  const sortedDepartments = Object.entries(departmentPerformance)
    .sort(([,a], [,b]) => b.successRate - a.successRate);

  // Weekly trend data
  const weeklyData = filteredIdeas.reduce((acc, idea) => {
    const date = new Date(idea.submissionDate);
    const weekKey = `${date.getFullYear()}-W${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}`;
    if (!acc[weekKey]) {
      acc[weekKey] = { 
        total: 0, 
        'Đề xuất mới': 0, 
        'Xem xét': 0, 
        'Phê duyệt': 0, 
        'Phản hồi phê duyệt': 0, 
        'Đang triển khai': 0, 
        'Lập báo cáo A3': 0, 
        'Phê duyệt khen thưởng': 0, 
        'Đã khen thưởng': 0, 
        'Không đạt': 0 
      };
    }
    acc[weekKey].total++;
    acc[weekKey][(idea as any).implementationStatus as keyof typeof acc[typeof weekKey]]++;
    return acc;
  }, {} as Record<string, { 
    total: number; 
    'Đề xuất mới': number; 
    'Xem xét': number; 
    'Phê duyệt': number; 
    'Phản hồi phê duyệt': number; 
    'Đang triển khai': number; 
    'Lập báo cáo A3': number; 
    'Phê duyệt khen thưởng': number; 
    'Đã khen thưởng': number; 
    'Không đạt': number 
  }>);

  const weeklyLabels = Object.keys(weeklyData).sort();
  const weeklyTotals = weeklyLabels.map(label => weeklyData[label].total);

  // Monthly implementation success comparison
  const monthlyPerformance = filteredIdeas.reduce((acc, idea) => {
    const date = new Date(idea.submissionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, successful: 0 } as any;
    }
    acc[monthKey].total++;
    if (isSuccessful((idea as any).implementationStatus)) acc[monthKey].successful++;
    return acc;
  }, {} as Record<string, { total: number; successful: number }>);

  const monthlyLabels = Object.keys(monthlyPerformance).sort();
  const monthlySuccessRates = monthlyLabels.map(label => {
    const data = monthlyPerformance[label];
    return data.total > 0 ? (data.successful / data.total) * 100 : 0;
  });

  // Chart configurations
  const departmentPerformanceData = {
    labels: sortedDepartments.slice(0, 8).map(([dept]) => 
      dept.length > 15 ? dept.substring(0, 15) + '...' : dept
    ),
    datasets: [
      {
        label: 'Tỷ lệ triển khai thành công (%)',
        data: sortedDepartments.slice(0, 8).map(([, data]) => (data as any).successRate.toFixed(1)),
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1
      }
    ]
  };

  // Department total counts (quantity-focused)
  const sortedDepartmentsByTotal = Object.entries(departmentPerformance)
    .sort(([,a], [,b]) => b.total - a.total);

  const departmentTotalCountData = {
    labels: sortedDepartmentsByTotal.slice(0, 8).map(([dept]) =>
      dept.length > 15 ? dept.substring(0, 15) + '...' : dept
    ),
    datasets: [
      {
        label: 'Tổng số ý tưởng',
        data: sortedDepartmentsByTotal.slice(0, 8).map(([, data]) => data.total),
        backgroundColor: '#42A5F5',
        borderColor: '#1E88E5',
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

  const monthlySuccessRateData = {
    labels: monthlyLabels.map(label => {
      const [year, month] = label.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Tỷ lệ triển khai thành công (%)',
        data: monthlySuccessRates,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const statusDistributionData = {
    labels: ['Đề xuất mới', 'Xem xét', 'Phê duyệt', 'Phản hồi phê duyệt', 'Đang triển khai', 'Lập báo cáo A3', 'Phê duyệt khen thưởng', 'Đã khen thưởng', 'Không đạt'],
    datasets: [
      {
        data: [newIdeas, reviewingIdeas, approvedIdeas, feedbackIdeas, implementingIdeas, a3Ideas, rewardApprovedIdeas, rewardedIdeas, failedIdeas],
        backgroundColor: [
          '#2196F3',
          '#FF9800',
          '#4CAF50',
          '#9C27B0',
          '#00BCD4',
          '#795548',
          '#607D8B',
          '#2E7D32',
          '#F44336'
        ],
        borderColor: [
          '#1976D2',
          '#F57C00',
          '#2E7D32',
          '#7B1FA2',
          '#0097A7',
          '#5D4037',
          '#455A64',
          '#1B5E20',
          '#D32F2F'
        ],
        borderWidth: 2
      }
    ]
  };

  // Yearly distribution and monthly counts (current year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const ideasThisYear = filteredIdeas.filter(i => {
    const d = new Date(i.submissionDate);
    return d.getFullYear() === currentYear;
  });

  const monthlyCounts = Array.from({ length: 12 }, () => 0);
  ideasThisYear.forEach(i => {
    const d = new Date(i.submissionDate);
    const m = d.getMonth();
    monthlyCounts[m] += 1;
  });

  const monthLabels = ['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => `${m}/${currentYear}`);

  const monthlyCountBarData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Số ý tưởng theo tháng',
        data: monthlyCounts,
        backgroundColor: '#42A5F5',
        borderColor: '#1E88E5',
        borderWidth: 1
      }
    ]
  };

  const yearlyDistributionPie = {
    labels: monthLabels,
    datasets: [
      {
        data: monthlyCounts,
        backgroundColor: [
          '#1E88E5','#43A047','#FB8C00','#8E24AA','#F4511E','#3949AB',
          '#00ACC1','#7CB342','#FDD835','#5E35B1','#039BE5','#8D6E63'
        ],
        borderWidth: 1
      }
    ]
  };

  // Value-based statistics
  const departmentBenefitValue = filteredIdeas.reduce((acc, idea) => {
    const dept = idea.department || 'Khác';
    if (!acc[dept]) {
      acc[dept] = 0;
    }
    acc[dept] += (idea as any).benefitValue || 0;
    return acc;
  }, {} as Record<string, number>);

  const departmentRewardAmount = filteredIdeas.reduce((acc, idea) => {
    const dept = idea.department || 'Khác';
    if (!acc[dept]) {
      acc[dept] = 0;
    }
    acc[dept] += (idea as any).rewardAmount || 0;
    return acc;
  }, {} as Record<string, number>);

  const userRewardAmount = filteredIdeas.reduce((acc, idea) => {
    const user = idea.fullName || 'Không rõ';
    if (!acc[user]) {
      acc[user] = {
        name: user,
        department: idea.department || 'Khác',
        totalReward: 0,
        totalBenefit: 0
      };
    }
    acc[user].totalReward += (idea as any).rewardAmount || 0;
    acc[user].totalBenefit += (idea as any).benefitValue || 0;
    return acc;
  }, {} as Record<string, { name: string; department: string; totalReward: number; totalBenefit: number }>);

  // Top departments by benefit value
  const topDeptByBenefit = Object.entries(departmentBenefitValue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  const topDeptByReward = Object.entries(departmentRewardAmount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  const topUsersByReward = Object.values(userRewardAmount)
    .sort((a, b) => b.totalReward - a.totalReward)
    .slice(0, 10);

  // Monthly reward amount data
  const monthlyRewardData = filteredIdeas.reduce((acc, idea) => {
    const date = new Date(idea.submissionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += (idea as any).rewardAmount || 0;
    return acc;
  }, {} as Record<string, number>);

  const monthlyRewardLabels = Object.keys(monthlyRewardData).sort();
  const monthlyRewardAmounts = monthlyRewardLabels.map(label => monthlyRewardData[label]);

  // Chart data for value-based charts
  const departmentBenefitChartData = {
    labels: topDeptByBenefit.map(([dept]) => 
      dept.length > 15 ? dept.substring(0, 15) + '...' : dept
    ),
    datasets: [
      {
        label: 'Giá trị làm lợi (VND)',
        data: topDeptByBenefit.map(([, value]) => value / 1000000), // Convert to millions
        backgroundColor: '#4CAF50',
        borderColor: '#2E7D32',
        borderWidth: 1
      }
    ]
  };

  const departmentRewardChartData = {
    labels: topDeptByReward.map(([dept]) => 
      dept.length > 15 ? dept.substring(0, 15) + '...' : dept
    ),
    datasets: [
      {
        label: 'Tiền thưởng (VND)',
        data: topDeptByReward.map(([, value]) => value / 1000000), // Convert to millions
        backgroundColor: '#FF9800',
        borderColor: '#F57C00',
        borderWidth: 1
      }
    ]
  };

  const userRewardChartData = {
    labels: topUsersByReward.map(user => 
      user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name
    ),
    datasets: [
      {
        label: 'Tiền thưởng (VND)',
        data: topUsersByReward.map(user => user.totalReward / 1000000), // Convert to millions
        backgroundColor: '#9C27B0',
        borderColor: '#7B1FA2',
        borderWidth: 1
      }
    ]
  };

  const monthlyRewardChartData = {
    labels: monthlyRewardLabels.map(label => {
      const [year, month] = label.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Tổng tiền thưởng (VND)',
        data: monthlyRewardAmounts.map(amount => amount / 1000000), // Convert to millions
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 1
      }
    ]
  };

  type ImplStats = { implemented: number; successful: number };

  const deptImplStats = filteredIdeas.reduce((acc, idea) => {
    const key = idea.department || 'Khác';
    if (!acc[key]) acc[key] = { implemented: 0, successful: 0 } as ImplStats;
    if (isImplemented((idea as any).implementationStatus)) acc[key].implemented += 1;
    if (isSuccessful((idea as any).implementationStatus)) acc[key].successful += 1;
    return acc;
  }, {} as Record<string, ImplStats>);

  const userImplStats = filteredIdeas.reduce((acc, idea) => {
    const key = idea.fullName || 'Không rõ';
    if (!acc[key]) acc[key] = { implemented: 0, successful: 0 } as ImplStats;
    if (isImplemented((idea as any).implementationStatus)) acc[key].implemented += 1;
    if (isSuccessful((idea as any).implementationStatus)) acc[key].successful += 1;
    return acc;
  }, {} as Record<string, ImplStats>);

  const topDeptImpl = Object.entries(deptImplStats)
    .sort(([,a],[,b]) => b.implemented - a.implemented)
    .slice(0, 10);
  const topUserImpl = Object.entries(userImplStats)
    .sort(([,a],[,b]) => b.implemented - a.implemented)
    .slice(0, 10);

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
        {/* SECTION: Số lượng */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>Số lượng</Typography>
        </Grid>

        {/* Monthly Counts (Bar) */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Số ý tưởng theo từng tháng (năm {currentYear})
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar 
                ref={monthlyCountBarRef}
                data={monthlyCountBarData} 
                options={chartOptions}
                onClick={(event) => {
                  const chart = monthlyCountBarRef.current;
                  if (!chart) return;
                  const elements = getElementAtEvent(chart, event);
                  if (!elements || elements.length === 0) return;
                  const index = (elements[0] as any).index as number;
                  const monthLabel = monthLabels[index];
                  if (monthLabel) {
                    const [month, year] = monthLabel.split('/');
                    const startDate = `${year}-${month}-01`;
                    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
                    navigate(`/admin?dateFrom=${startDate}&dateTo=${endDate}`);
                  }
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Yearly Distribution (Pie) */}
        {/* <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Phân bố ý tưởng trong năm (Theo tháng)
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Doughnut data={yearlyDistributionPie} options={pieOptions} />
            </Box>
          </Card>
        </Grid> */}

        {/* Weekly Trend Chart */}
        {/* <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Xu hướng Theo Tuần
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Line data={weeklyTrendData} options={chartOptions} />
            </Box>
          </Card>
        </Grid> */}

        {/* Department Total Counts */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Số lượng theo Phòng ban 
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar 
                ref={departmentTotalCountRef}
                data={departmentTotalCountData} 
                options={chartOptions}
                onClick={(event) => {
                  const chart = departmentTotalCountRef.current;
                  if (!chart) return;
                  const elements = getElementAtEvent(chart, event);
                  if (!elements || elements.length === 0) return;
                  const index = (elements[0] as any).index as number;
                  const dept = sortedDepartmentsByTotal[index]?.[0];
                  if (dept) {
                    navigate(`/admin?department=${encodeURIComponent(dept)}`);
                  }
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Rankings by Department (Implementation) */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Xếp hạng Phòng ban theo triển khai
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Xếp hạng</strong></TableCell>
                    <TableCell><strong>Phòng ban</strong></TableCell>
                    <TableCell align="center"><strong>Đã triển khai</strong></TableCell>
                    <TableCell align="center"><strong>Thành công (A3)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topDeptImpl.map(([dept, data], index) => (
                    <TableRow 
                      key={dept}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                      onClick={() => navigate(`/admin?department=${encodeURIComponent(dept)}`)}
                    >
                      <TableCell>
                        <Chip label={index + 1} color={index < 3 ? 'primary' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dept.length > 40 ? dept.substring(0, 40) + '...' : dept}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={(data as any).implemented} color="info" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={(data as any).successful} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Rankings by Individual (Implementation) */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Xếp hạng Cá nhân theo triển khai
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Xếp hạng</strong></TableCell>
                    <TableCell><strong>Họ và tên</strong></TableCell>
                    <TableCell align="center"><strong>Đã triển khai</strong></TableCell>
                    <TableCell align="center"><strong>Thành công (A3)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUserImpl.map(([name, data], index) => (
                    <TableRow 
                      key={name}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                      onClick={() => navigate(`/admin?fullName=${encodeURIComponent(name)}`)}
                    >
                      <TableCell>
                        <Chip label={index + 1} color={index < 3 ? 'primary' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {name.length > 40 ? name.substring(0, 40) + '...' : name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={(data as any).implemented} color="info" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={(data as any).successful} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* SECTION: Giá trị */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 3 }}>Giá trị</Typography>
        </Grid>

        {/* Top Departments by Benefit Value */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Top Phòng ban có Giá trị Làm lợi Cao nhất
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar 
                ref={departmentBenefitRef}
                data={departmentBenefitChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${(context.parsed.y * 1000000).toLocaleString('vi-VN')} VND`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + 'M VND';
                        }
                      }
                    }
                  }
                }}
                onClick={(event) => {
                  const chart = departmentBenefitRef.current;
                  if (!chart) return;
                  const elements = getElementAtEvent(chart, event);
                  if (!elements || elements.length === 0) return;
                  const index = (elements[0] as any).index as number;
                  const dept = topDeptByBenefit[index]?.[0];
                  if (dept) {
                    navigate(`/admin?department=${encodeURIComponent(dept)}`);
                  }
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Top Departments by Reward Amount */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Top Phòng ban có Tiền thưởng Cao nhất
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar 
                ref={departmentRewardRef}
                data={departmentRewardChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${(context.parsed.y * 1000000).toLocaleString('vi-VN')} VND`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + 'M VND';
                        }
                      }
                    }
                  }
                }}
                onClick={(event) => {
                  const chart = departmentRewardRef.current;
                  if (!chart) return;
                  const elements = getElementAtEvent(chart, event);
                  if (!elements || elements.length === 0) return;
                  const index = (elements[0] as any).index as number;
                  const dept = topDeptByReward[index]?.[0];
                  if (dept) {
                    navigate(`/admin?department=${encodeURIComponent(dept)}`);
                  }
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Top Individuals by Reward Amount */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Top Cá nhân có Tiền thưởng Cao nhất
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar 
                ref={userRewardRef}
                data={userRewardChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${(context.parsed.y * 1000000).toLocaleString('vi-VN')} VND`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + 'M VND';
                        }
                      }
                    }
                  }
                }}
                onClick={(event) => {
                  const chart = userRewardRef.current;
                  if (!chart) return;
                  const elements = getElementAtEvent(chart, event);
                  if (!elements || elements.length === 0) return;
                  const index = (elements[0] as any).index as number;
                  const user = topUsersByReward[index];
                  if (user) {
                    navigate(`/admin?fullName=${encodeURIComponent(user.name)}`);
                  }
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Monthly Reward Amount Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Số tiền thưởng theo từng tháng
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar 
                ref={monthlyRewardRef}
                data={monthlyRewardChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${(context.parsed.y * 1000000).toLocaleString('vi-VN')} VND`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + 'M VND';
                        }
                      }
                    }
                  }
                }}
                onClick={(event) => {
                  const chart = monthlyRewardRef.current;
                  if (!chart) return;
                  const elements = getElementAtEvent(chart, event);
                  if (!elements || elements.length === 0) return;
                  const index = (elements[0] as any).index as number;
                  const monthLabel = monthlyRewardLabels[index];
                  if (monthLabel) {
                    const [year, month] = monthLabel.split('-');
                    const startDate = `${year}-${month}-01`;
                    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
                    navigate(`/admin?dateFrom=${startDate}&dateTo=${endDate}`);
                  }
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* SECTION: Chất lượng */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 3 }}>Chất lượng</Typography>
        </Grid>

        {/* Department Performance Chart (Implementation Success Rate) */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Tỷ lệ Triển khai Thành công theo Phòng ban (Top 8)
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Bar data={departmentPerformanceData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Monthly Implementation Success Rate Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Tỷ lệ Triển khai Thành công Theo Tháng
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Line data={monthlySuccessRateData} options={chartOptions} />
            </Box>
          </Card>
        </Grid>

        {/* Status Distribution Pie Chart */}
        {/* <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              Phân bố Trạng thái
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Pie data={statusDistributionData} options={pieOptions} />
            </Box>
          </Card>
        </Grid> */}

        {/* Department Performance Table */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Bảng Xếp hạng Phòng ban (theo tỷ lệ triển khai thành công)
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Xếp hạng</strong></TableCell>
                    <TableCell><strong>Phòng ban</strong></TableCell>
                    <TableCell align="center"><strong>Tổng ý tưởng</strong></TableCell>
                    <TableCell align="center"><strong>Được triển khai</strong></TableCell>
                    <TableCell align="center"><strong>Triển khai thành công (A3)</strong></TableCell>
                    <TableCell align="center"><strong>Tỷ lệ thành công</strong></TableCell>
                    <TableCell align="center"><strong>Thanh tiến độ</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedDepartments.map(([dept, data], index) => (
                    <TableRow 
                      key={dept}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                      onClick={() => navigate(`/admin?department=${encodeURIComponent(dept)}`)}
                    >
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
                        <Chip label={(data as any).implemented} color="info" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={(data as any).successful} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {(data as any).successRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 150 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(data as any).successRate} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: (data as any).successRate > 50 ? '#4CAF50' : (data as any).successRate > 25 ? '#FF9800' : '#F44336'
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
