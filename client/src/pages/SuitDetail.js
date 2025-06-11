import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ImageModal from "../components/ImageModal";
import QRCodeModal from "../components/QRCodeModal";

const SuitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [suit, setSuit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [editSuitData, setEditSuitData] = useState({
    status: "",
    due_date: "",
    worker_id: "",
    images: [],
    delete_images: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch suit data
        const suitRes = await axios.get(`/api/suits/${id}`);
        setSuit(suitRes.data);

        // Initialize edit form data
        setEditSuitData({
          status: suitRes.data.status || "no progress",
          due_date: suitRes.data.due_date
            ? new Date(suitRes.data.due_date).toISOString().split("T")[0]
            : "",
          worker_id: suitRes.data.worker_id || "",
          images: [],
          delete_images: [],
        });

        // Fetch workers for dropdown
        const workersRes = await axios.get("/api/workers");
        setWorkers(workersRes.data);
      } catch (err) {
        setError("Failed to load suit data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Handle edit modal
  const handleEditClose = () => {
    setShowEditModal(false);
    setFormError("");

    // Reset form data
    if (suit) {
      setEditSuitData({
        status: suit.status || "no progress",
        due_date: suit.due_date
          ? new Date(suit.due_date).toISOString().split("T")[0]
          : "",
        worker_id: suit.worker_id || "",
        images: [],
        delete_images: [],
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
      if (editSuitData.delete_images.length > 0) {
        formData.append("delete_images", editSuitData.delete_images);
      }

      // Add new images
      if (editSuitData.images && editSuitData.images.length > 0) {
        for (let i = 0; i < editSuitData.images.length; i++) {
          formData.append("images", editSuitData.images[i]);
        }
      }

      const res = await axios.put(`/api/suits/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the suit state
      setSuit(res.data);

      // Close modal
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.response?.data?.msg || "Failed to update suit");
    } finally {
      setFormLoading(false);
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

  if (!suit) {
    return (
      <Alert variant="warning" className="my-3">
        Suit not found
      </Alert>
    );
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Suit Details</h2>
        <div>
          <Button
            variant="outline-info"
            className="me-2"
            onClick={() => setShowQRCodeModal(true)}
          >
            <i className="bi bi-qr-code me-1"></i> QR Code
          </Button>
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={() => setShowEditModal(true)}
          >
            Edit Suit
          </Button>
          <Button variant="outline-primary" onClick={() => navigate("/suits")}>
            Back to Suits
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Suit Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={4} className="text-muted">
                  Suit ID:
                </Col>
                <Col sm={8} className="mb-2">
                  {suit.suit_id}
                </Col>

                <Col sm={4} className="text-muted">
                  Customer:
                </Col>
                <Col sm={8} className="mb-2">
                  <Link to={`/customers/${suit.customer_id}`}>
                    {suit.customer_name || "Unknown"}
                  </Link>
                </Col>

                <Col sm={4} className="text-muted">
                  Status:
                </Col>
                <Col sm={8} className="mb-2">
                  <Badge bg={getStatusColor(suit.status)}>{suit.status}</Badge>
                </Col>

                <Col sm={4} className="text-muted">
                  Worker:
                </Col>
                <Col sm={8} className="mb-2">
                  {suit.worker_name ? (
                    <Link to={`/workers/${suit.worker_id}`}>
                      {suit.worker_name}
                    </Link>
                  ) : (
                    <span className="text-muted">Not assigned</span>
                  )}
                </Col>

                <Col sm={4} className="text-muted">
                  Order Date:
                </Col>
                <Col sm={8} className="mb-2">
                  {formatDate(suit.order_date)}
                </Col>

                <Col sm={4} className="text-muted">
                  Due Date:
                </Col>
                <Col sm={8} className="mb-2">
                  {formatDate(suit.due_date)}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Suit Images</h5>
            </Card.Header>
            <Card.Body>
              {!suit.images || suit.images.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  No images available
                </div>
              ) : (
                <div className="text-center">
                  {suit.images.map((image, index) => (
                    <img
                      key={image.image_id || index}
                      src={image.image_url}
                      alt={`Suit ${index + 1}`}
                      className="img-fluid mb-2 mx-2"
                      style={{ maxHeight: "200px", cursor: "pointer" }}
                      onClick={() => {
                        setSelectedImage(image.image_url);
                        setShowImageModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Image Modal for zoomed view */}
      <ImageModal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        imageUrl={selectedImage}
        title="Suit Image"
      />

      {/* QR Code Modal */}
      <QRCodeModal
        show={showQRCodeModal}
        onHide={() => setShowQRCodeModal(false)}
        suitId={suit.suit_id}
        suitInfo={suit}
      />

      {/* Edit Suit Modal */}
      <Modal show={showEditModal} onHide={handleEditClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Suit: {suit.suit_id}</Modal.Title>
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
            {suit.images && suit.images.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Current Images</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {suit.images
                    .filter(
                      (img) =>
                        !editSuitData.delete_images.includes(img.image_id)
                    )
                    .map((image, idx) => (
                      <div key={image.image_id} className="position-relative">
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
                            setShowImageModal(true);
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
                {editSuitData.delete_images.length > 0 && (
                  <p className="text-muted small">
                    {editSuitData.delete_images.length} image(s) marked for
                    deletion
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
    </div>
  );
};

export default SuitDetail;
