import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/sync', authController.syncUser);
router.get('/status', authenticate, authController.getUserStatus);
router.post('/enable-ai', authenticate, authController.enableAI);
router.post('/activate-premium', authenticate, authController.activatePremium);

export default router;
