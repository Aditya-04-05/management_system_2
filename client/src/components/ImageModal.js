import React from "react";
import { Modal, Button } from "react-bootstrap";

const ImageModal = ({ show, onHide, imageUrl, title }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || "Image Preview"}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Full size preview"
            className="img-fluid"
            style={{ maxHeight: "70vh" }}
          />
        ) : (
          <div className="text-muted">No image available</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageModal;
