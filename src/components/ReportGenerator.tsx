import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { FileDownload as FileDownloadIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Idea } from '../types';

interface ReportGeneratorProps {
  ideas: Idea[];
  timeRange: string;
  departmentFilter: string;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  ideas, 
  timeRange, 
  departmentFilter 
}) => {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  // Calculate statistics
  const totalIdeas = filteredIdeas.length;
  const pendingIdeas = filteredIdeas.filter(idea => idea.status === 'pending').length;
  const rewardedIdeas = filteredIdeas.filter(idea => idea.status === 'rewarded').length;
  const rejectedIdeas = filteredIdeas.filter(idea => idea.status === 'rejected').length;
  const rewardRate = totalIdeas > 0 ? ((rewardedIdeas / totalIdeas) * 100).toFixed(1) : '0';

  // Implementation-based statistics
  const isImplemented = (dir?: string) => dir === 'Triển khai' || dir === 'Làm báo cáo A3';
  const isSuccessful = (dir?: string) => dir === 'Làm báo cáo A3';
  const implementedCount = filteredIdeas.filter(idea => isImplemented(idea.implementationDirection)).length;
  const implementationSuccessRate = totalIdeas > 0 ? ((filteredIdeas.filter(i => isSuccessful(i.implementationDirection)).length / totalIdeas) * 100).toFixed(1) : '0';

  // Value-based statistics
  const totalBenefitValue = filteredIdeas.reduce((sum, idea) => sum + ((idea as any).benefitValue || 0), 0);
  const totalRewardAmount = filteredIdeas.reduce((sum, idea) => sum + ((idea as any).rewardAmount || 0), 0);

  // Department statistics
  const departmentStats = filteredIdeas.reduce((acc, idea) => {
    acc[idea.department] = (acc[idea.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepartments = Object.entries(departmentStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // Department implementation statistics
  const departmentImplementationStats = filteredIdeas.reduce((acc, idea) => {
    const dept = idea.department || 'Khác';
    if (!acc[dept]) {
      acc[dept] = {
        total: 0,
        implemented: 0,
        successful: 0,
        successRate: 0,
        benefitValue: 0,
        rewardAmount: 0
      };
    }
    acc[dept].total++;
    if (isImplemented(idea.implementationDirection)) acc[dept].implemented++;
    if (isSuccessful(idea.implementationDirection)) acc[dept].successful++;
    acc[dept].benefitValue += (idea as any).benefitValue || 0;
    acc[dept].rewardAmount += (idea as any).rewardAmount || 0;
    return acc;
  }, {} as Record<string, { total: number; implemented: number; successful: number; successRate: number; benefitValue: number; rewardAmount: number }>);

  // Calculate success rates
  Object.keys(departmentImplementationStats).forEach(dept => {
    const deptData = departmentImplementationStats[dept];
    deptData.successRate = deptData.total > 0 ? (deptData.successful / deptData.total) * 100 : 0;
  });

  // Top departments by benefit value and reward amount
  const topDeptByBenefit = Object.entries(departmentImplementationStats)
    .sort(([,a], [,b]) => b.benefitValue - a.benefitValue)
    .slice(0, 5);
  
  const topDeptByReward = Object.entries(departmentImplementationStats)
    .sort(([,a], [,b]) => b.rewardAmount - a.rewardAmount)
    .slice(0, 5);

  // Top users by reward amount
  const userRewardStats = filteredIdeas.reduce((acc, idea) => {
    const user = idea.fullName || 'Không rõ';
    if (!acc[user]) {
      acc[user] = {
        name: user,
        department: idea.department || 'Khác',
        totalReward: 0,
        totalBenefit: 0,
        ideaCount: 0
      };
    }
    acc[user].totalReward += (idea as any).rewardAmount || 0;
    acc[user].totalBenefit += (idea as any).benefitValue || 0;
    acc[user].ideaCount++;
    return acc;
  }, {} as Record<string, { name: string; department: string; totalReward: number; totalBenefit: number; ideaCount: number }>);

  const topUsersByReward = Object.values(userRewardStats)
    .sort((a, b) => b.totalReward - a.totalReward)
    .slice(0, 5);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BÁO CÁO THỐNG KÊ Ý TƯỞNG CẢI TIẾN', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add date and filters
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Ngày tạo báo cáo: ${new Date().toLocaleDateString('vi-VN')}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Khoảng thời gian: ${getTimeRangeLabel(timeRange)}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Phòng ban: ${departmentFilter === 'all' ? 'Tất cả' : departmentFilter}`, 20, yPosition);
      yPosition += 15;

      // Add summary statistics
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TỔNG QUAN THỐNG KÊ', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Tổng số ý tưởng: ${totalIdeas}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`• Ý tưởng đã triển khai: ${implementedCount}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`• Tỷ lệ triển khai thành công: ${implementationSuccessRate}%`, 20, yPosition);
      yPosition += 8;
      pdf.text(`• Chưa xem xét: ${pendingIdeas}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`• Không khen thưởng: ${rejectedIdeas}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`• Tỷ lệ khen thưởng: ${rewardRate}%`, 20, yPosition);
      yPosition += 15;

      // Add value-based statistics
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('THỐNG KÊ GIÁ TRỊ', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• Tổng giá trị làm lợi: ${(totalBenefitValue / 1000000).toFixed(1)}M VND`, 20, yPosition);
      yPosition += 8;
      pdf.text(`• Tổng tiền thưởng: ${(totalRewardAmount / 1000000).toFixed(1)}M VND`, 20, yPosition);
      yPosition += 15;

      // Add department statistics
      if (topDepartments.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('THỐNG KÊ THEO PHÒNG BAN', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        topDepartments.forEach(([dept, count], index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${dept}: ${count} ý tưởng`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add implementation statistics by department
      if (Object.keys(departmentImplementationStats).length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('THỐNG KÊ TRIỂN KHAI THEO PHÒNG BAN', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        Object.entries(departmentImplementationStats).forEach(([dept, stats]) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${dept}:`, 20, yPosition);
          yPosition += 6;
          pdf.text(`  - Tổng: ${stats.total} | Triển khai: ${stats.implemented} | Thành công: ${stats.successful}`, 25, yPosition);
          yPosition += 6;
          pdf.text(`  - Tỷ lệ thành công: ${stats.successRate.toFixed(1)}%`, 25, yPosition);
          yPosition += 6;
          pdf.text(`  - Giá trị làm lợi: ${(stats.benefitValue / 1000000).toFixed(1)}M VND`, 25, yPosition);
          yPosition += 6;
          pdf.text(`  - Tiền thưởng: ${(stats.rewardAmount / 1000000).toFixed(1)}M VND`, 25, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add top departments by benefit value
      if (topDeptByBenefit.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOP PHÒNG BAN CÓ GIÁ TRỊ LÀM LỢI CAO NHẤT', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        topDeptByBenefit.forEach(([dept, stats], index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${dept}: ${(stats.benefitValue / 1000000).toFixed(1)}M VND`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add top departments by reward amount
      if (topDeptByReward.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOP PHÒNG BAN CÓ TIỀN THƯỞNG CAO NHẤT', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        topDeptByReward.forEach(([dept, stats], index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${dept}: ${(stats.rewardAmount / 1000000).toFixed(1)}M VND`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add top users by reward amount
      if (topUsersByReward.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOP CÁ NHÂN CÓ TIỀN THƯỞNG CAO NHẤT', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        topUsersByReward.forEach((user, index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${user.name} (${user.department}): ${(user.totalReward / 1000000).toFixed(1)}M VND`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Số ý tưởng: ${user.ideaCount} | Giá trị làm lợi: ${(user.totalBenefit / 1000000).toFixed(1)}M VND`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add detailed ideas list if requested
      if (reportType === 'detailed') {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DANH SÁCH CHI TIẾT Ý TƯỞNG', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        filteredIdeas.forEach((idea, index) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(`${index + 1}. Mã: ${idea.ideaCode}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Tên: ${idea.fullName}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Phòng ban: ${idea.department}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Trạng thái: ${getStatusLabel(idea.status)}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Hướng triển khai: ${idea.implementationDirection || 'Chưa xác định'}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Phòng ban triển khai: ${(idea as any).implementationDepartment || 'Chưa xác định'}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Giá trị làm lợi: ${((idea as any).benefitValue || 0).toLocaleString('vi-VN')} VND`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Tiền thưởng: ${((idea as any).rewardAmount || 0).toLocaleString('vi-VN')} VND`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Ngày gửi: ${new Date(idea.submissionDate).toLocaleDateString('vi-VN')}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`   Ý tưởng: ${idea.idea.substring(0, 100)}${idea.idea.length > 100 ? '...' : ''}`, 20, yPosition);
          yPosition += 10;
        });
      }

      // Save the PDF
      const fileName = `bao_cao_thong_ke_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'week': return '7 ngày qua';
      case 'month': return '30 ngày qua';
      case 'quarter': return '3 tháng qua';
      case 'year': return '1 năm qua';
      default: return 'Tất cả';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chưa xem xét';
      case 'rewarded': return 'Đã khen thưởng';
      case 'rejected': return 'Không khen thưởng';
      default: return 'Chưa xem xét';
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<PdfIcon />}
        onClick={() => setOpen(true)}
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
        Xuất Báo cáo PDF
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Tạo Báo cáo PDF
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Loại báo cáo"
              >
                <MenuItem value="summary">Tóm tắt thống kê</MenuItem>
                <MenuItem value="detailed">Chi tiết đầy đủ</MenuItem>
              </Select>
            </FormControl>

            <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Thông tin báo cáo:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">Khoảng thời gian:</Typography>
                  <Chip label={getTimeRangeLabel(timeRange)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Phòng ban:</Typography>
                  <Chip label={departmentFilter === 'all' ? 'Tất cả' : departmentFilter} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Tổng ý tưởng:</Typography>
                  <Chip label={totalIdeas} color="primary" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Đã triển khai:</Typography>
                  <Chip label={implementedCount} color="info" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Tỷ lệ thành công:</Typography>
                  <Chip label={`${implementationSuccessRate}%`} color="success" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Tỷ lệ khen thưởng:</Typography>
                  <Chip label={`${rewardRate}%`} color="warning" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Giá trị làm lợi:</Typography>
                  <Chip label={`${(totalBenefitValue / 1000000).toFixed(1)}M VND`} color="secondary" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Tổng tiền thưởng:</Typography>
                  <Chip label={`${(totalRewardAmount / 1000000).toFixed(1)}M VND`} color="error" size="small" />
                </Grid>
              </Grid>
            </Card>

            {generating && (
              <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                Đang tạo báo cáo PDF...
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={generating}>
            Hủy
          </Button>
          <Button 
            onClick={generatePDF} 
            variant="contained" 
            startIcon={<FileDownloadIcon />}
            disabled={generating}
          >
            {generating ? 'Đang tạo...' : 'Tạo PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportGenerator;
