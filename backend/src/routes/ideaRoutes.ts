import express from 'express';
import { getAllIdeas, createIdea, updateIdea, deleteIdea, updatePaymentStatus } from '../controllers/ideaController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/', createIdea);

// Protected routes
router.get('/', auth, getAllIdeas);
router.put('/:id', auth, updateIdea);
router.delete('/:id', auth, deleteIdea);
router.patch('/:id/payment', auth, updatePaymentStatus);

export default router; 