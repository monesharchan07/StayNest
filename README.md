# StayNest — Property Rental & Booking Platform

StayNest is a full-featured property rental and booking web application. It connects guests looking for accommodations with hosts managing properties, supported by an administrative dashboard for platform oversight.

---

## Architecture Overview

- **Backend:** PHP 8.x with PDO (MySQL/MariaDB), RESTful JSON API endpoints, session-based authentication with role verification, and CORS support.
  - Base API URL: `http://localhost:8099`
- **Frontend:** React 19 + Vite + React Router 7 with modular components, responsive vanilla CSS styling, and client-side routing.
  - Application URL: `http://localhost:3000`
- **Database:** MySQL / MariaDB (`staynest_db`), relational schema with foreign key constraints, check constraints, database views, and automated triggers.

---

## Project Structure

```text
StayNest/
├── backend/
│   ├── api/
│   │   ├── admin/             # Admin endpoints (users, properties, bookings, payments, reviews, status)
│   │   ├── auth/              # Auth endpoints (login, register, logout)
│   │   ├── availability/      # Availability check, add, delete
│   │   ├── bookings/          # Booking creation, details, list, cancellation
│   │   ├── host/              # Host endpoints (dashboard, properties, bookings, status)
│   │   ├── payments/          # Payment processing and details
│   │   ├── properties/        # Property listing, search, details, create, update, delete
│   │   ├── reviews/           # Review creation and listing by property
│   │   └── test/              # Database connectivity test endpoint
│   ├── config/
│   │   └── database.php       # Singleton PDO database connector with .env loader
│   ├── includes/
│   │   ├── auth.php           # Session and authorization helpers
│   │   ├── availability.php   # Availability calculations
│   │   ├── properties.php     # Property helpers
│   │   ├── response.php       # Standardized JSON response formatting
│   │   └── validation.php     # Input sanitation and validation
│   ├── logs/                  # Application runtime logs (git-ignored)
│   ├── uploads/               # Property image uploads
│   └── .env.example           # Database configuration template
│
├── frontend/
│   ├── public/                # Public assets and icons
│   ├── src/
│   │   ├── assets/            # Static imagery and logos
│   │   ├── components/        # Reusable UI components (Navbar, Footer, Cards, Gallery, Filters)
│   │   ├── context/           # React Context (AuthContext)
│   │   ├── data/              # Mock fallback and reference datasets
│   │   ├── pages/             # Route views (Home, Search, Property, Bookings, Host, Admin, Auth)
│   │   ├── services/          # API service modules connecting to http://localhost:8099
│   │   ├── styles/            # Global design tokens and typography
│   │   ├── utils/             # Helper utilities and formatters
│   │   ├── App.jsx            # Main route definition
│   │   └── main.jsx           # React DOM root mounting
│   ├── package.json           # Dependencies and scripts
│   ├── package-lock.json      # Dependency lockfile
│   └── vite.config.js         # Vite configuration (port 3000)
│
├── database/
│   └── staynest_db.sql        # Complete verified database dump
│
├── README.md                  # Comprehensive setup and user guide
└── .gitignore                 # Exclusion rules for secrets, builds, and dependencies
```

---

## Prerequisites & Requirements

Ensure the following tools are installed on your machine before running StayNest:

1. **XAMPP / WampServer / LAMP Stack:**
   - **Apache** (Web server)
   - **MySQL / MariaDB** (Database engine)
   - **PHP 8.0 or higher** (with `pdo_mysql` and `mbstring` extensions enabled)
2. **Node.js & npm:**
   - Node.js `v18.x` or `v20.x` or later
   - npm `v9.x` or later
3. **Git:**
   - Git CLI installed and configured

---

## Step-by-Step Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/StayNest.git
cd StayNest
```

---

### 2. Database Setup

1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open your browser and navigate to **phpMyAdmin**:
   - URL: `http://localhost/phpmyadmin`
