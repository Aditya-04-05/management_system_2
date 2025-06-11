# Management System

A full-stack application for managing customers, suits, and workers.

## Features

- User authentication
- Customer management
- Suit tracking
- Worker assignment
- Search functionality
- Image uploads

## Technologies Used

- **Frontend**: React, React Router, Bootstrap, Axios
- **Backend**: Node.js, Express
- **Database**: PostgreSQL

## Deployment Instructions for Render.com

### Initial Deployment

1. **Push your code to GitHub**

2. **Create a PostgreSQL database on Render.com**

   - Go to the Render dashboard and click "New" > "PostgreSQL"
   - Configure your database:
     - Name: management-system-db
     - Database: management_system
     - User: postgres (or choose your own)
     - Set a secure password
   - Note down the connection string provided by Render

3. **Deploy the Web Service on Render.com**

   - Go to the Render dashboard and click "New" > "Web Service"
   - Connect your GitHub repository
   - Configure your web service:
     - Name: management-system
     - Environment: Node
     - Build Command: `npm run build`
     - Start Command: `npm run test-server` (initially for testing)
   - Set environment variables:
     - `CONNECTION_STRING`: Your PostgreSQL connection string from step 2
     - `JWT_SECRET`: A secure random string for JWT authentication
     - `NODE_ENV`: production
     - `PORT`: 10000

4. **Test the Deployment**
   - Once deployed, visit your application URL
   - Verify that the test server is working by visiting `/api/health`
   - If everything is working, update the start command to `npm start` for full functionality

### Troubleshooting

If you encounter issues with the deployment:

1. **Check the Render logs** for error messages

2. **Database Connection Issues**

   - Verify that the CONNECTION_STRING environment variable is set correctly
   - Make sure the database is accessible from the web service

3. **Server Timeout Issues**

   - Try using the test server (`npm run test-server`) to verify basic functionality
   - Check for long-running queries or operations in your code

4. **File Upload Issues**
   - Verify that the uploads directory is being created correctly
   - Check permissions for file creation

## Local Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Database Setup

1. Create a PostgreSQL database:

   ```
   psql -U postgres
   ```

2. Run the database setup script:

   ```
   psql -U postgres -f server/database.sql
   ```

3. Create a default admin user:
   ```sql
   INSERT INTO users (username, password, role)
   VALUES ('admin', '$2a$10$3QeJsrBJtECXMOTSNa1KQ.7exZWFYxKbJMCKFHC4.OPgYKMSXTZMi', 'admin');
   ```
   (This creates a user with username: admin, password: admin123)

### Server Setup

1. Navigate to the server directory:

   ```
   cd server
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following content:

   ```
   CONNECTION_STRING=postgresql://postgres:your_password@localhost:5432/management_system
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. Start the server:
   ```
   npm start
   ```

### Client Setup

1. Navigate to the client directory:

   ```
   cd client
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the client:

   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Login with the default admin credentials:

   - Username: admin
   - Password: admin123

2. Use the sidebar to navigate between different sections:

   - Dashboard: Overview of all data
   - Customers: Manage customers
   - Suits: Track suits
   - Workers: Manage workers

3. Use the search functionality in the navbar to find specific items

## Folder Structure

```
├── client/                 # React frontend
│   ├── public/             # Public assets
│   └── src/                # Source files
│       ├── components/     # Reusable components
│       └── pages/          # Page components
├── server/                 # Node.js backend
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── uploads/            # Uploaded files
│   ├── database.sql        # Database schema
│   ├── db.js               # Database connection
│   └── server.js           # Server entry point
└── README.md               # Project documentation
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/user` - Get current user

### Customers

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create a customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer
- `GET /api/customers/search/:term` - Search customers

### Suits

- `GET /api/suits` - Get all suits
- `GET /api/suits/:id` - Get suit by ID
- `POST /api/suits` - Create a suit
- `PUT /api/suits/:id` - Update a suit
- `DELETE /api/suits/:id` - Delete a suit
- `GET /api/suits/search/:term` - Search suits

### Workers

- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get worker by ID
- `POST /api/workers` - Create a worker
- `PUT /api/workers/:id` - Update a worker
- `DELETE /api/workers/:id` - Delete a worker
- `GET /api/workers/search/:term` - Search workers
# management_system_2
# management_system_2
