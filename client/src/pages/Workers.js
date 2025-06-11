import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Button, Alert, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/workers");
        setWorkers(res.data);
      } catch (err) {
        setError("Failed to load workers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkers();
  }, []);
  
  const handleClose = () => {
    setShowAddModal(false);
    setWorkerName("");
    setFormError("");
  };
  
  const handleShow = () => setShowAddModal(true);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    
    if (!workerName.trim()) {
      setFormError("Worker name is required");
      setFormLoading(false);
      return;
    }
    
    try {
      const res = await axios.post("/api/workers", { name: workerName });
      
      // Add to state
      setWorkers([...workers, res.data]);
      
      // Reset form and close modal
      handleClose();
    } catch (err) {
      setFormError(err.response?.data?.msg || "Failed to add worker");
    } finally {
      setFormLoading(false);
    }
  };
  
  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Workers</h2>
        <Button variant="primary" onClick={handleShow}>
          Add Worker
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            {workers.length === 0 ? (
              <p className="text-center">No workers found</p>
            ) : (
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map(worker => (
                      <tr key={worker.worker_id}>
                        <td>{worker.worker_id}</td>
                        <td>{worker.name}</td>
                        <td>
                          <Link to={`/workers/${worker.worker_id}`} className="btn btn-sm btn-outline-primary">
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
      )}
      
      {/* Add Worker Modal */}
      <Modal show={showAddModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Worker</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Worker Name</Form.Label>
              <Form.Control
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Enter worker name"
                required
              />
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Worker"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Workers;