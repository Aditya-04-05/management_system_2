import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import ImageModal from "../components/ImageModal";
import QRScanner from "../components/QRScanner";

const Suits = () => {
  const [suits, setSuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchSuits = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/suits");
        setSuits(res.data);
      } catch (err) {
        setError("Failed to load suits");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuits();
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

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Suits</h2>
        <Button
          variant="outline-info"
          onClick={() => setShowQRScannerModal(true)}
        >
          <i className="bi bi-qr-code-scan me-1"></i> Scan QR Code
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
            {suits.length === 0 ? (
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
                      <th>Images</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suits.map((suit) => (
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
                        <td>{formatDate(suit.due_date)}</td>
                        <td>
                          {suit.images && suit.images.length > 0 ? (
                            <div className="d-flex flex-wrap">
                              {suit.images.slice(0, 3).map((image, idx) => (
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
                                    setShowImageModal(true);
                                  }}
                                />
                              ))}
                              {suit.images.length > 3 && (
                                <span className="badge bg-secondary align-self-center">
                                  +{suit.images.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">No images</span>
                          )}
                        </td>
                        <td>
                          <Link
                            to={`/suits/${suit.suit_id}`}
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

      {/* Image Modal for zoomed view */}
      <ImageModal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        imageUrl={selectedImage}
        title="Suit Image"
      />

      {/* QR Scanner Modal */}
      <QRScanner
        show={showQRScannerModal}
        onHide={() => setShowQRScannerModal(false)}
      />
    </div>
  );
};

export default Suits;
