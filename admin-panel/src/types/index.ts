/**
 * Shared types for both client and server components
 * This file should NOT import any server-only modules
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  featured: boolean;
  metadata?: Record<string, string>;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  sizes?: string[];
  sizeStocks?: { size: string; quantity: number }[];
  fit?: string;
  composition?: string;
}

export interface ProductWithCategory extends Product {
  category: Category;
}

export interface SerializedProductWithCategory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  featured: boolean;
  metadata?: Record<string, string>;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  sizes?: string[];
  sizeStocks?: { size: string; quantity: number }[];
  fit?: string;
  composition?: string;
  category: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    description: string | null;
  };
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  size?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemWithProduct extends CartItem {
  product: Product & { category: Category };
}

export interface Cart {
  items: CartItemWithProduct[];
  totalItems: number;
  subtotal: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  product: ProductWithCategory;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string;
  product: Product;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  hasPremium: boolean;
  aiEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
