import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class CategoryController {
  async getCategories(_req: Request, res: Response, next: NextFunction) {    
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            include: {
              category: true,
              sizeStocks: true,
            },
          },
        },
      });

      if (!category) {
        throw new AppError(404, 'Category not found');
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }
}
