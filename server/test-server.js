const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

console.log("Starting test server...");

const app = express();

// Basic middleware
app.use(express.json());

// Add a simple health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Add a simple test route
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Test server is working" });
});

// Serve static files from client/build if it exists
const clientBuildPath = path.join(__dirname, "../client");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  console.log("Serving static files from:", clientBuildPath);

  // Serve index.html for all other routes
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.resolve(clientBuildPath, "index.html"));
    }
  });
} else {
  console.log("Client build directory not found");

  // Fallback route
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.send("Client build not available. This is a test server.");
    }
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
