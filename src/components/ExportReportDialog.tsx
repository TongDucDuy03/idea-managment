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
    if (selectedIdeas.length === ideas.length) {
      setSelectedIdeas([]);
    } else {
      setSelectedIdeas(ideas.map(idea => idea._id));
    }
  };

  const generateHTMLReport = (idea: Idea): string => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN');
    };

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Cải Tiến - ${idea.topicTitle || idea.ideaCode || 'N/A'}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      background-color: white;
      font-size: 13pt;
    }
    .container {
      width: 100%;
      max-width: none;
      background-color: white;
      border: 2px solid #000;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 0;
    }
    .header-table td {
      border: 2px solid #000;
      padding: 8px;
      vertical-align: middle;
    }
    .logo-cell {
      width: 12%;
      text-align: center;
    }
    .logo {
      width: 70px;
      height: 50px;
      border: 3px solid #0066cc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      background: white;
    }
    .logo-text {
      font-size: 16pt;
      font-weight: bold;
      color: #cc0066;
    }
    .company-cell {
      width: 58%;
      text-align: center;
    }
    .company-cell h3 {
      margin: 2px 0;
      font-size: 16pt;
      font-weight: bold;
    }
    .company-cell h2 {
      margin: 5px 0;
      font-size: 18pt;
      font-weight: bold;
    }
    .info-cell {
      width: 30%;
      font-size: 13pt;
      line-height: 1.4;
      text-align: left;
    }
    .info-cell p {
      margin: 3px 0;
    }
    .main-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      border: 2px solid #000;
    }
    .main-table th, .main-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .main-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      font-size: 14pt;
    }
    .main-table td {
      font-size: 13pt;
    }
    .topic-title {
      width: 18%;
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .topic-content {
      width: 32%;
    }
    .person-title {
      width: 18%;
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .person-content {
      width: 32%;
    }
    .section-header {
      font-weight: bold;
      text-align: left;
      background-color: #e8e8e8;
      padding: 10px 8px;
      font-size: 14pt;
    }
    .section-content {
      padding: 12px 8px;
      min-height: 50px;
      vertical-align: top;
      text-align: left;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }
    .image-header {
      text-align: center;
      font-weight: bold;
      background-color: #f0f0f0;
      height: 35px;
      vertical-align: middle;
      font-size: 14pt;
    }
    .image-section {
      height: 200px;
      text-align: center;
      vertical-align: middle;
      padding: 15px;
      font-size: 13pt;
      color: #666;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      border: 2px solid #000;
      border-top: none;
      page-break-inside: avoid !important;
    }
    .signature-row {
      text-align: center;
      font-weight: bold;
      height: 50px;
      vertical-align: middle;
      border: 1px solid #000;
      font-size: 12pt;
      background-color: #f0f0f0;
      padding: 8px 4px;
    }
    .signature-names {
      text-align: center;
      height: 120px;
      vertical-align: bottom;
      font-size: 12pt;
      font-weight: bold;
      border: 1px solid #000;
      padding: 15px 4px 15px 4px;
    }
    .signatures-table {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .full-width-section {
      background-color: #e8e8e8;
      border: 2px solid #000;
      border-top: none;
    }
    .department-row th {
      width: 18%;
      background-color: #f0f0f0;
    }
    .department-row td {
      width: 82%;
    }
    /* Đảm bảo không có page break trong table */
    .main-table {
      page-break-inside: avoid;
    }
    .section-table {
      page-break-inside: avoid;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>

<div class="container">
  <!-- Header -->
  <table class="header-table">
    <tr>
       <td class="logo-cell">
         ${logoDataUrl
           ? `<img src="${logoDataUrl}" alt="Logo" style="max-width: 90px; max-height: 60px; display:block; margin: 0 auto;" />`
           : `<div class=\"logo\"><span class=\"logo-text\">VICO</span></div>`}
       </td>
      <td class="company-cell">
        <h3>CÔNG TY TNHH THẮNG LỢI</h3>
        <h2>BÁO CÁO CẢI TIẾN</h2>
      </td>
      <td class="info-cell">
        <p><strong>Mã hiệu:</strong> BM.05.04</p>
        <p><strong>Đơn vị thực hiện:</strong> ${idea.implementationDepartment || idea.department || 'Ban Cải tiến'}</p>
        <p><strong>Số:</strong> ${idea.ideaCode || 'N/A'}</p>
        <p><strong>Ngày lập:</strong> ${formatDate(idea.submissionDate)}</p>
      </td>
    </tr>
  </table>
  
  <!-- Main Content -->
  <table class="main-table section-table">
    <tr>
      <th class="topic-title">Tên đề tài</th>
      <td class="topic-content">${idea.topicTitle || idea.idea || 'N/A'}</td>
    </tr>
    <tr class="department-row">
      <th>Bộ phận/ Khu vực</th>
      <td colspan="3">${idea.implementationDepartment || idea.department || 'N/A'}</td>
      <th class="person-title">Người đề xuất</th>
      <td class="person-content">${idea.fullName || 'N/A'}</td>
    </tr>
  </table>
  
  <!-- Section I -->
  <table class="main-table section-table">
    <tr>
      <td class="section-header">I. Mô tả trước cải tiến:</td>
    </tr>
    <tr>
      <td class="section-content">
        ${idea.solution || 'N/A'}
      </td>
    </tr>
  </table>
  
  <!-- Section II -->
  <table class="main-table section-table">
    <tr>
      <td class="section-header">II. Mô tả đối sách đã triển khai:</td>
    </tr>
    <tr>
      <td class="section-content">
        ${idea.benefit || 'N/A'}
      </td>
    </tr>
  </table>
  
  <!-- Section III - Images -->
  <table class="main-table section-table">
    <tr>
      <td colspan="2" class="section-header">III. Hình ảnh & chú thích quan trọng</td>
    </tr>
    <tr>
      <th class="image-header" style="width: 50%;">TRƯỚC</th>
      <th class="image-header" style="width: 50%;">SAU</th>
    </tr>
    <tr>
      <td class="image-section">
        [Hình ảnh trước cải tiến]<br>
        <em>Chú thích hình ảnh trước cải tiến</em>
      </td>
      <td class="image-section">
        [Hình ảnh sau cải tiến]<br>
        <em>Chú thích hình ảnh sau cải tiến</em>
      </td>
    </tr>
  </table>
  
  <!-- Section IV -->
  <table class="main-table section-table">
    <tr>
      <td class="section-header">IV. Nguồn lực sử dụng & Chi phí</td>
    </tr>
    <tr>
      <td class="section-content">${idea.resourcesUsed || 'N/A'}</td>
    </tr>
  </table>
  
  <!-- Section V -->
  <table class="main-table section-table">
    <tr>
      <td class="section-header">V. Lợi ích đạt được</td>
    </tr>
    <tr>
      <td class="section-content">
        ${idea.benefitOutcome || 'N/A'}
      </td>
    </tr>
  </table>
  
  <!-- Section VI -->
  <table class="main-table section-table">
    <tr>
      <td class="section-header">VI. Xem xét cơ hội nhân rộng phát triển</td>
    </tr>
    <tr>
      <td class="section-content">
        ${idea.scalingOpportunity || 'N/A'}
      </td>
    </tr>
  </table>
  
  <!-- Section VII -->
  <table class="main-table section-table">
    <tr>
      <td class="section-header">VII. Tính toán giá trị kinh tế của cải tiến</td>
    </tr>
    <tr>
      <td class="section-content">${idea.calculationDescription || 'N/A'}</td>
    </tr>
  </table>

  <!-- Signatures -->
  <div style="margin-top: 30px; page-break-inside: avoid;">
    <table class="signatures-table">
      <tr>
        <td class="signature-row" style="width: 25%;">GIÁM ĐỐC</td>
        <td class="signature-row" style="width: 25%;">XEM XÉT</td>
        <td class="signature-row" style="width: 25%;">TRƯỞNG PHÒNG CẢI TIẾN</td>
        <td class="signature-row" style="width: 25%;">THƯ KÝ CẢI TIẾN</td>
      </tr>
      <tr>
        <td class="signature-names">DƯƠNG VĂN BÌNH</td>
        <td class="signature-names">PHÙNG GIA CƯỜNG</td>
        <td class="signature-names">TRẦN VIỆT TIỆP</td>
        <td class="signature-names">HOÀNG NGỌC HÀ</td>
      </tr>
    </table>
  </div>
</div>

</body>
</html>`;
  };

  const createPdfFromHtml = async (htmlContent: string, filename: string) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '1200px';
    container.style.background = '#ffffff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      // Đợi DOM render hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: false,
        foreignObjectRendering: false,
        width: 1200,
        height: container.scrollHeight, // Sử dụng scrollHeight thực tế
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { 
              font-family: Arial, sans-serif !important;
              background-color: white !important;
            }
            body {
              height: auto !important;
              overflow: visible !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 40; // Tăng margin một chút
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      // Tính tỷ lệ để fit width
      const scale = contentWidth / canvas.width;
      const scaledHeight = canvas.height * scale;
      
      // Tính chiều cao mỗi trang theo canvas pixels
      const pageHeightInCanvasPx = contentHeight / scale;
      
      let currentY = 0;
      let pageNumber = 0;
      
      while (currentY < canvas.height) {
        if (pageNumber > 0) {
          pdf.addPage();
        }
        
        // Tăng buffer để đảm bảo signature không bị cắt
        const remainingHeight = canvas.height - currentY;
        let sliceHeight = Math.min(pageHeightInCanvasPx, remainingHeight);
        
        // Nếu còn ít content và có signature table, đảm bảo đủ không gian
        if (remainingHeight > 0 && remainingHeight < pageHeightInCanvasPx * 0.3) {
          sliceHeight = remainingHeight;
        }
        
        // Tạo canvas cho trang hiện tại
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        
        if (ctx) {
          // Vẽ background trắng
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Vẽ slice của trang
          ctx.drawImage(
            canvas,
            0, currentY, // source x, y
            canvas.width, sliceHeight, // source width, height
            0, 0, // dest x, y
            canvas.width, sliceHeight // dest width, height
          );
        }
        
        // Convert to image và add vào PDF
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(
          imgData, 
          'JPEG', 
          margin, 
          margin, 
          contentWidth, 
          sliceHeight * scale
        );
        
        currentY += sliceHeight;
        pageNumber++;
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
        const filename = `Bao_Cao_Cai_Tien_${idea.ideaCode || idea._id}.pdf`;
        await createPdfFromHtml(htmlContent, filename);
      } else {
        for (const idea of selectedIdeasData) {
          const htmlContent = generateHTMLReport(idea);
          const filename = `Bao_Cao_Cai_Tien_${idea.ideaCode || idea._id}.pdf`;
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
        Export Báo Cáo Cải Tiến
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chọn các ý tưởng cần export báo cáo. Mỗi ý tưởng sẽ được export thành một file PDF riêng biệt.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
              sx={{ minWidth: 120 }}
            >
              {selectedIdeas.length === ideas.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <Chip 
              label={`Đã chọn: ${selectedIdeas.length}/${ideas.length}`}
              color="primary"
              size="small"
            />
          </Box>
        </Box>

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
            {ideas.map((idea) => (
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
            Sẽ tạo {selectedIdeas.length} file báo cáo PDF riêng biệt.
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
          {loading ? 'Đang export PDF...' : 'Export PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportReportDialog;