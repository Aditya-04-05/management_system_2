const pool = require("./db");
const bcrypt = require("bcrypt");

const initializeDatabase = async () => {
  console.log("Starting database initialization...");
  console.log(
    "Connection string:",
    process.env.CONNECTION_STRING ? "Set (hidden for security)" : "Not set"
  );

  // Set a timeout for the entire initialization process
  const initTimeout = setTimeout(() => {
    console.error("Database initialization timed out after 60 seconds");
    process.exit(1);
  }, 60000);

  try {
    // Test database connection first
    console.log("Testing database connection...");
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");

    // Create tables and triggers in a transaction
    console.log("Creating tables and triggers...");
    await pool.query("BEGIN");

    try {
      // Create customers table
      console.log("Creating customers table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          customer_id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100),
          phone_number VARCHAR(20),
          instagram_id VARCHAR(100),
          total_suits INTEGER DEFAULT 0,
          order_date DATE,
          due_date DATE,
          pending_amount DECIMAL(10, 2) DEFAULT 0,
          received_amount DECIMAL(10, 2) DEFAULT 0
        )
      `);
      console.log("Customers table created or already exists.");

      // Create customer_measurement_images table
      console.log("Creating customer_measurement_images table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customer_measurement_images (
          image_id SERIAL PRIMARY KEY,
          customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
          image_url VARCHAR(255) NOT NULL
        )
      `);
      console.log(
        "Customer measurement images table created or already exists."
      );

      // Create workers table
      console.log("Creating workers table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS workers (
          worker_id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          suits_assigned INTEGER DEFAULT 0
        )
      `);
      console.log("Workers table created or already exists.");

      // Create suits table
      console.log("Creating suits table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS suits (
          suit_id VARCHAR(50) PRIMARY KEY,
          customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'no progress',
          order_date DATE,
          due_date DATE,
          worker_id INTEGER REFERENCES workers(worker_id) ON DELETE SET NULL,
          CONSTRAINT valid_status CHECK (status IN ('no progress', 'work', 'stitching', 'warehouse', 'dispatched', 'completed'))
        )
      `);
      console.log("Suits table created or already exists.");

      // Create suit_images table
      console.log("Creating suit_images table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS suit_images (
          image_id SERIAL PRIMARY KEY,
          suit_id VARCHAR(50) REFERENCES suits(suit_id) ON DELETE CASCADE,
          image_url VARCHAR(255) NOT NULL
        )
      `);
      console.log("Suit images table created or already exists.");

      // Create users table
      console.log("Creating users table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
        )
      `);
      console.log("Users table created or already exists.");

      // Create triggers
      console.log("Creating customer suits count trigger...");
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_customer_suits_count()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            UPDATE customers
            SET total_suits = total_suits + 1
            WHERE customer_id = NEW.customer_id;
          ELSIF TG_OP = 'DELETE' THEN
            UPDATE customers
            SET total_suits = total_suits - 1
            WHERE customer_id = OLD.customer_id;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS after_suit_insert_delete ON suits;
        CREATE TRIGGER after_suit_insert_delete
        AFTER INSERT OR DELETE ON suits
        FOR EACH ROW
        EXECUTE FUNCTION update_customer_suits_count();
      `);
      console.log("Customer suits count trigger created or updated.");

      console.log("Creating worker suits count trigger...");
      await pool.query(`
        CREATE OR REPLACE FUNCTION update_worker_suits_count()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'UPDATE' THEN
            -- If worker_id is being set (was NULL before)
            IF NEW.worker_id IS NOT NULL AND OLD.worker_id IS NULL THEN
              UPDATE workers
              SET suits_assigned = suits_assigned + 1
              WHERE worker_id = NEW.worker_id;
            -- If worker_id is being changed
            ELSIF NEW.worker_id IS NOT NULL AND OLD.worker_id IS NOT NULL AND NEW.worker_id != OLD.worker_id THEN
              UPDATE workers
              SET suits_assigned = suits_assigned - 1
              WHERE worker_id = OLD.worker_id;
              
              UPDATE workers
              SET suits_assigned = suits_assigned + 1
              WHERE worker_id = NEW.worker_id;
            -- If worker_id is being removed
            ELSIF NEW.worker_id IS NULL AND OLD.worker_id IS NOT NULL THEN
              UPDATE workers
              SET suits_assigned = suits_assigned - 1
              WHERE worker_id = OLD.worker_id;
            END IF;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS after_suit_worker_update ON suits;
        CREATE TRIGGER after_suit_worker_update
        AFTER UPDATE OF worker_id ON suits
        FOR EACH ROW
        EXECUTE FUNCTION update_worker_suits_count();
      `);
      console.log("Worker suits count trigger created or updated.");

      // Commit the transaction
      await pool.query("COMMIT");
      console.log("Database schema created successfully");
    } catch (err) {
      // Rollback the transaction if there's an error
      await pool.query("ROLLBACK");
      throw err;
    }

    // Check if admin user exists
    console.log("Checking for admin user...");
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE username = 'admin'"
    );

    if (userCheck.rows.length === 0) {
      console.log("Creating admin user...");

      try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        // Create admin user
        const insertResult = await pool.query(
          "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *",
          ["admin", hashedPassword, "admin"]
        );

        console.log("Admin user created successfully");
      } catch (err) {
        console.error("Error creating admin user:", err.message);
      }
    } else {
      console.log("Admin user already exists");
    }

    // Clear the timeout since initialization completed successfully
    clearTimeout(initTimeout);
    console.log("Database initialization complete.");
  } catch (err) {
    console.error("Error initializing database:", err);
    // Try to rollback if there's an error
    try {
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back due to error");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr.message);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
      console.log("Database connection pool closed");
    } catch (err) {
      console.error("Error closing database connection pool:", err.message);
    }
  }
};

initializeDatabase();
