import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Search as SearchIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import { Idea } from '../types';
import A3ReportForm from './A3ReportForm';

const A3ReportTab: React.FC = () => {
  const [ideaCode, setIdeaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idea, setIdea] = useState<Idea | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCheckIdea = async () => {
    if (!ideaCode.trim()) {
      setError('Vui lòng nhập mã ý tưởng');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setIdea(null);
    setShowForm(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Phiên đăng nhập đã hết hạn');
        return;
      }

      // Tìm ý tưởng theo mã
      const response = await axios.get(`https://idea-managment.onrender.com/api/ideas?search=${ideaCode}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.length === 0) {
        setError('Không tìm thấy ý tưởng với mã: ' + ideaCode);
        return;
      }

      // Tìm chính xác theo ideaCode (có thể có nhiều kết quả từ search)
      const foundIdea = response.data.find((idea: Idea) => idea.ideaCode === ideaCode);
      
      if (!foundIdea) {
        setError('Không tìm thấy ý tưởng với mã: ' + ideaCode);
        return;
      }
      
      // Kiểm tra trạng thái triển khai
      if (foundIdea.implementationStatus !== 'Lập báo cáo A3') {
        setError(`Ý tưởng này chưa ở trạng thái "Lập báo cáo A3". Trạng thái hiện tại: ${foundIdea.implementationStatus}`);
        return;
      }

      setIdea(foundIdea);
      setSuccess('Tìm thấy ý tưởng phù hợp. Bạn có thể nhập báo cáo A3.');
      setShowForm(true);
    } catch (error: any) {
      console.error('Error checking idea:', error);
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn');
      } else if (error.response?.status === 404) {
        setError('Không tìm thấy ý tưởng với mã: ' + ideaCode);
      } else {
        setError('Không thể kiểm tra mã ý tưởng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIdea(null);
    setIdeaCode('');
    setError('');
    setSuccess('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCheckIdea();
    }
  };

  if (showForm && idea) {
    return <A3ReportForm idea={idea} onClose={handleCloseForm} />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            Nhập báo cáo A3
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body1" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
            Nhập mã ý tưởng để kiểm tra và tạo báo cáo A3
          </Typography>

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

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
            <TextField
              fullWidth
              label="Mã ý tưởng"
              value={ideaCode}
              onChange={(e) => setIdeaCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập mã ý tưởng..."
              variant="outlined"
              disabled={loading}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckIdea}
              disabled={loading || !ideaCode.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ minWidth: 140, height: 56 }}
            >
              {loading ? 'Đang kiểm tra...' : 'Kiểm tra mã ý tưởng'}
            </Button>
          </Box>

          <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Hướng dẫn sử dụng:
            </Typography>
            <Typography variant="body2" component="div" sx={{ lineHeight: 1.8 }}>
              <ol>
                <li>Nhập mã ý tưởng vào ô bên trên</li>
                <li>Nhấn nút "Kiểm tra mã ý tưởng" để xác minh</li>
                <li>Hệ thống sẽ kiểm tra xem ý tưởng có ở trạng thái "Lập báo cáo A3" không</li>
                <li>Nếu đúng, form nhập báo cáo A3 sẽ hiển thị với dữ liệu đã có sẵn</li>
                <li>Điền thông tin còn thiếu và nhấn "Export báo cáo A3" để tải file</li>
              </ol>
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default A3ReportTab;
