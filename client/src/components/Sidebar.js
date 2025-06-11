import React, { useState } from "react";
import { Nav, Button, Modal, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const Sidebar = () => {
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    phone_number: "",
    instagram_id: "",
    due_date: "",
    pending_amount: "",
    received_amount: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setShowAddModal(false);
    setError("");
  };

  const handleShow = () => setShowAddModal(true);

  const handleChange = (e) => {
    setCustomerData({
      ...customerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate at least one contact method
    if (!customerData.phone_number && !customerData.instagram_id) {
      setError("Please provide either a phone number or Instagram ID");
      setLoading(false);
      return;
    }

    try {
      // Create customer
      await axios.post("/api/customers", customerData);

      // Reset form and close modal
      setCustomerData({
        name: "",
        phone_number: "",
        instagram_id: "",
        due_date: "",
        pending_amount: "",
        received_amount: "",
      });

      handleClose();

      // Reload page to show new customer
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="position-sticky pt-3">
        <Nav className="flex-column">
          <Nav.Link
            as={Link}
            to="/"
            className={location.pathname === "/" ? "active" : ""}
          >
            Dashboard
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/customers"
            className={location.pathname.includes("/customers") ? "active" : ""}
          >
            Customers
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/suits"
            className={location.pathname.includes("/suits") ? "active" : ""}
          >
            Suits
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/workers"
            className={location.pathname.includes("/workers") ? "active" : ""}
          >
            Workers
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/qr-scanner"
            className={
              location.pathname.includes("/qr-scanner") ? "active" : ""
            }
          >
            <i className="bi bi-qr-code-scan me-1"></i> QR Scanner
          </Nav.Link>
        </Nav>

        <hr />

        <div className="d-grid gap-2 px-3">
          <Button variant="success" onClick={handleShow}>
            Add Order
          </Button>
        </div>
      </div>

      {/* Add Order Modal */}
      <Modal show={showAddModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone_number"
                value={customerData.phone_number}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
              <Form.Text className="text-muted">
                Either phone number or Instagram ID is required
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Instagram ID</Form.Label>
              <Form.Control
                type="text"
                name="instagram_id"
                value={customerData.instagram_id}
                onChange={handleChange}
                placeholder="Enter Instagram ID"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="due_date"
                value={customerData.due_date}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pending Amount</Form.Label>
              <Form.Control
                type="number"
                name="pending_amount"
                value={customerData.pending_amount}
                onChange={handleChange}
                placeholder="Enter pending amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Received Amount</Form.Label>
              <Form.Control
                type="number"
                name="received_amount"
                value={customerData.received_amount}
                onChange={handleChange}
                placeholder="Enter received amount"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Customer"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Sidebar;
