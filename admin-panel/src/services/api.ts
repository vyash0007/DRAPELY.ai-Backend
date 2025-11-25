import axios, { AxiosInstance, AxiosError } from 'axios';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add admin token
    this.client.interceptors.request.use(
      (config) => {
        // Add admin token from localStorage if available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('admin-token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 errors by redirecting to login
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            // Clear admin session
            localStorage.removeItem('admin-token');
            document.cookie = 'admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            // Redirect to login
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Products
  async getProducts(params?: any) {
    const response = await this.client.get('/products', { params });
    return response.data;
  }

  async getProductBySlug(slug: string) {
    const response = await this.client.get(`/products/${slug}`);
    return response.data;
  }

  async getFeaturedProducts() {
    const response = await this.client.get('/products/featured');
    return response.data;
  }

  async getTrialProducts() {
    const response = await this.client.get('/products/trial');
    return response.data;
  }

  async searchProducts(query: string, params?: any) {
    const response = await this.client.get('/products/search', {
      params: { q: query, ...params },
    });
    return response.data;
  }

  // Categories
  async getCategories() {
    const response = await this.client.get('/categories');
    return response.data;
  }

  async getCategoryBySlug(slug: string) {
    const response = await this.client.get(`/categories/${slug}`);
    return response.data;
  }

  // Cart
  async getCart() {
    const response = await this.client.get('/cart');
    return response.data;
  }

  async addToCart(productId: string, quantity: number, size?: string) {
    const response = await this.client.post('/cart/items', {
      productId,
      quantity,
      size,
    });
    return response.data;
  }

  async updateCartItem(itemId: string, quantity: number) {
    const response = await this.client.put(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  }

  async removeFromCart(itemId: string) {
    const response = await this.client.delete(`/cart/items/${itemId}`);
    return response.data;
  }

  async clearCart() {
    const response = await this.client.delete('/cart/clear');
    return response.data;
  }

  // Orders
  async getUserOrders() {
    const response = await this.client.get('/orders');
    return response.data;
  }

  async getOrderById(orderId: string) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: string) {
    const response = await this.client.post(`/orders/${orderId}/cancel`);
    return response.data;
  }

  // Wishlist
  async getWishlist(token?: string) {
    try {
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await this.client.get('/wishlist', { headers });
      return response.data;
    } catch (error: any) {
      // Handle 401 (unauthorized) and 429 (rate limit) gracefully
      // These are expected for unauthenticated users or during high traffic
      if (error.response?.status === 401 || error.response?.status === 429) {
        return { wishlistItems: [] };
      }
      throw error;
    }
  }

  async addToWishlist(productId: string) {
    try {
      const response = await this.client.post('/wishlist/items', { productId });
      return response.data;
    } catch (error: any) {
      // Handle 401 (unauthorized) and 429 (rate limit) gracefully
      if (error.response?.status === 401 || error.response?.status === 429) {
        throw new Error('Please sign in to add items to your wishlist');
      }
      throw error;
    }
  }

  async removeFromWishlist(productId: string) {
    try {
      const response = await this.client.delete(`/wishlist/items/${productId}`);
      return response.data;
    } catch (error: any) {
      // Handle 401 (unauthorized) and 429 (rate limit) gracefully
      if (error.response?.status === 401 || error.response?.status === 429) {
        throw new Error('Please sign in to manage your wishlist');
      }
      throw error;
    }
  }

  // Auth
  async syncUser(userData: any) {
    const response = await this.client.post('/auth/sync', userData);
    return response.data;
  }

  async getUserStatus() {
    const response = await this.client.get('/auth/status');
    return response.data;
  }

  async enableAI() {
    const response = await this.client.post('/auth/enable-ai');
    return response.data;
  }

  async activatePremium() {
    const response = await this.client.post('/auth/activate-premium');
    return response.data;
  }

  // Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.client.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Try-On
  async processTryOn(personImage: string, garmentImage: string) {
    const response = await this.client.post('/try-on/process', {
      personImage,
      garmentImage,
    });
    return response.data;
  }

  async processTrial(personImage: string, garmentImage: string) {
    const response = await this.client.post('/try-on/trial', {
      personImage,
      garmentImage,
    });
    return response.data;
  }

  // Payment
  async createCheckoutSession(items: any[]) {
    const response = await this.client.post('/payment/create-checkout-session', {
      items,
    });
    return response.data;
  }

  async createPremiumCheckout() {
    const response = await this.client.post('/payment/premium-checkout');
    return response.data;
  }

  // Admin
  async adminLogin(email: string, password: string) {
    const response = await this.client.post('/admin/auth/login', {
      email,
      password,
    });

    // Store token in localStorage and cookie
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('admin-token', response.data.token);
      // Also set as cookie for server-side access
      document.cookie = `admin-session=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }

    return response.data;
  }

  async getAdminProducts(params?: any) {
    const response = await this.client.get('/admin/products', { params });
    return response.data;
  }

  async getAdminProductById(id: string) {
    const response = await this.client.get(`/admin/products/${id}`);
    return response.data;
  }

  async createAdminProduct(data: any) {
    try {
      const response = await this.client.post('/admin/products', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to create product' };
    }
  }

  async updateAdminProduct(id: string, data: any) {
    try {
      const response = await this.client.put(`/admin/products/${id}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to update product' };
    }
  }

  async deleteAdminProduct(id: string) {
    try {
      const response = await this.client.delete(`/admin/products/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete product'
      };
    }
  }

  async getAdminCategories() {
    const response = await this.client.get('/admin/categories');
    return response.data;
  }

  async createAdminCategory(data: any) {
    const response = await this.client.post('/admin/categories', data);
    return response.data;
  }

  async updateAdminCategory(id: string, data: any) {
    const response = await this.client.put(`/admin/categories/${id}`, data);
    return response.data;
  }

  async deleteAdminCategory(id: string) {
    const response = await this.client.delete(`/admin/categories/${id}`);
    return response.data;
  }

  async getAdminOrders(params?: any) {
    const response = await this.client.get('/admin/orders', { params });
    return response.data;
  }

  async getAdminOrderById(id: string) {
    const response = await this.client.get(`/admin/orders/${id}`);
    return response.data;
  }

  async updateAdminOrderStatus(id: string, status: string) {
    try {
      const response = await this.client.put(`/admin/orders/${id}/status`, {
        status,
      });
      return { success: true, message: 'Order status updated successfully', data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update order status',
      };
    }
  }

  async getAdminCustomers(params?: any) {
    const response = await this.client.get('/admin/customers', { params });
    return response.data;
  }

  async getAdminCustomerById(id: string) {
    const response = await this.client.get(`/admin/customers/${id}`);
    return response.data;
  }

  async toggleAdminCustomerPremium(id: string, hasPremium: boolean) {
    const response = await this.client.put(`/admin/customers/${id}/premium`, {
      hasPremium,
    });
    return response.data;
  }

  async toggleAdminCustomerAI(id: string, aiEnabled: boolean) {
    const response = await this.client.put(`/admin/customers/${id}/ai`, {
      aiEnabled,
    });
    return response.data;
  }

  async getAdminDashboardStats() {
    const response = await this.client.get('/admin/dashboard/stats');
    return response.data;
  }

  // Aliases for compatibility with old action names
  createProduct = this.createAdminProduct;
  updateProduct = this.updateAdminProduct;
  deleteProduct = this.deleteAdminProduct;
  createCategory = this.createAdminCategory;
  updateCategory = this.updateAdminCategory;
  deleteCategory = this.deleteAdminCategory;
  loginAdmin = this.adminLogin;
  async logoutAdmin() {
    // Clear admin session cookie and local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-token');
      // Delete cookie by setting it to expire
      document.cookie = 'admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Redirect to login
      window.location.href = '/login';
    }
    return { success: true };
  }
  updateOrderStatus = this.updateAdminOrderStatus;
  updateUserPremiumStatus = this.toggleAdminCustomerPremium;
  updateUserAiEnabled = this.toggleAdminCustomerAI;
  getOrderStatistics = this.getAdminDashboardStats;

  // Wishlist functions
  async toggleWishlist(productId: string) {
    try {
      // Check if in wishlist first
      const wishlist = await this.getWishlist();
      const isInWishlist = wishlist.wishlistItems?.some((item: any) => item.productId === productId);

      if (isInWishlist) {
        await this.removeFromWishlist(productId);
        return { inWishlist: false };
      } else {
        await this.addToWishlist(productId);
        return { inWishlist: true };
      }
    } catch (error: any) {
      // Handle 401 (unauthorized) and 429 (rate limit) gracefully
      if (error.response?.status === 401) {
        throw new Error('Please sign in to manage your wishlist');
      }
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      console.error('Error toggling wishlist:', error);
      throw error;
    }
  }

  async isInWishlist(productId: string) {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.wishlistItems?.some((item: any) => item.productId === productId) || false;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }
}

export const api = new ApiClient();
export default api;

// Export wrapper functions for client components
// These can be imported individually by client components without importing server-only code

export const addToCart = (productId: string, quantity: number, size?: string) =>
  api.addToCart(productId, quantity, size);

export const removeFromCart = (itemId: string) =>
  api.removeFromCart(itemId);

export const updateCartItemQuantity = (itemId: string, quantity: number) =>
  api.updateCartItem(itemId, quantity);

export const getCart = () =>
  api.getCart();

export const clearCart = () =>
  api.clearCart();

export const getWishlist = (token?: string) =>
  api.getWishlist(token);

export const addToWishlist = (productId: string) =>
  api.addToWishlist(productId);

export const removeFromWishlist = (productId: string) =>
  api.removeFromWishlist(productId);

export const toggleWishlist = (productId: string) =>
  api.toggleWishlist(productId);

export const isInWishlist = (productId: string) =>
  api.isInWishlist(productId);

export const getProducts = (params?: any) =>
  api.getProducts(params);

export const searchProducts = (query: string, params?: any) =>
  api.searchProducts(query, params);

// Admin exports
export const createProduct = api.createProduct.bind(api);
export const updateProduct = api.updateProduct.bind(api);
export const deleteProduct = api.deleteProduct.bind(api);

export const createCategory = api.createCategory.bind(api);
export const updateCategory = api.updateCategory.bind(api);
export const deleteCategory = api.deleteCategory.bind(api);

export const loginAdmin = api.loginAdmin.bind(api);
export const logoutAdmin = api.logoutAdmin.bind(api);

export const updateOrderStatus = api.updateOrderStatus.bind(api);
export const updateUserPremiumStatus = api.updateUserPremiumStatus.bind(api);
export const updateUserAiEnabled = api.updateUserAiEnabled.bind(api);
