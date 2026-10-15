import express from 'express';
import { 
  getMilestones, 
  createMilestone, 
  deleteMilestone 
} from '../controllers/milestoneController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMilestones);
router.post('/', createMilestone);
router.delete('/:id', deleteMilestone);

export default router;
