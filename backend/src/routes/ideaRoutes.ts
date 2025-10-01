import express from 'express';
import { getAllIdeas, createIdea, updateIdea, deleteIdea, updatePaymentStatus } from '../controllers/ideaController';
import Idea from '../models/Idea';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/', createIdea);
router.get('/', getAllIdeas);
router.put('/:id', updateIdea);

// Public: search ideas by code (no auth required)
router.get('/search', async (req, res) => {
  try {
    const { ideaCode } = req.query;
    if (!ideaCode) {
      return res.status(400).json({ message: 'Thiếu tham số ideaCode' });
    }
    
    const idea = await Idea.findOne({ ideaCode });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }
    
    res.json(idea);
  } catch (error) {
    console.error('Public search error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// Protected admin routes
router.delete('/:id', auth, deleteIdea);
router.patch('/:id/payment', auth, updatePaymentStatus);

// Public: search idea by exact code via query param (for FE public usage)
router.get('/public/search', async (req, res) => {
  try {
    const ideaCode = (req.query.ideaCode as string) || '';
    if (!ideaCode.trim()) {
      return res.status(400).json({ message: 'Thiếu tham số ideaCode' });
    }

    const idea = await Idea.findOne({ ideaCode });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }
    return res.json(idea);
  } catch (error) {
    console.error('Public search by code error:', error);
    return res.status(500).json({ message: 'Lỗi server', error });
  }
});

// Public: get idea by exact code
router.get('/code/:ideaCode', async (req, res) => {
  try {
    const { ideaCode } = req.params;
    const idea = await Idea.findOne({ ideaCode });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }
    res.json(idea);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// Public: update idea by code with allowed A3 fields only
router.put('/code/:ideaCode', async (req, res) => {
  try {
    const { ideaCode } = req.params;
    const idea = await Idea.findOne({ ideaCode });
    if (!idea) {
      return res.status(404).json({ message: 'Không tìm thấy ý tưởng với mã này' });
    }

    // Optional gate: chỉ cho phép khi đang ở trạng thái "Lập báo cáo A3"
    if ((idea as any).implementationStatus && (idea as any).implementationStatus !== 'Lập báo cáo A3') {
      return res.status(400).json({ message: 'Ý tưởng chưa ở trạng thái "Lập báo cáo A3"' });
    }

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
    return res.json(updated);
  } catch (error) {
    console.error('Public update by code error:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

export default router; 