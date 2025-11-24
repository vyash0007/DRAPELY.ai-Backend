/**
 * Admin authentication utilities
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE = 'admin-session';

/**
 * Check if admin is authenticated
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE);
  return !!token?.value;
}

/**
 * Get admin session token
 */
export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
}

/**
 * Set admin session token
 */
export async function setAdminToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear admin session
 */
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Require admin authentication - redirect to login if not authenticated
 */
export async function requireAdminAuth() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect('/login');
  }
}

/**
 * Redirect to dashboard if already authenticated
 */
export async function redirectIfAuthenticated() {
  const isAuthenticated = await isAdminAuthenticated();
  if (isAuthenticated) {
    redirect('/dashboard');
  }
}
