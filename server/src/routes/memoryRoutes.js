import express from 'express';
import { 
  getMemories, 
  createMemory, 
  updateMemory, 
  deleteMemory, 
  toggleFavorite 
} from '../controllers/memoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMemories);
router.post('/', createMemory);
router.put('/:id', updateMemory);
router.delete('/:id', deleteMemory);
router.patch('/:id/favorite', toggleFavorite);

export default router;
