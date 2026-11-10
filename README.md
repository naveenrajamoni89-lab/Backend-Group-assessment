# StudySpot Cafe – Group Backend Assessment

Backend REST API for **StudySpot Cafe**, a seat and study carrel booking management system for university students.

Built with **Node.js**, **Express**, and **SQLite**.

---

## 👥 Team Work Distribution

| Member | Focus Area | Status | Deliverables |
|---|---|---|---|
| **Member 1 (Current)** | Server & Carrels CRUD | ✅ Completed | Express setup, JSON middleware, Carrels REST API, DB interface |
| **Member 2** | Database & Tables | ⏳ Next Up | SQLite schema (`students`, `carrels`, `bookings`), relations & seeds |
| **Member 3** | Bookings API & Search | 📅 Upcoming | Booking endpoints, validation, JOIN queries, search filters |
| **Member 4** | Top Carrels & Postman | 📅 Upcoming | GET `/carrels/top`, Postman collection, final report & testing |

---

## 📁 Project Structure

```text
StudySpot-Cafe/
│
├── app.js               # Express app configuration & server listener
├── database.js          # SQLite connection manager & Member 2 integration hook
├── package.json         # Project metadata and dependencies
├── .gitignore           # Ignores node_modules, *.db, and temporary files
├── test-member1.js      # Automated verification suite for Member 1 deliverables
├── routes/
│   └── carrels.js       # Carrels CRUD REST API endpoints (Member 1)
└── README.md            # Team guide, API documentation, and testing steps
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

### 4. Run the Member 1 Verification Suite
Execute the automated test runner to test server routes, validation, and CRUD operations:
```bash
npm run test:integration
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

## 🤝 Handover Instructions for Member 2 (Database & Schema)

Member 1 has created the database connection interface in `database.js` and wired it into `routes/carrels.js`.

### What Member 2 needs to do:
1. Open `database.js`.
2. In `initializeDatabase()`, implement table creation statements for the 3 tables:
   ```sql
   -- 1. Carrels table (must match carrels API contract)
   CREATE TABLE IF NOT EXISTS carrels (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     zone TEXT NOT NULL
   );

   -- 2. Students table
   CREATE TABLE IF NOT EXISTS students (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE
   );

   -- 3. Bookings table
   CREATE TABLE IF NOT EXISTS bookings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     student_id INTEGER NOT NULL,
     carrel_id INTEGER NOT NULL,
     booking_date TEXT NOT NULL,
     start_time TEXT NOT NULL,
     end_time TEXT NOT NULL,
     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
     FOREIGN KEY (carrel_id) REFERENCES carrels(id) ON DELETE CASCADE
   );
   ```
3. Add initial seed data (sample carrels, students, and bookings).
4. Run `npm start` or `npm run test:integration` to verify carrels CRUD operations persist into `studyspot.db`.

---

## 🔒 Boundaries Respected
- **No Booking JOIN endpoint implemented** (Reserved for Member 3).
- **No Top 3 carrels endpoint implemented** (Reserved for Member 4).
- **No competing database schema hardcoded** (Reserved for Member 2).
