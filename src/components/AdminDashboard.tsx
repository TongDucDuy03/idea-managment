import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Edit as EditIcon, Delete as DeleteIcon, FileDownload as FileDownloadIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Idea } from '../types';
import IdeaDialog from './IdeaDialog';
import api from '../api/config';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Array<'pending' | 'rejected' | 'rewarded'>>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [ideaCodeFilter, setIdeaCodeFilter] = useState('');
  const [fullNameFilter, setFullNameFilter] = useState('');
  const [ideaTextFilter, setIdeaTextFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const topScrollRef = useRef<HTMLDivElement>(null);
  const dataGridRef = useRef<HTMLDivElement>(null);

  // Function to approximate row height based on content length
  // const calculateRowHeight = (params: GridRowHeightParams) => {
  //   const ideaLength = params.model.idea ? params.model.idea.length : 0;
  //   const solutionLength = params.model.solution ? params.model.solution.length : 0;
  //   const benefitLength = (params as any).model.benefit ? (params as any).model.benefit.length : 0;
    
  //   // Approximate characters per line for 'idea' and 'solution' columns
  //   // width: 300px, font-size: default (around 14px), assume ~40 characters per line for 300px width
  //   const charsPerLineIdea = 40; 
  //   const charsPerLineSolution = 40;
  //   const charsPerLineBenefit = 40;

  //   const linesIdea = Math.ceil(ideaLength / charsPerLineIdea);
  //   const linesSolution = Math.ceil(solutionLength / charsPerLineSolution);
  //   const linesBenefit = Math.ceil(benefitLength / charsPerLineBenefit);

  //   const maxLines = Math.max(linesIdea, linesSolution, linesBenefit);

  //   // Base height for a single line (e.g., 50px as initial min height for rows)
  //   const baseHeight = 50; 
  //   // Height per additional line (e.g., 20px per line)
  //   const lineHeight = 20; 

  //   // Ensure a minimum height and scale based on content
  //   return Math.max(baseHeight, baseHeight + (maxLines - 1) * lineHeight);
  // };

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


  

  const handleStatusFilterChange = (event: any) => {
    const value = event.target.value as Array<'pending' | 'rejected' | 'rewarded'>;
    setStatusFilter(value);
  };

  const handleDepartmentFilterChange = (event: any) => {
    const value = event.target.value as string[];
    setDepartmentFilter(value);
  };

  const handleIdeaCodeFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIdeaCodeFilter(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleFullNameFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFullNameFilter(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleIdeaTextFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIdeaTextFilter(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  
  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
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

  const handleGoToStatistics = () => {
    navigate('/statistics');
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
      'Giải pháp': (idea as any).solution || parseFieldFromIdea((idea as any).idea, 'Giải pháp'),
      'Lợi ích': (idea as any).benefit || parseFieldFromIdea((idea as any).idea, 'Lợi ích'),
      'Trạng thái': statusLabel(idea.status),
      'Ngày gửi': new Date(idea.submissionDate).toLocaleDateString('vi-VN')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ý tưởng cải tiến');
    XLSX.writeFile(wb, 'danh_sach_y_tuong.xlsx');
  };

  const uniqueDepartments = Array.from(new Set(ideas.map(i => i.department))).filter(Boolean).sort();

  const normalizeText = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredIdeas = ideas.filter(idea => {
    const matchesIdeaCode = normalizeText(ideaCodeFilter) === '' || normalizeText((idea as any).ideaCode || '').includes(normalizeText(ideaCodeFilter));
    const matchesFullName = normalizeText(fullNameFilter) === '' || normalizeText((idea as any).fullName || '').includes(normalizeText(fullNameFilter));
    const matchesIdeaText = normalizeText(ideaTextFilter) === '' || normalizeText((idea as any).idea || '').includes(normalizeText(ideaTextFilter));
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes((idea as any).status);
    const matchesDepartment = departmentFilter.length === 0 || departmentFilter.includes((idea as any).department);
    const submissionMs = idea.submissionDate ? new Date(idea.submissionDate).getTime() : NaN;
    const fromMs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : NaN;
    const toMs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : NaN;
    const matchesDateFrom = !dateFrom || (!Number.isNaN(submissionMs) && submissionMs >= fromMs);
    const matchesDateTo = !dateTo || (!Number.isNaN(submissionMs) && submissionMs <= toMs);

    return (
      matchesIdeaCode &&
      matchesFullName &&
      matchesIdeaText &&
      matchesStatus &&
      matchesDepartment &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  // Sync horizontal scroll between top scroll bar and DataGrid
  useEffect(() => {
    const topScrollElement = topScrollRef.current;
    const dataGridElement = dataGridRef.current?.querySelector('.MuiDataGrid-virtualScroller');

    if (!topScrollElement || !dataGridElement) return;

    // Tính tổng chiều rộng của các cột (hardcode để tránh lỗi dependency)
    const totalWidth = 150 + 200 + 250 + 300 + 300 + 300 + 200 + 180 + 180 + 200 + 250 + 120; // Tổng chiều rộng các cột
    
    // Cập nhật chiều rộng của thanh cuộn trên
    const invisibleContent = topScrollElement.querySelector('div');
    if (invisibleContent) {
      invisibleContent.style.width = `${totalWidth}px`;
    }

    const handleTopScroll = () => {
      if (dataGridElement) {
        dataGridElement.scrollLeft = topScrollElement.scrollLeft;
      }
    };

    const handleDataGridScroll = () => {
      if (topScrollElement) {
        topScrollElement.scrollLeft = dataGridElement.scrollLeft;
      }
    };

    topScrollElement.addEventListener('scroll', handleTopScroll);
    dataGridElement.addEventListener('scroll', handleDataGridScroll);

    return () => {
      topScrollElement.removeEventListener('scroll', handleTopScroll);
      dataGridElement.removeEventListener('scroll', handleDataGridScroll);
    };
  }, [filteredIdeas]);

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

  const parseFieldFromIdea = (ideaText: string | undefined, key: 'Giải pháp' | 'Lợi ích') => {
    if (!ideaText) return '';
    const lines = ideaText.split(/\n+/);
    const line = lines.find(l => l.trim().toLowerCase().startsWith(key.toLowerCase())) || '';
    return line.replace(/^.*?:\s*/, '').trim();
  };

  const getPureIdeaText = (ideaText: string | undefined) => {
    if (!ideaText) return '';
    const lines = ideaText.split(/\n+/);
    const filtered = lines.filter(l => {
      const t = l.trim().toLowerCase();
      return !(t.startsWith('giải pháp:') || t.startsWith('lợi ích:'));
    });
    return filtered.join('\n').trim();
  };


  const columns: GridColDef[] = [
    { 
      field: 'ideaCode', 
      headerName: 'Mã ý tưởng', 
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div
        style={{
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          width: '100%',
          textAlign: 'center'
        }}
      >
          {params.value || '-'}
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
        <div style={{
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value || '-'}
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
        <div style={{
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value || '-'}
        </div>
      )

    },
    {
      field: 'idea',
      headerName: 'Thực trạng',
      width: 300,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => getPureIdeaText((params.row as any).idea),
      renderCell: (params) => (
        <div style={{
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          width: '100%',
          textAlign: 'left',
          maxHeight: '180px',      // 👈 chiều cao tối đa cố định
          overflowY: 'auto',       // 👈 text dài thì có scroll
          paddingRight: '8px',
          scrollbarWidth: 'thin',  // 👈 scrollbar mỏng hơn
          scrollbarColor: '#ccc transparent' // 👈 màu scrollbar
        }}>
          {params.value || '-'}
        </div>
      )
    },
    {
      field: 'solution',
      headerName: 'Giải pháp',
      width: 300,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => (params.row as any).solution || parseFieldFromIdea((params.row as any).idea, 'Giải pháp'),
      renderCell: (params) => (
        <div style={{
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          width: '100%',
          textAlign: 'left',
          maxHeight: '180px',      // 👈 chiều cao tối đa cố định
          overflowY: 'auto',       // 👈 text dài thì có scroll
          paddingRight: '8px',
          scrollbarWidth: 'thin',  // 👈 scrollbar mỏng hơn
          scrollbarColor: '#ccc transparent' // 👈 màu scrollbar
        }}>
          {params.value || '-'}
        </div>
      )

    },
    {
      field: 'benefit',
      headerName: 'Lợi ích',
      width: 300,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => (params.row as any).benefit || parseFieldFromIdea((params.row as any).idea, 'Lợi ích'),
      renderCell: (params) => (
        <div style={{
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          width: '100%',
          textAlign: 'left',
          maxHeight: '180px',      // 👈 chiều cao tối đa cố định
          overflowY: 'auto',       // 👈 text dài thì có scroll
          paddingRight: '8px',
          scrollbarWidth: 'thin',  // 👈 scrollbar mỏng hơn
          scrollbarColor: '#ccc transparent' // 👈 màu scrollbar
        }}>
          {params.value || '-'}
        </div>
      )

    },
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
      field: 'implementationDirection',
      headerName: 'Hướng triển khai',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value || '-'}
        </div>
      )
    },
    {
      field: 'implementationDepartment',
      headerName: 'Phòng ban triển khai',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{
          width: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value || '-'}
        </div>
      )
    },
    {
      field: 'note',
      headerName: 'Ghi chú',
      width: 250,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <div style={{
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          width: '100%',
          textAlign: 'left',
          maxHeight: '180px',
          overflowY: 'auto',
          paddingRight: '8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#ccc transparent'
        }}>
          {params.value || '-'}
        </div>
      )
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
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 2 }}>
                <Box sx={{ display: 'flex', columnGap: 2, rowGap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    label="Mã ý tưởng"
                    size="small"
                    value={ideaCodeFilter}
                    onChange={handleIdeaCodeFilter}
                    sx={{ minWidth: 200, flex: '1 1 200px' }}
                  />
                  <TextField
                    label="Họ và tên"
                    size="small"
                    value={fullNameFilter}
                    onChange={handleFullNameFilter}
                    sx={{ minWidth: 200, flex: '1 1 200px' }}
                  />
                  <TextField
                    label="Ý tưởng"
                    size="small"
                    value={ideaTextFilter}
                    onChange={handleIdeaTextFilter}
                    sx={{ minWidth: 200, flex: '2 1 300px' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 2, rowGap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    label="Từ ngày"
                    type="date"
                    size="small"
                    value={dateFrom}
                    onChange={handleDateFromChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 170 }}
                  />
                  <TextField
                    label="Đến ngày"
                    type="date"
                    size="small"
                    value={dateTo}
                    onChange={handleDateToChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 170 }}
                  />
                  <Select
                    multiple
                    displayEmpty
                    value={departmentFilter}
                    onChange={handleDepartmentFilterChange}
                    renderValue={(selected) => {
                      if ((selected as string[]).length === 0) {
                        return 'Lọc phòng ban';
                      }
                      return (selected as string[]).join(', ');
                    }}
                    size="small"
                    sx={{ minWidth: 200, maxWidth: 280, flexShrink: 1 }}
                  >
                    {uniqueDepartments.map(dep => (
                      <MenuItem key={dep} value={dep}>
                        <Checkbox checked={departmentFilter.indexOf(dep) > -1} />
                        <ListItemText primary={dep} />
                      </MenuItem>
                    ))}
                  </Select>
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
                    sx={{ minWidth: 200, maxWidth: 280, flexShrink: 1 }}
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
                  <Box sx={{ display: 'flex', gap: 2, marginLeft: 'auto', alignItems: 'center' }}>
                    {/* <Button
                      variant="contained"
                      color="info"
                      startIcon={<BarChartIcon />}
                      onClick={handleGoToStatistics}
                      sx={{
                        py: 1.0,
                        px: 2.0,
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: 2,
                        whiteSpace: 'nowrap',
                        minWidth: 'max-content',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      Dashboard Thống kê
                    </Button> */}
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportExcel}
                      sx={{
                        py: 1.0,
                        px: 2.0,
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: 2,
                        whiteSpace: 'nowrap',
                        minWidth: 'max-content',
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
                        py: 1.0,
                        px: 2.0,
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        minWidth: 'max-content'
                      }}
                    >
                      Đăng xuất
                    </Button>
                  </Box>
                </Box>
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
          position: 'relative',
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderColor: 'rgba(224, 224, 224, 1)',
            whiteSpace: 'normal',
            lineHeight: '1.4',
            padding: '8px',
            display: 'flex',
            justifyContent: 'center',     // căn ngang giữa
            alignItems: 'flex-start',         // căn dọc giữa
            textAlign: 'center',
            wordBreak: 'break-word',
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
          },
          // Custom scrollbar styling
          '& .MuiDataGrid-cell div::-webkit-scrollbar': {
            width: '6px',
          },
          '& .MuiDataGrid-cell div::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '& .MuiDataGrid-cell div::-webkit-scrollbar-thumb': {
            background: '#ccc',
            borderRadius: '3px',
          },
          '& .MuiDataGrid-cell div::-webkit-scrollbar-thumb:hover': {
            background: '#999',
          }
        }}
      >
        {/* Top horizontal scroll bar - chỉ là thanh cuộn ngang */}
        <Box
          ref={topScrollRef}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'transparent',
            borderBottom: '1px solid #e0e0e0',
            height: '12px',
            overflowX: 'auto',
            overflowY: 'hidden',
            '&::-webkit-scrollbar': {
              height: '12px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#999999',
              borderRadius: '6px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#999',
            }
          }}
        >
          {/* Invisible content để tạo scrollbar với chiều rộng đúng */}
          <Box
            sx={{
              width: '100%',
              minWidth: 'max-content',
              height: '1px',
              visibility: 'hidden'
            }}
          />
        </Box>
        <Box ref={dataGridRef}>
          <DataGrid
            rows={filteredIdeas}
            columns={columns}
            getRowId={(row) => row._id}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            loading={loading}
            getRowHeight={() => 200} 
          />
        </Box>

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