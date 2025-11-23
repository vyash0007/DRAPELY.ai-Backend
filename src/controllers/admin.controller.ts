import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class AdminController {
  // Admin Authentication
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, 'Email and password are required');
      }

      if (
        email === process.env.ADMIN_EMAIL &&
        password === process.env.ADMIN_PASSWORD
      ) {
        res.json({
          success: true,
          token: 'admin-session-token', // In production, use JWT
        });
      } else {
        throw new AppError(401, 'Invalid credentials');
      }
    } catch (error) {
      next(error);
    }
  }

  // Products
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, category } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      if (category) {
        where.categoryId = category;
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
          orderBy: { createdAt: 'desc' },
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

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
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

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        slug,
        description,
        price,
        stock,
        images,
        categoryId,
        featured,
        availableForTryOn,
        composition,
        fit,
        sizes,
        sizeStocks,
      } = req.body;

      const product = await prisma.product.create({
        data: {
          title,
          slug,
          description,
          price,
          stock,
          images,
          categoryId,
          featured: featured || false,
          availableForTryOn: availableForTryOn || false,
          composition,
          fit,
          sizes,
          sizeStocks: {
            create: sizeStocks || [],
          },
        },
        include: {
          category: true,
          sizeStocks: true,
        },
      });

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        description,
        price,
        stock,
        images,
        categoryId,
        featured,
        availableForTryOn,
        composition,
        fit,
        sizes,
        sizeStocks,
      } = req.body;

      // Update size stocks separately if provided
      if (sizeStocks) {
        // Delete existing size stocks
        await prisma.sizeStock.deleteMany({
          where: { productId: id },
        });

        // Create new size stocks
        await prisma.sizeStock.createMany({
          data: sizeStocks.map((ss: any) => ({
            ...ss,
            productId: id,
          })),
        });
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          title,
          slug,
          description,
          price,
          stock,
          images,
          categoryId,
          featured,
          availableForTryOn,
          composition,
          fit,
          sizes,
        },
        include: {
          category: true,
          sizeStocks: true,
        },
      });

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id },
      });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Categories
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

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true },
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

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug, description } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
        },
      });

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, slug, description } = req.body;

      const category = await prisma.category.update({
        where: { id },
        data: {
          name,
          slug,
          description,
        },
      });

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.category.delete({
        where: { id },
      });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Orders
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        orders,
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

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      res.json({ order });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      res.json({ order });
    } catch (error) {
      next(error);
    }
  }

  // Customers
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            _count: {
              select: { orders: true },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        customers,
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

  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const customer = await prisma.user.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { orders: true, wishlistItems: true },
          },
        },
      });

      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      res.json({ customer });
    } catch (error) {
      next(error);
    }
  }

  async toggleCustomerPremium(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { hasPremium } = req.body;

      const customer = await prisma.user.update({
        where: { id },
        data: { hasPremium },
      });

      res.json({ customer });
    } catch (error) {
      next(error);
    }
  }

  async toggleCustomerAI(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { aiEnabled } = req.body;

      const customer = await prisma.user.update({
        where: { id },
        data: { aiEnabled },
      });

      res.json({ customer });
    } catch (error) {
      next(error);
    }
  }

  // Dashboard
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
        recentOrders,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: 'CANCELLED' } },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        }),
      ]);

      res.json({
        stats: {
          totalProducts,
          totalOrders,
          totalCustomers,
          totalRevenue: totalRevenue._sum.total || 0,
        },
        recentOrders,
      });
    } catch (error) {
      next(error);
    }
  }
}
