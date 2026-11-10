const express = require('express');
const router = express.Router();
const { getDatabase, getTopCarrels } = require('../database');

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
// 1. GET /carrels - Get all carrels (with optional ?zone= query parameter search)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { zone } = req.query;
    const db = await getDatabase();

    // Zone search filter: GET /carrels?zone=Silent%20Study
    if (zone !== undefined) {
      if (typeof zone !== 'string' || !zone.trim()) {
        return res.status(400).json({
          error: 'Invalid zone query parameter. It must be a non-empty string.',
        });
      }

      const trimmedZone = zone.trim();
      const carrels = await db.all(
        'SELECT * FROM carrels WHERE zone = ? ORDER BY id ASC',
        [trimmedZone]
      );
      return res.status(200).json(carrels);
    }

    const carrels = await db.all('SELECT * FROM carrels ORDER BY id ASC');
    return res.status(200).json(carrels);
  } catch (error) {
    console.error('Error fetching carrels:', error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching carrels',
      details: error.message,
    });
  }
});

// ============================================================================
// 2. GET /carrels/top - Get top 3 carrels ranked by booking count (Member 4)
// (Registered BEFORE /:id to prevent route shadowing)
// ============================================================================
router.get('/top', async (req, res) => {
  try {
    const topCarrels = await getTopCarrels(3);
    return res.status(200).json(topCarrels);
  } catch (error) {
    console.error('Error fetching top carrels:', error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching top carrels',
      details: error.message,
    });
  }
});

// ============================================================================
// 3. GET /carrels/:id - Get one carrel by ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const carrelId = parsePositiveIntegerId(req.params.id);
    if (!carrelId) {
      return res.status(400).json({
        error: 'Invalid carrel ID. ID must be a positive integer.',
      });
    }

    const db = await getDatabase();
    const carrel = await db.get('SELECT * FROM carrels WHERE id = ?', [carrelId]);

    if (!carrel) {
      return res.status(404).json({
        error: `Carrel with ID ${carrelId} not found`,
      });
    }

    return res.status(200).json(carrel);
  } catch (error) {
    console.error(`Error fetching carrel ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while fetching carrel',
      details: error.message,
    });
  }
});

// ============================================================================
// 4. POST /carrels - Add a new carrel
// ============================================================================
router.post('/', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Invalid request body. Request body must be a JSON object.',
      });
    }

    const { id, name, zone } = req.body;

    // Validate name
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Invalid request body. "name" is required and must be a non-empty string.',
      });
    }

    // Validate zone
    if (typeof zone !== 'string' || !zone.trim()) {
      return res.status(400).json({
        error: 'Invalid request body. "zone" is required and must be a non-empty string.',
      });
    }

    const trimmedName = name.trim();
    const trimmedZone = zone.trim();

    const db = await getDatabase();

    let newId;

    // Support optional explicit ID if supplied
    if (id !== undefined) {
      const explicitId = parsePositiveIntegerId(id);
      if (!explicitId) {
        return res.status(400).json({
          error: 'Invalid carrel ID. If provided, "id" must be a positive integer.',
        });
      }

      const existing = await db.get('SELECT * FROM carrels WHERE id = ?', [explicitId]);
      if (existing) {
        return res.status(400).json({
          error: `Carrel with ID ${explicitId} already exists.`,
        });
      }

      await db.run(
        'INSERT INTO carrels (id, name, zone) VALUES (?, ?, ?)',
        [explicitId, trimmedName, trimmedZone]
      );
      newId = explicitId;
    } else {
      const result = await db.run(
        'INSERT INTO carrels (name, zone) VALUES (?, ?)',
        [trimmedName, trimmedZone]
      );
      newId = result.lastID;
    }

    return res.status(201).json({
      message: 'Carrel created successfully',
      carrel: {
        id: newId,
        name: trimmedName,
        zone: trimmedZone,
      },
    });
  } catch (error) {
    console.error('Error creating carrel:', error.message);
    return res.status(500).json({
      error: 'Internal server error while creating carrel',
      details: error.message,
    });
  }
});

// ============================================================================
// 5. PUT /carrels/:id - Update an existing carrel
// ============================================================================
router.put('/:id', async (req, res) => {
  try {
    const carrelId = parsePositiveIntegerId(req.params.id);
    if (!carrelId) {
      return res.status(400).json({
        error: 'Invalid carrel ID. ID must be a positive integer.',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Invalid request body. Request body must be a JSON object.',
      });
    }

    const { name, zone } = req.body;

    // Validate name
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Invalid request body. "name" is required and must be a non-empty string.',
      });
    }

    // Validate zone
    if (typeof zone !== 'string' || !zone.trim()) {
      return res.status(400).json({
        error: 'Invalid request body. "zone" is required and must be a non-empty string.',
      });
    }

    const trimmedName = name.trim();
    const trimmedZone = zone.trim();

    const db = await getDatabase();

    // Check if carrel exists before updating
    const existing = await db.get('SELECT * FROM carrels WHERE id = ?', [carrelId]);
    if (!existing) {
      return res.status(404).json({
        error: `Carrel with ID ${carrelId} not found`,
      });
    }

    await db.run(
      'UPDATE carrels SET name = ?, zone = ? WHERE id = ?',
      [trimmedName, trimmedZone, carrelId]
    );

    return res.status(200).json({
      message: 'Carrel updated successfully',
      carrel: {
        id: carrelId,
        name: trimmedName,
        zone: trimmedZone,
      },
    });
  } catch (error) {
    console.error(`Error updating carrel ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while updating carrel',
      details: error.message,
    });
  }
});

// ============================================================================
// 6. DELETE /carrels/:id - Delete a carrel by ID
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const carrelId = parsePositiveIntegerId(req.params.id);
    if (!carrelId) {
      return res.status(400).json({
        error: 'Invalid carrel ID. ID must be a positive integer.',
      });
    }

    const db = await getDatabase();

    // Check if carrel exists before deleting
    const existing = await db.get('SELECT * FROM carrels WHERE id = ?', [carrelId]);
    if (!existing) {
      return res.status(404).json({
        error: `Carrel with ID ${carrelId} not found`,
      });
    }

    await db.run('DELETE FROM carrels WHERE id = ?', [carrelId]);

    return res.status(200).json({
      message: `Carrel with ID ${carrelId} deleted successfully`,
    });
  } catch (error) {
    console.error(`Error deleting carrel ${req.params.id}:`, error.message);
    return res.status(500).json({
      error: 'Internal server error while deleting carrel',
      details: error.message,
    });
  }
});

module.exports = router;
