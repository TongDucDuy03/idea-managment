import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  IconButton,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  Select,
  Checkbox,
  ListItemText
} from '@mui/material';
import { DataGrid, GridColDef, GridRowHeightParams } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Idea } from '../types';
import IdeaDialog from './IdeaDialog';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Array<'pending' | 'rejected' | 'rewarded'>>([]);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Function to approximate row height based on content length
  const calculateRowHeight = (params: GridRowHeightParams) => {
    const ideaLength = params.model.idea ? params.model.idea.length : 0;
    const solutionLength = params.model.solution ? params.model.solution.length : 0;
    
    // Approximate characters per line for 'idea' and 'solution' columns
    // width: 300px, font-size: default (around 14px), assume ~40 characters per line for 300px width
    const charsPerLineIdea = 40; 
    const charsPerLineSolution = 40;

    const linesIdea = Math.ceil(ideaLength / charsPerLineIdea);
    const linesSolution = Math.ceil(solutionLength / charsPerLineSolution);

    const maxLines = Math.max(linesIdea, linesSolution);

    // Base height for a single line (e.g., 50px as initial min height for rows)
    const baseHeight = 50; 
    // Height per additional line (e.g., 20px per line)
    const lineHeight = 20; 

    // Ensure a minimum height and scale based on content
    return Math.max(baseHeight, baseHeight + (maxLines - 1) * lineHeight);
  };

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
        setError('Không thể tải danh sách ý tưởng');
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event: any) => {
    const value = event.target.value as Array<'pending' | 'rejected' | 'rewarded'>;
    setStatusFilter(value);
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'rejected' | 'rewarded') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.put(`https://idea-managment.onrender.com/api/ideas/${id}`, {
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchIdeas();
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Không thể cập nhật trạng thái');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ý tưởng này?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        await axios.delete(`https://idea-managment.onrender.com/api/ideas/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchIdeas();
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Không thể xóa ý tưởng');
        }
      }
    }
  };

  const handleEdit = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedIdea(null);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleSave = async (ideaData: Partial<Idea>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (isEditMode && selectedIdea) {
        await axios.put(`https://idea-managment.onrender.com/api/ideas/${selectedIdea._id}`, ideaData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post('https://idea-managment.onrender.com/api/ideas', ideaData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      fetchIdeas();
      setIsDialogOpen(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Không thể lưu ý tưởng');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleExportExcel = () => {
    const statusLabel = (s: 'pending' | 'rejected' | 'rewarded') => (
      s === 'pending' ? 'Chưa xem xét' : s === 'rejected' ? 'Không khen thưởng' : 'Đã khen thưởng'
    );
    const exportData = ideas.map(idea => ({
      'Mã ý tưởng': idea.ideaCode,
      'Họ và tên': idea.fullName,
      'Đơn vị': idea.department,
      'Vấn đề': idea.idea,
      'Giải pháp': idea.solution,
      'Trạng thái': statusLabel(idea.status),
      'Ngày gửi': new Date(idea.submissionDate).toLocaleDateString('vi-VN')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ý tưởng cải tiến');
    XLSX.writeFile(wb, 'danh_sach_y_tuong.xlsx');
  };

  const filteredIdeas = ideas.filter(idea =>
    (
      idea.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.idea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.solution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.ideaCode.toLowerCase().includes(searchTerm.toLowerCase())
    ) && (
      statusFilter.length === 0 || statusFilter.includes(idea.status as any)
    )
  );

  const StatusCell: React.FC<{ row: Idea }> = ({ row }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const label = row.status ? (row.status === 'pending' ? 'Chưa xem xét' : row.status === 'rejected' ? 'Không khen thưởng' : 'Đã khen thưởng') : 'Chưa xem xét';
    const color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' =
      row.status === 'rejected' ? 'error' : row.status === 'rewarded' ? 'success' : 'info';

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const selectStatus = (s: 'pending' | 'rejected' | 'rewarded') => {
      handleStatusChange(row._id, s);
      handleClose();
    };

    return (
      <>
        <Chip
          label={label}
          color={color}
          size="small"
          onClick={handleOpen}
          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
        />
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => selectStatus('pending')}>Chưa xem xét</MenuItem>
          <MenuItem onClick={() => selectStatus('rejected')}>Không khen thưởng</MenuItem>
          <MenuItem onClick={() => selectStatus('rewarded')}>Đã khen thưởng</MenuItem>
        </Menu>
      </>
    );
  };

  const columns: GridColDef[] = [
    { 
      field: 'ideaCode', 
      headerName: 'Mã ý tưởng', 
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', width: '100%', textAlign: 'center' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'fullName', 
      headerName: 'Họ và tên', 
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', width: '100%', textAlign: 'center' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'department', 
      headerName: 'Đơn vị', 
      width: 250,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', width: '100%', textAlign: 'center' }}>
          {params.value}
        </div>
      )
    },
    {
      field: 'idea',
      headerName: 'Ý tưởng',
      width: 300,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', width: '100%', textAlign: 'center', marginTop: 0 }}>
          {params.value}
        </div>
      )
    },
    // {
    //   field: 'solution',
    //   headerName: 'Giải pháp',
    //   width: 300,
    //   renderCell: (params) => (
    //     <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
    //       {params.value}
    //     </div>
    //   )
    // },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <StatusCell row={params.row} />
        </div>
      ),
      sortable: false
    },
    {
      field: 'submissionDate',
      headerName: 'Thời gian nộp',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString('vi-VN');
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Sửa">
            <IconButton
              color="primary"
              onClick={() => handleEdit(params.row)}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row._id)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            Quản lý Ý tưởng Cải tiến
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, flexWrap: 'nowrap' }}>
                <Select
                  multiple
                  displayEmpty
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  renderValue={(selected) => {
                    if ((selected as string[]).length === 0) {
                      return 'Lọc trạng thái';
                    }
                    const map: any = { pending: 'Chưa xem xét', rejected: 'Không khen thưởng', rewarded: 'Đã khen thưởng' };
                    return (selected as string[]).map(s => map[s]).join(', ');
                  }}
                  size="small"
                  sx={{ minWidth: 220 }}
                >
                  {[
                    { value: 'pending', label: 'Chưa xem xét' },
                    { value: 'rejected', label: 'Không khen thưởng' },
                    { value: 'rewarded', label: 'Đã khen thưởng' }
                  ].map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Checkbox checked={statusFilter.indexOf(opt.value as any) > -1} />
                      <ListItemText primary={opt.label} />
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  sx={{
                    py: 1.25,
                    px: 2.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: 2,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  Thêm Ý tưởng Mới
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportExcel}
                  sx={{
                    py: 1.25,
                    px: 2.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: 2,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  Xuất Excel
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLogout}
                  sx={{
                    py: 1.25,
                    px: 2.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Đăng xuất
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%',
          borderRadius: 2,
          height: 'auto', // Ensure Paper expands
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderColor: 'rgba(224, 224, 224, 1)',
            whiteSpace: 'normal',
            lineHeight: 'normal',
            padding: '8px',
            alignItems: 'center',
            overflow: 'visible',
            wordBreak: 'break-word',
            display: 'flex',
            alignContent: 'center',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '2px solid #e0e0e0',
          },
          '& .MuiDataGrid-row': {
            alignItems: 'center',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f5f5f5',
          }
        }}
      >
        <DataGrid
          rows={filteredIdeas}
          columns={columns}
          getRowId={(row) => row._id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          loading={loading}
          getRowHeight={calculateRowHeight}
        />
      </Paper>

      <IdeaDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        idea={selectedIdea || undefined}
        isEdit={isEditMode}
      />
    </Container>
  );
};

export default AdminDashboard; 