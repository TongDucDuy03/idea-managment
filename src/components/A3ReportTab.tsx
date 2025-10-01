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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import api, { getWithFallback } from '../api/config';
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
      // ✅ Gọi API public lấy đúng ý tưởng theo mã (không cần token)
      let foundIdea: Idea | null = null;
      try {
        const { data } = await api.get(`/ideas/code/${encodeURIComponent(ideaCode)}`);
        foundIdea = data;
      } catch (err: any) {
        // Fallback: một số môi trường (Render cũ) chưa có endpoint này
        // Thử tìm qua endpoint search công khai nếu khả dụng
        const { data } = await getWithFallback<Idea[]>(
          `/ideas?search=${encodeURIComponent(ideaCode)}`
        );
        if (Array.isArray(data)) {
          foundIdea = data.find((it: Idea) => it.ideaCode === ideaCode) || null;
        }
      }

      if (!foundIdea) {
        setError('Không tìm thấy ý tưởng với mã: ' + ideaCode);
        return;
      }

      // ✅ Chỉ cho phép khi trạng thái là "Lập báo cáo A3"
      if (foundIdea.implementationStatus !== 'Lập báo cáo A3') {
        setError(
          `Ý tưởng này chưa ở trạng thái "Lập báo cáo A3". Trạng thái hiện tại: ${foundIdea.implementationStatus}`
        );
        return;
      }

      setIdea(foundIdea);
      setSuccess('Tìm thấy ý tưởng phù hợp. Bạn có thể nhập báo cáo A3.');
      setShowForm(true);
    } catch (error: any) {
      console.error('Error checking idea:', error);
      if (error.response?.status === 404) {
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
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ color: '#1976d2', fontWeight: 'bold' }}
          >
            Nhập báo cáo A3
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Typography
            variant="body1"
            gutterBottom
            sx={{ mb: 3, textAlign: 'center' }}
          >
            Nhập mã ý tưởng để kiểm tra và tạo báo cáo A3
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Hướng dẫn:</strong> Nếu bạn đã có mã ý tưởng từ email thông báo, hãy nhập mã đó vào ô bên dưới để tiếp tục nhập báo cáo A3.
            </Typography>
          </Alert>

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
              startIcon={
                loading ? <CircularProgress size={20} /> : <SearchIcon />
              }
              sx={{ minWidth: 140, height: 56 }}
            >
              {loading ? 'Đang kiểm tra...' : 'Kiểm tra mã ý tưởng'}
            </Button>
          </Box>

          <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: '#1976d2', fontWeight: 'bold' }}
            >
              Hướng dẫn sử dụng:
            </Typography>
            <Typography variant="body2" component="div" sx={{ lineHeight: 1.8 }}>
              <ol>
                <li><strong>Nhập mã ý tưởng:</strong> Dán mã ý tưởng bạn nhận được từ email thông báo vào ô bên trên</li>
                <li><strong>Kiểm tra mã:</strong> Nhấn nút "Kiểm tra mã ý tưởng" để xác minh</li>
                <li><strong>Xác nhận trạng thái:</strong> Hệ thống sẽ kiểm tra xem ý tưởng có ở trạng thái "Lập báo cáo A3" không</li>
                <li><strong>Nhập báo cáo:</strong> Nếu đúng, form nhập báo cáo A3 sẽ hiển thị với dữ liệu đã có sẵn</li>
                <li><strong>Hoàn thành:</strong> Điền thông tin còn thiếu và nhấn "Lưu và Export PDF" để tải file báo cáo</li>
              </ol>
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  💡 Lưu ý: Chỉ những ý tưởng đã được phê duyệt và chuyển sang trạng thái "Lập báo cáo A3" mới có thể nhập báo cáo.
                </Typography>
              </Box>
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default A3ReportTab;
