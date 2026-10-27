# StayNest — Online Accommodation Rental & Booking System
> **Database Systems (BACSE202) Mini-Project • Frontend Application**

StayNest is an Airbnb-inspired accommodation rental and booking platform built with **React**, **Vite**, **React Router**, and vanilla **CSS with modern design variables**. It aligns with the relational database schema, entities, and business rules outlined in `Staynest.pdf`.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js** (v18+ or v20+) and **npm**

### 2. Setup & Installation
```bash
# Navigate to the staynest directory
cd staynest

# Install dependencies (React 19, React Router 7, Vite)
npm install

# Start the local development server
npm run dev
```

The application will be live at:
```
http://localhost:3000/
```

### 3. Build for Production
```bash
npm run build
```
Creates an optimized, minified production bundle in `dist/`.

---

## 🧭 Implemented Routes

| Route | Page | Key Features |
|---|---|---|
| `/` | **HomePage** | Hero search bar, popular destinations (Goa, Manali, Bengaluru, Udaipur), category filter pills, property listings grid, Host CTA banner |
| `/search` | **SearchPage** | Advanced filter panel (price range, property type, guest rating, amenities), sorting (price, rating, date), search results grid |
| `/property/:id` | **PropertyPage** | 5-photo mosaic gallery + modal lightbox, host details, room specifications, description, amenity icons, reviews with rating summary, and sticky booking card |
| `/my-bookings` | **MyBookingsPage** | Guest reservation history, booking status badges, cancellation action, and review submission for completed bookings |
| `/host/dashboard` | **HostDashboard** | Host stats (derived revenue, total listings, bookings, portfolio rating), properties inventory with status tags, and received reservations table |
| `/host/properties/new` | **AddPropertyPage** | Form for listing new stays (property details, location entity, amenities checkboxes, photo preview) |
| `/admin/dashboard` | **AdminDashboard** | Platform governance: gross transaction volume, registered users registry, property status activation/deactivation, and bookings/payment audit |
| `/login` | **LoginPage** | Form validation with ⚡ **Quick Demo Buttons** to instantly log in as Guest, Host, or Admin |
| `/register` | **RegisterPage** | Registration form with role selection (Guest / Host), unique email constraint, and phone validation |

---

## 👥 Simulated Roles & Demo Switcher

The top navigation bar contains a prominent **Role Switcher pill** (`Role: GUEST` / `Role: HOST` / `Role: ADMIN`):
- **Guest (`Arjun Mehta`)**: Search stays, select dates, calculate prices, simulate reservations with atomic payment, view booking history, and review completed stays.
- **Host (`Priya Sharma`)**: Manage listings, view received bookings, track derived revenue, and publish new accommodations.
- **Admin (`Admin User`)**: Review platform metrics, approve/deactivate properties, inspect the `USERS` registry, and audit bookings and payment transactions.

---

## 🗄️ Relational Database Alignment (from `Staynest.pdf`)

The frontend separates UI components, mock data, and data access through a modular service layer (`src/services/`):

| Schema Entity | Frontend Representation | Service Method |
|---|---|---|
| **USERS** | `src/data/users.js` | `userService.js` (`loginUser`, `registerUser`, `getAllUsersAdmin`) |
| **PROPERTY** | `src/data/properties.js` | `propertyService.js` (`getProperties`, `getPropertyById`, `createProperty`, `updatePropertyStatus`) |
| **LOCATION** | Nested in property object | Stored via `createProperty` (`address`, `city`, `state`, `country`, `lat`, `long`) |
| **AMENITY** | `src/data/amenities.js` | Populated in property details and selectable in property creation |
| **PROPERTY_AMENITY** | `amenityIds` array in properties | M:N relationship handled cleanly |
| **PROPERTY_IMAGE** | `images` array with `isPrimary` | Displayed in PropertyCard and 5-photo mosaic `ImageGallery` |
| **BOOKING** | `src/data/bookings.js` | `bookingService.js` (`createBooking`, `cancelBooking`, `getBookingsByUser`) |
| **PAYMENT** | Nested in booking transaction | Simulated methods (`UPI`, `CARD`, `NET_BANKING`) and status (`SUCCESS`, `PENDING`, `FAILED`) |
| **REVIEW** | `src/data/reviews.js` | `reviewService.js` (`getReviewsByProperty`, `createReview`) |

---

## 📜 Business Rules Enforced

1. **Rule #4**: Only `ACTIVE` properties appear in guest search results.
2. **Rule #7**: A booking's check-out date must be later than its check-in date, and guests cannot exceed `maxGuests`.
3. **Rule #9**: Total amount is automatically calculated: `number of nights × price per night + 10% StayNest service fee`.
4. **Rule #10**: Cancelling a booking updates status to `CANCELLED` and frees up dates.
5. **Rule #11 & #12**: Booking creation and payment are handled together as an atomic simulated transaction.
6. **Rule #13**: Reviews are strictly restricted to valid, `COMPLETED` bookings with a 1 to 5 star rating.
7. **Rule #14 & #15**: Platform statistics (host revenue, average ratings, total volume) are **derived dynamically** from stored data rather than being redundantly duplicated.

---

## 🔌 Teammate Backend Integration Guide

When your teammate's MySQL REST API is ready, replace the mock calls inside `src/services/`:

| Method | Endpoint | Required Body / Query Parameters |
|---|---|---|
| `GET` | `/api/properties` | `?destination=...&propertyType=...&minPrice=...&maxPrice=...&minRating=...` |
| `GET` | `/api/properties/:id` | Returns property with joined `location`, `amenities`, and `images` |
| `POST` | `/api/properties` | `{ name, description, propertyType, pricePerNight, maxGuests, bedrooms, bathrooms, location, amenityIds, images }` |
| `PATCH` | `/api/properties/:id/status` | `{ status: "ACTIVE" \| "INACTIVE" }` |
| `GET` | `/api/bookings` | Returns authenticated user's bookings with joined payments |
| `POST` | `/api/bookings` | `{ propertyId, checkIn, checkOut, guests, paymentMethod }` (Processed atomically in a MySQL transaction) |
| `PATCH` | `/api/bookings/:id/cancel` | Updates booking status to `CANCELLED` |
| `POST` | `/api/reviews` | `{ propertyId, bookingId, rating, comment }` |
| `POST` | `/api/auth/login` | `{ email, password }` |
| `POST` | `/api/auth/register` | `{ name, email, phone, role, password }` |
| `GET` | `/api/admin/overview` | Platform-wide counts, users, and audit records |

---

## 🎨 Design Tokens & Aesthetics
- **Accent**: Emerald Teal (`#0F766E` / `#14B8A6`)
- **Background**: Soft warm neutral (`#FAFAF8`)
- **Surface**: Pure White (`#FFFFFF`) with subtle border shadows
- **Typography**: Google Fonts Inter (`300`, `400`, `500`, `600`, `700`, `800`)
- **Responsive**: Full desktop, tablet, and mobile breakpoints
