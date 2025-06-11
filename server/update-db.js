const pool = require("./db");
const fs = require("fs");
const path = require("path");

const updateDatabase = async () => {
  try {
    console.log("Checking if customer_measurement_images table exists...");

    // Check if customer_measurement_images table exists
    const tableCheck = await pool.query("SELECT to_regclass('public.customer_measurement_images')");

    if (!tableCheck.rows[0].to_regclass) {
      console.log("customer_measurement_images table does not exist. Creating table...");

      // Create customer_measurement_images table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customer_measurement_images (
          image_id SERIAL PRIMARY KEY,
          customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
          image_url VARCHAR(255) NOT NULL
        )
      `);

      console.log("customer_measurement_images table created.");

      // Migrate existing measurement images
      console.log("Migrating existing measurement images...");
      const customers = await pool.query(
        "SELECT customer_id, measurement_image_url FROM customers WHERE measurement_image_url IS NOT NULL"
      );

      for (const customer of customers.rows) {
        if (customer.measurement_image_url) {
          await pool.query(
            "INSERT INTO customer_measurement_images (customer_id, image_url) VALUES ($1, $2)",
            [customer.customer_id, customer.measurement_image_url]
          );
        }
      }

      console.log(`Migrated ${customers.rows.length} existing measurement images.`);
    } else {
      console.log("customer_measurement_images table already exists.");
    }

    console.log("Database update complete.");
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    pool.end();
  }
};

// Create uploads/measurements directory if it doesn't exist
const measurementsDir = path.join(__dirname, "uploads/measurements");
if (!fs.existsSync(measurementsDir)) {
  fs.mkdirSync(measurementsDir, { recursive: true });
}

updateDatabase();