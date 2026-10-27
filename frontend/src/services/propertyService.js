/**
 * Property Service - Data access layer
 * Integrates directly with real StayNest PHP backend REST API endpoints:
 * - GET  /api/properties/list.php
 * - GET  /api/properties/search.php
 * - GET  /api/properties/details.php
 * - POST /api/properties/create.php
 * - PUT  /api/properties/update.php
 * - DELETE /api/properties/delete.php
 */

import { updatePropertyStatus as updateAdminStatus } from './adminService';

const API_BASE = 'http://localhost:8099';

// Location name mapping to known database location_ids (1-5)
const LOCATION_NAME_TO_ID = {
  chennai: 1,
  bengaluru: 2,
  bangalore: 2,
  goa: 3,
  kochi: 4,
  cochin: 4,
  hyderabad: 5,
};

// Amenity icon dictionary for frontend UI
const AMENITY_ICONS = {
  1: '📶',
  2: '❄️',
  3: '🍳',
  4: '🅿️',
  5: '🏊',
  6: '📺',
  7: '🧺',
  8: '🚿',
  9: '🌅',
  10: '🐾',
  11: '💪',
  12: '🔒',
  13: '🔋',
  14: '🥐',
  15: '💻',
};

const AMENITY_NAME_ICONS = {
  wifi: '📶',
  'air conditioning': '❄️',
  kitchen: '🍳',
  parking: '🅿️',
  pool: '🏊',
  tv: '📺',
  'washing machine': '🧺',
  'hot water': '🚿',
  balcony: '🌅',
  'pet friendly': '🐾',
  gym: '💪',
  security: '🔒',
  'power backup': '🔋',
  breakfast: '🥐',
  workspace: '💻',
};

// High-resolution fallback imagery tailored per property type
const FALLBACK_TYPE_IMAGES = {
  APARTMENT: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
  ],
  HOUSE: [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80',
  ],
  VILLA: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
  ],
  COTTAGE: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80',
  ],
  ROOM: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&auto=format&fit=crop&q=80',
  ],
};

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Universal JSON fetch helper with credentialed session cookies and comprehensive error mapping
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
    });
  } catch {
    throw new ApiError('Unable to connect to the property server. Please check your network connection.', 0);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(`Unexpected server response (HTTP ${response.status}).`, response.status);
  }

  if (!response.ok || payload?.success === false) {
    const errorMsg = payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, payload);
  }

  return payload;
}

/**
 * Resolve displayable image URL (substitutes placeholder example.com domains)
 */
function resolveImageUrl(url, propertyType = 'APARTMENT', index = 0) {
  if (!url || url.includes('example.com')) {
    const typeKey = (propertyType || 'APARTMENT').toUpperCase();
    const list = FALLBACK_TYPE_IMAGES[typeKey] || FALLBACK_TYPE_IMAGES.APARTMENT;
    return list[index % list.length];
  }
  return url;
}

/**
 * Normalize image array for components
 */
function normalizeImages(rawImages, primaryImageUrl, propertyType, propertyName) {
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    return rawImages.map((img, idx) => ({
      id: img.image_id ?? img.id ?? (idx + 1),
      url: resolveImageUrl(img.image_url ?? img.url, propertyType, idx),
      isPrimary: Boolean(img.is_primary ?? img.isPrimary ?? (idx === 0)),
      caption: img.caption || `${propertyName} - Photo ${idx + 1}`,
    }));
  }

  if (primaryImageUrl) {
    const typeKey = (propertyType || 'APARTMENT').toUpperCase();
    const list = FALLBACK_TYPE_IMAGES[typeKey] || FALLBACK_TYPE_IMAGES.APARTMENT;
    return [
      {
        id: 1,
        url: resolveImageUrl(primaryImageUrl, propertyType, 0),
        isPrimary: true,
        caption: `${propertyName} - Main View`,
      },
      {
        id: 2,
        url: list[1 % list.length],
        isPrimary: false,
        caption: `${propertyName} - Living Area`,
      },
      {
        id: 3,
        url: list[2 % list.length],
        isPrimary: false,
        caption: `${propertyName} - Suite Bedroom`,
      },
    ];
  }

  const typeKey = (propertyType || 'APARTMENT').toUpperCase();
  const list = FALLBACK_TYPE_IMAGES[typeKey] || FALLBACK_TYPE_IMAGES.APARTMENT;
  return list.map((url, idx) => ({
    id: idx + 1,
    url,
    isPrimary: idx === 0,
    caption: `${propertyName} - Photo ${idx + 1}`,
  }));
}

