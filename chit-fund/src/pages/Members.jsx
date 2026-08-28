import React, { useEffect, useState, useRef } from "react";
import { Modal } from "bootstrap";
import { api } from "../api";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    _id: null,
    name: "",
    phone: "",
    planId: "",
    startDate: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const memberModalRef = useRef(null);
  const memberModalInstance = useRef(null);

  // 🔹 Initialize modal
  useEffect(() => {
    if (memberModalRef.current && !memberModalInstance.current) {
      memberModalInstance.current = new Modal(memberModalRef.current);
    }
  }, []);

  // 🔹 Fetch Members and Plans from backend
  const loadData = async () => {
    const [membersRes, plansRes] = await Promise.all([
      api.get("/members"),
      api.get("/plans"),
    ]);
    setMembers(membersRes.data);
    setPlans(plansRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Open Modal (for add or edit)
  const openModal = (member = null) => {
    if (member) {
      setIsEdit(true);
      setFormData({
        _id: member._id,
        name: member.name,
        phone: member.phone,
        planId: member.planId?._id || "",
        startDate: member.startDate?.substring(0, 10) || "",
      });
    } else {
      setIsEdit(false);
      setFormData({
        _id: null,
        name: "",
        phone: "",
        planId: "",
        startDate: "",
      });
    }
    if (memberModalInstance.current) {
      memberModalInstance.current.show();
    }
  };

  // 🔹 Close Modal
  const closeModal = () => {
    if (memberModalInstance.current) {
      memberModalInstance.current.hide();
    }
  };

  // 🔹 Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Save Member
  const handleSave = async (e) => {
    e.preventDefault();
    const { _id, ...data } = formData;
    if (isEdit) await api.put(`/members/${_id}`, data);
    else await api.post("/members", data);
    await loadData();
    closeModal();
  };

  // 🔹 Delete Member
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      await api.delete(`/members/${id}`);
      loadData();
    }
  };

  const getPlanName = (id) => plans.find((p) => p._id === id)?.name || "-";

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-semibold text-dark">Manage Members</h3>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <i className="bi bi-person-plus-fill me-2"></i> Add Member
        </button>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-warning">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m._id}>
                  <td>{i + 1}</td>
                  <td>{m.name}</td>
                  <td>{m.phone}</td>
                  <td>{m.planId?.name || getPlanName(m.planId)}</td>
                  <td>{new Date(m.startDate).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => openModal(m)}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(m._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <div
        className="modal fade"
        ref={memberModalRef}
        tabIndex="-1"
        aria-labelledby="memberModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSave}>
              <div className="modal-header bg-warning bg-opacity-25">
                <h5 className="modal-title" id="memberModalLabel">
                  {isEdit ? "Edit Member" : "Add New Member"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Member Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[0-9]{10}"
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Select Plan</label>
                  <select
                    className="form-select"
                    name="planId"
                    value={formData.planId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Choose Plan --</option>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {isEdit ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
