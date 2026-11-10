# StudySpot Cafe – Group Backend Assessment

Backend REST API for **StudySpot Cafe**, a seat and study carrel booking management system for university students.

Built with **Node.js**, **Express**, and **SQLite**.

---

## 👥 Team Work Distribution

| Member | Focus Area | Status | Deliverables |
|---|---|---|---|
| **Member 1** | Server & Carrels CRUD | ✅ Completed | Express setup, JSON middleware, Carrels REST API, DB interface |
| **Member 2** | Database & Tables | ✅ Completed | SQLite schema (`students`, `carrels`, `bookings`), relations, seeds, query helpers |
| **Member 3** | Bookings API, JOIN, Validation & Search | ✅ Completed | Bookings REST API, JOIN endpoints, Students API, zone search, input validation |
| **Member 4 (Next)** | Top Carrels & Postman | ⏳ Next Up | GET `/carrels/top`, Postman collection, final report & testing |

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
├── test-member3.js      # Automated verification suite for Member 3 deliverables
├── routes/
│   ├── carrels.js       # Carrels CRUD REST API + zone search (Member 1 & 3)
│   ├── students.js      # Students REST API endpoints (Member 3)
│   └── bookings.js      # Bookings REST API + JOIN endpoints (Member 3)
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
- **Run all automated suites (Member 1, Member 2 & Member 3):**
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
- **Run Member 3 Verification Suite:**
  ```bash
  npm run test:member3
  ```

---

## 📡 Carrels API Reference (Member 1 & Member 3)

Base URL: `http://localhost:3000/carrels`

All carrels have the following fields:
- `id` (Integer, Primary Key)
- `name` (String, Required)
- `zone` (String, Required)

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/carrels` | Get all carrels (or filter by zone) | 200, 400, 500 |
| `GET` | `/carrels?zone=Silent%20Study` | Search/filter carrels by zone | 200, 400, 500 |
| `GET` | `/carrels/:id` | Get single carrel by ID | 200, 400, 404, 500 |
| `POST` | `/carrels` | Create a new carrel | 201, 400, 500 |
| `PUT` | `/carrels/:id` | Update an existing carrel | 200, 400, 404, 500 |
| `DELETE` | `/carrels/:id` | Delete a carrel by ID | 200, 400, 404, 500 |

### Detailed Request & Response Examples

#### 1. GET `/carrels` & `/carrels?zone=Silent%20Study`
- **URL without filter:** `http://localhost:3000/carrels`
- **URL with zone filter:** `http://localhost:3000/carrels?zone=Silent%20Study`
- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Silent Pod A1",
    "zone": "Silent Study"
  }
]
```
- If no carrels match the zone, an empty array `[]` is returned.
- If `zone` is empty or whitespace-only, a `400 Bad Request` is returned.

#### 2. GET `/carrels/:id` – Retrieve Single Carrel
- **URL:** `http://localhost:3000/carrels/1`
- **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Silent Pod A1",
  "zone": "Silent Study"
}
```

#### 3. POST `/carrels` – Create New Carrel
- **URL:** `http://localhost:3000/carrels`
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

#### 4. PUT `/carrels/:id` – Update a Carrel
- **URL:** `http://localhost:3000/carrels/1`
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

#### 5. DELETE `/carrels/:id` – Delete a Carrel
- **URL:** `http://localhost:3000/carrels/1`
- **Response (200 OK):**
```json
{
  "message": "Carrel with ID 1 deleted successfully"
}
```

---

## 📡 Students API Reference (Member 3)

Base URL: `http://localhost:3000/students`

Students have the following fields:
- `id` (Integer, Primary Key)
- `name` (String, Required)
- `email` (String, Optional / Unique)

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/students` | Get all students | 200, 500 |
| `GET` | `/students/:id` | Get single student by ID | 200, 400, 404, 500 |
| `POST` | `/students` | Register a new student | 201, 400, 500 |

#### 1. GET `/students`
- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }
]
```

#### 2. POST `/students`
- **Request Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com"
}
```
- **Response (201 Created):**
```json
{
  "message": "Student created successfully",
  "student": {
    "id": 5,
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
  }
}
```

---

## 📡 Bookings API Reference (Member 3)

Base URL: `http://localhost:3000/bookings`