/**
 * Normalize an amenity object
 */
function normalizeAmenity(a) {
  if (!a) return null;
  const id = Number(a.amenity_id ?? a.id);
  const name = a.amenity_name ?? a.name ?? '';
  const description = a.description ?? '';
  const icon = AMENITY_ICONS[id] || AMENITY_NAME_ICONS[name.toLowerCase()] || a.icon || '✨';
  return { id, name, description, icon };
}

/**
 * Normalize raw backend property record to match frontend component model
 */
export function normalizeProperty(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = Number(raw.property_id ?? raw.id);
  const name = raw.property_name ?? raw.name ?? raw.title ?? '';
  const rawType = (raw.property_type ?? raw.propertyType ?? 'APARTMENT').toUpperCase();
  // Standardize propertyType to Title Case: 'Apartment', 'Villa', 'House', 'Cottage', 'Room'
  const propertyType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
  const description = raw.description ?? '';
  const pricePerNight = Number(raw.price_per_night ?? raw.pricePerNight ?? 0);
  const maxGuests = Number(raw.max_guests ?? raw.maxGuests ?? 1);
  const bedrooms = Number(raw.bedrooms ?? 1);
  const bathrooms = Number(raw.bathrooms ?? 1);
  const status = raw.status ?? 'ACTIVE';
  const createdAt = raw.created_at ?? raw.createdAt ?? '';

  const locationRaw = raw.location || {};
  const location = {
    id: locationRaw.location_id ?? locationRaw.id ?? null,
    city: locationRaw.city ?? '',
    state: locationRaw.state ?? '',
    country: locationRaw.country ?? 'India',
    address: locationRaw.address ?? '',
    latitude: locationRaw.latitude !== null && locationRaw.latitude !== undefined ? Number(locationRaw.latitude) : null,
    longitude: locationRaw.longitude !== null && locationRaw.longitude !== undefined ? Number(locationRaw.longitude) : null,
  };

  const hostRaw = raw.host || {};
  const hostId = hostRaw.host_id ?? hostRaw.id ?? raw.host_id ?? raw.hostId ?? null;
  const hostName = hostRaw.name ?? raw.host_name ?? raw.hostName ?? 'StayNest Host';
  const hostAvatar =
    hostRaw.avatar ??
    raw.host_avatar ??
    raw.hostAvatar ??
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face';

  const reviewSummary = raw.review_summary || {};
  const reviewCount = Number(reviewSummary.review_count ?? raw.review_count ?? raw.reviewCount ?? 0);
  const rawAvg = reviewSummary.average_rating ?? raw.average_rating ?? raw.averageRating;
  const averageRating = rawAvg !== null && rawAvg !== undefined ? Number(rawAvg) : 0;

  const images = normalizeImages(raw.images, raw.primary_image ?? raw.primaryImage, propertyType, name);

  const amenities = Array.isArray(raw.amenities)
    ? raw.amenities.map(normalizeAmenity).filter(Boolean)
    : [];

  const amenityIds = amenities.map((a) => a.id);

  return {
    id,
    name,
    description,
    propertyType,
    pricePerNight,
    maxGuests,
    bedrooms,
    bathrooms,
    status,
    createdAt,
    location,
    hostId,
    hostName,
    hostAvatar,
    averageRating,
    reviewCount,
    images,
    amenities,
    amenityIds,
    availability: raw.availability || [],
    reviewSummary: {
      averageRating,
      reviewCount,
      latestReviews: reviewSummary.latest_reviews || [],
    },
  };
}

/**
 * Resolve existing database location_id from property payload
 */
