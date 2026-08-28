import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../api";
import { Popover, Modal } from "bootstrap";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../assets/Advay-Traders-Logo.png";

/* =======================
   DUES CONFIG
======================= */
const duesList = [
  { key: "Due1", period: "Nov 2025" },
  { key: "Due2", period: "Dec 2025" },
  { key: "Due3", period: "Jan 2026" },
  { key: "Due4", period: "Feb 2026" },
  { key: "Due5", period: "Mar 2026" },
  { key: "Due6", period: "Apr 2026" },
  { key: "Due7", period: "May 2026" },
  { key: "Due8", period: "Jun 2026" },
  { key: "Due9", period: "Jul 2026" },
];

export default function Payments() {
  /* =======================
     STATE
  ======================= */
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDue, setSelectedDue] = useState(null);

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [txnNo, setTxnNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDue, setFilterDue] = useState("All");

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const popoverRefs = useRef({});
  const activePopovers = useRef([]);
  const modalRef = useRef(null);
  const bootstrapModal = useRef(null);

  /* =======================
     HELPERS
  ======================= */
  const getPlan = useCallback(
    (id) => plans.find((p) => p._id === id),
    [plans]
  );

  const destroyPopovers = useCallback(() => {
    activePopovers.current.forEach((p) => {
      try {
        p.dispose();
      } catch (e) {
        console.warn("Popover dispose error", e);
      }
    });
    activePopovers.current = [];
  }, []);

  const initPopovers = useCallback(() => {
    destroyPopovers();
    // Only init if we have valid refs and the component is still mounted
    Object.values(popoverRefs.current).forEach((el) => {
      if (el && document.body.contains(el)) {
        try {
          const p = new Popover(el, {
            trigger: "hover",
            html: true,
            placement: "top",
          });
          activePopovers.current.push(p);
        } catch (e) {
          console.error("Failed to init popover", e);
        }
      }
    });
  }, [destroyPopovers]);

  const loadData = useCallback(async () => {
    const [plansRes, membersRes, paymentsRes] = await Promise.all([
      api.get("/plans"),
      api.get("/members"),
      api.get("/payments"),
    ]);
    setPlans(plansRes.data);
    setMembers(membersRes.data);
    setPayments(paymentsRes.data);
    setTimeout(initPopovers, 200);
  }, [initPopovers]);

  useEffect(() => {
    loadData();
    if (modalRef.current) {
      bootstrapModal.current = Modal.getOrCreateInstance(modalRef.current);
    }
    return () => {
      destroyPopovers();
      if (bootstrapModal.current) {
        bootstrapModal.current.dispose();
      }
    };
  }, [loadData, destroyPopovers]);

  /* Reset page on filter change */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterPlan, filterStatus, filterDue]);

  /* =======================
     PAYMENT TOGGLE
  ======================= */
  const handleCellClick = async (member, due) => {
    const cycle = member.cycle || 1;
    const existing = payments.find(
      (p) =>
        p.memberId?._id === member._id &&
        p.period === due.period &&
        (p.cycle || 1) === cycle
    );

    if (existing?.status === "Paid") {
      if (window.confirm("Are you sure you want to change this status back to Pending?")) {
        await api.post("/payments", {
          memberId: member._id,
          planId: member.planId?._id,
          period: due.period,
          amount: getPlan(member.planId?._id)?.monthly,
          paymentMode: existing.paymentMode,
          transactionNo: existing.transactionNo || null,
          cycle,
        });
        await loadData();
      }
    } else {
      setSelectedMember(member);
      setSelectedDue(due);
      setPaymentMode("Cash");
      setTxnNo("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      if (bootstrapModal.current) {
        bootstrapModal.current.show();
      }
    }
  };

  const confirmPayment = async () => {
    const plan = getPlan(selectedMember.planId?._id);
    const cycle = selectedMember.cycle || 1;
    await api.post("/payments", {
      memberId: selectedMember._id,
      planId: plan._id,
      period: selectedDue.period,
      amount: plan.monthly,
      paymentMode,
      transactionNo: txnNo || null,
      paymentDate,
      cycle,
    });
    await loadData();
    if (bootstrapModal.current) {
      bootstrapModal.current.hide();
    }
  };

  /* =======================
     AVAIL AGAIN (FRESH CYCLE)
  ======================= */
  const handleAvailAgain = async (member) => {
    const nextCycle = (member.cycle || 1) + 1;
    if (
      window.confirm(
        `All dues completed for ${member.name}!\n\nDo you want to avail again and start freshly from Due 1 for Cycle ${nextCycle}?`
      )
    ) {
      try {
        await api.post("/payments/avail-again", { memberId: member._id });
        await loadData();
        alert(`Successfully started Cycle ${nextCycle} from Due 1 for ${member.name}!`);
      } catch (err) {
        console.error("Failed to start fresh cycle:", err);
        alert("Failed to start fresh cycle. Please try again.");
      }
    }
  };

  /* =======================
     STATS
  ======================= */
  const getStats = (member) => {
    const plan = getPlan(member.planId?._id);
    if (!plan) return { totalPaid: 0, pending: 0, paidCount: 0, totalDues: 9, isCompleted: false };
    const cycle = member.cycle || 1;
    const paidCount = payments.filter(
      (p) => p.memberId?._id === member._id && (p.cycle || 1) === cycle && p.status === "Paid"
    ).length;
    const totalDues = plan.months || 9;
    return {
      totalPaid: paidCount * plan.monthly,
      pending: Math.max(0, totalDues - paidCount),
      paidCount,
      totalDues,
      isCompleted: paidCount >= totalDues,
    };
  };

  /* =======================
     FILTER + PAGINATION
  ======================= */
  const filteredMembers = members.filter((m) => {
    const matchesName = m.name?.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === "All" || m.planId?.name === filterPlan;

    const cycle = m.cycle || 1;
    const memberPayments = payments.filter(
      (p) => p.memberId?._id === m._id && (p.cycle || 1) === cycle
    );

    const stats = getStats(m);

    let matchesStatus = true;
    if (filterStatus === "Paid") {
      matchesStatus = memberPayments.some((p) => p.status === "Paid");
    } else if (filterStatus === "Completed") {
      matchesStatus = stats.isCompleted;
    } else if (filterStatus === "Pending") {
      matchesStatus = !stats.isCompleted;
    }

    const matchesDue =
      filterDue === "All" ? true : memberPayments.some((p) => p.period === filterDue);

    return matchesName && matchesPlan && matchesStatus && matchesDue;
  });

  // 🔁 Re-init popovers when page or data changes
  useEffect(() => {
    const validRefs = {};
    Object.keys(popoverRefs.current).forEach((key) => {
      if (popoverRefs.current[key]) validRefs[key] = popoverRefs.current[key];
    });
    popoverRefs.current = validRefs;

    const timer = setTimeout(() => {
      initPopovers();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, rowsPerPage, filteredMembers, initPopovers, payments]);

  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + rowsPerPage);

  /* =======================
     PDF RECEIPT (THEME-ALIGNED)
  ======================= */
  const loadImageAsDataUrl = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const generateIndividualPDF = async (member, duePeriod) => {
    if (duePeriod === "All") {
      alert("Please select a specific Due from the filter or table to generate receipt");
      return;
    }

    const plan = getPlan(member.planId?._id);
    const cycle = member.cycle || 1;
    const record = payments.find(
      (p) =>
        p.memberId?._id === member._id &&
        p.period === duePeriod &&
        (p.cycle || 1) === cycle
    );

    const doc = new jsPDF("p", "mm", "a4");
    const navyColor = [27, 54, 93];       // #1B365D Primary Brand Blue
    const goldColor = [229, 142, 38];     // #E58E26 Accent Brand Gold
    const darkTextColor = [30, 41, 59];   // #1E293B
    const mutedTextColor = [100, 116, 139]; // #64748B

    // 1. Header with Logo & Details
    try {
      const logoData = await loadImageAsDataUrl(logo);
      if (logoData) {
        doc.addImage(logoData, "PNG", 14, 10, 40, 20);
      }
    } catch (e) {
      console.warn("Logo load error", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text("ADVAY TRADERS", 60, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text("Sivakasi - Sattur Main Road, Sivakasi - 626189", 60, 22);
    doc.text("Phone: 96881 17904 / 82483 61625 | Email: advaytraders@gmail.com", 60, 27);
    doc.text("Website: www.advaytraders.in", 60, 32);

    // Document Badge
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.roundedRect(142, 12, 54, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("PAYMENT RECEIPT", 145, 20);

    // Decorative Lines
    doc.setDrawColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.setLineWidth(0.8);
    doc.line(14, 38, 196, 38);

    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(1.2);
    doc.line(14, 40, 196, 40);

    // 2. Member & Due Meta Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 45, 182, 45, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text("MEMBER & DUE DETAILS", 20, 52);
    if (cycle > 1) {
      doc.text(`(CYCLE ${cycle})`, 80, 52);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`Member Name : ${member.name}`, 20, 60);
    doc.text(`Plan Name   : ${plan?.name || "—"}`, 20, 67);
    doc.text(`Due Period  : ${duePeriod}`, 20, 74);
    doc.text(`Status      : ${record?.status || "Pending"}`, 20, 81);

    doc.text(`Monthly Due : Rs. ${record?.amount || plan?.monthly || 0}`, 115, 60);
    doc.text(`Payment Mode: ${record?.paymentMode || "—"}`, 115, 67);
    doc.text(
      `Paid On     : ${
        record?.paymentDate ? new Date(record.paymentDate).toLocaleDateString("en-IN") : "—"
      }`,
      115,
      74
    );
    doc.text(`Txn No      : ${record?.transactionNo || "—"}`, 115, 81);

    if (record?.status === "Paid") {
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.text("PAID", 75, 150, { angle: 35 });
      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    }

    // 3. Dues Table for this Cycle
    const rows = [];
    duesList.forEach((d) => {
      const rec = payments.find(
        (p) =>
          p.memberId?._id === member._id &&
          p.period === d.period &&
          (p.cycle || 1) === cycle
      );
      rows.push([
        d.key,
        d.period,
        rec?.status || "Pending",
        rec?.paymentMode || "—",
        rec?.paymentDate ? new Date(rec.paymentDate).toLocaleDateString("en-IN") : "—",
        `Rs. ${rec?.amount || plan?.monthly || 0}`,
        rec?.transactionNo || "—",
      ]);
    });

    doc.autoTable({
      startY: 96,
      head: [["Due", "Month", "Status", "Mode", "Paid Date", "Amount", "Txn No"]],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: navyColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8.5, lineColor: [226, 232, 240], cellPadding: 2.5 },
    });

    const y = doc.lastAutoTable.finalY + 15;
    doc.setDrawColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.setLineWidth(0.4);
    doc.line(140, y, 190, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("Authorized Signature", 145, y + 5);

    // Bottom Decorative Bar
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(0, 287, 210, 10, "F");
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(0, 285, 210, 2, "F");

    const dueInfo = duesList.find((d) => d.period === duePeriod);
    const dueLabel = dueInfo ? dueInfo.key : duePeriod;
    doc.save(`${member.name}_${dueLabel}_Cycle${cycle}.pdf`);
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="container-fluid py-2">
      {/* FILTERS */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-semibold mb-0">Payments Tracker</h3>
          <small className="text-muted">Manage 9 dues, track payment modes, and manage cycles</small>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <input
            className="form-control form-control-sm"
            placeholder="Search Member"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "160px" }}
          />

          <select
            className="form-select form-select-sm"
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            style={{ width: "140px" }}
          >
            <option value="All">All Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "140px" }}
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed (9 Dues)</option>
            <option value="Pending">In Progress</option>
            <option value="Paid">Has Paid Dues</option>
          </select>

          <select
            className="form-select form-select-sm"
            value={filterDue}
            onChange={(e) => setFilterDue(e.target.value)}
            style={{ width: "120px" }}
          >
            <option value="All">All Dues</option>
            {duesList.map((d) => (
              <option key={d.key} value={d.period}>
                {d.key}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            style={{ width: "100px" }}
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0 table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light text-center" style={{ backgroundColor: "#fff8e1" }}>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Cycle</th>
                {duesList.map((d) => (
                  <th key={d.key}>{d.key}</th>
                ))}
                <th>Total Paid</th>
                <th>Pending</th>
                <th>Status / Action</th>
                <th>PDF</th>
              </tr>
            </thead>

            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={16} className="text-center py-4 text-muted">
                    No members found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const plan = getPlan(member.planId?._id);
                  const stats = getStats(member);
                  const cycle = member.cycle || 1;

                  return (
                    <tr key={member._id}>
                      <td className="fw-semibold">{member.name}</td>
                      <td>{plan?.name || "—"}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary bg-opacity-75">
                          C{cycle}
                        </span>
                      </td>

                      {duesList.map((d) => {
                        const record = payments.find(
                          (p) =>
                            p.memberId?._id === member._id &&
                            p.period === d.period &&
                            (p.cycle || 1) === cycle
                        );

                        const popoverContent = `
                          <div class='text-start'>
                            <b>💳 Mode:</b> ${record?.paymentMode || "—"}<br/>
                            <b>📅 Date:</b> ${
                              record?.paymentDate
                                ? new Date(record.paymentDate).toLocaleDateString()
                                : "—"
                            }<br/>
                            <b>💰 Amount:</b> ₹${record?.amount || plan?.monthly || 0}<br/>
                            <b>🔄 Cycle:</b> ${cycle}
                          </div>
                        `;

                        return (
                          <td
                            key={d.key}
                            ref={(el) =>
                              (popoverRefs.current[`${member._id}_${d.key}`] = el)
                            }
                            data-bs-toggle="popover"
                            data-bs-content={popoverContent}
                            className="text-center"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleCellClick(member, d)}
                          >
                            <span
                              className={`badge ${
                                record?.status === "Paid" ? "bg-success" : "bg-danger"
                              }`}
                            >
                              {record?.status || "Pending"}
                            </span>
                          </td>
                        );
                      })}

                      <td className="fw-bold text-success text-center">
                        ₹{stats.totalPaid}
                      </td>
                      <td className="fw-bold text-danger text-center">
                        {stats.pending}
                      </td>

                      {/* Status / Avail Again */}
                      <td className="text-center">
                        {stats.isCompleted ? (
                          <div className="d-flex flex-column gap-1 align-items-center">
                            <span className="badge bg-success py-1 px-2">
                              <i className="bi bi-check-circle-fill me-1"></i>Completed
                            </span>
                            <button
                              className="btn btn-warning btn-sm fw-bold shadow-sm text-dark d-flex align-items-center gap-1"
                              title="Avail Again - Start fresh from Due 1"
                              onClick={() => handleAvailAgain(member)}
                            >
                              <i className="bi bi-arrow-repeat"></i> Avail Again
                            </button>
                          </div>
                        ) : (
                          <span className="badge bg-light text-dark border py-1 px-2">
                            {stats.paidCount}/{stats.totalDues} Paid
                          </span>
                        )}
                      </td>

                      <td className="text-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => generateIndividualPDF(member, filterDue)}
                          title="Download Receipt PDF"
                        >
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <span className="small text-muted">
          Showing {filteredMembers.length > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(startIndex + rowsPerPage, filteredMembers.length)} of {filteredMembers.length} members
        </span>

        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ◀ Prev
          </button>
          <button
            className="btn btn-outline-secondary"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* MODAL FOR PAYMENT MODE */}
      <div className="modal fade" id="paymentModeModal" ref={modalRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Record Payment</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => bootstrapModal.current?.hide()}
              ></button>
            </div>

            <div className="modal-body">
              <p className="mb-2">
                <strong>Member:</strong> {selectedMember?.name} (Cycle {selectedMember?.cycle || 1})
              </p>
              <p className="mb-3">
                <strong>Due:</strong> {selectedDue?.key} ({selectedDue?.period}) — Amount: ₹
                {getPlan(selectedMember?.planId?._id)?.monthly}
              </p>

              <label className="form-label small fw-semibold">Payment Mode</label>
              <select
                className="form-select mb-2"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option>Cash</option>
                <option>GPay</option>
                <option>PhonePe</option>
                <option>UPI</option>
                <option>Internet Banking</option>
              </select>

              <label className="form-label small fw-semibold">Payment Date</label>
              <input
                type="date"
                className="form-control mb-2"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />

              {paymentMode !== "Cash" && (
                <>
                  <label className="form-label small fw-semibold">Transaction Number / Reference ID</label>
                  <input
                    className="form-control mb-2"
                    placeholder="Enter Txn No (optional)"
                    value={txnNo}
                    onChange={(e) => setTxnNo(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => bootstrapModal.current?.hide()}
              >
                Cancel
              </button>
              <button className="btn btn-success" onClick={confirmPayment}>
                <i className="bi bi-check-lg me-1"></i> Confirm Paid
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
