import React, { useState } from "react";
import { Card, Alert, Button } from "react-bootstrap";
import { QrReader } from "react-qr-reader";
import { useNavigate } from "react-router-dom";

const QRScannerPage = () => {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = (result) => {
    if (result && scanning) {
      setScanning(false);

      try {
        // Extract the URL and check if it's a valid suit URL
        const scannedUrl = result?.text;
        setScanResult(scannedUrl);

        if (scannedUrl && scannedUrl.includes("/suits/")) {
          // Extract the suit ID from the URL
          const urlParts = scannedUrl.split("/");
          const suitId = urlParts[urlParts.length - 1];

          if (suitId) {
            // Navigate to the suit detail page after a short delay
            setTimeout(() => {
              navigate(`/suits/${suitId}`);
            }, 1500);
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
    setScanResult(null);
    setScanning(true);
  };

  return (
    <div className="py-4">
      <h2 className="mb-4">QR Code Scanner</h2>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <p className="text-center mb-4">
            Scan a suit QR code to quickly access its details
          </p>

          {scanError && (
            <Alert variant="danger" className="mb-3">
              {scanError}
              <div className="mt-2">
                <Button variant="outline-primary" onClick={resetScanner}>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          {scanResult && !scanError && (
            <Alert variant="success" className="mb-3">
              <p>Successfully scanned QR code!</p>
              <p className="mb-0">
                <strong>Redirecting to suit details...</strong>
              </p>
            </Alert>
          )}

          {scanning && (
            <div className="text-center">
              <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                <QrReader
                  constraints={{ facingMode: "environment" }}
                  onResult={handleScan}
                  onError={handleError}
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-muted mt-3">
                Position the QR code within the frame to scan
              </p>
            </div>
          )}

          {!scanning && !scanError && (
            <div className="text-center mt-3">
              <Button variant="primary" onClick={resetScanner}>
                Scan Another Code
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Instructions</h5>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>Allow camera access when prompted</li>
            <li>Position the QR code within the scanning frame</li>
            <li>Hold steady until the code is recognized</li>
            <li>
              You will be automatically redirected to the suit details page
            </li>
          </ol>
          <p className="mb-0">
            <strong>Note:</strong> QR codes can be printed from any suit detail
            page by clicking the "QR Code" button.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default QRScannerPage;
