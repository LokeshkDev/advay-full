import React, { useEffect, useState, useRef } from "react";
import { Modal } from "bootstrap";
import { api } from "../api";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({ id: null, name: "", monthly: "", months: "", bonus: "" });
  const [isEdit, setIsEdit] = useState(false);
  const planModalRef = useRef(null);
  const planModalInstance = useRef(null);

  // 🔹 Initialize modal
  useEffect(() => {
    if (planModalRef.current && !planModalInstance.current) {
      planModalInstance.current = new Modal(planModalRef.current);
    }
  }, []);

  // 🔹 Fetch Plans
  const loadPlans = async () => {
    const res = await api.get("/plans");
    setPlans(res.data);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // 🔹 Open modal
  const openModal = (plan = null) => {
    if (plan) {
      setIsEdit(true);
      setFormData(plan);
    } else {
      setIsEdit(false);
      setFormData({ id: null, name: "", monthly: "", months: "", bonus: "" });
    }
    if (planModalInstance.current) {
      planModalInstance.current.show();
    }
  };

  // 🔹 Close modal
  const closeModal = () => {
    if (planModalInstance.current) {
      planModalInstance.current.hide();
    }
  };

  // 🔹 Save or update
  const handleSave = async (e) => {
    e.preventDefault();
    const { _id, ...data } = formData;

    if (isEdit) await api.put(`/plans/${_id}`, data);
    else await api.post("/plans", data);

    await loadPlans();
    closeModal();
  };

  // 🔹 Delete
  const handleDelete = async (id) => {
    if (window.confirm("Delete this plan?")) {
      await api.delete(`/plans/${id}`);
      loadPlans();
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-semibold text-dark">Manage Plans</h3>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <i className="bi bi-plus-circle me-2"></i> Add Plan
        </button>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
      <div className="card-body table-responsive"> 
    <table className="table table-hover align-middle">
      <thead className="table-warning">
        <tr>
          <th>#</th>
          <th>Plan Name</th>
          <th>Monthly</th>
          <th>Months</th>
          <th>Bonus</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan, i) => (
          <tr key={plan._id}>
            <td>{i + 1}</td>
            <td>{plan.name}</td>
            <td>₹{plan.monthly}</td>
            <td>{plan.months}</td>
            <td>₹{plan.bonus}</td>
            <td>₹{plan.monthly * plan.months + Number(plan.bonus)}</td>
            <td>
              <button
                className="btn btn-sm btn-outline-primary me-2"
                onClick={() => openModal(plan)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(plan._id)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        ))}
        {!plans.length && (
          <tr>
            <td colSpan="7" className="text-center text-muted">
              No plans found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>


      {/* Modal */}
      <div className="modal fade" ref={planModalRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSave}>
              <div className="modal-header bg-warning bg-opacity-25">
                <h5 className="modal-title">{isEdit ? "Edit Plan" : "Add New Plan"}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <input type="text" className="form-control mb-3" placeholder="Plan Name"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <input type="number" className="form-control" placeholder="Monthly"
                      value={formData.monthly} onChange={(e) => setFormData({ ...formData, monthly: e.target.value })} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <input type="number" className="form-control" placeholder="Months"
                      value={formData.months} onChange={(e) => setFormData({ ...formData, months: e.target.value })} required />
                  </div>
                </div>
                <input type="number" className="form-control" placeholder="Bonus"
                  value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{isEdit ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
