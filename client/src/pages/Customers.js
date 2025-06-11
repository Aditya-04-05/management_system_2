import React, { useState, useEffect } from "react";
import { Card, Table, Button, Badge, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    phone_number: "",
    instagram_id: "",
    due_date: "",
    pending_amount: "",
    received_amount: "",
    measurement_image: null, // Changed from measurement_image_url to measurement_image
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [sortField, setSortField] = useState("due_date");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/customers");
        setCustomers(res.data);
      } catch (err) {
        setError("Failed to load customers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleClose = () => {
    setShowAddModal(false);
    setFormError("");
    setCustomerData({
      name: "",
      phone_number: "",
      instagram_id: "",
      due_date: "",
      pending_amount: "",
      received_amount: "",
      measurement_image: null, // Changed from measurement_image_url to measurement_image
    });
  };

  const handleShow = () => setShowAddModal(true);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "measurement_image_url" && files && files.length > 0) {
      setCustomerData({
        ...customerData,
        measurement_image: files, // Store all files
      });
    } else {
      setCustomerData({
        ...customerData,
        [name]: value,
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!customerData.phone_number && !customerData.instagram_id) {
      setFormError("Please provide either a phone number or Instagram ID");
      setFormLoading(false);
      return;
    }

    try {
      const formData = new FormData();

      // Add basic customer data
      formData.append("name", customerData.name || "");
      formData.append("phone_number", customerData.phone_number || "");
      formData.append("instagram_id", customerData.instagram_id || "");
      formData.append("due_date", customerData.due_date || "");
      formData.append("pending_amount", customerData.pending_amount || "");
      formData.append("received_amount", customerData.received_amount || "");

      // Add measurement images if they exist
      if (customerData.measurement_image) {
        for (let i = 0; i < customerData.measurement_image.length; i++) {
          formData.append(
            "measurement_image_url",
            customerData.measurement_image[i]
          );
        }
      }

      console.log("Adding customer with data:", customerData);

      const res = await axios.post("/api/customers", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Add response:", res.data);

      setCustomers([...customers, res.data]);
      handleClose();
    } catch (err) {
      console.error("Add error:", err);
      setFormError(err.response?.data?.msg || "Failed to add customer");
    } finally {
      setFormLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort customers
  const sortedCustomers = [...customers].sort((a, b) => {
    let comparison = 0;

    if (sortField === "name") {
      const nameA = a.name || "";
      const nameB = b.name || "";
      comparison = nameA.localeCompare(nameB);
    } else if (sortField === "due_date") {
      const dateA = a.due_date
        ? new Date(a.due_date)
        : new Date(8640000000000000);
      const dateB = b.due_date
        ? new Date(b.due_date)
        : new Date(8640000000000000);
      comparison = dateA - dateB;
    } else if (sortField === "total_suits") {
      comparison = a.total_suits - b.total_suits;
    } else if (sortField === "pending_amount") {
      comparison =
        parseFloat(a.pending_amount || 0) - parseFloat(b.pending_amount || 0);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customers</h2>
        <Button variant="primary" onClick={handleShow}>
          Add Customer
        </Button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            {customers.length === 0 ? (
              <p className="text-center">No customers found</p>
            ) : (
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th
                        onClick={() => handleSort("name")}
                        style={{ cursor: "pointer" }}
                      >
                        Name{" "}
                        {sortField === "name" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th>Contact</th>
                      <th
                        onClick={() => handleSort("total_suits")}
                        style={{ cursor: "pointer" }}
                      >
                        Suits{" "}
                        {sortField === "total_suits" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("due_date")}
                        style={{ cursor: "pointer" }}
                      >
                        Due Date{" "}
                        {sortField === "due_date" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("pending_amount")}
                        style={{ cursor: "pointer" }}
                      >
                        Pending{" "}
                        {sortField === "pending_amount" &&
                          (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCustomers.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td>{customer.customer_id}</td>
                        <td>
                          {customer.name || (
                            <span className="text-muted">Not provided</span>
                          )}
                        </td>
                        <td>
                          {customer.phone_number && (
                            <div>{customer.phone_number}</div>
                          )}
                          {customer.instagram_id && (
                            <div className="text-muted">
                              @{customer.instagram_id}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge
                            bg={
                              customer.total_suits > 0 ? "primary" : "secondary"
                            }
                          >
                            {customer.total_suits}
                          </Badge>
                        </td>
                        <td>{formatDate(customer.due_date)}</td>
                        <td>
                          {parseFloat(customer.pending_amount) > 0 ? (
                            <span className="text-danger">
                              {formatCurrency(customer.pending_amount)}
                            </span>
                          ) : (
                            <span className="text-success">Paid</span>
                          )}
                        </td>
                        <td>
                          <Link
                            to={`/customers/${customer.customer_id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
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

      {/* Add Customer Modal */}
      <Modal show={showAddModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <div className="alert alert-danger">{formError}</div>}

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
            <Form.Group className="mb-3">
              <Form.Label>Measurement Image</Form.Label>
              <Form.Control
                type="file"
                name="measurement_image_url"
                onChange={handleChange}
                multiple
                accept="image/*"
              />
              <Form.Text className="text-muted">
                You can select multiple images
              </Form.Text>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Customer"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Customers;
