// Global state
let currentPage = 'dashboard';
const API_BASE = '/api/admin';

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return token;
}

// Get API headers
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${checkAuth()}`,
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;

    const adminEmail = localStorage.getItem('adminEmail');
    if (adminEmail) {
        document.getElementById('adminEmail').textContent = adminEmail;
    }

    // Setup navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            loadPage(page);

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin/login.html';
    });

    // Load initial page
    loadPage('dashboard');
});

// Load page content
async function loadPage(page) {
    currentPage = page;
    const pageTitle = document.getElementById('pageTitle');
    const contentArea = document.getElementById('contentArea');

    const titles = {
        dashboard: 'Dashboard',
        products: 'Products Management',
        categories: 'Categories Management',
        orders: 'Orders Management',
        customers: 'Customers Management',
    };

    pageTitle.textContent = titles[page] || page;

    try {
        switch (page) {
            case 'dashboard':
                await loadDashboard(contentArea);
                break;
            case 'products':
                await loadProducts(contentArea);
                break;
            case 'categories':
                await loadCategories(contentArea);
                break;
            case 'orders':
                await loadOrders(contentArea);
                break;
            case 'customers':
                await loadCustomers(contentArea);
                break;
            default:
                contentArea.innerHTML = '<div class="empty-state"><h3>Page not found</h3></div>';
        }
    } catch (error) {
        console.error('Error loading page:', error);
        contentArea.innerHTML = '<div class="empty-state"><h3>Error loading data</h3></div>';
    }
}

// Dashboard
async function loadDashboard(container) {
    container.innerHTML = '<div class="loading">Loading dashboard...</div>';

    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`, {
            headers: getHeaders(),
        });
        const stats = await response.json();

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Revenue</h3>
                    <div class="value">$${stats.totalRevenue?.toLocaleString() || 0}</div>
                    <div class="change positive">+12.5% from last month</div>
                </div>
                <div class="stat-card">
                    <h3>Total Orders</h3>
                    <div class="value">${stats.totalOrders || 0}</div>
                    <div class="change positive">+8.2% from last month</div>
                </div>
                <div class="stat-card">
                    <h3>Total Customers</h3>
                    <div class="value">${stats.totalCustomers || 0}</div>
                    <div class="change positive">+15.3% from last month</div>
                </div>
                <div class="stat-card">
                    <h3>Total Products</h3>
                    <div class="value">${stats.totalProducts || 0}</div>
                    <div class="change">Updated today</div>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h2>Recent Orders</h2>
                </div>
                <table id="recentOrders">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="5" class="loading">Loading recent orders...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        // Load recent orders
        const ordersResponse = await fetch(`${API_BASE}/orders?limit=10`, {
            headers: getHeaders(),
        });
        const orders = await ordersResponse.json();
        displayRecentOrders(orders);
    } catch (error) {
        console.error('Dashboard error:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading dashboard</h3></div>';
    }
}

function displayRecentOrders(orders) {
    const tbody = document.querySelector('#recentOrders tbody');
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No recent orders</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id.slice(0, 8)}</td>
            <td>${order.user?.email || 'N/A'}</td>
            <td>$${order.totalAmount.toFixed(2)}</td>
            <td><span class="badge ${getStatusClass(order.status)}">${order.status}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Products
async function loadProducts(container) {
    container.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: getHeaders(),
        });
        const products = await response.json();

        container.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2>All Products</h2>
                    <div class="search-box">
                        <input type="text" id="productSearch" placeholder="Search products...">
                    </div>
                </div>
                <table id="productsTable">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        displayProducts(products);

        // Search functionality
        document.getElementById('productSearch').addEventListener('input', (e) => {
            const search = e.target.value.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(search) ||
                p.category?.name.toLowerCase().includes(search)
            );
            displayProducts(filtered);
        });
    } catch (error) {
        console.error('Products error:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading products</h3></div>';
    }
}

function displayProducts(products) {
    const tbody = document.querySelector('#productsTable tbody');
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.images?.[0] || '/placeholder.png'}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
            <td>${product.name}</td>
            <td>${product.category?.name || 'N/A'}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="badge ${product.stock > 0 ? 'success' : 'danger'}">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-small btn-view" onclick="viewProduct('${product.id}')">View</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Categories
async function loadCategories(container) {
    container.innerHTML = '<div class="loading">Loading categories...</div>';

    try {
        const response = await fetch(`${API_BASE}/categories`, {
            headers: getHeaders(),
        });
        const categories = await response.json();

        container.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2>All Categories</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Products Count</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categories.map(cat => `
                            <tr>
                                <td>${cat.name}</td>
                                <td>${cat.description || 'N/A'}</td>
                                <td>${cat._count?.products || 0}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-small btn-edit">Edit</button>
                                        <button class="btn-small btn-delete" onclick="deleteCategory('${cat.id}')">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Categories error:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading categories</h3></div>';
    }
}

// Orders
async function loadOrders(container) {
    container.innerHTML = '<div class="loading">Loading orders...</div>';

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            headers: getHeaders(),
        });
        const orders = await response.json();

        container.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2>All Orders</h2>
                    <div class="search-box">
                        <input type="text" id="orderSearch" placeholder="Search orders...">
                    </div>
                </div>
                <table id="ordersTable">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        displayOrders(orders);

        document.getElementById('orderSearch').addEventListener('input', (e) => {
            const search = e.target.value.toLowerCase();
            const filtered = orders.filter(o =>
                o.id.toLowerCase().includes(search) ||
                o.user?.email.toLowerCase().includes(search)
            );
            displayOrders(filtered);
        });
    } catch (error) {
        console.error('Orders error:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading orders</h3></div>';
    }
}

function displayOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id.slice(0, 8)}</td>
            <td>${order.user?.email || 'N/A'}</td>
            <td>${order.items?.length || 0} items</td>
            <td>$${order.totalAmount.toFixed(2)}</td>
            <td><span class="badge ${getStatusClass(order.status)}">${order.status}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="actions">
                    <button class="btn-small btn-view" onclick="viewOrder('${order.id}')">View</button>
                    <button class="btn-small btn-edit" onclick="updateOrderStatus('${order.id}')">Update Status</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Customers
async function loadCustomers(container) {
    container.innerHTML = '<div class="loading">Loading customers...</div>';

    try {
        const response = await fetch(`${API_BASE}/customers`, {
            headers: getHeaders(),
        });
        const customers = await response.json();

        container.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h2>All Customers</h2>
                    <div class="search-box">
                        <input type="text" id="customerSearch" placeholder="Search customers...">
                    </div>
                </div>
                <table id="customersTable">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Orders</th>
                            <th>Premium</th>
                            <th>AI Credits</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        displayCustomers(customers);

        document.getElementById('customerSearch').addEventListener('input', (e) => {
            const search = e.target.value.toLowerCase();
            const filtered = customers.filter(c =>
                c.email.toLowerCase().includes(search) ||
                (c.firstName && c.firstName.toLowerCase().includes(search))
            );
            displayCustomers(filtered);
        });
    } catch (error) {
        console.error('Customers error:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading customers</h3></div>';
    }
}

function displayCustomers(customers) {
    const tbody = document.querySelector('#customersTable tbody');
    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No customers found</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.email}</td>
            <td>${customer.firstName || ''} ${customer.lastName || ''}</td>
            <td>${customer._count?.orders || 0}</td>
            <td><span class="badge ${customer.isPremium ? 'success' : 'info'}">${customer.isPremium ? 'Yes' : 'No'}</span></td>
            <td>${customer.aiCredits || 0}</td>
            <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="actions">
                    <button class="btn-small btn-view" onclick="viewCustomer('${customer.id}')">View</button>
                    <button class="btn-small btn-edit" onclick="togglePremium('${customer.id}', ${customer.isPremium})">
                        ${customer.isPremium ? 'Remove Premium' : 'Add Premium'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Utility functions
function getStatusClass(status) {
    const statusMap = {
        'PENDING': 'warning',
        'PROCESSING': 'info',
        'SHIPPED': 'info',
        'DELIVERED': 'success',
        'CANCELLED': 'danger',
    };
    return statusMap[status] || 'info';
}

// Action functions (to be implemented)
function viewProduct(id) {
    alert(`View product: ${id}`);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        })
        .then(() => loadPage('products'))
        .catch(err => alert('Error deleting product'));
    }
}

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        fetch(`${API_BASE}/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        })
        .then(() => loadPage('categories'))
        .catch(err => alert('Error deleting category'));
    }
}

function viewOrder(id) {
    alert(`View order: ${id}`);
}

function updateOrderStatus(id) {
    const newStatus = prompt('Enter new status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED):');
    if (newStatus) {
        fetch(`${API_BASE}/orders/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: newStatus }),
        })
        .then(() => loadPage('orders'))
        .catch(err => alert('Error updating order status'));
    }
}

function viewCustomer(id) {
    alert(`View customer: ${id}`);
}

function togglePremium(id, isPremium) {
    fetch(`${API_BASE}/customers/${id}/premium`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isPremium: !isPremium }),
    })
    .then(() => loadPage('customers'))
    .catch(err => alert('Error toggling premium status'));
}
