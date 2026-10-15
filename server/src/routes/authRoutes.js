import express from 'express';
import { register, login, quickLogin, getMe, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/quick-login/:role', quickLogin); // For convenient testing: /asit or /nisya
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
