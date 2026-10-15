import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  reactToMessage, 
  markAsRead,
  editMessage,
  deleteMessage
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMessages);
router.post('/', sendMessage);
router.post('/read', markAsRead);
router.put('/:id/reaction', reactToMessage);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);

export default router;

