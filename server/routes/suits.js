const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/suits"));
  },
  filename: (req, file, cb) => {
    cb(null, `suit_${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Create uploads/suits directory if it doesn't exist
const suitsDir = path.join(__dirname, "../uploads/suits");
if (!fs.existsSync(suitsDir)) {
  fs.mkdirSync(suitsDir, { recursive: true });
}

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images only!");
    }
  },
});

// Helper function to generate suit ID
const generateSuitId = async (customer_id) => {
  try {
    // Get customer's suits count
    const suitsCount = await pool.query(
      "SELECT COUNT(*) FROM suits WHERE customer_id = $1",
      [customer_id]
    );

    const count = parseInt(suitsCount.rows[0].count) + 1;
    return `${customer_id}_${count}`;
  } catch (err) {
    console.error(err);
    return `${customer_id}_1`;
  }
};

// @route   POST api/suits
// @desc    Create a suit
// @access  Private
router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    const { customer_id, status, order_date, due_date, worker_id } = req.body;

    // Validate required fields
    if (!customer_id) {
      return res.status(400).json({ msg: "Customer ID is required" });
    }

    // Check if customer exists
    const customerCheck = await pool.query(
      "SELECT * FROM customers WHERE customer_id = $1",
      [customer_id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    // Generate suit ID
    const suit_id = await generateSuitId(customer_id);

    // Insert suit into database
    const newSuit = await pool.query(
      "INSERT INTO suits (suit_id, customer_id, status, order_date, due_date, worker_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        suit_id,
        customer_id,
        status || "no progress",
        order_date || new Date(),
        due_date || null,
        worker_id || null,
      ]
    );

    // Handle image uploads
    const imagePromises = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/suits/${file.filename}`;
        imagePromises.push(
          pool.query(
            "INSERT INTO suit_images (suit_id, image_url) VALUES ($1, $2) RETURNING *",
            [suit_id, imageUrl]
          )
        );
      }
    }

    // Wait for all image insertions to complete
    const imageResults = await Promise.all(imagePromises);
    const images = imageResults.map((result) => result.rows[0]);

    // Update customer's due date if not set or if this suit's due date is earlier
    if (due_date) {
      await pool.query(
        "UPDATE customers SET due_date = CASE WHEN due_date IS NULL OR $1 < due_date THEN $1 ELSE due_date END WHERE customer_id = $2",
        [due_date, customer_id]
      );
    }

    // Return the new suit with images
    res.json({
      ...newSuit.rows[0],
      images,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/suits
// @desc    Get all suits
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const suits = await pool.query(
      "SELECT s.*, c.name as customer_name, w.name as worker_name FROM suits s LEFT JOIN customers c ON s.customer_id = c.customer_id LEFT JOIN workers w ON s.worker_id = w.worker_id ORDER BY s.due_date ASC"
    );

    // Get all suit images
    const images = await pool.query("SELECT * FROM suit_images");

    // Combine suits with their images
    const suitsWithImages = suits.rows.map((suit) => ({
      ...suit,
      images: images.rows.filter((img) => img.suit_id === suit.suit_id),
    }));

    res.json(suitsWithImages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/suits/:id
// @desc    Get suit by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get suit
    const suit = await pool.query(
      "SELECT s.*, c.name as customer_name, w.name as worker_name FROM suits s LEFT JOIN customers c ON s.customer_id = c.customer_id LEFT JOIN workers w ON s.worker_id = w.worker_id WHERE s.suit_id = $1",
      [id]
    );

    if (suit.rows.length === 0) {
      return res.status(404).json({ msg: "Suit not found" });
    }

    // Get suit images
    const images = await pool.query(
      "SELECT * FROM suit_images WHERE suit_id = $1",
      [id]
    );

    // Combine data
    const suitData = {
      ...suit.rows[0],
      images: images.rows,
    };

    res.json(suitData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/suits/:id
// @desc    Update suit
// @access  Private
router.put("/:id", auth, upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, due_date, worker_id, delete_images } = req.body;

    // Check if suit exists
    const suitCheck = await pool.query(
      "SELECT * FROM suits WHERE suit_id = $1",
      [id]
    );

    if (suitCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Suit not found" });
    }

    // Update suit
    const updatedSuit = await pool.query(
      "UPDATE suits SET status = COALESCE($1, status), due_date = COALESCE($2, due_date), worker_id = $3 WHERE suit_id = $4 RETURNING *",
      [status, due_date, worker_id === "" ? null : worker_id, id]
    );

    // Delete images if requested
    if (delete_images && delete_images.length > 0) {
      const deleteImageIds = Array.isArray(delete_images)
        ? delete_images
        : delete_images.split(",").map((id) => id.trim());

      await pool.query("DELETE FROM suit_images WHERE image_id = ANY($1)", [
        deleteImageIds,
      ]);
    }

    // Handle new image uploads
    const imagePromises = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/suits/${file.filename}`;
        imagePromises.push(
          pool.query(
            "INSERT INTO suit_images (suit_id, image_url) VALUES ($1, $2) RETURNING *",
            [id, imageUrl]
          )
        );
      }
    }

    // Wait for all image insertions to complete
    const imageResults = await Promise.all(imagePromises);
    const newImages = imageResults.map((result) => result.rows[0]);

    // Get all current images
    const images = await pool.query(
      "SELECT * FROM suit_images WHERE suit_id = $1",
      [id]
    );

    // Update customer's due date if this suit's due date changed
    if (due_date) {
      await pool.query(
        "UPDATE customers SET due_date = (SELECT MIN(due_date) FROM suits WHERE customer_id = $1) WHERE customer_id = $1",
        [updatedSuit.rows[0].customer_id]
      );
    }

    // Return the updated suit with images
    res.json({
      ...updatedSuit.rows[0],
      images: images.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/suits/:id
// @desc    Delete suit
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if suit exists
    const suitCheck = await pool.query(
      "SELECT * FROM suits WHERE suit_id = $1",
      [id]
    );

    if (suitCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Suit not found" });
    }

    // Delete suit (cascade will delete related images)
    await pool.query("DELETE FROM suits WHERE suit_id = $1", [id]);

    // Update customer's total_suits count and due_date
    await pool.query(
      "UPDATE customers SET due_date = (SELECT MIN(due_date) FROM suits WHERE customer_id = $1) WHERE customer_id = $1",
      [suitCheck.rows[0].customer_id]
    );

    res.json({ msg: "Suit deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/suits/search/:term
// @desc    Search suits
// @access  Private
router.get("/search/:term", auth, async (req, res) => {
  try {
    const { term } = req.params;

    const suits = await pool.query(
      "SELECT s.*, c.name as customer_name, w.name as worker_name FROM suits s LEFT JOIN customers c ON s.customer_id = c.customer_id LEFT JOIN workers w ON s.worker_id = w.worker_id WHERE s.suit_id ILIKE $1 OR c.name ILIKE $1 OR c.phone_number ILIKE $1",
      [`%${term}%`]
    );

    // Get images for matching suits
    const suitIds = suits.rows.map((suit) => suit.suit_id);
    let images = [];

    if (suitIds.length > 0) {
      images = await pool.query(
        "SELECT * FROM suit_images WHERE suit_id = ANY($1)",
        [suitIds]
      );
    }

    // Combine suits with their images
    const suitsWithImages = suits.rows.map((suit) => ({
      ...suit,
      images: images.rows.filter((img) => img.suit_id === suit.suit_id),
    }));

    res.json(suitsWithImages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
