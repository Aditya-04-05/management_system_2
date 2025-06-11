const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20, // Maximum number of clients in the pool
});

// Log connection errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});

module.exports = pool;
