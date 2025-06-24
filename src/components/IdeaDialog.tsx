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
    solution: '',
    ideaCode: '',
    isPaid: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (idea) {
      setFormData(idea);
    } else {
      setFormData({
        fullName: '',
        department: '',
        solution: '',
        ideaCode: '',
        isPaid: false
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
            <TextField
              name="ideaCode"
              label="Mã ý tưởng"
              value={formData.ideaCode}
              onChange={handleTextChange}
              required
              fullWidth
            />
            <TextField
              name="solution"
              label="Ý tưởng"
              value={formData.solution}
              onChange={handleTextChange}
              required
              fullWidth
              multiline
              rows={4}
            />
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