import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Alert } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Search = () => {
  const { type, term } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        let searchType = type;
        if (!["customer", "suit", "worker"].includes(searchType)) {
          searchType = "customer";
        }

        const res = await axios.get(`/api/${searchType}s/search/${term}`);
        setResults(res.data);
      } catch (err) {
        setError(`Failed to search for ${type}s`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (term) {
      fetchResults();
    } else {
      setLoading(false);
      setError("No search term provided");
    }
  }, [type, term]);

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

  // Render results based on type
  const renderResults = () => {
    if (results.length === 0) {
      return <p className="text-center">No results found matching "{term}"</p>;
    }

    if (type === "customer") {
      return (
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((customer) => (
              <tr key={customer.customer_id}>
                <td>{customer.customer_id}</td>
                <td>
                  {customer.name || (
                    <span className="text-muted">Not provided</span>
                  )}
                </td>
                <td>
                  {customer.phone_number && <div>{customer.phone_number}</div>}
                  {customer.instagram_id && (
                    <div className="text-muted">@{customer.instagram_id}</div>
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
      );
    } else if (type === "suit") {
      return (
        <Table hover>
          <thead>
            <tr>
              <th>Suit ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((suit) => (
              <tr key={suit.suit_id}>
                <td>{suit.suit_id}</td>
                <td>
                  <Link to={`/customers/${suit.customer_id}`}>
                    {suit.customer_name || "Unknown"}
                  </Link>
                </td>
                <td>
                  <Badge bg={getStatusColor(suit.status)}>{suit.status}</Badge>
                </td>
                <td>{formatDate(suit.due_date)}</td>
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
      );
    } else if (type === "worker") {
      return (
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((worker) => (
              <tr key={worker.worker_id}>
                <td>{worker.worker_id}</td>
                <td>{worker.name}</td>
                <td>
                  <Link
                    to={`/workers/${worker.worker_id}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }
  };

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Search Results for "{term}"</h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
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
          <Card.Header className="bg-white">
            <h5 className="mb-0">
              {type === "customer"
                ? "Customers"
                : type === "suit"
                ? "Suits"
                : "Workers"}
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">{renderResults()}</div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Search;
