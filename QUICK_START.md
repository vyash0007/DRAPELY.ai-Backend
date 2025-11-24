# Quick Start - Admin Panel

## Start Both Services

### Terminal 1: Backend API
```bash
cd backend
npm run dev
```
✅ Backend API running on: **http://localhost:5000**

### Terminal 2: Admin Panel
```bash
cd backend/admin-panel
npm run dev
```
✅ Admin panel running on: **http://localhost:5001**

## Or Use Scripts

### Windows
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd backend
start-admin.bat
```

### macOS/Linux
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd backend
./start-admin.sh
```

## Login to Admin Panel

1. Open browser: **http://localhost:5001**
2. Login with:
   - **Email**: admin@example.com
   - **Password**: StrongPass123

## That's It!

You now have:
- ✅ Backend API on port 5000
- ✅ Admin panel on port 5001
- ✅ Full admin dashboard with all features

See [ADMIN_PANEL_SETUP.md](../ADMIN_PANEL_SETUP.md) for complete documentation.
