import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProductController {
  async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        featured,
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (category) {
        where.category = { slug: category };
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }

      if (featured === 'true') {
        where.featured = true;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            sizeStocks: true,
          },
          skip,
          take: Number(limit),
          orderBy: { [sort as string]: order },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        where: { featured: true },
        include: {
          category: true,
          sizeStocks: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      res.json({ products });
    } catch (error) {
      next(error);
    }
  }

  async getTrialProducts(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        where: { availableForTryOn: true },
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ products });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          sizeStocks: true,
        },
      });

      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q || typeof q !== 'string') {
        throw new AppError(400, 'Search query is required');
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          include: {
            category: true,
            sizeStocks: true,
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      res.json({
        products,
        query: q,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