3. Create the database:
   - Click on **New** in the left sidebar.
   - Enter Database name: `staynest_db`
   - Select Collation: `utf8mb4_unicode_ci` (or `utf8mb4_general_ci`)
   - Click **Create**.
4. Import the schema and seed data:
   - Select the `staynest_db` database in phpMyAdmin.
   - Click the **Import** tab at the top.
   - Click **Browse / Choose File** and select `database/staynest_db.sql` from the project folder.
   - Click **Import** at the bottom of the page.
5. Alternatively, import via MySQL CLI / PowerShell:
   ```bash
   mysql -u root -p staynest_db < database/staynest_db.sql
   ```

> **Verified Baseline Data State:**
> - Users: 7 accounts (Guests, Hosts, Admin)
> - Locations: 5 destinations (Chennai, Bengaluru, Goa, Kochi, Hyderabad)
> - Properties: 5 listings
> - Amenities: 10 amenities
> - Property Amenities: 31 mapping relations
> - Property Images: 9 verified gallery items
> - Availability: 6 date ranges
> - Bookings: 4 verified reservations (IDs 1, 2, 3, 4; `AUTO_INCREMENT = 5`)
> - Payments: 4 verified payment records (IDs 1, 2, 3, 4; `AUTO_INCREMENT = 5`)
> - Reviews: 2 verified reviews

---

### 3. Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create your local environment configuration by copying `.env.example`:
   - On Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - On Linux / macOS / Bash:
     ```bash
     cp .env.example .env
     ```
3. Edit `backend/.env` with your local MySQL credentials:
   ```ini
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASS=
   DB_NAME=staynest_db
   DB_CHARSET=utf8mb4
   ```
   *(Note: Leave `DB_PASS=` blank if your local XAMPP root user does not have a password).*

4. Start the PHP built-in server on port **8099**:
   ```bash
   php -S localhost:8099
   ```
   The backend API is now live at: `http://localhost:8099`

5. Test connectivity:
   Open `http://localhost:8099/api/test/db_test.php` in your browser. You should receive:
   ```json
   {"success": true, "message": "Database connection successful"}
   ```

---

### 4. Frontend Setup

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser:
   ```text
   http://localhost:3000/
   ```

---

## User Roles & Credentials

StayNest includes pre-seeded user accounts for testing and demonstration:

| Role | Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **GUEST** | Arun Kumar | `arun@staynest.com` | `guest123` | Search, view listings, book stays, make payments, submit reviews, view booking history |
| **GUEST** | Priya Sharma | `priya@staynest.com` | `guest123` | Search, book properties, manage personal bookings |
| **HOST** | Rahul Mehta | `rahul@staynest.com` | `host123` | Host dashboard, view bookings for properties, manage listings, confirm/update reservations |
| **HOST** | Sneha Reddy | `sneha@staynest.com` | `host123` | Host dashboard, manage properties in Goa and Kochi |
| **ADMIN** | StayNest Admin | `admin@staynest.com` | `admin123` | Admin dashboard, manage all platform users, view all payments & bookings, toggle property status |

*(You can also register a brand new account as a Guest or Host directly from the `/register` page).*

---

## Application Features & Flow

### 1. Authentication
- User registration with name, email, phone, password, and role selection (`GUEST` or `HOST`).
- Password hashing with PHP's `PASSWORD_BCRYPT`.
- Session-based authentication stored in PHP sessions with secure cookies (`credentials: 'include'`).

### 2. Property Browsing & Search
- Location-based filtering across Chennai, Bengaluru, Goa, Kochi, and Hyderabad.
- Filter by check-in / check-out dates, guest count, price range (Min/Max), and property types (`APARTMENT`, `HOUSE`, `VILLA`, `ROOM`, `COTTAGE`).
- Dynamic search bar and interactive filter panels.

### 3. Property Details & Availability
- High-resolution image galleries with cover and thumbnail navigation.
- Detailed listing descriptions, host credentials, room specifications, and amenity icons.
- Availability calendar checking against booked dates and blocked ranges.

