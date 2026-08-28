import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  const loadDashboard = async () => {
    const res = await api.get("/reports/dashboard");
    setData(res.data);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!data) return <p className="p-4 text-muted">Loading dashboard...</p>;
  if (data.error) return (
    <div className="alert alert-danger m-4">
      <h5><i className="bi bi-exclamation-triangle-fill me-2"></i>Dashboard Error</h5>
      {data.error}
    </div>
  );

  return (
    <div className="container-fluid">
      <h3 className="fw-semibold mb-4 text-dark">Admin Dashboard</h3>

      {/* Row 1: Order Related */}
      <h5 className="text-secondary mb-3 mt-4">Order & Customer Overview</h5>
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100">
            <h6 className="text-secondary">New Order Notifications</h6>
            {data.newOrdersCount > 0 ? (
              <div className="d-flex align-items-center justify-content-center mt-2">
                <span className="badge rounded-pill bg-danger fs-5 px-3 py-2 animate-pulse">
                  {data.newOrdersCount} New Orders
                </span>
              </div>
            ) : (
              <h3 className="fw-bold text-muted mt-2">No New Orders</h3>
            )}
            <p className="small text-muted mb-0 mt-2">Waiting to be processed</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100 position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 p-2 opacity-10">
              <i className="bi bi-cart-fill display-4"></i>
            </div>
            <h6 className="text-secondary">Total Orders</h6>
            <h3 className="fw-bold text-primary">{data.totalOrders}</h3>
            <p className="small text-muted mb-0">Total enquiries received</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100 position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 p-2 opacity-10">
              <i className="bi bi-people-fill display-4"></i>
            </div>
            <h6 className="text-secondary">Total Customers</h6>
            <h3 className="fw-bold text-success">{data.totalCustomers}</h3>
            <p className="small text-muted mb-0">Registered shop visitors</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100 bg-info text-white">
            <h6 className="text-white-50">Total Order Amount</h6>
            <h3 className="fw-bold">
              ₹{data.totalOrderAmount?.toLocaleString() || 0}
            </h3>
            <p className="small text-white-50 mb-0">Sum of all order totals</p>
          </div>
        </div>
      </div>

      {/* Row 2: Chitfund Related */}
      <h5 className="text-secondary mb-3 mt-4">Chitfund Overview</h5>
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100 bg-primary text-white">
            <h6 className="text-white-50">Total Collection</h6>
            <h3 className="fw-bold">
              ₹{data.totalCollection.toLocaleString()}
            </h3>
            <p className="small text-white-50 mb-0">Chit fund collection</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100">
            <h6 className="text-secondary">Total Plans</h6>
            <h3 className="fw-bold text-info">{data.totalPlans}</h3>
            <p className="small text-muted mb-0">Active chit schemes</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100">
            <h6 className="text-secondary">Total Members</h6>
            <h3 className="fw-bold text-warning">{data.totalMembers}</h3>
            <p className="small text-muted mb-0">Joined members</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3 h-100 d-flex flex-column justify-content-center">
            <div className="d-flex align-items-center justify-content-between">
              <div className="text-start">
                <h6 className="text-secondary mb-1">Status</h6>
                <p className="small text-muted mb-0">Updated: {new Date().toLocaleTimeString()}</p>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={loadDashboard}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="row g-4">
        {/* Latest Orders */}
        <div className="col-md-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary bg-opacity-10 fw-semibold d-flex justify-content-between align-items-center">
              <span><i className="bi bi-cart3 me-2"></i>Latest Orders</span>
              <a href="/orders" className="btn btn-sm btn-link text-primary text-decoration-none">View All</a>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.latestOrders || []).map((o) => (
                      <tr key={o._id}>
                        <td className="fw-semibold text-primary">{o._id?.slice(-6).toUpperCase()}</td>
                        <td>
                          <div>{o.customerId?.name}</div>
                          <small className="text-muted">{o.customerId?.phone}</small>
                        </td>
                        <td className="fw-bold">₹{o.totalPrice?.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${o.status === 'new' ? 'bg-primary' :
                            o.status === 'packing' ? 'bg-warning text-dark' :
                              o.status === 'completed' ? 'bg-success' : 'bg-info'
                            }`}>
                            {o.status === 'new' ? 'New' :
                              o.status === 'packing' ? 'Packing' :
                                o.status === 'completed' ? 'Completed' : 'Dispatched'}
                          </span>
                        </td>
                        <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                    {(!data.latestOrders || !data.latestOrders.length) && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No recent orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Members */}
        <div className="col-md-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-warning bg-opacity-25 fw-semibold d-flex justify-content-between align-items-center">
              <span><i className="bi bi-people-fill me-2"></i>Latest Members</span>
              <a href="/members" className="btn btn-sm btn-link text-warning text-decoration-none">View All</a>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Plan</th>
                      <th>Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.latestMembers || []).map((m) => (
                      <tr key={m._id}>
                        <td>{m.name}</td>
                        <td>{m.planId?.name || "-"}</td>
                        <td>{m.startDate ? new Date(m.startDate).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                    {(!data.latestMembers || !data.latestMembers.length) && (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-muted">
                          No recent members
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
