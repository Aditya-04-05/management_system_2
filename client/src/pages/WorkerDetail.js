import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Button, Alert } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/workers/${id}`);
        setWorker(res.data);
      } catch (err) {
        setError("Failed to load worker data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorker();
  }, [id]);
  
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
  
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger" className="my-3">
        {error}
      </Alert>
    );
  }
  
  if (!worker) {
    return (
      <Alert variant="warning" className="my-3">
        Worker not found
      </Alert>
    );
  }
  
  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Worker Details</h2>
        <Button variant="outline-primary" onClick={() => navigate("/workers")}>
          Back to Workers
        </Button>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Worker Information</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-3 text-muted">Worker ID:</div>
            <div className="col-md-9 mb-2">{worker.worker_id}</div>
            
            <div className="col-md-3 text-muted">Name:</div>
            <div className="col-md-9 mb-2">{worker.name}</div>
          </div>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Assigned Suits</h5>
        </Card.Header>
        <Card.Body>
          {!worker.suits || worker.suits.length === 0 ? (
            <p className="text-center">No suits assigned to this worker</p>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Suit ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {worker.suits.map(suit => (
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
                      <td>{formatDate(suit.due_date)}</td>
                      <td>
                        <Link to={`/suits/${suit.suit_id}`} className="btn btn-sm btn-outline-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default WorkerDetail;