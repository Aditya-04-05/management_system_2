import React, { useState, useEffect } from "react";
import { Card, Row, Col, Table, Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [suits, setSuits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [suitsRes, customersRes, workersRes] = await Promise.all([
          axios.get("/api/suits"),
          axios.get("/api/customers"),
          axios.get("/api/workers")
        ]);
        
        setSuits(suitsRes.data);
        setCustomers(customersRes.data);
        setWorkers(workersRes.data);
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "no progress":
        return "secondary";
      case "work":
        return "primary";
      case "stitching":
        return "info";
      case "warehouse":
        return "warning";
      case "dispatched":
      case "completed":
        return "success";
      default:
        return "secondary";
    }
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    
    // Reset time part for accurate day calculation
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Get days remaining text with color
  const getDaysRemainingText = (dueDate) => {
    const days = getDaysRemaining(dueDate);
    
    if (days === null) return { text: "No due date", color: "text-secondary" };
    
    if (days < 0) {
      return { text: `${Math.abs(days)} days overdue`, color: "text-danger" };
    } else if (days === 0) {
      return { text: "Due today", color: "text-warning" };
    } else if (days === 1) {
      return { text: "Due tomorrow", color: "text-warning" };
    } else if (days <= 3) {
      return { text: `${days} days remaining`, color: "text-warning" };
    } else {
      return { text: `${days} days remaining`, color: "text-success" };
    }
  };
  
  // Stats
  const totalCustomers = customers?.length || 0;
  const totalSuits = suits?.length || 0;
  const pendingSuits = suits?.filter(suit => suit.status !== "completed" && suit.status !== "dispatched").length || 0;
  const totalWorkers = workers?.length || 0;
  
  // Sort suits by due date
  const sortedSuits = [...(suits || [])].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });
  
  return (
    <div className="py-4">
      <h2 className="mb-4">Dashboard</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>Total Customers</Card.Title>
                  <Card.Text className="display-4">{totalCustomers}</Card.Text>
                  <Link to="/customers" className="btn btn-sm btn-outline-primary">View All</Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>Total Suits</Card.Title>
                  <Card.Text className="display-4">{totalSuits}</Card.Text>
                  <Link to="/suits" className="btn btn-sm btn-outline-primary">View All</Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>Pending Suits</Card.Title>
                  <Card.Text className="display-4">{pendingSuits}</Card.Text>
                  <Link to="/suits" className="btn btn-sm btn-outline-warning">View Pending</Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>Workers</Card.Title>
                  <Card.Text className="display-4">{totalWorkers}</Card.Text>
                  <Link to="/workers" className="btn btn-sm btn-outline-primary">View All</Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Recent orders */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Recent Orders</h5>
            </Card.Header>
            <Card.Body>
              {sortedSuits.length === 0 ? (
                <p className="text-center">No suits found</p>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Suit ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Worker</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSuits.slice(0, 10).map(suit => {
                        const daysRemaining = getDaysRemainingText(suit.due_date);
                        
                        return (
                          <tr key={suit.suit_id}>
                            <td>{suit.suit_id}</td>
                            <td>
                              <Link to={`/customers/${suit.customer_id}`}>
                                {suit.customer_name || "Unknown"}
                              </Link>
                            </td>
                            <td>
                              <Badge bg={getStatusColor(suit.status)}>
                                {suit.status}
                              </Badge>
                            </td>
                            <td>
                              {suit.worker_name ? (
                                <Link to={`/workers/${suit.worker_id}`}>
                                  {suit.worker_name}
                                </Link>
                              ) : (
                                <span className="text-muted">Not assigned</span>
                              )}
                            </td>
                            <td>
                              <div className={daysRemaining.color}>
                                {formatDate(suit.due_date)}
                                <br />
                                <small>{daysRemaining.text}</small>
                              </div>
                            </td>
                            <td>
                              <Link to={`/suits/${suit.suit_id}`} className="btn btn-sm btn-outline-primary me-2">
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {sortedSuits.length > 10 && (
                <div className="text-center mt-3">
                  <Link to="/suits" className="btn btn-outline-primary">
                    View All Suits
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;