/**
 * Server-side API calls for Next.js Server Components
 * These functions run on the server and call the backend API
 */

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-session')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Retry logic for rate limiting
  let retries = 3;
  let delay = 1000;
  let response: Response | undefined = undefined;
  for (let attempt = 0; attempt < retries; attempt++) {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });
    if (response.status !== 429) {
      break;
    }
    await new Promise(res => setTimeout(res, delay));
    delay *= 2;
  }
  
  // Handle 401 Unauthorized gracefully - return null instead of throwing
  if (response && response.status === 401) {
    return null;
  }
  
  // Handle 429 Too Many Requests gracefully - return null instead of throwing
  if (response && response.status === 429) {
    return null;
  }
  
  // Handle 404 Not Found gracefully - return null instead of throwing
  if (response && response.status === 404) {
    return null;
  }

  if (!response || !response.ok) {
    throw new Error(`API error: ${response ? response.statusText : 'No response'}`);
  }
  return response.json();
}

// Products
export async function getFeaturedProducts() {
  try {
    const data = await fetchWithAuth('/products/featured');
    // fetchWithAuth returns null for 401/429, so handle that case
    if (!data) {
      return [];
    }
    return data.products || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export async function getProducts(params?: any) {
  try {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const data = await fetchWithAuth(`/products${queryString}`);
    // fetchWithAuth returns null for 401/429, so handle that case
    if (!data) {
      return [];
    }
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const data = await fetchWithAuth(`/products/${slug}`);
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getTrialProducts() {
  try {
    const data = await fetchWithAuth('/products/trial');
    // fetchWithAuth returns null for 401/429, so handle that case
    if (!data) {
      return [];
    }
    return data.products || [];
  } catch (error) {
    console.error('Error fetching trial products:', error);
    return [];
  }
}

export async function searchProducts(query: string, params?: any) {
  try {
    const queryParams = new URLSearchParams({ q: query, ...params });
    const data = await fetchWithAuth(`/products/search?${queryParams}`);
    return {
      products: data.products || [],
      pagination: data.pagination,
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], pagination: null };
  }
}

// Categories
export async function getCategories() {
  try {
    const data = await fetchWithAuth('/categories');
    return data?.categories || [];
  } catch (error) {
    // Handle rate limiting and other errors gracefully
    if (error instanceof Error && error.message.includes('Too Many Requests')) {
      // Return empty array on rate limit - categories are not critical for page render
      return [];
    }
    // Only log non-rate-limit errors
    if (error instanceof Error && !error.message.includes('429')) {
      console.error('Error fetching categories:', error);
    }
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const data = await fetchWithAuth(`/categories/${slug}`);
    return data.category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// Cart
export async function getCart() {
  try {
    const data = await fetchWithAuth('/cart');
    // fetchWithAuth returns null for 401, so handle that case
    if (!data || !data.cart) {
      return null;
    }
    
    const cart = data.cart;
    const items = cart.items || [];
    
    // Calculate totalItems and totalPrice from items
    const totalItems = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const totalPrice = items.reduce((sum: number, item: any) => {
      const itemPrice = item.product?.price ? Number(item.product.price) : 0;
      const quantity = item.quantity || 0;
      return sum + itemPrice * quantity;
    }, 0);
    
    return {
      ...cart,
      items,
      totalItems,
      totalPrice,
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

// Orders
export async function getUserOrders() {
  try {
    const data = await fetchWithAuth('/orders');
    // fetchWithAuth returns null for 401, so handle that case
    if (!data) {
      return [];
    }
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrderById(orderId: string) {
  try {
    const data = await fetchWithAuth(`/orders/${orderId}`);
    return data.order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const data = await fetchWithAuth(`/orders/${orderId}/cancel`, {
      method: 'POST',
    });
    return data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

// Wishlist
export async function getWishlist() {
  try {
    const data = await fetchWithAuth('/wishlist');
    // fetchWithAuth returns null for 401, so handle that case
    if (!data) {
      return [];
    }
    return data.wishlistItems || [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

// User
export async function getCurrentUser() {
  try {
    const data = await fetchWithAuth('/auth/status');
    // fetchWithAuth returns null for 401, so handle that case
    if (!data) {
      return null;
    }
    return data.user;
  } catch (error) {
    // Only log unexpected errors, not 401s (which are handled by fetchWithAuth)
    if (error instanceof Error && !error.message.includes('401')) {
      console.error('Error fetching user:', error);
    }
    return null;
  }
}

// Admin - Products
export async function getAdminProducts(params?: any) {
  try {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const data = await fetchWithAuth(`/admin/products${queryString}`);

    // Backend returns array directly, not wrapped in object
    if (Array.isArray(data)) {
      return {
        products: data,
        pagination: null,
      };
    }

    return {
      products: data?.products || [],
      pagination: data?.pagination || null,
    };
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return {
      products: [],
      pagination: null,
    };
  }
}

export async function getAdminProductById(id: string) {
  try {
    const data = await fetchWithAuth(`/admin/products/${id}`);
    // fetchWithAuth returns null for 401/404/429, so handle that case
    if (!data) {
      return null;
    }
    return data.product;
  } catch (error) {
    console.error('Error fetching admin product:', error);
    return null;
  }
}

// Admin - Categories
export async function getAdminCategories() {
  try {
    const data = await fetchWithAuth('/admin/categories');

    // Backend returns array directly
    if (Array.isArray(data)) {
      return data;
    }

    return data?.categories || [];
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return [];
  }
}

export async function getAdminCategoryById(id: string) {
  try {
    const data = await fetchWithAuth(`/admin/categories/${id}`);
    return data.category;
  } catch (error) {
    console.error('Error fetching admin category:', error);
    return null;
  }
}

// Admin - Orders
export async function getAdminOrders(params?: any) {
  try {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const data = await fetchWithAuth(`/admin/orders${queryString}`);

    // Backend returns { orders, pagination } or just array
    if (Array.isArray(data)) {
      return {
        orders: data,
        pagination: null,
      };
    }

    return {
      orders: data?.orders || [],
      pagination: data?.pagination || null,
    };
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return {
      orders: [],
      pagination: null,
    };
  }
}

export async function getAdminOrderById(id: string) {
  try {
    const data = await fetchWithAuth(`/admin/orders/${id}`);
    return data.order;
  } catch (error) {
    console.error('Error fetching admin order:', error);
    return null;
  }
}

export async function getOrderStatistics() {
  try {
    const data = await fetchWithAuth('/admin/dashboard/stats');
    // Handle case where stats might be nested under a 'stats' property
    if (data?.stats && typeof data.stats === 'object') {
      return { ...data.stats, recentOrders: data.recentOrders || [] };
    }
    return data || { totalOrders: 0, pendingOrders: 0, processingOrders: 0, deliveredOrders: 0, totalRevenue: 0 };
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return { totalOrders: 0, pendingOrders: 0, processingOrders: 0, deliveredOrders: 0, totalRevenue: 0 };
  }
}

// Admin - Customers
export async function getAdminCustomers(params?: any) {
  try {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const data = await fetchWithAuth(`/admin/customers${queryString}`);

    // Backend returns { customers, pagination } or just array
    if (Array.isArray(data)) {
      return {
        customers: data,
        pagination: null,
      };
    }

    return {
      customers: data?.customers || [],
      pagination: data?.pagination || null,
    };
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    return {
      customers: [],
      pagination: null,
    };
  }
}

export async function getAdminCustomerById(id: string) {
  try {
    const data = await fetchWithAuth(`/admin/customers/${id}`);
    return data.customer;
  } catch (error) {
    console.error('Error fetching admin customer:', error);
    return null;
  }
}

// Orders - Extended
export async function createCheckoutSession(items: any[]) {
  try {
    const data = await fetchWithAuth('/payment/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getOrderBySessionId(sessionId: string) {
  try {
    // This might need to be implemented in the backend
    const data = await fetchWithAuth(`/orders?sessionId=${sessionId}`);
    return data.order;
  } catch (error) {
    console.error('Error fetching order by session:', error);
    return null;
  }
}

export async function processOrderCompletion(sessionId: string) {
  try {
    // This is typically handled by webhooks, but can be called directly if needed
    return { success: true };
  } catch (error) {
    console.error('Error processing order completion:', error);
    return { success: false };
  }
}

// Orders - Alternative name
export async function getOrders() {
  return getUserOrders();
}

// Product variants
export async function getTrialProductsByCategory(categoryId: string) {
  try {
    const data = await fetchWithAuth(`/products/trial?category=${categoryId}`);
    return data.products || [];
  } catch (error) {
    console.error('Error fetching trial products by category:', error);
    return [];
  }
}

export async function getAllProductsByCategory(categoryId: string) {
  try {
    const data = await fetchWithAuth(`/products?category=${categoryId}`);
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}
