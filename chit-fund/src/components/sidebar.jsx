import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/Advay-Traders-Logo.png";

export default function Sidebar({ isOpen, closeSidebar }) {
  return (
    <aside
      className="sidebar bg-dark text-white p-3"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "250px",
        backgroundColor: "#212529",
        zIndex: 1100,
        transform: isOpen ? "translateX(0)" : "translateX(-250px)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <img src={logo} alt="Advay Traders" width="160" className="img-fluid" />
        <button
          className="btn btn-sm btn-outline-light d-lg-none"
          onClick={closeSidebar}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <h6 className="text-center mb-4">Diwali Chit Funds</h6>

      <ul className="nav nav-pills flex-column mb-auto">
        <li>
          <NavLink
            to="/dashboard"
            className="nav-link text-white"
            onClick={closeSidebar}
          >
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/plans"
            className="nav-link text-white"
            onClick={closeSidebar}
          >
            <i className="bi bi-box-seam me-2"></i> Plans
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/members"
            className="nav-link text-white"
            onClick={closeSidebar}
          >
            <i className="bi bi-people-fill me-2"></i> Members
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/payments"
            className="nav-link text-white"
            onClick={closeSidebar}
          >
            <i className="bi bi-wallet2 me-2"></i> Payments
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/reports"
            className="nav-link text-white"
            onClick={closeSidebar}
          >
            <i className="bi bi-bar-chart-line-fill me-2"></i> Reports
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}