Bookings have the following fields:
- `id` (Integer, Primary Key)
- `student_id` (Integer, Required, FK -> students.id)
- `carrel_id` (Integer, Required, FK -> carrels.id)
- `booking_date` (String, Required, YYYY-MM-DD)
- `booking_time` (String, Optional, e.g. "09:00 - 11:00")

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/bookings` | Get all bookings (supports `?student_id=`, `?carrel_id=`, `?booking_date=`) | 200, 400, 500 |
| `GET` | `/bookings/details` | Get all bookings joined with student and carrel details | 200, 400, 500 |
| `GET` | `/bookings/details/:id` | Get single booking joined with student and carrel details | 200, 400, 404, 500 |
| `GET` | `/bookings/:id` | Get single booking by ID | 200, 400, 404, 500 |
| `POST` | `/bookings` | Create a new booking | 201, 400, 500 |
| `DELETE` | `/bookings/:id` | Delete a booking by ID | 200, 400, 404, 500 |

### Detailed Request & Response Examples

#### 1. GET `/bookings/details` – Booking JOIN Endpoint
- **URL:** `http://localhost:3000/bookings/details`
- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "booking_date": "2026-11-10",
    "booking_time": "09:00 - 11:00",
    "student_id": 1,
    "student_name": "Alice Johnson",
    "student_email": "alice@example.com",
    "carrel_id": 2,
    "carrel_name": "Collab Table B3",
    "carrel_zone": "Collaborative"
  }
]
```

#### 2. GET `/bookings/details/:id` – Single Booking JOIN Endpoint
- **URL:** `http://localhost:3000/bookings/details/1`
- **Response (200 OK):**
```json
{
  "id": 1,
  "booking_date": "2026-11-10",
  "booking_time": "09:00 - 11:00",
  "student_id": 1,
  "student_name": "Alice Johnson",
  "student_email": "alice@example.com",
  "carrel_id": 2,
  "carrel_name": "Collab Table B3",
  "carrel_zone": "Collaborative"
}
```

#### 3. POST `/bookings` – Create New Booking
- **URL:** `http://localhost:3000/bookings`
- **Request Body:**
```json
{
  "student_id": 1,
  "carrel_id": 2,
  "booking_date": "2026-11-10",
  "booking_time": "09:00 - 11:00"
}
```
- **Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": 4,
    "student_id": 1,
    "carrel_id": 2,
    "booking_date": "2026-11-10",
    "booking_time": "09:00 - 11:00"
  }
}
```
- **Error Response (400 Bad Request - Non-existent Student):**
```json
{
  "error": "Student with ID 9999 does not exist."
}
```
- **Error Response (400 Bad Request - Non-existent Carrel):**
```json
{
  "error": "Carrel with ID 9999 does not exist."
}
```

#### 4. DELETE `/bookings/:id` – Delete Booking
- **URL:** `http://localhost:3000/bookings/1`
- **Response (200 OK):**
```json
{
  "message": "Booking with ID 1 deleted successfully"
}
```
- **Error Response (404 Not Found):**
```json
{
  "error": "Booking with ID 9999 not found"
}
```

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

```text
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

---

## 🤝 Handover Instructions for Member 4 (Top Carrels & Postman Collection)

Member 3 has completed all Booking REST APIs, JOIN endpoints, Student endpoints, Carrels zone search, and comprehensive input validation.

### What Member 4 needs to implement:
1. **Endpoint `GET /carrels/top`:**
   - Retrieve top study carrels ordered by booking count (e.g. `COUNT(bookings.id) DESC LIMIT 3`).
   - Query template recommendation:
     ```sql
     SELECT 
       carrels.id,
       carrels.name,
       carrels.zone,
       COUNT(bookings.id) AS booking_count
     FROM carrels
     LEFT JOIN bookings ON carrels.id = bookings.carrel_id
     GROUP BY carrels.id
     ORDER BY booking_count DESC, carrels.id ASC
     LIMIT 3;
     ```
   - IMPORTANT: Register `GET /carrels/top` in `routes/carrels.js` **before** `GET /carrels/:id` to avoid route conflicts.
2. **Postman Collection & Environment:**
   - Create and export a Postman collection covering all carrels, students, and bookings endpoints.
   - Include positive and negative test assertions.
3. **Final Report & Deliverables:**
   - Complete team documentation and integration tests.

---

## 🔒 Boundaries Respected
- **Express routes maintained:** Member 1's `/carrels` routes and validation preserved and enhanced with zone search.
- **Database integrity preserved:** Member 2's schema, foreign key cascade behaviors, and query functions utilized directly.
- **No `GET /carrels/top` implemented:** Reserved exclusively for Member 4.
- **Single database connection:** All modules share `studyspot.db` through `database.js`.
