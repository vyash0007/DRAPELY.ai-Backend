import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

// Public routes
router.get('/', optionalAuth, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/trial', productController.getTrialProducts);
router.get('/:slug', productController.getProductBySlug);
router.get('/search', productController.searchProducts);

export default router;
