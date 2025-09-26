import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { FileDownload as FileDownloadIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import { Idea, A3Report } from '../types';
import * as XLSX from 'xlsx';

interface A3ReportFormProps {
  idea: Idea | null;
  onClose: () => void;
}

const A3ReportForm: React.FC<A3ReportFormProps> = ({ idea, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportData, setReportData] = useState<Partial<A3Report>>({
    problemDescription: '',
    currentSituation: '',
    rootCause: '',
    targetSituation: '',
    solution: '',
    implementationPlan: '',
    resources: '',
    timeline: '',
    responsiblePerson: '',
    expectedResult: '',
    actualResult: '',
    benefit: '',
    cost: '',
    risk: '',
    followUpAction: '',
    lessonsLearned: '',
    scalingOpportunity: '',
    status: 'draft'
  });

  useEffect(() => {
    if (idea) {
      // Điền sẵn dữ liệu từ ý tưởng
      setReportData(prev => ({
        ...prev,
        ideaId: idea._id,
        ideaCode: idea.ideaCode,
        fullName: idea.fullName,
        department: idea.department,
        topicTitle: idea.topicTitle || '',
        submissionDate: idea.submissionDate,
        implementationDepartment: idea.implementationDepartment,
        problemDescription: idea.idea || '',
        currentSituation: idea.solution || '',
        solution: idea.benefit || '',
        benefit: idea.benefitOutcome || '',
        scalingOpportunity: idea.scalingOpportunity || '',
        resources: idea.resourcesUsed || '',
        // Điền thêm thông tin từ các trường khác nếu có
        cost: idea.benefitValue ? idea.benefitValue.toString() : '',
        responsiblePerson: idea.fullName
      }));
    }
  }, [idea]);

  const handleInputChange = (field: keyof A3Report, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!idea) return;
    
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Phiên đăng nhập đã hết hạn');
        return;
      }

      // Lưu báo cáo A3 vào database
      const response = await axios.post('https://idea-managment.onrender.com/api/a3-reports', {
        ...reportData,
        ideaId: idea._id,
        ideaCode: idea.ideaCode,
        fullName: idea.fullName,
        department: idea.department,
        topicTitle: idea.topicTitle || '',
        submissionDate: idea.submissionDate,
        status: 'submitted'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Báo cáo A3 đã được lưu thành công!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving A3 report:', error);
      setError('Không thể lưu báo cáo A3. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!idea) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Tạo dữ liệu cho file Excel
      const exportData = {
        'Mã ý tưởng': reportData.ideaCode || '',
        'Họ và tên': reportData.fullName || '',
        'Đơn vị': reportData.department || '',
        'Tên đề tài': reportData.topicTitle || '',
        'Ngày nộp': idea.submissionDate ? new Date(idea.submissionDate).toLocaleDateString('vi-VN') : '',
        'Mô tả vấn đề': reportData.problemDescription || '',
        'Thực trạng hiện tại': reportData.currentSituation || '',
        'Nguyên nhân gốc': reportData.rootCause || '',
        'Tình hình mục tiêu': reportData.targetSituation || '',
        'Giải pháp': reportData.solution || '',
        'Kế hoạch triển khai': reportData.implementationPlan || '',
        'Nguồn lực': reportData.resources || '',
        'Thời gian thực hiện': reportData.timeline || '',
        'Người chịu trách nhiệm': reportData.responsiblePerson || '',
        'Kết quả mong đợi': reportData.expectedResult || '',
        'Kết quả thực tế': reportData.actualResult || '',
        'Lợi ích': reportData.benefit || '',
        'Chi phí': reportData.cost || '',
        'Rủi ro': reportData.risk || '',
        'Hành động theo dõi': reportData.followUpAction || '',
        'Bài học kinh nghiệm': reportData.lessonsLearned || '',
        'Cơ hội nhân rộng': reportData.scalingOpportunity || '',
        'Phòng ban triển khai': reportData.implementationDepartment || '',
        'Ghi chú': reportData.note || ''
      };

      // Tạo workbook và worksheet
      const ws = XLSX.utils.json_to_sheet([exportData]);
      const wb = XLSX.utils.book_new();
      
      // Đặt chiều rộng cột
      const colWidths = [
        { wch: 15 }, // Mã ý tưởng
        { wch: 25 }, // Họ và tên
        { wch: 20 }, // Đơn vị
        { wch: 30 }, // Tên đề tài
        { wch: 15 }, // Ngày nộp
        { wch: 40 }, // Mô tả vấn đề
        { wch: 40 }, // Thực trạng hiện tại
        { wch: 40 }, // Nguyên nhân gốc
        { wch: 40 }, // Tình hình mục tiêu
        { wch: 40 }, // Giải pháp
        { wch: 40 }, // Kế hoạch triển khai
        { wch: 30 }, // Nguồn lực
        { wch: 20 }, // Thời gian thực hiện
        { wch: 25 }, // Người chịu trách nhiệm
        { wch: 40 }, // Kết quả mong đợi
        { wch: 40 }, // Kết quả thực tế
        { wch: 40 }, // Lợi ích
        { wch: 20 }, // Chi phí
        { wch: 30 }, // Rủi ro
        { wch: 40 }, // Hành động theo dõi
        { wch: 40 }, // Bài học kinh nghiệm
        { wch: 40 }, // Cơ hội nhân rộng
        { wch: 25 }, // Phòng ban triển khai
        { wch: 30 }  // Ghi chú
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo A3');
      
      // Xuất file
      const fileName = `Bao_cao_A3_${reportData.ideaCode || 'unknown'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setSuccess('File báo cáo A3 đã được tải về thành công!');
    } catch (error: any) {
      console.error('Error exporting A3 report:', error);
      setError('Không thể xuất file báo cáo A3. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndExport = async () => {
    await handleSave();
    if (!error) {
      setTimeout(() => {
        handleExport();
      }, 1000);
    }
  };

  if (!idea) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Không tìm thấy thông tin ý tưởng
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            Báo cáo A3 - {idea.ideaCode}
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Thông tin cơ bản */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                Thông tin cơ bản
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mã ý tưởng"
                value={reportData.ideaCode || ''}
                disabled
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Họ và tên"
                value={reportData.fullName || ''}
                disabled
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Đơn vị"
                value={reportData.department || ''}
                disabled
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên đề tài"
                value={reportData.topicTitle || ''}
                onChange={(e) => handleInputChange('topicTitle', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Mô tả vấn đề */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Mô tả vấn đề
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả vấn đề"
                multiline
                rows={4}
                value={reportData.problemDescription || ''}
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Thực trạng hiện tại */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Thực trạng hiện tại
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Thực trạng hiện tại"
                multiline
                rows={4}
                value={reportData.currentSituation || ''}
                onChange={(e) => handleInputChange('currentSituation', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Nguyên nhân gốc */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Nguyên nhân gốc
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nguyên nhân gốc"
                multiline
                rows={4}
                value={reportData.rootCause || ''}
                onChange={(e) => handleInputChange('rootCause', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Tình hình mục tiêu */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Tình hình mục tiêu
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tình hình mục tiêu"
                multiline
                rows={4}
                value={reportData.targetSituation || ''}
                onChange={(e) => handleInputChange('targetSituation', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Giải pháp */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Giải pháp
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Giải pháp"
                multiline
                rows={4}
                value={reportData.solution || ''}
                onChange={(e) => handleInputChange('solution', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Kế hoạch triển khai */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Kế hoạch triển khai
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kế hoạch triển khai"
                multiline
                rows={4}
                value={reportData.implementationPlan || ''}
                onChange={(e) => handleInputChange('implementationPlan', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nguồn lực"
                multiline
                rows={4}
                value={reportData.resources || ''}
                onChange={(e) => handleInputChange('resources', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Thời gian và trách nhiệm */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thời gian thực hiện"
                value={reportData.timeline || ''}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Người chịu trách nhiệm"
                value={reportData.responsiblePerson || ''}
                onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Kết quả */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Kết quả
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kết quả mong đợi"
                multiline
                rows={3}
                value={reportData.expectedResult || ''}
                onChange={(e) => handleInputChange('expectedResult', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kết quả thực tế"
                multiline
                rows={3}
                value={reportData.actualResult || ''}
                onChange={(e) => handleInputChange('actualResult', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Lợi ích và chi phí */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lợi ích"
                multiline
                rows={3}
                value={reportData.benefit || ''}
                onChange={(e) => handleInputChange('benefit', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Chi phí"
                multiline
                rows={3}
                value={reportData.cost || ''}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Rủi ro và theo dõi */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rủi ro"
                multiline
                rows={3}
                value={reportData.risk || ''}
                onChange={(e) => handleInputChange('risk', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hành động theo dõi"
                multiline
                rows={3}
                value={reportData.followUpAction || ''}
                onChange={(e) => handleInputChange('followUpAction', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Bài học và cơ hội */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bài học kinh nghiệm"
                multiline
                rows={3}
                value={reportData.lessonsLearned || ''}
                onChange={(e) => handleInputChange('lessonsLearned', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cơ hội nhân rộng"
                multiline
                rows={3}
                value={reportData.scalingOpportunity || ''}
                onChange={(e) => handleInputChange('scalingOpportunity', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Ghi chú */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
                value={reportData.note || ''}
                onChange={(e) => handleInputChange('note', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Nút hành động */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ minWidth: 120 }}
            >
              Đóng
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              sx={{ minWidth: 120 }}
            >
              {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
            </Button>
            
            <Button
              variant="contained"
              color="success"
              onClick={handleExport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Đang xuất...' : 'Export báo cáo A3'}
            </Button>
            
            <Button
              variant="contained"
              color="info"
              onClick={handleSaveAndExport}
              disabled={saving || loading}
              startIcon={saving || loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
              sx={{ minWidth: 160 }}
            >
              {saving || loading ? 'Đang xử lý...' : 'Lưu và Export'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default A3ReportForm;
