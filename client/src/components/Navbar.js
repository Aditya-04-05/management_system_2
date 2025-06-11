import React, { useState } from "react";
import {
  Navbar,
  Nav,
  Container,
  Form,
  Button,
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const MainNavbar = ({ user, logout }) => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("customer");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    navigate(`/search/${searchType}/${searchTerm}`);
    setSearchTerm("");
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Management System
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          {user ? (
            <>
              <Form className="d-flex mx-auto" onSubmit={handleSearch}>
                <Dropdown className="me-2">
                  <Dropdown.Toggle variant="outline-light" id="search-dropdown">
                    {searchType === "customer"
                      ? "Customer"
                      : searchType === "suit"
                      ? "Suit"
                      : "Worker"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setSearchType("customer")}>
                      Customer
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSearchType("suit")}>
                      Suit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSearchType("worker")}>
                      Worker
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Form.Control
                  type="search"
                  placeholder="Search..."
                  className="me-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-light" type="submit">
                  Search
                </Button>
              </Form>

              <Nav>
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    className="nav-link text-white"
                    id="user-dropdown"
                  >
                    {user.username}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </>
          ) : (
            <Nav>
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar;
