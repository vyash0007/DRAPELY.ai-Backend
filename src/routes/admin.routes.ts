import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();
const adminController = new AdminController();

// Admin auth
router.post('/auth/login', strictLimiter, adminController.login);

// Products
router.get('/products', adminController.getProducts);
router.get('/products/:id', adminController.getProductById);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Categories
router.get('/categories', adminController.getCategories);
router.get('/categories/:id', adminController.getCategoryById);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Customers
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.put('/customers/:id/premium', adminController.toggleCustomerPremium);
router.put('/customers/:id/ai', adminController.toggleCustomerAI);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;
