import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Idea } from '../types';

const departments = [
  'Phòng Hành chính nhân sự',
  'Phòng Nghiên cứu thí nghiệm',
  'Phòng Kinh doanh quốc tế',
  'Phòng Kinh tế kế toán',
  'Phòng Kỹ thuật công nghệ',
  'Phòng Kiểm soát chất lượng',
  'Phòng Kế hoạch',
  'Phòng Vật tư',
  'Phòng Thiết bị',
  'Phòng Cải tiến',
  'PX Mẫu Xốp',
  'PX Khuôn',
  'PX Đúc 1',
  'PX Hoàn thiện',
  'PX Nhiệt luyện',
  'PX Cơ điện',
  'PX GCCK',
  'Nhà máy DISA',
  'Thư ký ISO',
  'Thư ký An toàn 5S'
];

interface IdeaDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (idea: Partial<Idea>) => Promise<void>;
  idea?: Idea;
  isEdit?: boolean;
}

const IdeaDialog: React.FC<IdeaDialogProps> = ({
  open,
  onClose,
  onSave,
  idea,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<Partial<Idea>>({
    fullName: '',
    department: '',
    idea: '',
    solution: '',
    benefit: '',
    implementationDirection: 'Lưu ý tưởng',
    implementationDepartment: '',
    note: '',
    status: 'pending'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (idea) {
      setFormData({
        ...idea,
        implementationDirection: idea.implementationDirection || 'Lưu ý tưởng',
        implementationDepartment: idea.implementationDepartment || '',
        note: idea.note || '',
        status: idea.status || 'pending'
      });
    } else {
      setFormData({
        fullName: '',
        department: '',
        idea: '',
        solution: '',
        benefit: '',
        implementationDirection: 'Lưu ý tưởng',
        implementationDepartment: '',
        note: '',
        status: 'pending'
      });
    }
  }, [idea]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Sửa Ý tưởng' : 'Thêm Ý tưởng Mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="fullName"
              label="Họ và tên"
              value={formData.fullName}
              onChange={handleTextChange}
              required
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Phòng ban</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleSelectChange}
                label="Phòng ban"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Mã ý tưởng được tạo tự động ở backend; không cần nhập ở đây */}
            <TextField
              name="idea"
              label="Vấn đề"
              value={formData.idea}
              onChange={handleTextChange}
              required
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              name="solution"
              label="Giải pháp"
              value={formData.solution}
              onChange={handleTextChange}
              required
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              name="benefit"
              label="Lợi ích"
              value={formData.benefit}
              onChange={handleTextChange}
              required
              fullWidth
              multiline
              rows={4}
            />
            <FormControl fullWidth>
              <InputLabel>Hướng triển khai</InputLabel>
              <Select
                name="implementationDirection"
                value={formData.implementationDirection || 'Lưu ý tưởng'}
                onChange={handleSelectChange}
                label="Hướng triển khai"
              >
                <MenuItem value="Lưu ý tưởng">Lưu ý tưởng</MenuItem>
                <MenuItem value="Triển khai">Triển khai</MenuItem>
                <MenuItem value="Làm báo cáo A3">Làm báo cáo A3</MenuItem>
                <MenuItem value="Xem xét">Xem xét</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Phòng ban triển khai</InputLabel>
              <Select
                name="implementationDepartment"
                value={formData.implementationDepartment || ''}
                onChange={handleSelectChange}
                label="Phòng ban triển khai"
              >
                <MenuItem value="">Chọn phòng ban</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="note"
              label="Ghi chú"
              value={formData.note}
              onChange={handleTextChange}
              fullWidth
              multiline
              rows={3}
            />
            {isEdit && (
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleSelectChange}
                  label="Trạng thái"
                >
                  <MenuItem value="pending">Chưa xem xét</MenuItem>
                  <MenuItem value="rejected">Không khen thưởng</MenuItem>
                  <MenuItem value="rewarded">Đã khen thưởng</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IdeaDialog; 