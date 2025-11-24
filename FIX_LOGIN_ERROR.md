# Fix: Login Error "An unexpected error occurred"

## Problem
The admin panel login shows "An unexpected error occurred" when trying to sign in.

## Root Cause
**CORS (Cross-Origin Resource Sharing) issue** - The backend was only allowing requests from `http://localhost:3000` (frontend), but the admin panel runs on `http://localhost:5001`.

## Solution Applied ✅

I've updated the backend CORS configuration to allow both:
- `http://localhost:3000` (frontend)
- `http://localhost:5001` (admin panel)

**File Updated**: `backend/src/server.ts`

## Steps to Fix

### 1. Restart Backend Server

**Stop the current backend server** (Ctrl+C in the terminal) and restart it:

```bash
cd backend
npm run dev
```

This will load the new CORS configuration.

### 2. Restart Admin Panel (Optional)

If the admin panel is running, you can keep it running or restart it:

```bash
# If using scripts:
cd backend
start-admin.bat  # Windows
./start-admin.sh # macOS/Linux

# Or manually:
cd backend/admin-panel
npm run dev
```

### 3. Clear Browser Cache

1. Open browser DevTools (F12)
2. Go to "Application" or "Storage" tab
3. Clear all storage for `localhost:5001`:
   - Local Storage
   - Cookies
   - Session Storage

### 4. Try Login Again

1. Navigate to **http://localhost:5001**
2. Enter credentials:
   - Email: `admin@example.com`
   - Password: `StrongPass123`
3. Click "Sign In"

**Result**: ✅ Should successfully log in and redirect to dashboard

## Verification

### Test API Directly

You can verify the API is working:

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongPass123"}'
```

**Expected Response**:
```json
{
  "success": true,
  "token": "admin-session-token",
  "email": "admin@example.com"
}
```

### Check Browser Console

1. Open DevTools (F12)
2. Go to "Console" tab
3. Try logging in
4. Look for error messages

**Before Fix**: You would see CORS error like:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/admin/auth/login'
from origin 'http://localhost:5001' has been blocked by CORS policy
```

**After Fix**: No CORS errors, successful login

## Additional Fixes Applied

### 1. Fixed Route Redirects
Updated all routes to use `/dashboard` instead of `/admin/dashboard` since this is a standalone app.

**Files Updated**:
- `backend/admin-panel/src/components/admin/login-form.tsx`
- `backend/admin-panel/src/app/login/page.tsx`
- `backend/admin-panel/src/components/admin/sidebar.tsx`

### 2. Improved Error Handling
Enhanced the login form to show more descriptive error messages.

### 3. Updated API Client
Fixed token management in `backend/admin-panel/src/services/api.ts`:
- Stores token in localStorage and cookie
- Includes token in all API requests
- Handles 401 errors by redirecting to login

## Production Setup

For production, update the CORS configuration in `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://your-frontend.com',
    process.env.ADMIN_PANEL_URL || 'https://admin.your-site.com',
  ],
  credentials: true,
}));
```

Add to your production `.env`:
```env
FRONTEND_URL=https://your-frontend.com
ADMIN_PANEL_URL=https://admin.your-site.com
```

## Still Having Issues?

### Check Backend is Running
```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Check Admin Panel is Running
Navigate to: http://localhost:5001

Expected: Login page should load

### Check Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Try logging in
4. Look for the `/api/admin/auth/login` request
5. Check:
   - Status code (should be 200)
   - Response body
   - Any error messages

### Common Issues

**Issue**: `ERR_CONNECTION_REFUSED`
**Solution**: Backend is not running. Start it with `npm run dev`

**Issue**: `404 Not Found`
**Solution**: Wrong API URL. Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Issue**: `CORS error`
**Solution**: Restart backend server to load new CORS config

**Issue**: `401 Unauthorized`
**Solution**: Wrong credentials. Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`

## Summary

The login error was caused by a **CORS configuration issue**. The fix has been applied and you just need to:

1. ✅ **Restart the backend server** (`npm run dev` in `backend/`)
2. ✅ **Clear browser cache** for localhost:5001
3. ✅ **Try logging in again**

The admin panel should now work perfectly! 🎉
