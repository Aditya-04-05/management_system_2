import React, { useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import QRCode from "qrcode.react";
import * as htmlToImage from "html-to-image";

const QRCodeModal = ({ show, onHide, suitId, suitInfo }) => {
  const qrCodeRef = useRef(null);

  // Generate the URL for the suit edit page
  const suitUrl = `${window.location.origin}/suits/${suitId}`;

  // Function to download QR code as image
  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      htmlToImage
        .toPng(qrCodeRef.current)
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = `suit-${suitId}-qrcode.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error("Error generating QR code image:", error);
        });
    }
  };

  // Function to print QR code
  const printQRCode = () => {
    if (qrCodeRef.current) {
      htmlToImage
        .toPng(qrCodeRef.current)
        .then((dataUrl) => {
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
            <html>
              <head>
                <title>Suit QR Code - ${suitId}</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                  }
                  .container {
                    max-width: 400px;
                    margin: 0 auto;
                    border: 1px solid #ddd;
                    padding: 20px;
                    border-radius: 5px;
                  }
                  .qr-image {
                    width: 200px;
                    height: 200px;
                    margin: 0 auto;
                  }
                  .suit-info {
                    margin-top: 15px;
                    text-align: left;
                  }
                  .suit-info p {
                    margin: 5px 0;
                  }
                  @media print {
                    .no-print {
                      display: none;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h2>Suit QR Code</h2>
                  <img src="${dataUrl}" class="qr-image" alt="Suit QR Code" />
                  <div class="suit-info">
                    <p><strong>Suit ID:</strong> ${suitId}</p>
                    ${
                      suitInfo.customer_name
                        ? `<p><strong>Customer:</strong> ${suitInfo.customer_name}</p>`
                        : ""
                    }
                    ${
                      suitInfo.status
                        ? `<p><strong>Status:</strong> ${suitInfo.status}</p>`
                        : ""
                    }
                    ${
                      suitInfo.due_date
                        ? `<p><strong>Due Date:</strong> ${new Date(
                            suitInfo.due_date
                          ).toLocaleDateString()}</p>`
                        : ""
                    }
                  </div>
                  <p class="no-print">Scan this QR code to access suit details</p>
                  <button class="no-print" onclick="window.print(); window.close();">Print</button>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        })
        .catch((error) => {
          console.error("Error generating QR code for printing:", error);
        });
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Suit QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div ref={qrCodeRef} className="p-3 bg-white">
          <div className="mb-3">
            <QRCode
              value={suitUrl}
              size={200}
              level="H"
              includeMargin={true}
              renderAs="canvas"
            />
          </div>
          <div className="text-center mb-3">
            <p className="mb-1">
              <strong>Suit ID:</strong> {suitId}
            </p>
            {suitInfo.customer_name && (
              <p className="mb-1">
                <strong>Customer:</strong> {suitInfo.customer_name}
              </p>
            )}
            {suitInfo.status && (
              <p className="mb-1">
                <strong>Status:</strong> {suitInfo.status}
              </p>
            )}
            {suitInfo.due_date && (
              <p className="mb-1">
                <strong>Due Date:</strong>{" "}
                {new Date(suitInfo.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <p className="text-muted small">
            Scan this QR code to access suit details
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={downloadQRCode}>
          Download
        </Button>
        <Button variant="success" onClick={printQRCode}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRCodeModal;
