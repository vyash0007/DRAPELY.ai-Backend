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
          email: email,
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

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          sizeStocks: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      });

      // Map products to match frontend expected structure
      const mappedProducts = products.map(p => ({
        ...p,
        name: p.title, // Map title to name for frontend compatibility
      }));

      res.json(mappedProducts);
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
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        next(new AppError(400, `A product with this ${field} already exists`));
      } else {
        next(error);
      }
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

      res.json(categories);
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
      if (status && status !== 'undefined') {
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

      // Map orders to match frontend expected structure
      const mappedOrders = orders.map(o => ({
        ...o,
        totalAmount: o.total, // Map total to totalAmount
      }));

      res.json({
        orders: mappedOrders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
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
            orders: {
              select: {
                total: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      // Map customers to match frontend expected structure
      const mappedCustomers = customers.map(c => {
        const totalSpent = c.orders.reduce((sum, order) => sum + Number(order.total), 0);
        const lastOrder = c.orders[0];

        return {
          ...c,
          isPremium: c.hasPremium, // Map hasPremium to isPremium
          ordersCount: c._count.orders,
          totalSpent,
          lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        };
      });

      res.json({
        customers: mappedCustomers,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
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

      // Calculate total spent
      const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);

      res.json({
        customer: {
          ...customer,
          totalSpent,
          totalOrders: customer._count.orders,
        }
      });
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

      res.json({ success: true, customer });
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

      res.json({ success: true, customer });
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
        pendingOrders,
        processingOrders,
        deliveredOrders,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: 'CANCELLED' } },
        }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
      ]);

      res.json({
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenue._sum.total || 0,
        pendingOrders,
        processingOrders,
        deliveredOrders,
      });
    } catch (error) {
      next(error);
    }
  }
}
