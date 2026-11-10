# StudySpot Cafe – Group Backend Assessment

Backend REST API for **StudySpot Cafe**, a seat and study carrel booking management system for university students.

Built with **Node.js**, **Express**, and **SQLite**.

---

## 👥 Team Work Distribution

| Member | Focus Area | Status | Deliverables |
|---|---|---|---|
| **Member 1** | Server & Carrels CRUD | ✅ Completed | Express setup, JSON middleware, Carrels REST API, DB interface |
| **Member 2** | Database & Tables | ✅ Completed | SQLite schema (`students`, `carrels`, `bookings`), relations, seeds, query helpers |
| **Member 3 (Current)** | Bookings API & Search | ⏳ Next Up | Booking endpoints, validation, JOIN queries, search filters |
| **Member 4** | Top Carrels & Postman | 📅 Upcoming | GET `/carrels/top`, Postman collection, final report & testing |

---

## 📁 Project Structure

```text
StudySpot-Cafe/
│
├── app.js               # Express app configuration & server listener
├── database.js          # SQLite connection manager, schema DDL, seeds, and query helpers
├── package.json         # Project metadata, dependencies, and test scripts
├── .gitignore           # Ignores node_modules, *.db, and temporary files
├── test-member1.js      # Automated verification suite for Member 1 deliverables
├── test-member2.js      # Automated verification suite for Member 2 deliverables
├── routes/
│   └── carrels.js       # Carrels CRUD REST API endpoints (Member 1)
└── README.md            # Team guide, schema reference, API documentation, and handover notes
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **npm** (v9.x or later)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Run the Server
- **Production mode:**
  ```bash
  npm start
  ```
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```

The server runs at: `http://localhost:3000`

### 4. Run the Verification Suites
- **Run all automated suites (Member 1 & Member 2):**
  ```bash
  npm test
  ```
- **Run Member 1 Verification Suite:**
  ```bash
  npm run test:integration
  ```
- **Run Member 2 Verification Suite:**
  ```bash
  npm run test:member2
  ```

---

## 📡 Carrels API Reference (Member 1)

Base URL: `http://localhost:3000/carrels`

All carrels have the following fields:
- `id` (Integer, Primary Key)
- `name` (String, Required)
- `zone` (String, Required)

### HTTP Status Code Conventions
- `200 OK` – Successful GET, PUT, or DELETE request.
- `201 Created` – Successfully added a new carrel via POST.
- `400 Bad Request` – Missing required fields, empty values, or invalid ID format.
- `404 Not Found` – Requested carrel ID does not exist.
- `500 Internal Server Error` – Unhandled server or database error.

---

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/carrels` | Get all carrels | 200, 500 |
| `GET` | `/carrels/:id` | Get single carrel by ID | 200, 400, 404, 500 |
| `POST` | `/carrels` | Create a new carrel | 201, 400, 500 |
| `PUT` | `/carrels/:id` | Update an existing carrel | 200, 400, 404, 500 |
| `DELETE` | `/carrels/:id` | Delete a carrel by ID | 200, 400, 404, 500 |

---

### Detailed Request & Response Examples

#### 1. GET `/carrels` – Retrieve All Carrels
- **Method:** `GET`
- **URL:** `http://localhost:3000/carrels`
- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Silent Pod A1",
    "zone": "Silent Study"
  },
  {
    "id": 2,
    "name": "Collab Table B3",
    "zone": "Collaborative"
  }
]
```

#### 2. GET `/carrels/:id` – Retrieve Single Carrel
- **Method:** `GET`
- **URL:** `http://localhost:3000/carrels/1`
- **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Silent Pod A1",
  "zone": "Silent Study"
}
```
- **Error Response (400 Bad Request):**
```json
{
  "error": "Invalid carrel ID. ID must be a positive integer."
}
```
- **Error Response (404 Not Found):**
```json
{
  "error": "Carrel with ID 999 not found"
}
```

#### 3. POST `/carrels` – Create New Carrel
- **Method:** `POST`
- **URL:** `http://localhost:3000/carrels`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "name": "Window Desk C4",
  "zone": "Quiet Zone"
}
```
- **Response (201 Created):**
```json
{
  "message": "Carrel created successfully",
  "carrel": {
    "id": 3,
    "name": "Window Desk C4",
    "zone": "Quiet Zone"
  }
}
```
- **Error Response (400 Bad Request - Missing Field):**
```json
{
  "error": "Invalid request body. \"zone\" is required and must be a non-empty string."
}
```

#### 4. PUT `/carrels/:id` – Update a Carrel
- **Method:** `PUT`
- **URL:** `http://localhost:3000/carrels/1`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "name": "Silent Pod A1 (Upgraded)",
  "zone": "Deep Focus"
}
```
- **Response (200 OK):**
```json
{
  "message": "Carrel updated successfully",
  "carrel": {
    "id": 1,
    "name": "Silent Pod A1 (Upgraded)",
    "zone": "Deep Focus"
  }
}
```
- **Error Response (404 Not Found):**
```json
{
  "error": "Carrel with ID 999 not found"
}
```

#### 5. DELETE `/carrels/:id` – Delete a Carrel
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/carrels/1`
- **Response (200 OK):**
```json
{
  "message": "Carrel with ID 1 deleted successfully"
}
```
- **Error Response (404 Not Found):**
```json
{
  "error": "Carrel with ID 999 not found"
}
```

---

---

## 🗄️ Database Architecture & Schema (Member 2)

Member 2 has implemented SQLite database management in `database.js` with full foreign key enforcement and reusable data access functions.

