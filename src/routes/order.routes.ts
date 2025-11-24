import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const orderController = new OrderController();

// All order routes require authentication
router.use(authenticate);

router.get('/', orderController.getUserOrders);
router.get('/session/:sessionId', orderController.getOrderBySessionId);
router.get('/:orderId', orderController.getOrderById);
router.post('/:orderId/cancel', orderController.cancelOrder);

export default router;
