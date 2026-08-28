import { useEffect, useState, useCallback, useRef } from "react";
import { Modal } from "bootstrap";
import { api } from "../api";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../assets/Advay-Traders-Logo.png";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [editingAddress, setEditingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({ address: "", pincode: "" });
    const [editingRemarkId, setEditingRemarkId] = useState(null);
    const [remarkBuffer, setRemarkBuffer] = useState("");
    
    const orderModalRef = useRef(null);
    const orderModalInstance = useRef(null);

    useEffect(() => {
        if (orderModalRef.current && !orderModalInstance.current) {
            orderModalInstance.current = Modal.getOrCreateInstance(orderModalRef.current);
        }
    }, []);

    async function fetchOrders() {
        try {
            const res = await api.get(
                `/enquiry?page=${page}&search=${search}&status=${statusFilter}`
            );
            setOrders(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Fetch orders failed:", err);
        }
    }

    const memoizedFetch = useCallback(fetchOrders, [page, search, statusFilter]);

    useEffect(() => {
        memoizedFetch();
    }, [memoizedFetch]);

    function formatOrderID(order) {
        if (!order?._id) return "N/A";
        const date = new Date(order.createdAt);
        const yyyymm = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0');
        const shortId = order._id.slice(-5).toUpperCase();
        return `ADT-${yyyymm}-${shortId}`;
    }

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

    async function generateOrderPDF(order) {
        const doc = new jsPDF("p", "mm", "a4");
        const formattedId = formatOrderID(order);
        const navyColor = [27, 54, 93];       // #1B365D Primary Brand Blue
        const goldColor = [229, 142, 38];     // #E58E26 Accent Brand Gold
        const darkTextColor = [30, 41, 59];   // #1E293B
        const mutedTextColor = [100, 116, 139]; // #64748B

        // 1. Header with Logo & Company Information
        try {
            const logoData = await loadImageAsDataUrl(logo);
            if (logoData) {
                doc.addImage(logoData, "PNG", 14, 10, 40, 20);
            }
        } catch (e) {
            console.warn("Logo load error", e);
        }

        // Company Details
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

        // Header Document Badge (Right Side)
        doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.roundedRect(145, 12, 51, 12, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text("TAX INVOICE", 153, 20);

        // Decorative Accent Lines
        doc.setDrawColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.setLineWidth(0.8);
        doc.line(14, 38, 196, 38);

        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(1.2);
        doc.line(14, 40, 196, 40);

        // 2. Info Cards (Billed To / Order Details)
        // Left Box: Customer Details
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, 45, 88, 42, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.text("CUSTOMER DETAILS", 18, 51);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text(order.customerId?.name || "Customer", 18, 57);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text(`Phone: ${order.customerId?.phone || "N/A"}`, 18, 62);
        doc.text(`Email: ${order.customerId?.email || "N/A"}`, 18, 67);
        const addressText = `${order.customerId?.address || "N/A"}${order.customerId?.pincode ? ` - ${order.customerId?.pincode}` : ""}`;
        const splitAddress = doc.splitTextToSize(`Address: ${addressText}`, 80);
        doc.text(splitAddress, 18, 72);

        // Right Box: Order Meta
        doc.setFillColor(248, 250, 252);
        // Increased height to 42 to accommodate Agent ID
        doc.roundedRect(108, 45, 88, 42, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.text("ORDER SUMMARY", 112, 51);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text("Order ID:", 112, 57);
        doc.setFont("helvetica", "bold");
        doc.text(formattedId, 142, 57);

        doc.setFont("helvetica", "normal");
        doc.text("Order Date:", 112, 63);
        doc.text(new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), 142, 63);

        doc.text("Order Status:", 112, 69);
        doc.setFont("helvetica", "bold");
        const statusText = (order.status || "New").toUpperCase();
        doc.setTextColor(order.status === "completed" ? 22 : 190, order.status === "completed" ? 101 : 120, 30);
        doc.text(statusText, 142, 69);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text("Agent ID:", 112, 75);
        doc.setFont("helvetica", "bold");
        doc.text(order.agentId || "Not provided", 142, 75);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text("Payment Mode:", 112, 81);
        doc.text("Cash / Online", 142, 81);

        // 3. Items Table
        const tableBody = (order.cart || []).map((item, index) => [
            index + 1,
            item.name,
            item.quantity,
            `Rs. ${Number(item.price).toLocaleString("en-IN")}`,
            `Rs. ${(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}`
        ]);

        doc.autoTable({
            startY: 92,
            head: [["#", "Item Description", "Qty", "Price", "Subtotal"]],
            body: tableBody,
            theme: "grid",
            headStyles: {
                fillColor: navyColor,
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 9,
                halign: "left",
            },
            bodyStyles: {
                fontSize: 9,
                textColor: darkTextColor,
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { halign: "center", cellWidth: 12 },
                1: { halign: "left" },
                2: { halign: "center", cellWidth: 18 },
                3: { halign: "right", cellWidth: 32 },
                4: { halign: "right", cellWidth: 36 },
            },
            styles: {
                lineColor: [226, 232, 240],
                lineWidth: 0.2,
                cellPadding: 3,
            }
        });

        // 4. Totals & Summary
        const finalY = doc.lastAutoTable.finalY + 6;
        const totalItems = (order.cart || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);

        // Total Box on Right
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(120, finalY, 76, 24, 2, 2, "FD");

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text(`Total Items: ${totalItems}`, 125, finalY + 7);

        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.5);
        doc.line(125, finalY + 11, 191, finalY + 11);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.text("Grand Total:", 125, finalY + 18);
        doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.text(`Rs. ${Number(order.totalPrice || 0).toLocaleString("en-IN")}`, 155, finalY + 18);

        // 5. Signature & Thank You Note
        const bottomY = Math.max(finalY + 36, 250);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text("Thank you for choosing Advay Traders!", 14, bottomY);
        doc.text("For support, inquiries or questions regarding this invoice, please reach out to us.", 14, bottomY + 5);

        // Authorized Signature
        doc.setDrawColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.setLineWidth(0.4);
        doc.line(140, bottomY + 2, 190, bottomY + 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text("Authorized Signatory", 148, bottomY + 7);

        // Bottom Brand Accent
        doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.rect(0, 287, 210, 10, "F");
        doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.rect(0, 285, 210, 2, "F");

        const fileName = `${order.customerId?.name || "Customer"}_Order_${formattedId}.pdf`;
        doc.save(fileName);
    }

    const statusBadge = {
        new: { color: "bg-primary text-white", label: "New Order" },
        packing: { color: "bg-warning text-dark", label: "Packing Progress" },
        completed: { color: "bg-success text-white", label: "Completed" },
        dispatched: { color: "bg-info text-dark", label: "Dispatched" },
    };

    async function handleStatusChange(orderId, newStatus) {
        try {
            await api.patch(`/enquiry/${orderId}/status`, { status: newStatus });
            memoizedFetch();
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update order status");
        }
    }

    async function handleRemarksChange(orderId, newRemarks) {
        try {
            await api.patch(`/enquiry/${orderId}/status`, { remarks: newRemarks });
            setOrders(orders.map(o => o._id === orderId ? { ...o, remarks: newRemarks } : o));
            setEditingRemarkId(null);
        } catch (err) {
            console.error("Failed to update remarks:", err);
            alert("Failed to update remarks");
        }
    }

    function handleSelectOrder(orderId) {
        if (selectedOrders.includes(orderId)) {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        } else {
            setSelectedOrders([...selectedOrders, orderId]);
        }
    }

    function handleSelectAll() {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o._id));
        }
    }

    async function handleBulkDelete(idsToDelete = null) {
        const ids = idsToDelete || selectedOrders;
        if (ids.length === 0) {
            alert("Please select orders to delete");
            return;
        }
        if (window.confirm(`Delete ${ids.length} selected order(s)?`)) {
            try {
                await Promise.all(ids.map(id => api.delete(`/enquiry/${id}`)));
                if (!idsToDelete) setSelectedOrders([]);
                memoizedFetch();
            } catch (err) {
                console.error("Failed to delete orders:", err);
                alert("Failed to delete orders");
            }
        }
    }

    async function handleBulkStatusUpdate(newStatus) {
        if (selectedOrders.length === 0) {
            alert("Please select orders to update");
            return;
        }
        try {
            await api.patch("/enquiry/bulk-status", { ids: selectedOrders, status: newStatus });
            setSelectedOrders([]);
            memoizedFetch();
        } catch (err) {
            console.error("Bulk status update failed:", err);
            alert("Failed to update status");
        }
    }

    const handleEditAddress = () => {
        setEditingAddress(true);
        setAddressForm({
            address: selectedOrder.customerId?.address || "",
            pincode: selectedOrder.customerId?.pincode || ""
        });
    };

    const handleSaveAddress = async () => {
        try {
            console.log(`[FRONTEND] Updating customer: ${selectedOrder.customerId?._id}`, addressForm);
            await api.patch(`/customers/${selectedOrder.customerId?._id}`, addressForm);
            setEditingAddress(false);
            fetchOrders();
            // Update the selected order with new data
            const updatedOrder = { ...selectedOrder };
            updatedOrder.customerId.address = addressForm.address;
            updatedOrder.customerId.pincode = addressForm.pincode;
            setSelectedOrder(updatedOrder);
            alert("Address updated successfully");
        } catch (err) {
            console.error("Failed to update address:", err);
            const msg = err.response?.data?.message || err.message;
            alert(`Failed to update address: ${msg}`);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between mb-3">
                <h4 className="fw-bold">Orders</h4>
                <div className="d-flex gap-2">
                    {selectedOrders.length > 0 && (
                        <div className="d-flex gap-2 align-items-center">
                            <span className="small text-muted">{selectedOrders.length} selected</span>
                            <div className="dropdown">
                                <button className="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Change Status
                                </button>
                                <ul className="dropdown-menu">
                                    <li><button className="dropdown-item" onClick={() => handleBulkStatusUpdate("new")}>New Order</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleBulkStatusUpdate("packing")}>Packing Progress</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleBulkStatusUpdate("completed")}>Completed</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleBulkStatusUpdate("dispatched")}>Dispatched</button></li>
                                </ul>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={() => handleBulkDelete()}>
                                <i className="bi bi-trash me-1"></i>
                                Delete
                            </button>
                        </div>
                    )}
                    <select
                        className="form-select form-select-sm w-auto"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="new">New Order</option>
                        <option value="packing">Packing Progress</option>
                        <option value="completed">Completed</option>
                        <option value="dispatched">Dispatched</option>
                    </select>
                    <input
                        className="form-control w-auto"
                        placeholder="Search customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <table className="table table-bordered table-hover">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: "40px" }}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedOrders.length === orders.length && orders.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th>S.No</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Agent ID</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o, index) => (
                        <tr key={o._id}>
                            <td>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedOrders.includes(o._id)}
                                    onChange={() => handleSelectOrder(o._id)}
                                />
                            </td>
                            <td>{(page - 1) * 10 + index + 1}</td>
                            <td className="fw-semibold">{formatOrderID(o)}</td>
                            <td>{o.customerId?.name}</td>
                            <td>{o.agentId ? <span className="badge bg-dark">{o.agentId}</span> : <span className="text-muted small">—</span>}</td>
                            <td>₹{o.totalPrice}</td>
                            <td>
                                <select
                                    className={`form-select form-select-sm ${statusBadge[o.status]?.color || "bg-secondary"}`}
                                    value={o.status}
                                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                    style={{ fontWeight: "500", border: "none" }}
                                >
                                    <option value="new">New Order</option>
                                    <option value="packing">Packing Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="dispatched">Dispatched</option>
                                </select>
                            </td>
                            <td>
                                {editingRemarkId === o._id ? (
                                    <div className="d-flex gap-1 align-items-center">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={remarkBuffer}
                                            onChange={(e) => setRemarkBuffer(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            className="btn btn-sm btn-success p-1"
                                            onClick={() => handleRemarksChange(o._id, remarkBuffer)}
                                            title="Save"
                                        >
                                            <i className="bi bi-check-lg"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary p-1"
                                            onClick={() => setEditingRemarkId(null)}
                                            title="Cancel"
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="small">{o.remarks || "—"}</span>
                                        <button
                                            className="btn btn-sm btn-outline-primary border-0 p-1"
                                            onClick={() => {
                                                setEditingRemarkId(o._id);
                                                setRemarkBuffer(o.remarks || "");
                                            }}
                                            title="Edit"
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                        setSelectedOrder(o);
                                        setEditingAddress(false);
                                        const modal = orderModalInstance.current || (orderModalRef.current ? Modal.getOrCreateInstance(orderModalRef.current) : null);
                                        modal?.show();
                                    }}
                                >
                                    View
                                </button>
                                <button
                                    className="btn btn-sm btn-danger ms-1"
                                    onClick={() => handleBulkDelete([o._id])}
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="d-flex justify-content-end gap-2">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    Prev
                </button>
                <span className="align-self-center">
                    Page {page} of {totalPages}
                </span>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>

            {/* ORDER DETAILS MODAL */}
            <div className="modal fade" ref={orderModalRef} tabIndex="-1">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Order: {selectedOrder ? formatOrderID(selectedOrder) : ""}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    const modal = orderModalInstance.current || (orderModalRef.current ? Modal.getOrCreateInstance(orderModalRef.current) : null);
                                    modal?.hide();
                                }}
                            ></button>
                        </div>

                        <div className="modal-body">
                            {selectedOrder && (
                                <>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <p><strong>Name:</strong> {selectedOrder.customerId?.name}</p>
                                            <p><strong>Email:</strong> {selectedOrder.customerId?.email}</p>
                                            <p><strong>Phone:</strong> {selectedOrder.customerId?.phone}</p>
                                            <p><strong>Agent ID:</strong> {selectedOrder.agentId ? <span className="badge bg-dark">{selectedOrder.agentId}</span> : <span className="text-muted">Not provided</span>}</p>
                                            <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>

                                            {editingAddress ? (
                                                <div className="mt-3">
                                                    <div className="mb-2">
                                                        <label className="form-label"><strong>Address:</strong></label>
                                                        <textarea
                                                            className="form-control"
                                                            rows="2"
                                                            value={addressForm.address}
                                                            onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="form-label"><strong>Pincode:</strong></label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={addressForm.pincode}
                                                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                        />
                                                    </div>
                                                    <button className="btn btn-success btn-sm me-2" onClick={handleSaveAddress}>
                                                        <i className="bi bi-check-lg me-1"></i>Save
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingAddress(false)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p><strong>Address:</strong> {selectedOrder.customerId?.address || 'N/A'}</p>
                                                    <p><strong>Pincode:</strong> {selectedOrder.customerId?.pincode || 'N/A'}</p>
                                                    <button className="btn btn-outline-primary btn-sm" onClick={handleEditAddress}>
                                                        <i className="bi bi-pencil me-1"></i>Edit Address
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="btn btn-outline-success"
                                            onClick={() => generateOrderPDF(selectedOrder)}
                                        >
                                            <i className="bi bi-file-earmark-pdf me-1"></i>
                                            Print Receipt
                                        </button>
                                    </div>

                                    <table className="table mt-3">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.cart?.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>₹{item.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <h6 className="text-end">
                                        Total: ₹{selectedOrder.totalPrice}
                                    </h6>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