function resolveLocationId(propertyData) {
  if (propertyData.location_id) {
    return Number(propertyData.location_id);
  }
  if (propertyData.location?.location_id) {
    return Number(propertyData.location.location_id);
  }
  if (propertyData.location?.id) {
    return Number(propertyData.location.id);
  }

  const city = (propertyData.city || propertyData.location?.city || '').trim().toLowerCase();
  if (city && LOCATION_NAME_TO_ID[city]) {
    return LOCATION_NAME_TO_ID[city];
  }

  const state = (propertyData.state || propertyData.location?.state || '').trim().toLowerCase();
  if (state.includes('tamil nadu')) return 1;
  if (state.includes('karnataka')) return 2;
  if (state.includes('goa')) return 3;
  if (state.includes('kerala')) return 4;
  if (state.includes('telangana')) return 5;

  // Default to Goa (3) if not matched
  return 3;
}

/**
 * Build backend query parameters from frontend filter state
 */
function buildQueryParams(filters = {}) {
  const params = new URLSearchParams();

  const destination = filters.destination || filters.location;
  if (destination && destination.trim()) {
    params.set('location', destination.trim());
  }

  const type = filters.propertyType || filters.property_type;
  if (type && type !== 'ALL') {
    params.set('property_type', type.toUpperCase());
  }

  const minPrice = filters.minPrice ?? filters.min_price;
  if (minPrice !== undefined && minPrice !== '') {
    params.set('min_price', minPrice.toString());
  }

  const maxPrice = filters.maxPrice ?? filters.max_price;
  if (maxPrice !== undefined && maxPrice !== '') {
    params.set('max_price', maxPrice.toString());
  }

  const guests = filters.guests;
  if (guests && Number(guests) > 0) {
    params.set('guests', Number(guests).toString());
  }

  if (filters.limit) {
    params.set('limit', filters.limit.toString());
  }
  if (filters.offset) {
    params.set('offset', filters.offset.toString());
  }

  return params;
}

/**
 * Apply client-side sorting and secondary filters
 */
function applyClientFiltersAndSort(properties, filters = {}) {
  let results = [...properties];

  // Min rating filter
  if (filters.minRating && Number(filters.minRating) > 0) {
    const minRating = Number(filters.minRating);
    results = results.filter((p) => (p.averageRating || 0) >= minRating);
  }

  // Amenities filter: match if property contains all selected amenity IDs
  if (filters.amenities && filters.amenities.length > 0) {
    results = results.filter((p) => {
      if (!p.amenityIds || p.amenityIds.length === 0) return true;
      return filters.amenities.every((amenityId) => p.amenityIds.includes(Number(amenityId)));
    });
  }

  // Sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price_asc':
        results.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price_desc':
        results.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating_desc':
        results.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }
  }

  return results;
}

/**
 * 1. PUBLIC PROPERTY LIST
 * GET /api/properties/list.php
 */
export async function listProperties(params = {}) {
  const query = buildQueryParams(params).toString();
  const path = query ? `/api/properties/list.php?${query}` : '/api/properties/list.php';
  const payload = await apiRequest(path);
  const rawList = payload?.data?.properties || [];
  const normalized = rawList.map(normalizeProperty).filter(Boolean);
  return applyClientFiltersAndSort(normalized, params);
}

/**
 * 2. PROPERTY SEARCH
 * GET /api/properties/search.php
 */
export async function searchProperties(filters = {}) {
  const query = buildQueryParams(filters).toString();
  const path = query ? `/api/properties/search.php?${query}` : '/api/properties/search.php';
  const payload = await apiRequest(path);
  const rawList = payload?.data?.properties || [];
  const normalized = rawList.map(normalizeProperty).filter(Boolean);
  return applyClientFiltersAndSort(normalized, filters);
}

/**
 * Universal query helper: routes to search.php when criteria present, list.php otherwise
 */
export async function getProperties(filters = {}) {
  const hasSearchCriteria = Boolean(
    (filters.destination && filters.destination.trim()) ||
    (filters.propertyType && filters.propertyType !== 'ALL') ||
    (filters.minPrice !== undefined && filters.minPrice !== '') ||
    (filters.maxPrice !== undefined && filters.maxPrice !== '') ||
    (filters.guests && Number(filters.guests) > 0)
  );

  if (hasSearchCriteria) {
    return searchProperties(filters);
  }
  return listProperties(filters);
}

/**
 * 3. PROPERTY DETAILS
 * GET /api/properties/details.php?id={id}
 */
