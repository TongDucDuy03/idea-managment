import express from 'express';
import { getAllIdeas, createIdea, updateIdea, deleteIdea, updatePaymentStatus } from '../controllers/ideaController';
import Idea from '../models/Idea';
import { auth } from '../middleware/auth';

const router = express.Router();

// ========================================
// PUBLIC ROUTES - ĐẶT TRƯỚC CÁC ROUTE KHÁC
// ========================================

// Public: tạo ý tưởng mới
router.post('/', createIdea);

// Public: tìm ý tưởng theo mã code (endpoint chính)
router.get('/code/:ideaCode', async (req, res) => {
  try {
    const { ideaCode } = req.params;
    console.log('GET /ideas/code/:ideaCode - ideaCode:', ideaCode);
    
    const idea = await Idea.findOne({ ideaCode });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }
    
    console.log('Found idea:', idea.ideaCode, 'implementationStatus:', idea.implementationStatus);
    res.json(idea);
  } catch (error) {
    console.error('Error getting idea by code:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// Public: tìm kiếm ý tưởng theo query param (dự phòng)
router.get('/search', async (req, res) => {
  try {
    const { ideaCode } = req.query;
    console.log('GET /ideas/search - ideaCode:', ideaCode);
    
    if (!ideaCode || typeof ideaCode !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số ideaCode' });
    }
    
    const idea = await Idea.findOne({ ideaCode: ideaCode.trim() });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }
    
    console.log('Found idea via search:', idea.ideaCode);
    res.json(idea);
  } catch (error) {
    console.error('Error in public search:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// Public: cập nhật ý tưởng theo code (chỉ các trường A3)
router.put('/code/:ideaCode', async (req, res) => {
  try {
    const { ideaCode } = req.params;
    console.log('PUT /ideas/code/:ideaCode - ideaCode:', ideaCode);
    
    const idea = await Idea.findOne({ ideaCode });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }

    // Kiểm tra trạng thái
    if ((idea as any).implementationStatus !== 'Lập báo cáo A3') {
      return res.status(400).json({ 
        message: 'Ý tưởng chưa ở trạng thái "Lập báo cáo A3"',
        currentStatus: (idea as any).implementationStatus 
      });
    }

    // Chỉ cho phép cập nhật các trường A3
    const allowedFields: (keyof any)[] = [
      'topicTitle',
      'solution',
      'benefit',
      'benefitOutcome',
      'scalingOpportunity',
      'resourcesUsed',
      'calculationDescription',
      'beforeImage',
      'afterImage'
    ];

    const updatePayload: Record<string, any> = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updatePayload[key as string] = (req.body as any)[key];
      }
    }

    const updated = await Idea.findByIdAndUpdate(idea._id, updatePayload, { new: true });
    console.log('Updated idea:', updated?.ideaCode);
    return res.json(updated);
  } catch (error) {
    console.error('Error in public update by code:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// ========================================
// PROTECTED ROUTES (cần authentication)
// ========================================

// Protected: lấy tất cả ý tưởng (dành cho admin)
router.get('/', auth, getAllIdeas);

// Protected: cập nhật ý tưởng theo ID (admin)
router.put('/:id', auth, updateIdea);

// Protected: xóa ý tưởng (admin)
router.delete('/:id', auth, deleteIdea);

// Protected: cập nhật trạng thái thanh toán (admin)
router.patch('/:id/payment', auth, updatePaymentStatus);

export default router;