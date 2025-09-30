import express from 'express';
import { getAllIdeas, createIdea, updateIdea, deleteIdea, updatePaymentStatus } from '../controllers/ideaController';
import Idea from '../models/Idea';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/', createIdea);
router.get('/', getAllIdeas);
router.put('/:id', updateIdea);

// Protected admin routes
router.delete('/:id', auth, deleteIdea);
router.patch('/:id/payment', auth, updatePaymentStatus);

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

export default router; 