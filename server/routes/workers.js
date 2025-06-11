const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// @route   POST api/workers
// @desc    Create a worker
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ msg: "Worker name is required" });
    }

    // Insert worker into database
    const newWorker = await pool.query(
      "INSERT INTO workers (name) VALUES ($1) RETURNING *",
      [name]
    );

    res.json(newWorker.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/workers
// @desc    Get all workers
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const workers = await pool.query("SELECT * FROM workers ORDER BY name");
    res.json(workers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/workers/:id
// @desc    Get worker by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get worker
    const worker = await pool.query(
      "SELECT * FROM workers WHERE worker_id = $1",
      [id]
    );

    if (worker.rows.length === 0) {
      return res.status(404).json({ msg: "Worker not found" });
    }

    // Get worker's assigned suits
    const suits = await pool.query(
      "SELECT s.*, c.name as customer_name FROM suits s JOIN customers c ON s.customer_id = c.customer_id WHERE s.worker_id = $1 ORDER BY s.due_date ASC",
      [id]
    );

    // Get suit images
    const suitIds = suits.rows.map((suit) => suit.suit_id);
    let images = [];

    if (suitIds.length > 0) {
      images = await pool.query(
        "SELECT * FROM suit_images WHERE suit_id = ANY($1)",
        [suitIds]
      );
    }

    // Combine data
    const workerData = {
      ...worker.rows[0],
      suits: suits.rows.map((suit) => ({
        ...suit,
        images: images.rows.filter((img) => img.suit_id === suit.suit_id),
      })),
    };

    res.json(workerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/workers/:id
// @desc    Update worker
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ msg: "Worker name is required" });
    }

    // Check if worker exists
    const workerCheck = await pool.query(
      "SELECT * FROM workers WHERE worker_id = $1",
      [id]
    );

    if (workerCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Worker not found" });
    }

    // Update worker
    const updatedWorker = await pool.query(
      "UPDATE workers SET name = $1 WHERE worker_id = $2 RETURNING *",
      [name, id]
    );

    res.json(updatedWorker.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/workers/:id
// @desc    Delete worker
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if worker exists
    const workerCheck = await pool.query(
      "SELECT * FROM workers WHERE worker_id = $1",
      [id]
    );

    if (workerCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Worker not found" });
    }

    // Update suits to remove worker reference
    await pool.query("UPDATE suits SET worker_id = NULL WHERE worker_id = $1", [
      id,
    ]);

    // Delete worker
    await pool.query("DELETE FROM workers WHERE worker_id = $1", [id]);

    res.json({ msg: "Worker deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/workers/search/:term
// @desc    Search workers
// @access  Private
router.get("/search/:term", auth, async (req, res) => {
  try {
    const { term } = req.params;

    const workers = await pool.query(
      "SELECT * FROM workers WHERE name ILIKE $1",
      [`%${term}%`]
    );

    res.json(workers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
