const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingById,
  insertBooking,
  deleteBooking,
  getAllBookingsWithDetails,
  getBookingWithDetailsById,
  getBookingsByStudentId,
  getBookingsByCarrelId,
  getStudentById,
  getCarrelById,
  getDatabase,
  BOOKINGS_JOIN_QUERY,
} = require('../database');

/**
 * Helper to validate positive integer IDs.
 * Returns the parsed integer if valid, or null if invalid.
 */
const parsePositiveIntegerId = (idParam) => {
  const parsed = Number(idParam);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

/**
 * Helper to validate ISO date format (YYYY-MM-DD).
 */
const isValidIsoDate = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
};

// ============================================================================
// 1. GET /bookings/details - Get all bookings with student and carrel details
// (Registered BEFORE /:id to prevent route shadowing)
// ============================================================================
router.get('/details', async (req, res) => {
  try {
    const { student_id, carrel_id, date } = req.query;

    if (student_id !== undefined) {
      const parsedStudentId = parsePositiveIntegerId(student_id);
      if (!parsedStudentId) {
        return res.status(400).json({
          error: 'Invalid student_id query parameter. Must be a positive integer.',
        });
      }
      const bookings = await getBookingsByStudentId(parsedStudentId);
      return res.status(200).json(bookings);
    }

    if (carrel_id !== undefined) {
      const parsedCarrelId = parsePositiveIntegerId(carrel_id);
      if (!parsedCarrelId) {
        return res.status(400).json({
          error: 'Invalid carrel_id query parameter. Must be a positive integer.',
        });
      }
      const bookings = await getBookingsByCarrelId(parsedCarrelId);
      return res.status(200).json(bookings);
    }

    if (date !== undefined) {
      if (!isValidIsoDate(date)) {
        return res.status(400).json({
          error: 'Invalid date query parameter. Expected YYYY-MM-DD format.',
        });
      }
      const db = await getDatabase();
      const bookings = await db.all(
        `${BOOKINGS_JOIN_QUERY} WHERE bookings.booking_date = ? ORDER BY bookings.id ASC`,
        [date]
      );
      return res.status(200).json(bookings);
    }

    const bookings = await getAllBookingsWithDetails();
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings details:', error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching booking details',
      details: error.message,
    });
  }
});

// ============================================================================
// 2. GET /bookings/details/:id - Get one booking with student and carrel details
// (Registered BEFORE /:id to prevent route shadowing)
// ============================================================================
router.get('/details/:id', async (req, res) => {
  try {
    const bookingId = parsePositiveIntegerId(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        error: 'Invalid booking ID. ID must be a positive integer.',
      });
    }

    const bookingDetails = await getBookingWithDetailsById(bookingId);
    if (!bookingDetails) {
      return res.status(404).json({
        error: `Booking details for ID ${bookingId} not found`,
      });
    }

    return res.status(200).json(bookingDetails);
  } catch (error) {
    console.error(`Error fetching booking details for ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching booking details',
      details: error.message,
    });
  }
});

// ============================================================================
// 3. GET /bookings - Get all bookings (with optional query filters)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { student_id, carrel_id, booking_date } = req.query;

    if (student_id !== undefined || carrel_id !== undefined || booking_date !== undefined) {
      const conditions = [];
      const params = [];

      if (student_id !== undefined) {
        const parsedStudentId = parsePositiveIntegerId(student_id);
        if (!parsedStudentId) {
          return res.status(400).json({
            error: 'Invalid student_id query parameter. Must be a positive integer.',
          });
        }
        conditions.push('student_id = ?');
        params.push(parsedStudentId);
      }

      if (carrel_id !== undefined) {
        const parsedCarrelId = parsePositiveIntegerId(carrel_id);
        if (!parsedCarrelId) {
          return res.status(400).json({
            error: 'Invalid carrel_id query parameter. Must be a positive integer.',
          });
        }
        conditions.push('carrel_id = ?');
        params.push(parsedCarrelId);
      }

      if (booking_date !== undefined) {
        if (!isValidIsoDate(booking_date)) {
          return res.status(400).json({
            error: 'Invalid booking_date query parameter. Expected YYYY-MM-DD format.',
          });
        }
        conditions.push('booking_date = ?');
        params.push(booking_date);
      }

      const db = await getDatabase();
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const bookings = await db.all(
        `SELECT * FROM bookings ${whereClause} ORDER BY id ASC`,
        params
      );
      return res.status(200).json(bookings);
    }

    const bookings = await getAllBookings();
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching bookings',
      details: error.message,
    });
  }
});

// ============================================================================
// 4. GET /bookings/:id - Get one booking by ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const bookingId = parsePositiveIntegerId(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        error: 'Invalid booking ID. ID must be a positive integer.',
      });
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({
        error: `Booking with ID ${bookingId} not found`,
      });
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error(`Error fetching booking ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching booking',
      details: error.message,
    });
  }
});

