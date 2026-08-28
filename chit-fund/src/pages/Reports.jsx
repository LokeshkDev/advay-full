import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Reports() {
  const [summary, setSummary] = useState(null);

  // 🔹 Fetch report summary from backend
  const loadSummary = async () => {
    const res = await api.get("/reports/summary");
    setSummary(res.data);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (!summary) {
    return <p className="p-4 text-muted">Loading report data...</p>;
  }

  return (
    <div className="container-fluid">
      <h3 className="fw-semibold mb-4 text-dark">Reports & Analytics</h3>

      {/* Dashboard Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3">
            <h6 className="text-secondary">Total Plans</h6>
            <h3 className="fw-bold text-primary">{summary.totalPlans}</h3>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3">
            <h6 className="text-secondary">Total Members</h6>
            <h3 className="fw-bold text-success">{summary.totalMembers}</h3>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3">
            <h6 className="text-secondary">Total Collection</h6>
            <h3 className="fw-bold text-warning">
              ₹{summary.totalCollection.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center shadow-sm border-0 p-3">
            <h6 className="text-secondary">Pending Members</h6>
            <h3 className="fw-bold text-danger">{summary.pendingMembers}</h3>
          </div>
        </div>
      </div>

      {/* Plan-Wise Summary Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body table-responsive">
          <h5 className="fw-semibold mb-3 text-dark">Plan-wise Summary</h5>
          <table className="table table-hover align-middle">
            <thead className="table-warning">
              <tr>
                <th>Plan Name</th>
                <th>Total Members</th>
                <th>Collected (₹)</th>
                <th>Pending (₹)</th>
              </tr>
            </thead>
            <tbody>
              {summary.planWise.map((plan) => (
                <tr key={plan.planName}>
                  <td>{plan.planName}</td>
                  <td>{plan.totalMembers}</td>
                  <td className="fw-bold text-success">
                    ₹{plan.collected.toLocaleString()}
                  </td>
                  <td className="fw-bold text-danger">
                    ₹{plan.pending.toLocaleString()}
                  </td>
                </tr>
              ))}
              {!summary.planWise.length && (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
