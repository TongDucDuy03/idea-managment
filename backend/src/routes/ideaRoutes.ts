import express from 'express';
import { getAllIdeas, createIdea, updateIdea, deleteIdea, updatePaymentStatus } from '../controllers/ideaController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/', createIdea);
router.get('/', getAllIdeas);
router.put('/:id', updateIdea);

// Protected admin routes
router.delete('/:id', auth, deleteIdea);
router.patch('/:id/payment', auth, updatePaymentStatus);

export default router; 