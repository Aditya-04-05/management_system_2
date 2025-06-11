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
    cb(null, path.join(__dirname, "../uploads/measurements"));
  },
  filename: (req, file, cb) => {
    cb(null, `measurement_${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Create uploads/measurements directory if it doesn't exist
const measurementsDir = path.join(__dirname, "../uploads/measurements");
if (!fs.existsSync(measurementsDir)) {
  fs.mkdirSync(measurementsDir, { recursive: true });
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

// Helper function to generate customer ID
const generateCustomerId = (phoneNumber, instagramId) => {
  if (phoneNumber) {
    // Get last 4 digits of phone number
    const last4Digits = phoneNumber.slice(-4);
    return last4Digits;
  } else if (instagramId) {
    return instagramId;
  } else {
    // Generate a random ID if neither is available
    return `CUST_${Math.floor(Math.random() * 10000)}`;
  }
};

// @route   POST api/customers
// @desc    Create a customer
// @access  Private
router.post(
  "/",
  auth,
  upload.array("measurement_image_url", 5), // Allow up to 5 measurement images
  async (req, res) => {
    try {
      const {
        name,
        phone_number,
        instagram_id,
        order_date,
        due_date,
        pending_amount,
        received_amount,
      } = req.body;

      // Validate required fields
      if (!phone_number && !instagram_id) {
        return res
          .status(400)
          .json({ msg: "Either phone number or Instagram ID is required" });
      }

      // Generate customer ID
      const customer_id = generateCustomerId(phone_number, instagram_id);

      // Check if customer already exists
      const customerCheck = await pool.query(
        "SELECT * FROM customers WHERE customer_id = $1",
        [customer_id]
      );

      if (customerCheck.rows.length > 0) {
        return res.status(400).json({ msg: "Customer already exists" });
      }

      // Insert customer into database
      const newCustomer = await pool.query(
        "INSERT INTO customers (customer_id, name, phone_number, instagram_id, order_date, due_date, pending_amount, received_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          customer_id,
          name || null,
          phone_number || null,
          instagram_id || null,
          order_date || new Date(),
          due_date || null,
          pending_amount || 0,
          received_amount || 0,
        ]
      );

      // Process uploaded measurement images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const image_url = `/uploads/measurements/${file.filename}`;

          // Insert image into customer_measurement_images table
          await pool.query(
            "INSERT INTO customer_measurement_images (customer_id, image_url) VALUES ($1, $2)",
            [customer_id, image_url]
          );
        }
      }

      // Get customer with measurement images
      const customerWithImages = await pool.query(
        "SELECT c.*, COALESCE(json_agg(cmi) FILTER (WHERE cmi.image_id IS NOT NULL), '[]') as measurement_images FROM customers c LEFT JOIN customer_measurement_images cmi ON c.customer_id = cmi.customer_id WHERE c.customer_id = $1 GROUP BY c.customer_id",
        [customer_id]
      );

      res.json(customerWithImages.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET api/customers
// @desc    Get all customers
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const customers = await pool.query(
      "SELECT c.*, (SELECT COUNT(*) FROM customer_measurement_images WHERE customer_id = c.customer_id) as measurement_images_count FROM customers c ORDER BY due_date ASC"
    );
    res.json(customers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get customer with measurement images
    const customer = await pool.query(
      "SELECT c.*, COALESCE(json_agg(cmi) FILTER (WHERE cmi.image_id IS NOT NULL), '[]') as measurement_images FROM customers c LEFT JOIN customer_measurement_images cmi ON c.customer_id = cmi.customer_id WHERE c.customer_id = $1 GROUP BY c.customer_id",
      [id]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    // Get customer's suits
    const suits = await pool.query(
      "SELECT s.*, w.name as worker_name FROM suits s LEFT JOIN workers w ON s.worker_id = w.worker_id WHERE s.customer_id = $1 ORDER BY s.due_date ASC",
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
    const customerData = {
      ...customer.rows[0],
      suits: suits.rows.map((suit) => ({
        ...suit,
        images: images.rows.filter((img) => img.suit_id === suit.suit_id),
      })),
    };

    res.json(customerData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/customers/:id
// @desc    Update customer
// @access  Private
router.put(
  "/:id",
  auth,
  upload.array("measurement_image_url", 5), // Allow up to 5 measurement images
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        phone_number,
        instagram_id,
        due_date,
        pending_amount,
        received_amount,
        delete_images,
      } = req.body;

      if (req.files && req.files.length > 0) {
        console.log(`${req.files.length} files uploaded`);
      } else {
        console.log("No files uploaded");
      }

      // Check if customer exists
      const customerCheck = await pool.query(
        "SELECT * FROM customers WHERE customer_id = $1",
        [id]
      );

      if (customerCheck.rows.length === 0) {
        return res.status(404).json({ msg: "Customer not found" });
      }

      // Update customer basic info
      const updatedCustomer = await pool.query(
        "UPDATE customers SET name = COALESCE($1, name), phone_number = COALESCE($2, phone_number), instagram_id = COALESCE($3, instagram_id), due_date = COALESCE($4, due_date), pending_amount = COALESCE($5, pending_amount), received_amount = COALESCE($6, received_amount) WHERE customer_id = $7 RETURNING *",
        [
          name,
          phone_number,
          instagram_id,
          due_date,
          pending_amount,
          received_amount,
          id,
        ]
      );

      // Delete images if requested
      if (delete_images) {
        const imagesToDelete = Array.isArray(delete_images)
          ? delete_images
          : delete_images.split(",").map((id) => parseInt(id.trim()));

        if (imagesToDelete.length > 0) {
          await pool.query(
            "DELETE FROM customer_measurement_images WHERE image_id = ANY($1)",
            [imagesToDelete]
          );
        }
      }

      // Process uploaded measurement images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const image_url = `/uploads/measurements/${file.filename}`;

          // Insert image into customer_measurement_images table
          await pool.query(
            "INSERT INTO customer_measurement_images (customer_id, image_url) VALUES ($1, $2)",
            [id, image_url]
          );
        }
      }

      // Get customer with measurement images
      const customerWithImages = await pool.query(
        "SELECT c.*, COALESCE(json_agg(cmi) FILTER (WHERE cmi.image_id IS NOT NULL), '[]') as measurement_images FROM customers c LEFT JOIN customer_measurement_images cmi ON c.customer_id = cmi.customer_id WHERE c.customer_id = $1 GROUP BY c.customer_id",
        [id]
      );

      res.json(customerWithImages.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   DELETE api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheck = await pool.query(
      "SELECT * FROM customers WHERE customer_id = $1",
      [id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    // Delete customer (cascade will delete related suits and images)
    await pool.query("DELETE FROM customers WHERE customer_id = $1", [id]);

    res.json({ msg: "Customer deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/customers/search/:term
// @desc    Search customers
// @access  Private
router.get("/search/:term", auth, async (req, res) => {
  try {
    const { term } = req.params;

    const customers = await pool.query(
      "SELECT * FROM customers WHERE customer_id ILIKE $1 OR name ILIKE $1 OR phone_number ILIKE $1 OR instagram_id ILIKE $1",
      [`%${term}%`]
    );

    res.json(customers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
