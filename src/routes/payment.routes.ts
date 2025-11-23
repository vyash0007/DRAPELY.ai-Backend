import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

router.post('/create-checkout-session', authenticate, paymentController.createCheckoutSession);
router.post('/premium-checkout', authenticate, paymentController.createPremiumCheckout);

export default router;
