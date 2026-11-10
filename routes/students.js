const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  insertStudent,
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

// ============================================================================
// 1. GET /students - Get all students
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const students = await getAllStudents();
    return res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching students',
      details: error.message,
    });
  }
});

// ============================================================================
// 2. GET /students/:id - Get one student by ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const studentId = parsePositiveIntegerId(req.params.id);
    if (!studentId) {
      return res.status(400).json({
        error: 'Invalid student ID. ID must be a positive integer.',
      });
    }

    const student = await getStudentById(studentId);
    if (!student) {
      return res.status(404).json({
        error: `Student with ID ${studentId} not found`,
      });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error(`Error fetching student ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching student',
      details: error.message,
    });
  }
});

// ============================================================================
// 3. POST /students - Add a new student
// ============================================================================
router.post('/', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Invalid request body. Request body must be a JSON object.',
      });
    }

    const { name, email } = req.body;

    // Validate name
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Invalid request body. "name" is required and must be a non-empty string.',
      });
    }

    // Validate email if supplied
    let trimmedEmail = null;
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          error: 'Invalid request body. If provided, "email" must be a non-empty string.',
        });
      }
      trimmedEmail = email.trim();
    }

    const trimmedName = name.trim();

    const newStudent = await insertStudent({
      name: trimmedName,
      email: trimmedEmail,
    });

    return res.status(201).json({
      message: 'Student created successfully',
      student: newStudent,
      id: newStudent.id,
      name: newStudent.name,
      email: newStudent.email,
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        error: 'A student with this email already exists.',
      });
    }

    console.error('Error creating student:', error.message);
    return res.status(500).json({
      error: 'Internal server error while creating student',
      details: error.message,
    });
  }
});

module.exports = router;
