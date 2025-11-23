import { Router } from 'express';
import { TryOnController } from '../controllers/tryOn.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const tryOnController = new TryOnController();

router.post('/process', authenticate, tryOnController.processTryOn);
router.post('/trial', authenticate, tryOnController.processTrial);

export default router;
