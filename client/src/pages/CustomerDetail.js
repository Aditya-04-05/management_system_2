import React, { useState, useEffect } from "react";
import { Image } from "react-bootstrap";

import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import ImageModal from "../components/ImageModal";
import QRCodeModal from "../components/QRCodeModal";
import QRScanner from "../components/QRScanner";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSuitModal, setShowAddSuitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showEditSuitModal, setShowEditSuitModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSuit, setSelectedSuit] = useState(null);
  const [customerData, setCustomerData] = useState({
    name: "",
    phone_number: "",
    instagram_id: "",
    due_date: "",
    pending_amount: "",
    received_amount: "",
    measurement_image: null,
    delete_images: [],
  });

  const [suitData, setSuitData] = useState({
    status: "no progress",
    due_date: "",
    worker_id: "",
    images: [],
  });

  const [editSuitData, setEditSuitData] = useState({
    suit_id: "",
    status: "",
    due_date: "",
    worker_id: "",
    images: [],
    delete_images: [],
  });

  const [workers, setWorkers] = useState([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch customer data
        const customerRes = await axios.get(`/api/customers/${id}`);
        setCustomer(customerRes.data);

        // Set form data for editing
        setCustomerData({
          name: customerRes.data.name || "",
          phone_number: customerRes.data.phone_number || "",
          instagram_id: customerRes.data.instagram_id || "",
          due_date: customerRes.data.due_date
            ? new Date(customerRes.data.due_date).toISOString().split("T")[0]
            : "",
          pending_amount: customerRes.data.pending_amount || "",
          received_amount: customerRes.data.received_amount || "",
        });

        // Set default due date for new suit
        setSuitData({
          ...suitData,
          due_date: customerRes.data.due_date
            ? new Date(customerRes.data.due_date).toISOString().split("T")[0]
            : "",
        });

        // Fetch workers for dropdown
        const workersRes = await axios.get("/api/workers");
        setWorkers(workersRes.data);
      } catch (err) {
        setError("Failed to load customer data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEditClose = () => {
    setShowEditModal(false);
    setFormError("");

    // Reset form data
    if (customer) {
      setCustomerData({
        name: customer.name || "",
        phone_number: customer.phone_number || "",
        instagram_id: customer.instagram_id || "",
        due_date: customer.due_date
          ? new Date(customer.due_date).toISOString().split("T")[0]
          : "",
        pending_amount: customer.pending_amount || "",
        received_amount: customer.received_amount || "",
        measurement_image: null, // Reset file upload
        delete_images: [], // Reset delete images
      });
    }
  };

  const handleAddSuitClose = () => {
    setShowAddSuitModal(false);
    setFormError("");

    // Reset form data
    setSuitData({
      status: "no progress",
      due_date: customer?.due_date
        ? new Date(customer.due_date).toISOString().split("T")[0]
        : "",
      worker_id: "",
      images: [],
    });
  };

  const handleEditSuitClose = () => {
    setShowEditSuitModal(false);
    setFormError("");
    setSelectedSuit(null);
    setEditSuitData({
      suit_id: "",
      status: "",
      due_date: "",
      worker_id: "",
      images: [],
      delete_images: [],
    });
  };

  const handleEditSuit = (suit) => {
    setSelectedSuit(suit);
    setEditSuitData({
      suit_id: suit.suit_id,
      status: suit.status || "no progress",
      due_date: suit.due_date
        ? new Date(suit.due_date).toISOString().split("T")[0]
        : "",
      worker_id: suit.worker_id || "",
      images: [],
      delete_images: [],
    });
    setShowEditSuitModal(true);
  };

  const handleDeleteClose = () => {
    setShowDeleteModal(false);
  };

  const handleCustomerChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "measurement_image_url" && files && files.length > 0) {
      setCustomerData({
        ...customerData,
        measurement_image: files, // Store all files
        delete_images: [], // Reset delete_images when new files are selected
      });
    } else {
      setCustomerData({
        ...customerData,
        [name]: value,
      });
    }
  };

  const handleSuitChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      setSuitData({
        ...suitData,
        images: files,
      });
    } else {
      setSuitData({
        ...suitData,
        [name]: value,
      });
    }
  };

  const handleEditSuitChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "images") {
      setEditSuitData({
        ...editSuitData,
        images: files,
      });
    } else {
      setEditSuitData({
        ...editSuitData,
        [name]: value,
      });
    }
  };

  const handleDeleteImage = (imageId) => {
    setEditSuitData({
      ...editSuitData,
      delete_images: [...editSuitData.delete_images, imageId],
    });
  };

  const handleDeleteMeasurementImage = (imageId) => {
    setCustomerData({
      ...customerData,
      delete_images: [...customerData.delete_images, imageId],
    });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

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

      // Add images to delete
      if (customerData.delete_images && customerData.delete_images.length > 0) {
        formData.append("delete_images", customerData.delete_images);
      }

      console.log("Updating customer with data:", customerData);

      const res = await axios.put(`/api/customers/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Update response:", res.data);

      setCustomer({
        ...customer,
        ...res.data,
      });

      setShowEditModal(false);
    } catch (err) {
      console.error("Update error:", err);
      setFormError(err.response?.data?.msg || "Failed to update customer");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddSuit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("customer_id", id);
      formData.append("status", suitData.status);
      formData.append("due_date", suitData.due_date);
      formData.append("worker_id", suitData.worker_id);

      // Append each image file to the form data
      if (suitData.images && suitData.images.length > 0) {
        for (let i = 0; i < suitData.images.length; i++) {
          formData.append("images", suitData.images[i]);
        }
      }

      const res = await axios.post("/api/suits", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update state
      setCustomer({
        ...customer,
        suits: [...(customer.suits || []), res.data],
        total_suits: (customer.total_suits || 0) + 1,
      });

      // Close modal
      setShowAddSuitModal(false);
    } catch (err) {
      setFormError(err.response?.data?.msg || "Failed to add suit");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setFormLoading(true);

    try {
      await axios.delete(`/api/customers/${id}`);

      // Redirect to customers list
      navigate("/customers");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete customer");
      setShowDeleteModal(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSuit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const formData = new FormData();

      // Add basic suit data
      formData.append("status", editSuitData.status);
      formData.append("due_date", editSuitData.due_date);
      formData.append("worker_id", editSuitData.worker_id);

      // Add images to delete
      if (editSuitData.delete_images && editSuitData.delete_images.length > 0) {
        formData.append("delete_images", editSuitData.delete_images);
      }

      // Add new images
      if (editSuitData.images && editSuitData.images.length > 0) {
        for (let i = 0; i < editSuitData.images.length; i++) {
          formData.append("images", editSuitData.images[i]);
        }
      }

      const res = await axios.put(
        `/api/suits/${editSuitData.suit_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the suit in the customer's suits array
      const updatedSuits = Array.isArray(customer.suits)
        ? customer.suits.map((suit) =>
            suit.suit_id === res.data.suit_id ? res.data : suit
          )
        : [res.data];

      setCustomer({
        ...customer,
        suits: updatedSuits,
      });

      // Close modal
      setShowEditSuitModal(false);
    } catch (err) {
      setFormError(err.response?.data?.msg || "Failed to update suit");
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

  if (!customer) {
    return (
      <Alert variant="warning" className="my-3">
        Customer not found
      </Alert>
    );
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customer Details</h2>
        <div>
          <Button
            variant="outline-info"
            className="me-2"
            onClick={() => setShowQRScannerModal(true)}
          >
            <i className="bi bi-qr-code-scan me-1"></i> Scan QR
          </Button>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => setShowEditModal(true)}
          >
            Edit Customer
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Customer Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={4} className="text-muted">
                  Customer ID:
                </Col>
                <Col sm={8} className="mb-2">
                  {customer.customer_id}
                </Col>

                <Col sm={4} className="text-muted">
                  Name:
                </Col>
                <Col sm={8} className="mb-2">
                  {customer.name || (
                    <span className="text-muted">Not provided</span>
                  )}
                </Col>

                <Col sm={4} className="text-muted">
                  Phone Number:
                </Col>
                <Col sm={8} className="mb-2">
                  {customer.phone_number || (
                    <span className="text-muted">Not provided</span>
                  )}
                </Col>

                <Col sm={4} className="text-muted">
                  Instagram ID:
                </Col>
                <Col sm={8} className="mb-2">
                  {customer.instagram_id ? (
                    `@${customer.instagram_id}`
                  ) : (
                    <span className="text-muted">Not provided</span>
                  )}
                </Col>

                <Col sm={4} className="text-muted">
                  Total Suits:
                </Col>
                <Col sm={8} className="mb-2">
                  <Badge bg="primary">{customer.total_suits || 0}</Badge>
                </Col>

                <Col sm={4} className="text-muted">
                  Order Date:
                </Col>
                <Col sm={8} className="mb-2">
                  {formatDate(customer.order_date)}
                </Col>

                <Col sm={4} className="text-muted">
                  Due Date:
                </Col>
                <Col sm={8} className="mb-2">
                  {formatDate(customer.due_date)}
                </Col>

                <Col sm={4} className="text-muted">
                  Pending Amount:
                </Col>
                <Col sm={8} className="mb-2">
                  {parseFloat(customer.pending_amount) > 0 ? (
                    <span className="text-danger">
                      {formatCurrency(customer.pending_amount)}
                    </span>
                  ) : (
                    <span className="text-success">No pending amount</span>
                  )}
                </Col>

                <Col sm={4} className="text-muted">
                  Received Amount:
                </Col>
                <Col sm={8} className="mb-2">
                  {formatCurrency(customer.received_amount)}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Measurement</h5>
            </Card.Header>
            <Card.Body className="text-center">
              {customer.measurement_images &&
              Array.isArray(customer.measurement_images) &&
              customer.measurement_images.length > 0 ? (
                <div className="d-flex flex-wrap justify-content-center">
                  {customer.measurement_images.map((image, idx) => (
                    <div key={image.image_id} className="m-2">
                      <img
                        src={image.image_url}
                        alt={`Measurement ${idx + 1}`}
                        className="img-thumbnail"
                        style={{
                          height: "150px",
                          cursor: "pointer",
                          objectFit: "cover",
                        }}
                        onClick={() => {
                          setSelectedImage(image.image_url);
                          setShowZoomModal(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted py-5">
                  No measurement images available
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Suits</h5>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddSuitModal(true)}
          >
            Add Suit
          </Button>
        </Card.Header>
        <Card.Body>
          {!customer.suits ||
          !Array.isArray(customer.suits) ||
          customer.suits.length === 0 ? (
            <p className="text-center">No suits found for this customer</p>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Suit ID</th>
                    <th>Status</th>
                    <th>Worker</th>
                    <th>Order Date</th>
                    <th>Due Date</th>
                    <th>Images</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.suits.map((suit) => (
                    <tr key={suit.suit_id}>
                      <td>{suit.suit_id}</td>
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
                      <td>{formatDate(suit.order_date)}</td>
                      <td>{formatDate(suit.due_date)}</td>
                      <td>
                        {suit.images &&
                        Array.isArray(suit.images) &&
                        suit.images.length > 0 ? (
                          <div className="d-flex flex-wrap">
                            {suit.images.map((image, idx) => (
                              <img
                                key={image.image_id || idx}
                                src={image.image_url}
                                alt={`Suit ${idx + 1}`}
                                className="img-thumbnail me-1 mb-1"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() => {
                                  setSelectedImage(image.image_url);
                                  setShowZoomModal(true);
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">No images</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link
                            to={`/suits/${suit.suit_id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </Link>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleEditSuit(suit)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                              setSelectedSuit(suit);
                              setShowQRCodeModal(true);
                            }}
                          >
                            QR
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      <Modal
        show={showZoomModal}
        onHide={() => setShowZoomModal(false)}
        centered
        size="lg"
      >
        <Modal.Body className="text-center">
          <Image
            src={customer.measurement_image_url}
            alt="Zoomed Measurement"
            fluid
          />
        </Modal.Body>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal show={showEditModal} onHide={handleEditClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form onSubmit={handleUpdateCustomer}>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleCustomerChange}
                placeholder="Enter customer name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone_number"
                value={customerData.phone_number}
                onChange={handleCustomerChange}
                placeholder="Enter phone number"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Instagram ID</Form.Label>
              <Form.Control
                type="text"
                name="instagram_id"
                value={customerData.instagram_id}
                onChange={handleCustomerChange}
                placeholder="Enter Instagram ID"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="due_date"
                value={customerData.due_date}
                onChange={handleCustomerChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pending Amount</Form.Label>
              <Form.Control
                type="number"
                name="pending_amount"
                value={customerData.pending_amount}
                onChange={handleCustomerChange}
                placeholder="Enter pending amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Received Amount</Form.Label>
              <Form.Control
                type="number"
                name="received_amount"
                value={customerData.received_amount}
                onChange={handleCustomerChange}
                placeholder="Enter received amount"
              />
            </Form.Group>
            {/* Current Measurement Images */}
            {customer.measurement_images &&
              Array.isArray(customer.measurement_images) &&
              customer.measurement_images.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Current Measurement Images</Form.Label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {customer.measurement_images
                      .filter(
                        (img) =>
                          !customerData.delete_images?.includes(img.image_id)
                      )
                      .map((image, idx) => (
                        <div key={image.image_id} className="position-relative">
                          <img
                            src={image.image_url}
                            alt={`Measurement ${idx + 1}`}
                            className="img-thumbnail"
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setSelectedImage(image.image_url);
                              setShowZoomModal(true);
                            }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0"
                            onClick={() =>
                              handleDeleteMeasurementImage(image.image_id)
                            }
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                  </div>
                  {customerData.delete_images &&
                    customerData.delete_images.length > 0 && (
                      <p className="text-muted small">
                        {customerData.delete_images.length} image(s) marked for
                        deletion
                      </p>
                    )}
                </Form.Group>
              )}

            {/* Add New Measurement Images */}
            <Form.Group className="mb-3">
              <Form.Label>Add Measurement Images</Form.Label>
              <Form.Control
                type="file"
                name="measurement_image_url"
                onChange={handleCustomerChange}
                multiple
                accept="image/*"
              />
              <Form.Text className="text-muted">
                You can select multiple images
              </Form.Text>
            </Form.Group>
            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={formLoading}>
                {formLoading ? "Updating..." : "Update Customer"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Suit Modal */}
      <Modal show={showAddSuitModal} onHide={handleAddSuitClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Suit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form onSubmit={handleAddSuit}>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={suitData.status}
                onChange={handleSuitChange}
              >
                <option value="no progress">No Progress</option>
                <option value="work">Work</option>
                <option value="stitching">Stitching</option>
                <option value="warehouse">Warehouse</option>
                <option value="dispatched">Dispatched</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                name="due_date"
                value={suitData.due_date}
                onChange={handleSuitChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assign Worker (Optional)</Form.Label>
              <Form.Select
                name="worker_id"
                value={suitData.worker_id}
                onChange={handleSuitChange}
              >
                <option value="">Select Worker</option>
                {workers.map((worker) => (
                  <option key={worker.worker_id} value={worker.worker_id}>
                    {worker.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Suit Images (Optional)</Form.Label>
              <Form.Control
                type="file"
                name="images"
                onChange={handleSuitChange}
                multiple
              />
              <Form.Text className="text-muted">
                You can select multiple images
              </Form.Text>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Suit"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* QR Code Modal */}
      {selectedSuit && (
        <QRCodeModal
          show={showQRCodeModal}
          onHide={() => setShowQRCodeModal(false)}
          suitId={selectedSuit.suit_id}
          suitInfo={selectedSuit}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        show={showQRScannerModal}
        onHide={() => setShowQRScannerModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete this customer? This will also delete
            all associated suits and cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteCustomer}
            disabled={formLoading}
          >
            {formLoading ? "Deleting..." : "Delete Customer"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Suit Modal */}
      {selectedSuit && (
        <Modal show={showEditSuitModal} onHide={handleEditSuitClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Suit: {editSuitData.suit_id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}

            <Form onSubmit={handleUpdateSuit}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={editSuitData.status}
                  onChange={handleEditSuitChange}
                >
                  <option value="no progress">No Progress</option>
                  <option value="work">Work</option>
                  <option value="stitching">Stitching</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="due_date"
                  value={editSuitData.due_date}
                  onChange={handleEditSuitChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Assign Worker</Form.Label>
                <Form.Select
                  name="worker_id"
                  value={editSuitData.worker_id}
                  onChange={handleEditSuitChange}
                >
                  <option value="">Select Worker</option>
                  {workers.map((worker) => (
                    <option key={worker.worker_id} value={worker.worker_id}>
                      {worker.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Current Images */}
              {selectedSuit &&
                selectedSuit.images &&
                Array.isArray(selectedSuit.images) &&
                selectedSuit.images.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Current Images</Form.Label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {selectedSuit.images
                        .filter(
                          (img) =>
                            !editSuitData.delete_images?.includes(img.image_id)
                        )
                        .map((image, idx) => (
                          <div
                            key={image.image_id}
                            className="position-relative"
                          >
                            <img
                              src={image.image_url}
                              alt={`Suit ${idx + 1}`}
                              className="img-thumbnail"
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                setSelectedImage(image.image_url);
                                setShowZoomModal(true);
                              }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              onClick={() => handleDeleteImage(image.image_id)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                    </div>
                    {editSuitData.delete_images &&
                      editSuitData.delete_images.length > 0 && (
                        <p className="text-muted small">
                          {editSuitData.delete_images.length} image(s) marked
                          for deletion
                        </p>
                      )}
                  </Form.Group>
                )}

              {/* Add New Images */}
              <Form.Group className="mb-3">
                <Form.Label>Add New Images</Form.Label>
                <Form.Control
                  type="file"
                  name="images"
                  onChange={handleEditSuitChange}
                  multiple
                />
                <Form.Text className="text-muted">
                  You can select multiple images
                </Form.Text>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? "Updating..." : "Update Suit"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDetail;
