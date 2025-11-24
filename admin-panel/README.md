# DRAPELY.ai Admin Panel

A standalone Next.js admin panel for managing the DRAPELY.ai e-commerce platform.

## Overview

This admin panel runs as a separate Next.js application on port **5001**, completely independent from the main frontend. It connects to the backend API at `http://localhost:5000`.

## Features

- **Dashboard**: View statistics, revenue, orders, and customers
- **Products Management**: Full CRUD operations with image upload via Cloudinary
- **Categories Management**: Create, edit, and delete product categories
- **Orders Management**: View and update order statuses
- **Customers Management**: View customer details, toggle premium status

## Architecture

```
backend/
├── admin-panel/              # Standalone Next.js admin app
│   ├── src/
│   │   ├── app/             # Next.js 16 App Router
│   │   │   ├── (dashboard)/ # Dashboard route group
│   │   │   ├── login/       # Login page
│   │   │   ├── layout.tsx   # Root layout
│   │   │   └── globals.css  # Tailwind styles
│   │   ├── components/
│   │   │   ├── admin/       # Admin-specific components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── lib/             # Utilities
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
└── src/                      # Express backend
    └── routes/
        └── admin.routes.ts   # API endpoints
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom built on Radix UI primitives
- **Icons**: Lucide React
- **Image Upload**: Cloudinary via next-cloudinary
- **Notifications**: Sonner (toast)
- **HTTP Client**: Axios

## Installation

1. **Navigate to admin-panel directory:**
   ```bash
   cd backend/admin-panel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   The `.env.local` file is already created with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=duot7ssur
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=drapely-admin
   ```

4. **Start the admin panel:**
   ```bash
   npm run dev
   ```

   The admin panel will run on **http://localhost:5001**

## Usage

### Development

Run both the backend and admin panel:

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Admin Panel
cd backend/admin-panel
npm run dev
```

Access the admin panel at: **http://localhost:5001**

### Login

Default admin credentials (from `backend/.env`):
- **Email**: admin@example.com
- **Password**: StrongPass123

### Production

1. **Build the admin panel:**
   ```bash
   cd backend/admin-panel
   npm run build
   ```

2. **Start in production:**
   ```bash
   npm start
   ```

## Project Structure

### Pages (App Router)

```
/login                          # Admin login
/(dashboard)/dashboard          # Main dashboard
/(dashboard)/products           # Products list
/(dashboard)/products/new       # Create product
/(dashboard)/products/[id]/edit # Edit product
/(dashboard)/categories         # Categories list
/(dashboard)/categories/new     # Create category
/(dashboard)/categories/[id]/edit # Edit category
/(dashboard)/orders             # Orders list
/(dashboard)/orders/[id]        # Order details
/(dashboard)/customers          # Customers list
/(dashboard)/customers/[id]     # Customer details
```

### Key Components

**Admin Components** (`src/components/admin/`):
- `sidebar.tsx` - Navigation sidebar
- `topbar.tsx` - Top bar with branding
- `product-table.tsx`, `product-form.tsx`, `product-filters.tsx`
- `category-table.tsx`, `category-form.tsx`
- `order-table.tsx`, `order-filters.tsx`, `update-order-status.tsx`
- `customer-table.tsx`, `customer-filters.tsx`, `customer-toggles.tsx`
- `login-form.tsx` - Authentication
- `image-uploader.tsx` - Cloudinary integration
- `pagination.tsx` - Pagination controls
- Delete confirmation dialogs

**UI Components** (`src/components/ui/`):
- `button.tsx`, `input.tsx`, `select.tsx`, `label.tsx`
- `dialog.tsx`, `alert-dialog.tsx`
- `card.tsx`, `badge.tsx`, `checkbox.tsx`, `toggle.tsx`
- `textarea.tsx`, `scroll-area.tsx`

## API Integration

The admin panel communicates with the backend API:

**Base URL**: `http://localhost:5000/api/admin`

**Endpoints Used**:
- `/auth/login` - Admin authentication
- `/dashboard/stats` - Dashboard statistics
- `/products` - Product CRUD
- `/categories` - Category CRUD
- `/orders` - Order management
- `/customers` - Customer management

API calls are made via:
- **Client-side**: `src/services/api.ts` (axios)
- **Server-side**: `src/lib/api-server.ts` (fetch with auth)

## Authentication

Admin authentication uses a simple session-based approach:

1. User logs in at `/login`
2. Backend validates credentials against `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. Session token stored in cookie: `admin-session`
4. Protected routes check for valid session
5. Logout clears the session cookie

**Note**: For production, implement JWT tokens with expiration.

## Styling

The admin panel uses the same design system as the main frontend:

- **Tailwind CSS v4** with PostCSS
- **Custom theme** with CSS variables
- **Inter font** from Google Fonts
- **Pink/rose gradient** theme
- **Responsive design** (mobile-first)

## Development Tips

1. **Hot reload**: Changes auto-reload during development
2. **Type safety**: All components and API calls are fully typed
3. **Error handling**: Toast notifications for user feedback
4. **Loading states**: Built into tables and forms
5. **Validation**: Client-side form validation

## Deployment

### Option 1: Deploy as Separate App

Deploy the admin panel as a standalone Next.js app on Vercel, Netlify, or any Node.js host.

### Option 2: Serve from Backend

You can build the admin panel and serve it from your Express backend:

1. Build the admin panel: `npm run build`
2. Serve the `.next` output from Express
3. Update backend to serve on `/admin` route

## Security Considerations

1. **Change default credentials** in production
2. **Use HTTPS** for all communication
3. **Implement JWT** instead of simple tokens
4. **Add rate limiting** for login attempts
5. **IP whitelist** for admin access (optional)
6. **Enable CORS** only for admin panel domain

## Troubleshooting

**Port already in use:**
```bash
# Change port in package.json scripts:
"dev": "next dev -p 5002"
```

**API connection issues:**
- Verify backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Build errors:**
- Run `npm install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next`

## License

Proprietary - DRAPELY.ai