// ============================================================================
// 5. POST /bookings - Create a new booking
// ============================================================================
router.post('/', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Invalid request body. Request body must be a JSON object.',
      });
    }

    const { student_id, carrel_id, booking_date, booking_time } = req.body;

    // Validate student_id
    if (student_id === undefined || student_id === null) {
      return res.status(400).json({
        error: 'Invalid request body. "student_id" is required and must be a positive integer.',
      });
    }
    const parsedStudentId = parsePositiveIntegerId(student_id);
    if (!parsedStudentId) {
      return res.status(400).json({
        error: 'Invalid request body. "student_id" must be a positive integer.',
      });
    }

    // Validate carrel_id
    if (carrel_id === undefined || carrel_id === null) {
      return res.status(400).json({
        error: 'Invalid request body. "carrel_id" is required and must be a positive integer.',
      });
    }
    const parsedCarrelId = parsePositiveIntegerId(carrel_id);
    if (!parsedCarrelId) {
      return res.status(400).json({
        error: 'Invalid request body. "carrel_id" must be a positive integer.',
      });
    }

    // Validate booking_date
    if (typeof booking_date !== 'string' || !booking_date.trim()) {
      return res.status(400).json({
        error: 'Invalid request body. "booking_date" is required and must be a non-empty string.',
      });
    }
    const trimmedDate = booking_date.trim();
    if (!isValidIsoDate(trimmedDate)) {
      return res.status(400).json({
        error: 'Invalid booking_date format. Date must be in YYYY-MM-DD format.',
      });
    }

    // Validate booking_time (optional)
    let trimmedTime = null;
    if (booking_time !== undefined && booking_time !== null) {
      if (typeof booking_time !== 'string' || !booking_time.trim()) {
        return res.status(400).json({
          error: 'Invalid booking_time. If provided, it must be a non-empty string.',
        });
      }
      trimmedTime = booking_time.trim();
    }

    // Check student and carrel existence to return descriptive error messages
    const student = await getStudentById(parsedStudentId);
    if (!student) {
      return res.status(400).json({
        error: `Student with ID ${parsedStudentId} does not exist.`,
      });
    }

    const carrel = await getCarrelById(parsedCarrelId);
    if (!carrel) {
      return res.status(400).json({
        error: `Carrel with ID ${parsedCarrelId} does not exist.`,
      });
    }

    const newBooking = await insertBooking({
      student_id: parsedStudentId,
      carrel_id: parsedCarrelId,
      booking_date: trimmedDate,
      booking_time: trimmedTime,
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking,
      id: newBooking.id,
      student_id: newBooking.student_id,
      carrel_id: newBooking.carrel_id,
      booking_date: newBooking.booking_date,
      booking_time: newBooking.booking_time,
    });
  } catch (error) {
    if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({
        error: 'Foreign key constraint failed. Specified student or carrel does not exist.',
      });
    }

    console.error('Error creating booking:', error.message);
    return res.status(500).json({
      error: 'Internal server error while creating booking',
      details: error.message,
    });
  }
});

// ============================================================================
// 6. DELETE /bookings/:id - Delete a booking by ID
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const bookingId = parsePositiveIntegerId(req.params.id);
    if (!bookingId) {
      return res.status(400).json({
        error: 'Invalid booking ID. ID must be a positive integer.',
      });
    }

    const deleted = await deleteBooking(bookingId);
    if (!deleted) {
      return res.status(404).json({
        error: `Booking with ID ${bookingId} not found`,
      });
    }

    return res.status(200).json({
      message: `Booking with ID ${bookingId} deleted successfully`,
    });
  } catch (error) {
    console.error(`Error deleting booking ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while deleting booking',
      details: error.message,
    });
  }
});

module.exports = router;
