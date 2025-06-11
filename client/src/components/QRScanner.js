import React, { useState } from "react";
import { Modal, Button, Alert } from "react-bootstrap";
import { QrReader } from "react-qr-reader"; // ✅ correct
import { useNavigate } from "react-router-dom";

const QRScanner = ({ show, onHide }) => {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(true);

  const handleScan = (result) => {
    if (result) {
      setScanning(false);

      try {
        // Extract the URL and check if it's a valid suit URL
        const scannedUrl = result?.text;

        if (scannedUrl && scannedUrl.includes("/suits/")) {
          // Extract the suit ID from the URL
          const urlParts = scannedUrl.split("/");
          const suitId = urlParts[urlParts.length - 1];

          if (suitId) {
            // Navigate to the suit detail page
            navigate(`/suits/${suitId}`);
            onHide(); // Close the scanner modal
          } else {
            setScanError("Invalid QR code: Could not extract suit ID");
          }
        } else {
          setScanError("Invalid QR code: Not a valid suit URL");
        }
      } catch (error) {
        console.error("Error processing QR code:", error);
        setScanError("Error processing QR code");
      }
    }
  };

  const handleError = (error) => {
    console.error("QR Scanner error:", error);
    setScanError("Error accessing camera. Please check permissions.");
  };

  const resetScanner = () => {
    setScanError("");
    setScanning(true);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Scan Suit QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {scanError ? (
          <div className="text-center">
            <Alert variant="danger">{scanError}</Alert>
            <Button variant="primary" onClick={resetScanner}>
              Try Again
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={handleScan}
                onError={handleError}
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-center mt-3">
              Position the QR code within the frame to scan
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRScanner;