### 4. Booking & Reservation Management
- Interactive booking calculation with automatic duration (nights) and total cost computation.
- Real-time overlap prevention ensuring properties cannot be double-booked.
- Guests can view all active and past bookings under **My Bookings** with status badges (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).

### 5. Payment Simulation
- Mock checkout supporting multiple payment methods (`UPI`, `CARD`, `NET_BANKING`).
- Unique transaction ID generation (`TXN-SN-xxxxx`).
- Automated MySQL trigger (`trg_payment_success_confirms_booking`) automatically updates the associated booking to `CONFIRMED` upon successful payment.

### 6. Review & Rating System
- 5-star rating system with written guest feedback.
- Reviews displayed dynamically on property listing pages with average rating calculation.

### 7. Host Dashboard (`/host`)
- Performance metrics: total listings, active bookings, total revenue, and occupancy.
- Property management: add new listings, toggle availability dates.
- Reservation actions: approve or update guest booking statuses.

### 8. Admin Dashboard (`/admin`)
- Platform-wide statistics: total users, active listings, gross bookings volume, and total revenue.
- Comprehensive management tables for Users, Properties, Bookings, Payments, and Reviews.
- Status toggle: approve, activate, or deactivate property listings platform-wide.

---

## Troubleshooting

### 1. MySQL Server Not Running
- **Symptom:** Connection refused or PDO exception (`SQLSTATE[HY000] [2002]`).
- **Solution:**
  1. Open the XAMPP Control Panel and check that MySQL is started (green indicator).
  2. If MySQL fails to start, verify that port `3306` is not occupied by another MySQL service (e.g., a standalone MySQL 8.0 installation).
  3. If your MySQL runs on a custom port (such as `3307`), update `DB_PORT=3307` in `backend/.env`.

### 2. Apache / PHP Command Not Found
- **Symptom:** `php : The term 'php' is not recognized as the name of a cmdlet...`
- **Solution:**
  1. Add the PHP executable directory to your system's PATH environment variable. In standard XAMPP, this is `C:\xampp\php`.
  2. Alternatively, invoke PHP using the full path:
     ```powershell
     C:\xampp\php\php.exe -S localhost:8099
     ```

### 3. Port 8099 Already in Use
- **Symptom:** `Failed to listen on localhost:8099 (reason: ...)`
- **Solution:**
  - On Windows PowerShell, find and terminate the process holding port 8099:
    ```powershell
    Get-NetTCPConnection -LocalPort 8099 -ErrorAction SilentlyContinue | Select-Object OwningProcess
    Stop-Process -Id <OwningProcessId> -Force
    ```
  - On Linux / macOS:
    ```bash
    lsof -i :8099
    kill -9 <PID>
    ```

### 4. npm install Errors
- **Symptom:** Dependency resolution errors or permission issues.
- **Solution:**
  1. Verify you are using Node.js version 18 or higher: `node -v`.
  2. Delete `node_modules` and re-run:
     ```bash
     cd frontend
     Remove-Item -Recurse -Force node_modules
     npm install
     ```

### 5. CORS or Session Cookie Issues
- **Symptom:** Logging in succeeds but refreshing logs the user out, or `401 Unauthorized` on protected endpoints.
- **Solution:**
  1. Ensure the frontend is running on `http://localhost:3000` and backend on `http://localhost:8099`.
  2. Check that the backend `api/` endpoints send standard CORS headers with `Access-Control-Allow-Credentials: true` and `Access-Control-Allow-Origin: http://localhost:3000`.
  3. Ensure your browser is not blocking third-party/local cookies on `localhost`.

---

## Security Guidelines

- **Environment Credentials:** Never commit your actual `backend/.env` file. Keep `.env` listed in `.gitignore` at all times.
- **Passwords:** All passwords stored in `staynest_db` are hashed using bcrypt.
- **Input Sanitization:** Backend endpoints utilize PDO prepared statements to guard against SQL injection, alongside input validation helpers.

---

## License

This project is created for educational and portfolio demonstration purposes. All rights reserved.