### 1. Database Configuration
- **Database Engine:** SQLite 3 (via `sqlite` and `sqlite3` packages)
- **Database File:** `studyspot.db` (automatically generated at root)
- **Foreign Key Constraints:** Enforced on every connection via `PRAGMA foreign_keys = ON;`
- **Initialisation Hook:** `initializeDatabase()` is automatically called during server bootstrap in `app.js`.

---

### 2. Relational Schema Design

```
+------------------+       1 : N       +-------------------------+       N : 1       +------------------+
|     students     | <---------------- |        bookings         | ----------------> |     carrels      |
+------------------+                   +-------------------------+                   +------------------+
| id (PK, AutoInc) |                   | id (PK, AutoIncrement)  |                   | id (PK, AutoInc) |
| name (TEXT, NN)  |                   | student_id (FK -> st.id)|                   | name (TEXT, NN)  |
| email (TEXT, UNQ)|                   | carrel_id (FK -> ca.id) |                   | zone (TEXT, NN)  |
+------------------+                   | booking_date (TEXT, NN) |                   +------------------+
                                       | booking_time (TEXT)     |
                                       +-------------------------+
```

#### Table Definitions (DDL)

```sql
-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

-- 2. Carrels Table (matches Carrels API contract)
CREATE TABLE IF NOT EXISTS carrels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  zone TEXT NOT NULL
);

-- 3. Bookings Table (with foreign key constraints and cascade actions)
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  carrel_id INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  booking_time TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (carrel_id) REFERENCES carrels(id) ON DELETE CASCADE
);
```

#### Key Relationships & Integrity Rules:
1. **One student can have multiple bookings** (`student_id` in `bookings` references `students(id)`).
2. **One carrel can appear in multiple bookings** (`carrel_id` in `bookings` references `carrels(id)`).
3. **Every booking must reference an existing student and carrel:** Enforced via `NOT NULL` on foreign key columns and active SQLite foreign key pragma. Rejects invalid references with `FOREIGN KEY constraint failed`.
4. **Cascade Deletions (`ON DELETE CASCADE`):** If a student or carrel is deleted, their associated bookings are automatically removed, preventing orphan rows.
5. **Idempotent Seeding:** `initializeDatabase()` checks existing row counts before inserting seed records, avoiding duplicates across restarts.

---

### 3. Reusable Database Query Operations (Available for Team)

Member 2 has exported modular, promise-based query functions from `database.js` ready for Member 3 and Member 4:

#### Students Operations:
- `getAllStudents()` – Returns array of all student records.
- `getStudentById(id)` – Returns single student record or undefined.
- `insertStudent({ name, email })` – Inserts and returns `{ id, name, email }`.

#### Carrels Operations:
- `getAllCarrels()` – Returns array of all carrels.
- `getCarrelById(id)` – Returns single carrel record or undefined.
- `insertCarrel({ id, name, zone })` – Inserts carrel (supports optional explicit ID) and returns `{ id, name, zone }`.
- `updateCarrel(id, { name, zone })` – Updates carrel and returns updated object or null.
- `deleteCarrel(id)` – Deletes carrel and returns boolean.

#### Bookings Operations:
- `getAllBookings()` – Returns array of all bookings.
- `getBookingById(id)` – Returns single booking record or undefined.
- `insertBooking({ student_id, carrel_id, booking_date, booking_time })` – Inserts and returns created booking object.
- `deleteBooking(id)` – Deletes booking by ID.

#### SQL JOIN Query & Helpers (Ready for Member 3):
- `BOOKINGS_JOIN_QUERY` – Exported SQL query string joining `bookings`, `students`, and `carrels`:
  ```sql
  SELECT 
    bookings.id,
    bookings.booking_date,
    bookings.booking_time,
    bookings.student_id,
    students.name AS student_name,
    students.email AS student_email,
    bookings.carrel_id,
    carrels.name AS carrel_name,
    carrels.zone AS carrel_zone
  FROM bookings
  JOIN students ON bookings.student_id = students.id
  JOIN carrels ON bookings.carrel_id = carrels.id
  ```
- `getAllBookingsWithDetails()` – Executes the JOIN query and returns all detailed booking records.
- `getBookingWithDetailsById(id)` – Executes the JOIN query for a specific booking ID.
- `getBookingsByStudentId(studentId)` – Filters joined bookings by student.
- `getBookingsByCarrelId(carrelId)` – Filters joined bookings by carrel.

---

## 🤝 Handover Instructions for Member 3 (Bookings APIs & Validation)

Member 2 has completed the database schema, table relations, constraints, seed records, and prepared JOIN queries.

### How Member 3 should use `database.js`:
```javascript
const {
  getDatabase,
  getAllBookings,
  getBookingById,
  insertBooking,
  getAllBookingsWithDetails,
  getBookingWithDetailsById,
  BOOKINGS_JOIN_QUERY,
} = require('../database');
```

### What Member 3 needs to implement:
1. Create `routes/bookings.js` and mount it at `/bookings` in `app.js`.
2. Implement Booking REST API endpoints:
   - `GET /bookings` – Retrieve all bookings (or detailed bookings).
   - `GET /bookings/:id` – Retrieve a single booking.
   - `POST /bookings` – Create a new booking (validate student exists, carrel exists, date format).
   - `GET /bookings/details` or JOIN endpoint – Utilize `getAllBookingsWithDetails()` or `BOOKINGS_JOIN_QUERY`.
   - Search/filter functionality (e.g. by student, carrel, date).

---

## 🔒 Boundaries Respected
- **Express routes maintained:** Member 1's `/carrels` routes and validation were not overwritten.
- **No Booking JOIN Express endpoint created:** Reserved for Member 3.
- **No Top 3 carrels endpoint created:** Reserved for Member 4.
- **Single database connection:** All modules share `studyspot.db` through `database.js`.
