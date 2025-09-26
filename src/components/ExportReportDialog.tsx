import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { Idea } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportReportDialogProps {
  open: boolean;
  onClose: () => void;
  ideas: Idea[];
}

const ExportReportDialog: React.FC<ExportReportDialogProps> = ({
  open,
  onClose,
  ideas
}) => {
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Lọc các ý tưởng có trạng thái "Lập báo cáo A3"
  const filteredIdeas = ideas.filter(idea => 
    idea.implementationStatus === 'Lập báo cáo A3'
  );

  // Reset selected ideas when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIdeas([]);
    }
  }, [open]);

  // Load logo from public folder and convert to data URL for embedding in exported content
  useEffect(() => {
    let cancelled = false;
    const loadLogo = async () => {
      try {
        const res = await fetch('/vico-logo.png', { cache: 'no-store' });
        if (!res.ok) return;
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) setLogoDataUrl(typeof reader.result === 'string' ? reader.result : null);
        };
        reader.readAsDataURL(blob);
      } catch {}
    };
    loadLogo();
    return () => { cancelled = true; };
  }, []);

  const handleIdeaSelection = (ideaId: string) => {
    setSelectedIdeas(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIdeas.length === filteredIdeas.length) {
      setSelectedIdeas([]);
    } else {
      setSelectedIdeas(filteredIdeas.map(idea => idea._id));
    }
  };

  const generateHTMLReport = (idea: Idea): string => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN');
    };

    // Tự động điều chỉnh font size dựa trên độ dài nội dung
    const getContentStyle = (content: string) => {
      const length = (content || '').length;
      if (length > 500) return 'font-size: 9px; line-height: 1.2;';
      if (length > 300) return 'font-size: 10px; line-height: 1.3;';
      if (length > 200) return 'font-size: 11px; line-height: 1.4;';
      return 'font-size: 12px; line-height: 1.4;';
    };

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Báo Cáo Cải Tiến A3 - ${idea.topicTitle || idea.ideaCode || 'N/A'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #ffffff;
            padding: 0;
            margin: 0;
        }
        
        .a3-container {
            width: 297mm;
            height: 210mm;
            background: white;
            border: 2px solid #000;
            position: relative;
            page-break-inside: avoid;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            height: 80px;
            border-bottom: 2px solid #000;
            flex-shrink: 0;
        }
        
        .logo-section {
            width: 120px;
            border-right: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
        }
        
        .title-section {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 10px;
        }
        
        .title-section h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
        }
        
        .info-sections {
            width: 400px;
            border-left: 2px solid #000;
            display: flex;
            height: 80px;
        }
        
        .info-section {
            flex: 1;
            padding: 8px;
            font-size: 11px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        .info-section:first-child {
            border-right: 2px solid #000;
        }
        
        .info-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 2px;
            flex-wrap: wrap;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-label {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 2px;
            display: block;
            width: 100%;
        }
        
        .info-value {
            width: 100%;
            font-size: 11px;
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
            min-height: 16px;
            word-wrap: break-word;
            overflow: hidden;
        }
        
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        .left-sidebar {
            width: 120px;
            border-right: 2px solid #000;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }
        
        .sidebar-section {
            flex: 1;
            border-bottom: 2px solid #000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            padding: 5px;
        }
        
        .sidebar-section:last-child {
            border-bottom: none;
        }
        
        .content-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 200px 200px auto;
            gap: 0;
            overflow: hidden;
        }
        
        .content-section {
            border: 1px solid #000;
            padding: 10px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .section-title {
            position: absolute;
            top: -1px;
            left: 10px;
            background: white;
            padding: 0 5px;
            font-weight: bold;
            font-size: 12px;
            z-index: 1;
        }
        
        .bottom-row {
            display: grid;
            grid-column: 1 / -1;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            min-height: 150px;
        }
        
        .section-content {
            flex: 1;
            border: none;
            resize: none;
            font-family: inherit;
            padding: 15px 5px 5px 5px;
            overflow: hidden;
            word-wrap: break-word;
            white-space: pre-wrap;
            text-overflow: ellipsis;
        }
        
        /* Dynamic content styling */
        .content-thuc-trang {
            ${getContentStyle(idea.solution || '')}
        }
        
        .content-doi-sach {
            ${getContentStyle(idea.benefit || '')}
        }
        
        .content-loi-ich {
            ${getContentStyle(idea.benefitOutcome || '')}
        }
        
        .content-danh-gia {
            ${getContentStyle(idea.scalingOpportunity || '')}
        }
        
        .content-chi-phi {
            ${getContentStyle(idea.resourcesUsed || '')}
        }
        
        .content-khen-thuong {
            ${getContentStyle(idea.calculationDescription || '')}
        }
        
        /* Overflow handling for long content */
        .overflow-content {
            page-break-before: always;
            padding: 20px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            border: 2px solid #000;
            margin-top: 20px;
            background: white;
        }
        
        .overflow-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ccc;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .a3-container {
                margin: 0;
                border: 1px solid #000;
            }
            
            .overflow-content {
                margin: 0;
                margin-top: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="a3-container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                ${logoDataUrl
                  ? `<img src="${logoDataUrl}" alt="Logo" style="max-width: 90px; max-height: 60px;" />`
                  : 'LOGO'}
            </div>
            <div class="title-section">
                <div>
                    <h1>CÔNG TY TNHH THẮNG LỢI</h1>
                    <h1>BÁO CÁO CẢI TIẾN A3</h1>
                </div>
            </div>
            <div class="info-sections">
                <!-- Ô 1: Tên đề tài và Mã ý tưởng -->
                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">TÊN ĐỀ TÀI:</span>
                        <div class="info-value">${idea.topicTitle || idea.idea || 'N/A'}</div>
                    </div>
                    
                </div>
                
                <!-- Ô 2: Người lập, Ngày lập, Đơn vị -->
                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">MÃ Ý TƯỞNG: ${idea.ideaCode || 'N/A'}</span>
                        
                    </div>
                    <div class="info-row">
                        <span class="info-label">Người lâp:  ${idea.fullName || 'N/A'}</span>
                        
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ngày lập: ${formatDate(idea.submissionDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Đơn vị: ${idea.implementationDepartment || idea.department || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Sidebar -->
            <div class="left-sidebar">
                <div class="sidebar-section">
                    NGƯỜI LẬP
                </div>
                <div class="sidebar-section">
                    P. CẢI TIẾN
                </div>
                <div class="sidebar-section">
                    GĐ KT
                </div>
                <div class="sidebar-section">
                    GĐ ĐH
                </div>
            </div>

            <!-- Content Grid -->
            <div class="content-grid">
                <!-- Top Row -->
                <div class="content-section">
                    <div class="section-title">THỰC TRẠNG</div>
                    <div class="section-content content-thuc-trang">${(idea.solution || 'Mô tả thực trạng hiện tại...').substring(0, 800)}${(idea.solution || '').length > 800 ? '...' : ''}</div>
                </div>
                
                <div class="content-section">
                    <div class="section-title">ĐỐI SÁCH</div>
                    <div class="section-content content-doi-sach">${(idea.benefit || 'Đối sách đề xuất...').substring(0, 800)}${(idea.benefit || '').length > 800 ? '...' : ''}</div>
                </div>

                <!-- Middle Row -->
                <div class="content-section">
                    <div class="section-title">HÌNH ẢNH TRƯỚC</div>
                    <div class="section-content">[Hình ảnh trước cải tiến]<br><em>Chú thích hình ảnh trước cải tiến</em></div>
                </div>
                
                <div class="content-section">
                    <div class="section-title">HÌNH ẢNH SAU</div>
                    <div class="section-content">[Hình ảnh sau cải tiến]<br><em>Chú thích hình ảnh sau cải tiến</em></div>
                </div>

                <!-- Bottom Row -->
                <div class="bottom-row">
                    <div class="content-section">
                        <div class="section-title">LỢI ÍCH</div>
                        <div class="section-content content-loi-ich">${(idea.benefitOutcome || 'Lợi ích đạt được...').substring(0, 300)}${(idea.benefitOutcome || '').length > 300 ? '...' : ''}</div>
                    </div>
                    
                    <div class="content-section">
                        <div class="section-title">ĐÁNH GIÁ</div>
                        <div class="section-content content-danh-gia">${(idea.scalingOpportunity || 'Đánh giá kết quả...').substring(0, 300)}${(idea.scalingOpportunity || '').length > 300 ? '...' : ''}</div>
                    </div>
                    
                    <div class="content-section">
                        <div class="section-title">CHI PHÍ</div>
                        <div class="section-content content-chi-phi">${(idea.resourcesUsed || 'Chi phí thực hiện...').substring(0, 300)}${(idea.resourcesUsed || '').length > 300 ? '...' : ''}</div>
                    </div>
                    
                    <div class="content-section">
                        <div class="section-title">KHEN THƯỞNG</div>
                        <div class="section-content content-khen-thuong">${(idea.calculationDescription || 'Đề xuất khen thưởng...').substring(0, 300)}${(idea.calculationDescription || '').length > 300 ? '...' : ''}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Overflow content for long text (will be on separate pages if needed) -->
    ${generateOverflowPages(idea)}
</body>
</html>`;
  };

  // Helper function để tạo trang phụ cho nội dung dài
  const generateOverflowPages = (idea: Idea): string => {
    let overflowContent = '';
    
    const sections = [
      { title: 'THỰC TRẠNG (tiếp theo)', content: idea.solution, limit: 800 },
      { title: 'ĐỐI SÁCH (tiếp theo)', content: idea.benefit, limit: 800 },
      { title: 'LỢI ÍCH (tiếp theo)', content: idea.benefitOutcome, limit: 300 },
      { title: 'ĐÁNH GIÁ (tiếp theo)', content: idea.scalingOpportunity, limit: 300 },
      { title: 'CHI PHÍ (tiếp theo)', content: idea.resourcesUsed, limit: 300 },
      { title: 'KHEN THƯỞNG (tiếp theo)', content: idea.calculationDescription, limit: 300 }
    ];
    
    sections.forEach(section => {
      if (section.content && section.content.length > section.limit) {
        const remainingContent = section.content.substring(section.limit);
        overflowContent += `
          <div class="overflow-content">
            <div class="overflow-title">${section.title}</div>
            <div>${remainingContent}</div>
          </div>
        `;
      }
    });
    
    return overflowContent;
  };

  const createPdfFromHtml = async (htmlContent: string, filename: string) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '297mm';
    container.style.background = '#ffffff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      // Đợi DOM render hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sử dụng A3 landscape orientation
      const pdf = new jsPDF('l', 'mm', 'a3'); // landscape A3
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Tìm tất cả các phần tử cần render
      const mainContainer = container.querySelector('.a3-container') as HTMLElement;
      const overflowContents = container.querySelectorAll('.overflow-content');
      
      // Render trang chính (A3 form)
      if (mainContainer) {
        const canvas = await html2canvas(mainContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: false,
          foreignObjectRendering: false,
          width: Math.floor(297 * 3.78), // Convert mm to px (297mm = A3 width)
          height: Math.floor(210 * 3.78), // Convert mm to px (210mm = A3 height)
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              * { 
                font-family: Arial, sans-serif !important;
                background-color: white !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Fit content to page with some margin
        const margin = 5; // 5mm margin
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);
        
        const scaleWidth = availableWidth / (canvas.width / 3.78);
        const scaleHeight = availableHeight / (canvas.height / 3.78);
        const scale = Math.min(scaleWidth, scaleHeight);
        
        const finalWidth = (canvas.width / 3.78) * scale;
        const finalHeight = (canvas.height / 3.78) * scale;
        
        const xOffset = (pageWidth - finalWidth) / 2;
        const yOffset = (pageHeight - finalHeight) / 2;
        
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
      }
      
      // Render các trang overflow nếu có
      for (let i = 0; i < overflowContents.length; i++) {
        const overflowElement = overflowContents[i] as HTMLElement;
        
        const canvas = await html2canvas(overflowElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: false,
          foreignObjectRendering: false,
        });

        pdf.addPage();
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);
        
        const scale = Math.min(
          contentWidth / (canvas.width / 3.78),
          contentHeight / (canvas.height / 3.78)
        );
        
        const finalWidth = (canvas.width / 3.78) * scale;
        const finalHeight = (canvas.height / 3.78) * scale;
        
        pdf.addImage(
          imgData, 
          'JPEG', 
          margin, 
          margin, 
          finalWidth, 
          finalHeight
        );
      }

      pdf.save(filename.replace(/\s+/g, '_'));
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw error;
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleExport = async () => {
    if (selectedIdeas.length === 0) {
      alert('Vui lòng chọn ít nhất một ý tưởng để export!');
      return;
    }

    setLoading(true);

    try {
      const selectedIdeasData = ideas.filter(idea => selectedIdeas.includes(idea._id));
      
      if (selectedIdeasData.length === 1) {
        const idea = selectedIdeasData[0];
        const htmlContent = generateHTMLReport(idea);
        const filename = `Bao_Cao_Cai_Tien_A3_${idea.ideaCode || idea._id}.pdf`;
        await createPdfFromHtml(htmlContent, filename);
      } else {
        for (const idea of selectedIdeasData) {
          const htmlContent = generateHTMLReport(idea);
          const filename = `Bao_Cao_Cai_Tien_A3_${idea.ideaCode || idea._id}.pdf`;
          await createPdfFromHtml(htmlContent, filename);
          // Delay giữa các file để tránh lỗi
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi xảy ra khi export báo cáo!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Export Báo Cáo Cải Tiến A3
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chọn các ý tưởng cần export báo cáo theo format A3. Nội dung dài sẽ tự động được chia sang trang tiếp theo.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
              sx={{ minWidth: 120 }}
            >
              {selectedIdeas.length === filteredIdeas.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <Chip 
              label={`Đã chọn: ${selectedIdeas.length}/${filteredIdeas.length}`}
              color="primary"
              size="small"
            />
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Chỉ hiển thị các ý tưởng có trạng thái "Lập báo cáo A3" ({filteredIdeas.length} ý tưởng)
        </Alert>
        
        <FormControl fullWidth>
          <InputLabel>Chọn ý tưởng cần export</InputLabel>
          <Select
            multiple
            value={selectedIdeas}
            onChange={(e) => setSelectedIdeas(e.target.value as string[])}
            renderValue={(selected) => `${selected.length} ý tưởng đã chọn`}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                },
              },
            }}
          >
            {filteredIdeas.map((idea) => (
              <MenuItem key={idea._id} value={idea._id}>
                <Checkbox checked={selectedIdeas.includes(idea._id)} />
                <ListItemText 
                  primary={`${idea.ideaCode || 'N/A'} - ${idea.fullName || 'N/A'}`}
                  secondary={`${idea.department || 'N/A'} - ${idea.topicTitle || idea.idea?.substring(0, 50) + '...' || 'N/A'}`}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedIdeas.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Sẽ tạo {selectedIdeas.length} file báo cáo PDF A3. Nội dung dài sẽ được tự động chia trang hợp lý.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button 
          onClick={handleExport} 
          variant="contained" 
          color="primary"
          disabled={selectedIdeas.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Đang export PDF A3...' : 'Export PDF A3'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportReportDialog;