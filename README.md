# DRAPELY.ai Backend API

Express.js backend server for DRAPELY.ai e-commerce platform with virtual try-on features.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payment**: Stripe
- **Image Storage**: Cloudinary
- **AI Try-On**: External API integration

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (Neon recommended)
- Clerk account for authentication
- Stripe account for payments
- Cloudinary account for image storage

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=your_postgresql_url

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Try-On API
TRY_ON_API_URL=https://your-tryon-api.com
TRY_ON_API_SECRET_KEY=your_secret_key

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed database
npm run db:seed
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Server will run on http://localhost:5000
```

## Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/sync` - Sync user from Clerk
- `GET /api/auth/status` - Get user status
- `POST /api/auth/enable-ai` - Enable AI features
- `POST /api/auth/activate-premium` - Activate premium

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/trial` - Get try-on enabled products
- `GET /api/products/:slug` - Get product by slug
- `GET /api/products/search` - Search products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get category by slug

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:itemId` - Update cart item
- `DELETE /api/cart/items/:itemId` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:orderId` - Get order details
- `POST /api/orders/:orderId/cancel` - Cancel order

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist/items` - Add to wishlist
- `DELETE /api/wishlist/items/:productId` - Remove from wishlist

### Upload
- `POST /api/upload` - Upload image
- `POST /api/upload/avatar` - Upload avatar

### Try-On
- `POST /api/try-on/process` - Process try-on (premium)
- `POST /api/try-on/trial` - Process trial try-on

### Payment
- `POST /api/payment/create-checkout-session` - Create checkout
- `POST /api/payment/premium-checkout` - Premium checkout

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook

### Admin
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/products` - Manage products
- `GET /api/admin/categories` - Manage categories
- `GET /api/admin/orders` - Manage orders
- `GET /api/admin/customers` - Manage customers
- `GET /api/admin/dashboard/stats` - Dashboard stats

## Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push

# Seed database
npm run db:seed
```

## Admin Panel

The admin panel is a **standalone Next.js application** located in `backend/admin-panel/`. It runs independently on port **5001** and connects to the backend API.

### Starting the Admin Panel

```bash
# Option 1: Use the startup script
# Windows:
start-admin.bat

# macOS/Linux:
./start-admin.sh

# Option 2: Manual start
cd admin-panel
npm install  # First time only
npm run dev
```

Access the admin panel at: **http://localhost:5001**

**Default Login:**
- Email: `admin@example.com`
- Password: `StrongPass123` (change in `.env`)

See [admin-panel/README.md](admin-panel/README.md) for detailed documentation.

## Project Structure

```
backend/
├── admin-panel/         # Standalone Next.js admin app (port 5001)
│   ├── src/
│   │   ├── app/        # Next.js pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities
│   │   └── services/   # API client
│   ├── package.json
│   └── README.md
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## License

ISC