export async function getPropertyById(id) {
  if (!id) return null;
  try {
    const payload = await apiRequest(`/api/properties/details.php?id=${encodeURIComponent(id)}`);
    return normalizeProperty(payload.data);
  } catch (err) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Host properties query: calls /api/host/properties.php for authenticated hosts,
 * with graceful fallback to public active listings.
 */
export async function getPropertiesByHost(hostId) {
  try {
    const payload = await apiRequest('/api/host/properties.php');
    const rawList = payload?.data?.properties || [];
    return rawList.map(normalizeProperty).filter(Boolean);
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      // Unauthenticated host context: fetch public active properties filtered by hostId
      const all = await listProperties();
      return all.filter((p) => p.hostId === Number(hostId));
    }
    throw err;
  }
}

/**
 * Admin view of all properties
 */
export async function getAllPropertiesAdmin() {
  try {
    const payload = await apiRequest('/api/admin/properties.php');
    const rawList = payload?.data?.properties || [];
    return rawList.map(normalizeProperty).filter(Boolean);
  } catch {
    return listProperties();
  }
}

/**
 * 4. HOST CREATE
 * POST /api/properties/create.php
 * Note: Session host_id is authoritative; never passed or trusted from client.
 */
export async function createProperty(propertyData) {
  const locationId = resolveLocationId(propertyData);

  const rawType = (propertyData.propertyType || propertyData.property_type || 'APARTMENT').toUpperCase();
  const allowedTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'ROOM', 'COTTAGE'];
  const propertyType = allowedTypes.includes(rawType) ? rawType : 'APARTMENT';

  const body = {
    property_name: (propertyData.name || propertyData.property_name || propertyData.title || '').trim(),
    description: propertyData.description ? String(propertyData.description).trim() : null,
    property_type: propertyType,
    price_per_night: Number(propertyData.pricePerNight || propertyData.price_per_night),
    max_guests: Number(propertyData.maxGuests || propertyData.max_guests || 1),
    bedrooms: Number(propertyData.bedrooms ?? 1),
    bathrooms: Number(propertyData.bathrooms ?? 1),
    location_id: locationId,
  };

  const payload = await apiRequest('/api/properties/create.php', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return normalizeProperty(payload.data);
}

/**
 * 5. HOST UPDATE
 * PUT /api/properties/update.php?id={id}
 * Credentials: include
 */
export async function updateProperty(propertyId, propertyData) {
  const body = {};

  if (propertyData.name || propertyData.property_name) {
    body.property_name = (propertyData.name || propertyData.property_name).trim();
  }
  if (propertyData.description !== undefined) {
    body.description = propertyData.description;
  }
  if (propertyData.propertyType || propertyData.property_type) {
    const rawType = (propertyData.propertyType || propertyData.property_type).toUpperCase();
    const allowedTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'ROOM', 'COTTAGE'];
    if (allowedTypes.includes(rawType)) {
      body.property_type = rawType;
    }
  }
  if (propertyData.pricePerNight !== undefined || propertyData.price_per_night !== undefined) {
    body.price_per_night = Number(propertyData.pricePerNight ?? propertyData.price_per_night);
  }
  if (propertyData.maxGuests !== undefined || propertyData.max_guests !== undefined) {
    body.max_guests = Number(propertyData.maxGuests ?? propertyData.max_guests);
  }
  if (propertyData.bedrooms !== undefined) {
    body.bedrooms = Number(propertyData.bedrooms);
  }
  if (propertyData.bathrooms !== undefined) {
    body.bathrooms = Number(propertyData.bathrooms);
  }
  if (propertyData.location_id || propertyData.city) {
    body.location_id = resolveLocationId(propertyData);
  }

  const payload = await apiRequest(`/api/properties/update.php?id=${encodeURIComponent(propertyId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return normalizeProperty(payload.data);
}

/**
 * 6. HOST DELETE
 * DELETE /api/properties/delete.php?id={id}
 * Credentials: include
 */
export async function deleteProperty(propertyId) {
  const payload = await apiRequest(`/api/properties/delete.php?id=${encodeURIComponent(propertyId)}`, {
    method: 'DELETE',
  });
  return payload.data;
}

/**
 * Update property status (Admin action)
 * POST /api/admin/update-property-status.php
 */
export async function updatePropertyStatus(propertyId, newStatus) {
  return updateAdminStatus(propertyId, newStatus);
}
