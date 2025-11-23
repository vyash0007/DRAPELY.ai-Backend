import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const wishlistController = new WishlistController();

// GET wishlist can work without auth (returns empty array for unauthenticated users)
// POST and DELETE require authentication
router.get('/', optionalAuth, wishlistController.getWishlist);
router.post('/items', authenticate, wishlistController.addToWishlist);
router.delete('/items/:productId', authenticate, wishlistController.removeFromWishlist);

export default router;
