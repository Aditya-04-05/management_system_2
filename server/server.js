const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
require("dotenv").config();

console.log("Starting server initialization...");
console.log("Node.js version:", process.version);
console.log("Environment:", process.env.NODE_ENV);

// Create uploads directory and subdirectories if they don't exist
const uploadsDir = path.join(__dirname, "uploads");
const measurementsDir = path.join(uploadsDir, "measurements");
const suitsDir = path.join(uploadsDir, "suits");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("Created uploads directory");
  }
  if (!fs.existsSync(measurementsDir)) {
    fs.mkdirSync(measurementsDir, { recursive: true });
    console.log("Created measurements directory");
  }
  if (!fs.existsSync(suitsDir)) {
    fs.mkdirSync(suitsDir, { recursive: true });
    console.log("Created suits directory");
  }
} catch (err) {
  console.error("Error creating directories:", err);
}

const app = express();

// Add request timeout middleware
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  req.setTimeout(30000, () => {
    console.error(`Request timeout: ${req.method} ${req.url}`);
    res.status(503).json({
      error: "Request timeout",
      message: "The server took too long to respond",
    });
  });
  next();
});

// Basic middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add a simple health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes with error handling
try {
  console.log("Loading routes...");
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/customers", require("./routes/customers"));
  app.use("/api/suits", require("./routes/suits"));
  app.use("/api/workers", require("./routes/workers"));
  console.log("Routes loaded successfully");
} catch (err) {
  console.error("Error loading routes:", err);
}

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  console.log("Setting up production static file serving...");
  try {
    // Set static folder
    const clientBuildPath = path.join(__dirname, "../client/");
    if (fs.existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      console.log("Serving static files from:", clientBuildPath);

      // Any route that is not an API route will be redirected to index.html
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
          res.sendFile(path.resolve(clientBuildPath, "index.html"));
        }
      });
    } else {
      console.error("Client build directory does not exist:", clientBuildPath);
    }
  } catch (err) {
    console.error("Error setting up static file serving:", err);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Server error",
    message: err.message,
    path: req.path,
    method: req.method,
  });
});

// Create HTTP server
const server = http.createServer(app);

// Set server timeout
server.timeout = 60000; // 60 seconds

const PORT = process.env.PORT || 5000;

// Start server with error handling
server
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error("Error starting server:", err);
  });

// Handle process termination
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
