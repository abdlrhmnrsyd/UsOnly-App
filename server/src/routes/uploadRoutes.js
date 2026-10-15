import express from 'express';
import { upload, handleSingleUpload } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, upload.single('photo'), handleSingleUpload);

export default router;
