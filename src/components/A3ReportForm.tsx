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
import { Idea } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface A3ReportFormProps {
  idea: Idea | null;
  onClose: () => void;
}

const A3ReportForm: React.FC<A3ReportFormProps> = ({ idea, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Partial<Idea>>({});

  useEffect(() => {
    if (idea) {
      setReportData(idea);
    }
  }, [idea]);

  // Load logo from public folder
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

  const handleInputChange = (field: keyof Idea, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Hàm tối ưu hóa hình ảnh
  const optimizeImage = (file: File, maxWidth: number = 1200, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Tính toán kích thước mới
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Vẽ hình ảnh đã resize
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Chuyển đổi thành data URL với chất lượng đã tối ưu
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'beforeImage' | 'afterImage'
  ) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File ${field} quá lớn. Vui lòng chọn file nhỏ hơn 5MB.`);
      return;
    }
    
    console.log(`Handling ${field} image:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    try {
      // Tối ưu hóa hình ảnh trước khi lưu
      const optimizedDataUrl = await optimizeImage(file);
      
      console.log(`${field} optimized data URL length:`, optimizedDataUrl.length);
      setReportData(prev => {
        const newData = { ...prev, [field]: optimizedDataUrl };
        console.log(`Updated reportData with ${field}:`, {
          [field]: optimizedDataUrl ? 'Present' : 'Missing',
          allFields: Object.keys(newData)
        });
        return newData;
      });
      
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error(`Error processing ${field} image:`, error);
      setError(`Lỗi khi xử lý hình ảnh ${field}. Vui lòng thử lại.`);
    }
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

      // Log dữ liệu trước khi gửi
      console.log('Saving A3 report data:', {
        ideaId: idea._id,
        beforeImage: (reportData as any).beforeImage ? 'Present' : 'Missing',
        afterImage: (reportData as any).afterImage ? 'Present' : 'Missing',
        reportData: reportData
      });

      // Cập nhật ý tưởng với dữ liệu mới
      const response = await axios.put(`https://idea-managment.onrender.com/api/ideas/${idea._id}`, reportData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Save response:', response.data);

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

  const generateHTMLReport = (idea: Idea): string => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('vi-VN');
    };

    const getContentStyle = (content: string) => {
      const length = (content || '').length;
      if (length > 500) return 'font-size: 11px; line-height: 1.3;';
      if (length > 300) return 'font-size: 12px; line-height: 1.35;';
      if (length > 200) return 'font-size: 13px; line-height: 1.45;';
      return 'font-size: 14px; line-height: 1.45;';
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
        /* Reset màu trong vùng export để tránh oklch từ theme */
        .a3-container, .a3-container * {
            background: #ffffff !important;
            color: #000000 !important;
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
            font-size: 22px;
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
            font-size: 13px;
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
            font-size: 12px;
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
            font-size: 14px;
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
            font-size: 14px;
            z-index: 1;
        }
        
        .bottom-row {
            display: grid;
            grid-column: 1 / -1;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            min-height: 150px;
        }
        .image-box {
            border: 1px dashed #999;
            height: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #fff;
        }
        .image-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
        
        .section-content {
            flex: 1;
            border: none;
            resize: none;
            font-family: inherit;
            padding: 15px 5px 5px 5px;
            overflow: hidden;
            word-wrap: break-word;
            white-space: pre-line;
            line-height: 1.4;
            text-overflow: ellipsis;
        }
        
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
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .a3-container {
                margin: 0;
                border: 1px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="a3-container">
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
                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">TÊN ĐỀ TÀI:</span>
                        <div class="info-value">${idea.topicTitle || idea.idea || 'N/A'}</div>
                    </div>
                </div>
                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">MÃ Ý TƯỞNG: ${idea.ideaCode || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Người lập: ${idea.fullName || 'N/A'}</span>
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

        <div class="main-content">
            <div class="left-sidebar">
                <div class="sidebar-section">NGƯỜI LẬP</div>
                <div class="sidebar-section">P. CẢI TIẾN</div>
                <div class="sidebar-section">GĐ KT</div>
                <div class="sidebar-section">GĐ ĐH</div>
            </div>

            <div class="content-grid" style="grid-template-rows: 230px 230px auto;">
                <div class="content-section">
                    <div class="section-title">THỰC TRẠNG</div>
                    <div class="section-content content-thuc-trang">${(idea.solution || 'Mô tả thực trạng hiện tại...').substring(0, 800)}${(idea.solution || '').length > 800 ? '...' : ''}</div>
                </div>
                
                <div class="content-section">
                    <div class="section-title">ĐỐI SÁCH</div>
                    <div class="section-content content-doi-sach">${(idea.benefit || 'Đối sách đề xuất...').substring(0, 800)}${(idea.benefit || '').length > 800 ? '...' : ''}</div>
                </div>

                <div class="content-section">
                    <div class="section-title">HÌNH ẢNH TRƯỚC</div>
                    <div class="section-content">
                      ${(idea as any).beforeImage
                        ? `<div class=\"image-box\"><img src=\"${(idea as any).beforeImage}\" alt=\"Hình ảnh trước\" /></div>`
                        : '<div class=\"image-box\" style=\"color:#999; font-style:italic;\">Chưa có hình ảnh trước</div>'}
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="section-title">HÌNH ẢNH SAU</div>
                    <div class="section-content">
                      ${(idea as any).afterImage
                        ? `<div class=\"image-box\"><img src=\"${(idea as any).afterImage}\" alt=\"Hình ảnh sau\" /></div>`
                        : '<div class=\"image-box\" style=\"color:#999; font-style:italic;\">Chưa có hình ảnh sau</div>'}
                    </div>
                </div>

                <div class="bottom-row" style="min-height: 200px;">
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
</body>
</html>`;
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pdf = new jsPDF('l', 'mm', 'a3');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const mainContainer = container.querySelector('.a3-container') as HTMLElement;
      
      if (mainContainer) {
        const canvas = await html2canvas(mainContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: false,
          foreignObjectRendering: false,
          width: Math.floor(297 * 3.78),
          height: Math.floor(210 * 3.78),
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
        
        const margin = 5;
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

      pdf.save(filename.replace(/\s+/g, '_'));
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw error;
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleExport = async () => {
    if (!idea) return;
    
    setLoading(true);
    setError('');
    
    try {
      const htmlContent = generateHTMLReport(reportData as Idea);
      const filename = `Bao_Cao_Cai_Tien_A3_${idea.ideaCode || idea._id}.pdf`;
      await createPdfFromHtml(htmlContent, filename);
      
      setSuccess('File báo cáo A3 PDF đã được tải về thành công!');
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
            {/* Hình ảnh trước/sau */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                Hình ảnh minh họa
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="outlined" component="label" fullWidth>
                Tải lên Hình ảnh Trước
                <input type="file" accept="image/*" hidden onChange={(e) => handleImageChange(e, 'beforeImage')} />
              </Button>
              <Box sx={{ mt: 0.5, color: '#777', fontSize: 12 }}>
                Gợi ý: ảnh ngang ~1200×800px, dung lượng nhỏ hơn 5MB (sẽ được tối ưu hóa tự động)
              </Box>
              {(reportData as any).beforeImage && (
                <Box sx={{ mt: 1 }}>
                  <img src={(reportData as any).beforeImage} alt="Hình ảnh trước" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8 }} />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="outlined" component="label" fullWidth>
                Tải lên Hình ảnh Sau
                <input type="file" accept="image/*" hidden onChange={(e) => handleImageChange(e, 'afterImage')} />
              </Button>
              <Box sx={{ mt: 0.5, color: '#777', fontSize: 12 }}>
                Gợi ý: ảnh ngang ~1200×800px, dung lượng nhỏ hơn 5MB (sẽ được tối ưu hóa tự động)
              </Box>
              {(reportData as any).afterImage && (
                <Box sx={{ mt: 1 }}>
                  <img src={(reportData as any).afterImage} alt="Hình ảnh sau" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8 }} />
                </Box>
              )}
            </Grid>
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

            {/* Các trường chính cho báo cáo A3 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mt: 2 }}>
                Nội dung báo cáo A3
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Thực trạng (Solution)"
                value={reportData.solution || ''}
                onChange={(e) => handleInputChange('solution', e.target.value)}
                multiline
                rows={4}
                variant="outlined"
                placeholder="Mô tả thực trạng hiện tại..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Đối sách (Benefit)"
                value={reportData.benefit || ''}
                onChange={(e) => handleInputChange('benefit', e.target.value)}
                multiline
                rows={4}
                variant="outlined"
                placeholder="Đối sách đề xuất..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lợi ích đạt được "
                value={reportData.benefitOutcome || ''}
                onChange={(e) => handleInputChange('benefitOutcome', e.target.value)}
                multiline
                rows={3}
                variant="outlined"
                placeholder="Lợi ích đạt được..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cơ hội nhân rộng "
                value={reportData.scalingOpportunity || ''}
                onChange={(e) => handleInputChange('scalingOpportunity', e.target.value)}
                multiline
                rows={3}
                variant="outlined"
                placeholder="Cơ hội nhân rộng..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nguồn lực sử dụng "
                value={reportData.resourcesUsed || ''}
                onChange={(e) => handleInputChange('resourcesUsed', e.target.value)}
                multiline
                rows={3}
                variant="outlined"
                placeholder="Nguồn lực sử dụng..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mô tả tính toán "
                value={reportData.calculationDescription || ''}
                onChange={(e) => handleInputChange('calculationDescription', e.target.value)}
                multiline
                rows={3}
                variant="outlined"
                placeholder="Mô tả tính toán khen thưởng..."
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
              sx={{ minWidth: 150 }}
            >
              {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
            </Button>
            
            <Button
              variant="contained"
              color="success"
              onClick={handleExport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Đang xuất...' : 'Export PDF A3'}
            </Button>
            
            <Button
              variant="contained"
              color="info"
              onClick={handleSaveAndExport}
              disabled={saving || loading}
              startIcon={saving || loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
              sx={{ minWidth: 200 }}
            >
              {saving || loading ? 'Đang xử lý...' : 'Lưu và Export PDF'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default A3ReportForm;
