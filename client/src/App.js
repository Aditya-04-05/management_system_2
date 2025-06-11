import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// Layout Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Suits from "./pages/Suits";
import SuitDetail from "./pages/SuitDetail";
import Workers from "./pages/Workers";
import WorkerDetail from "./pages/WorkerDetail";
import Login from "./pages/Login";
import Search from "./pages/Search";
import QRScannerPage from "./pages/QRScannerPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      if (token) {
        try {
          // Set auth token header
          axios.defaults.headers.common["x-auth-token"] = token;

          // Get user data
          const res = await axios.get("/api/auth/user");
          setUser(res.data);
        } catch (err) {
          // Clear token if invalid
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["x-auth-token"];
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    try {
      const res = await axios.post("/api/auth/login", { username, password });

      // Save token and set headers
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["x-auth-token"] = res.data.token;

      setToken(res.data.token);

      // Get user data
      const userRes = await axios.get("/api/auth/user");
      setUser(userRes.data);

      return true;
    } catch (err) {
      return { error: err.response?.data?.msg || "Login failed" };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["x-auth-token"];
    setToken(null);
    setUser(null);
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="text-center p-5">Loading...</div>;
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Navbar user={user} logout={logout} />

        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/" /> : <Login login={login} />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <Dashboard />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <Customers />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <CustomerDetail />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/suits"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <Suits />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/suits/:id"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <SuitDetail />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/workers"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <Workers />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/workers/:id"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <WorkerDetail />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/search/:type/:term"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <Search />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/qr-scanner"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-md-2 d-none d-md-block bg-light sidebar">
                      <Sidebar />
                    </div>
                    <div className="col-md-10 ms-sm-auto px-md-4">
                      <QRScannerPage />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
