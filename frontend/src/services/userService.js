/**
 * User Service - Authentication & User Data Layer
 * Login, registration, and logout call the PHP auth APIs.
 */

import { users as initialUsers } from '../data/users';

let usersStore = [...initialUsers];

const API_BASE = 'http://localhost:8099';
const SESSION_KEY = 'staynest_current_user';

function normalizeUser(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const id = data.user_id ?? data.id;
  const email = data.email;
  const role = data.role;

  if (id == null || !email || !role) {
    return null;
  }

  return {
    id,
    name: data.name || '',
    email,
    phone: data.phone || '',
    role,
    createdAt: data.createdAt || data.created_at || '',
    avatar: data.avatar ?? null,
  };
}

async function postAuth(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('Unable to reach the authentication server. Please try again.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Unexpected response from the authentication server.');
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || 'Authentication request failed.');
  }

  return payload;
}

function userFromAuthPayload(payload) {
  const rawUser = payload?.data?.user ?? payload?.data ?? payload?.user;
  const user = normalizeUser(rawUser);
  if (!user) {
    throw new Error('Unexpected response from the authentication server.');
  }
  return user;
}

/**
 * Get currently logged-in user from localStorage (no fake default user).
 */
export function getCurrentUser() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error reading current user session', err);
  }
  return null;
}

/**
 * Set current logged-in user
 */
export function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (err) {
    console.error('Error writing current user session', err);
  }
}

/**
 * Login via POST /api/auth/login.php
 */
export async function loginUser(email, password) {
  const payload = await postAuth('/api/auth/login.php', { email, password });
  const user = userFromAuthPayload(payload);
  setCurrentUser(user);
  return user;
}

/**
 * Register via POST /api/auth/register.php
 */
export async function registerUser({ name, email, phone, role = 'GUEST', password }) {
  const payload = await postAuth('/api/auth/register.php', {
    name,
    email,
    phone,
    role,
    password,
  });
  const rawUser = payload?.data?.user ?? payload?.data ?? payload?.user;
  const user = normalizeUser(rawUser);
  if (!user) {
    return loginUser(email, password);
  }
  setCurrentUser(user);
  return user;
}

/**
 * Logout via POST /api/auth/logout.php
 */
export async function logoutUser() {
  try {
    await postAuth('/api/auth/logout.php');
  } catch {
    // Always clear the local session so the UI can sign out.
  }
  setCurrentUser(null);
  return true;
}

import { getAdminUsers } from './adminService';

/**
 * Get all users (Admin view)
 * Calls GET /api/admin/users.php
 */
export async function getAllUsersAdmin(roleFilter = '') {
  return getAdminUsers(roleFilter);
}
