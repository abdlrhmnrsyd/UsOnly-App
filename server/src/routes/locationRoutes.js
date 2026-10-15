import express from 'express';
import { 
  getLocationState, 
  updateLocation, 
  toggleConsent,
  clearHistory
} from '../controllers/locationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getLocationState);
router.post('/update', updateLocation);
router.post('/toggle-consent', toggleConsent);
router.delete('/history', clearHistory);

export default router;

