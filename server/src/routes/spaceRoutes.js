import express from 'express';
import { 
  createSpace, 
  createInvitation, 
  getActiveInvitation,
  joinSpace, 
  getSpaceDetails, 
  updateSpaceSettings,
  leaveSpace
} from '../controllers/spaceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createSpace);
router.get('/', getSpaceDetails);
router.put('/', updateSpaceSettings);
router.get('/invite', getActiveInvitation);
router.post('/invite', createInvitation);
router.post('/join', joinSpace);
router.post('/leave', leaveSpace);
router.delete('/membership', leaveSpace);

export default router;

