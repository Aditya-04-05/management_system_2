const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting deployment process...');

// Create a log directory
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create log streams
const dbLogStream = fs.createWriteStream(path.join(logDir, 'db-init.log'), { flags: 'a' });
const serverLogStream = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' });

// Log timestamp
const timestamp = new Date().toISOString();
dbLogStream.write(`\n\n--- Deployment started at ${timestamp} ---\n`);
serverLogStream.write(`\n\n--- Deployment started at ${timestamp} ---\n`);

// Set a timeout for database initialization (2 minutes)
const dbInitTimeout = setTimeout(() => {
  console.error('Database initialization timed out after 2 minutes');
  dbLogStream.write('Database initialization timed out after 2 minutes\n');
  process.exit(1);
}, 120000);

// Run database initialization
console.log('Initializing database...');
const initDb = spawn('node', [path.join(__dirname, 'server', 'init-db.js')]);

initDb.stdout.on('data', (data) => {
  const output = `DB Init: ${data}`;
  console.log(output);
  dbLogStream.write(output);
});

initDb.stderr.on('data', (data) => {
  const output = `DB Init Error: ${data}`;
  console.error(output);
  dbLogStream.write(output);
});

initDb.on('close', (code) => {
  clearTimeout(dbInitTimeout);
  const message = `Database initialization process exited with code ${code}`;
  console.log(message);
  dbLogStream.write(message + '\n');
  
  if (code === 0 || code === null) {
    console.log('Starting server...');
    serverLogStream.write('Starting server...\n');
    
    // Start the server directly (no spawn)
    try {
      // Set environment variable to skip DB initialization in server.js
      process.env.DB_INITIALIZED = 'true';
      
      // Require and run the server directly
      console.log('Server starting...');
      serverLogStream.write('Server starting directly...\n');
      
      // Start the server
      const server = spawn('node', [path.join(__dirname, 'server', 'server.js')]);
      
      server.stdout.on('data', (data) => {
        const output = `Server: ${data}`;
        console.log(output);
        serverLogStream.write(output);
      });
      
      server.stderr.on('data', (data) => {
        const output = `Server Error: ${data}`;
        console.error(output);
        serverLogStream.write(output);
      });
      
      server.on('close', (code) => {
        const message = `Server process exited with code ${code}`;
        console.log(message);
        serverLogStream.write(message + '\n');
      });
      
      // Handle process termination
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        serverLogStream.write('SIGTERM received, shutting down gracefully\n');
        server.kill('SIGTERM');
      });
      
    } catch (error) {
      console.error('Error starting server:', error);
      serverLogStream.write(`Error starting server: ${error.message}\n`);
      process.exit(1);
    }
  } else {
    console.error('Database initialization failed. Server will not start.');
    dbLogStream.write('Database initialization failed. Server will not start.\n');
    process.exit(1);
  }
});