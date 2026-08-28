import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/Advay-Traders-Logo.png";

export default function Header() {
  const navigate = useNavigate();
  useEffect(() => {
    // Attach event listeners manually
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    const navbarCollapse = document.getElementById("navbarNav");

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navbarCollapse.classList.contains("show")) {
          navbarCollapse.classList.remove("show");
        }
      });
    });
    return () => {
      navLinks.forEach((link) => {
        link.removeEventListener("click", () => { });
      });
    };
  }, []);

  // 🔴 LOGOUT HANDLER
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-2">
      <NavLink className="navbar-brand d-flex align-items-center" to="/dashboard">
        <img
          src={logo}
          alt="Advay Traders Logo"
          width="150"
          className="me-2"
        />
        <span className="fw-bold">Diwali Funds</span>
      </NavLink>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      {/* Navbar Items */}
      <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
        <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <NavLink to="/dashboard" className="nav-link">
              <i className="bi bi-speedometer2 me-1"></i> Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/plans" className="nav-link">
              <i className="bi bi-box-seam me-1"></i> Plans
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/members" className="nav-link">
              <i className="bi bi-people-fill me-1"></i> Members
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/payments" className="nav-link">
              <i className="bi bi-wallet2 me-1"></i> Payments
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/orders" className="nav-link">
              <i className="bi bi-bag-check-fill me-1"></i> Orders
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/products" className="nav-link">
              <i className="bi bi-box2-heart-fill me-1"></i> Products
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/reports" className="nav-link">
              <i className="bi bi-bar-chart-line-fill me-1"></i> Reports
            </NavLink>
          </li>
        </ul>

        {/* 🔴 LOGOUT BUTTON */}
        <div className="d-flex">
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm"
          >
            <i className="bi bi-box-arrow-right me-1"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}