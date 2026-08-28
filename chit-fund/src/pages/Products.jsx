import { useEffect, useState, useRef, useCallback } from "react";
import { Modal } from "bootstrap";
import { api } from "../api";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Selection State
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Form State
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        originalPrice: "",
        offerPrice: "",
        isActive: true,
        image: null
    });
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editCategoryId, setEditCategoryId] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState("");
    const [preview, setPreview] = useState(null);

    // Refs for hidden inputs
    const prodImportRef = useRef(null);
    const productModalRef = useRef(null);
    const categoryModalRef = useRef(null);
    let productModalInstance = useRef(null);
    let categoryModalInstance = useRef(null);

    // Initialize Bootstrap modals
    useEffect(() => {
        if (productModalRef.current && !productModalInstance.current) {
            productModalInstance.current = new Modal(productModalRef.current);
        }
        if (categoryModalRef.current && !categoryModalInstance.current) {
            categoryModalInstance.current = new Modal(categoryModalRef.current);
        }
    }, []);

    async function fetchProducts() {
        try {
            const params = new URLSearchParams();
            if (filterCategory) params.append("category", filterCategory);
            if (filterStatus !== "") params.append("status", filterStatus);
            if (searchTerm) params.append("search", searchTerm);
            const res = await api.get(`/products?${params.toString()}`);
            setProducts(res.data);
            setSelectedProducts([]);
            setSelectAll(false);
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchCategories() {
        try {
            const res = await api.get("/categories");
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    const memoizedProducts = useCallback(fetchProducts, [filterCategory, filterStatus, searchTerm]);
    const memoizedCategories = useCallback(fetchCategories, []);

    useEffect(() => {
        memoizedProducts();
        memoizedCategories();
    }, [memoizedProducts, memoizedCategories]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setEditId(null);
        setFormData({
            name: "",
            category: "",
            originalPrice: "",
            offerPrice: "",
            isActive: true,
            image: null
        });
        setPreview(null);
    };

    const handleEdit = (p) => {
        setEditId(p._id);
        setFormData({
            name: p.name,
            category: p.category?._id || "",
            originalPrice: p.originalPrice,
            offerPrice: p.offerPrice,
            isActive: p.isActive,
            image: null
        });
        setPreview(p.image ? `http://api.advaytraders.in/${p.image}` : null);
        if (productModalInstance.current) {
            productModalInstance.current.show();
        }
    };

    const openProductModal = () => {
        resetForm();
        if (productModalInstance.current) {
            productModalInstance.current.show();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append("name", formData.name);
        data.append("category", formData.category);
        data.append("originalPrice", formData.originalPrice);
        data.append("offerPrice", formData.offerPrice);
        data.append("isActive", formData.isActive);
        if (formData.image) data.append("image", formData.image);

        try {
            if (editId) {
                await api.patch(`/products/${editId}`, data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else {
                await api.post("/products", data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }
            fetchProducts();
            closeModal('productModal');
            resetForm();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = (modalId) => {
        if (modalId === 'productModal' && productModalInstance.current) {
            productModalInstance.current.hide();
        } else if (modalId === 'categoryModal' && categoryModalInstance.current) {
            categoryModalInstance.current.hide();
        }
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }, 300);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const toggleStatus = async (product) => {
        try {
            await api.patch(`/products/${product._id}`, { isActive: !product.isActive });
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        try {
            const res = await api.post("/categories", { name: newCategoryName });
            setCategories([...categories, res.data]);
            setFormData({ ...formData, category: res.data._id });
            setNewCategoryName("");
        } catch (err) {
            console.error(err);
            alert("Error adding category: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
            try {
                await api.delete(`/categories/${id}`);
                setCategories(categories.filter(c => c._id !== id));
                if (formData.category === id) setFormData({ ...formData, category: "" });
                alert("Category deleted successfully");
            } catch (err) {
                console.error(err);
                alert("Error: " + (err.response?.data?.message || "Failed to delete category"));
            }
        }
    };

    const handleUpdateCategory = async (id) => {
        if (!editCategoryName) return;
        try {
            const res = await api.patch(`/categories/${id}`, { name: editCategoryName });
            setCategories(categories.map(c => c._id === id ? res.data : c));
            setEditCategoryId(null);
            setEditCategoryName("");
        } catch (err) {
            console.error(err);
            alert("Error updating category: " + (err.response?.data?.message || err.message));
        }
    };

    // Selection handlers
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map(p => p._id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectProduct = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pid => pid !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    // Bulk operations
    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) {
            alert("Please select products to delete");
            return;
        }
        if (window.confirm(`Delete ${selectedProducts.length} selected products?`)) {
            try {
                await api.post("/products/bulk-delete", { ids: selectedProducts });
                fetchProducts();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleBulkStatusUpdate = async (isActive) => {
        if (selectedProducts.length === 0) {
            alert("Please select products to update");
            return;
        }
        try {
            await api.post("/products/bulk-status", { ids: selectedProducts, isActive });
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    // CSV Export
    const handleExportCSV = () => {
        if (products.length === 0) return alert("No products to export");

        const headers = ["Name", "Category", "Original Price", "Offer Price", "Status"];
        const rows = products.map(p => [
            p.name,
            p.category?.name || "N/A",
            p.originalPrice,
            p.offerPrice,
            p.isActive ? "Active" : "Disabled"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `products_export_${Date.now()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSV Import handling
    const handleImportCSV = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            // Handle both \n and \r\n line endings correctly
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

            if (lines.length < 2) {
                alert("CSV file seems to be empty or missing data rows.");
                return;
            }

            // Skip headers on first line
            const dataRows = lines.slice(1);

            try {
                const errors = [];
                const productsData = dataRows.map((line, index) => {
                    const columns = line.split(",").map(s => s.trim());

                    if (columns.length < 4) {
                        errors.push(`Row ${index + 2}: Insufficient columns (Needs Name, Category, OriginalPrice, OfferPrice)`);
                        return null;
                    }

                    const [name, categoryName, originalPrice, offerPrice] = columns;

                    const cat = categories.find(c => c.name.trim().toLowerCase() === categoryName.toLowerCase());

                    if (!cat) {
                        errors.push(`Row ${index + 2}: Category "${categoryName}" not found. Please create it first exactly as named.`);
                        return null;
                    }

                    const oPrice = parseFloat(originalPrice);
                    const sPrice = parseFloat(offerPrice);

                    if (isNaN(oPrice) || isNaN(sPrice)) {
                        errors.push(`Row ${index + 2}: Prices are not valid numbers.`);
                        return null;
                    }

                    return {
                        name,
                        category: cat._id,
                        originalPrice: oPrice,
                        offerPrice: sPrice,
                        isActive: true
                    };
                }).filter(p => p !== null);

                if (errors.length > 0) {
                    alert("Import failed with errors:\n\n" + errors.join("\n"));
                    return;
                }

                if (productsData.length === 0) throw new Error("No valid products to import.");

                await api.post("/products/bulk", { products: productsData });
                fetchProducts();
                alert(`Successfully imported ${productsData.length} products!`);
                e.target.value = ""; // Clear file input after use
            } catch (err) {
                console.error("Import Error:", err);
                const msg = err.response?.data?.message || err.message || "Failed to process import.";
                alert("Import failed: " + msg);
            }
        };
        reader.onerror = () => alert("Failed to read file.");
        reader.readAsText(file);
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold">Product Management</h4>
                <div className="d-flex gap-2">
                    {/* Direct Import Button for Products */}
                    <button className="btn btn-outline-success btn-sm shadow-sm" onClick={() => { console.log('Import Products Clicked'); prodImportRef.current.click(); }}>
                        <i className="bi bi-file-earmark-arrow-up me-1"></i> Import Products
                    </button>

                    {/* Hidden File Input */}
                    <input type="file" ref={prodImportRef} className="d-none" accept=".csv" onChange={(e) => handleImportCSV(e, "products")} />

                    <button className="btn btn-outline-primary btn-sm shadow-sm" onClick={handleExportCSV}>
                        <i className="bi bi-file-earmark-arrow-down me-1"></i> Export CSV
                    </button>
                    <button className="btn btn-outline-info btn-sm shadow-sm" onClick={() => categoryModalInstance.current?.show()}>
                        <i className="bi bi-tags me-1"></i> Manage Categories
                    </button>
                    <button className="btn btn-primary btn-sm shadow-sm" onClick={openProductModal}>
                        <i className="bi bi-plus-lg me-1"></i> Add Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label fw-bold small">Search</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small">Category</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small">Status</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <div className="col-md-3 d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary btn-sm w-100"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterCategory("");
                                    setFilterStatus("");
                                }}
                            >
                                <i className="bi bi-x-circle me-1"></i> Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className="alert alert-info d-flex justify-content-between align-items-center py-2 px-3 border-0 shadow-sm">
                    <span className="small"><strong>{selectedProducts.length}</strong> products selected</span>
                    <div className="btn-group btn-group-sm">
                        <button className="btn btn-success" onClick={() => handleBulkStatusUpdate(true)}>
                            Enable
                        </button>
                        <button className="btn btn-warning" onClick={() => handleBulkStatusUpdate(false)}>
                            Disable
                        </button>
                        <button className="btn btn-danger" onClick={handleBulkDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-secondary small text-uppercase">
                                <tr>
                                    <th className="ps-3" style={{ width: "40px" }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={products.length > 0 && selectAll}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th style={{ width: "60px" }}>S.No</th>
                                    <th style={{ width: "80px" }}>Image</th>
                                    <th>Name</th>
                                    <th style={{ width: "120px" }}>Category</th>
                                    <th style={{ width: "100px" }}>Price</th>
                                    <th style={{ width: "180px" }}>Status</th>
                                    <th className="text-center" style={{ width: "120px" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">No products found</td>
                                    </tr>
                                ) : products.map((p, i) => (
                                    <tr key={p._id}>
                                        <td className="ps-3">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedProducts.includes(p._id)}
                                                onChange={() => handleSelectProduct(p._id)}
                                            />
                                        </td>
                                        <td>{i + 1}</td>
                                        <td>
                                            <img
                                                src={p.image ? `http://api.advaytraders.in/${p.image}` : "http://api.advaytraders.in/uploads/AD-preview.png"}
                                                alt={p.name}
                                                className="rounded border"
                                                style={{ width: "45px", height: "45px", objectFit: "cover" }}
                                            />
                                        </td>
                                        <td className="fw-semibold">{p.name}</td>
                                        <td><span className="badge bg-light text-dark border font-normal">{p.category?.name || "N/A"}</span></td>
                                        <td>
                                            <div className="text-decoration-line-through text-muted extra-small">₹{p.originalPrice}</div>
                                            <div className="fw-bold text-success">₹{p.offerPrice}</div>
                                        </td>
                                        <td>
                                            <div className="form-check form-switch d-flex align-items-center gap-2 text-nowrap">
                                                <input
                                                    className="form-check-input mt-0"
                                                    type="checkbox"
                                                    checked={p.isActive}
                                                    onChange={() => toggleStatus(p)}
                                                />
                                                <span className={`badge ${p.isActive ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                                                    {p.isActive ? "Active" : "Disabled"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center text-nowrap">
                                            <button className="btn btn-sm btn-link text-primary p-0 me-2" onClick={() => handleEdit(p)} title="Edit">
                                                <i className="bi bi-pencil-square fs-5"></i>
                                            </button>
                                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDelete(p._id)} title="Delete">
                                                <i className="bi bi-trash-fill fs-5"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* PRODUCT MODAL */}
            <div className="modal fade" ref={productModalRef} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header bg-light border-0">
                                <h5 className="modal-title fw-bold">
                                    {editId ? "Edit Product" : "Add New Product"}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => productModalInstance.current?.hide()}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Product Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Category</label>
                                        <select
                                            className="form-select shadow-sm"
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                        <div className="form-text mt-1 small text-muted">Use 'Manage Categories' on dashboard to add/edit.</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Original Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            required
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Offer Price (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            required
                                            value={formData.offerPrice}
                                            onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Product Image</label>
                                        <div className="border rounded p-3 text-center bg-light border-dashed">
                                            <input
                                                type="file"
                                                className="form-control mb-2"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            {preview ? (
                                                <div className="mt-2 position-relative d-inline-block">
                                                    <img src={preview} alt="Preview" className="img-thumbnail shadow-sm" style={{ height: "120px" }} />
                                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" onClick={() => setPreview(null)}>
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-muted small">No image selected</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="form-check form-switch p-0 d-flex align-items-center gap-2">
                                            <input
                                                className="form-check-input ms-0 mt-0"
                                                type="checkbox"
                                                id="activeCheck"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label className="form-check-label fw-bold" htmlFor="activeCheck">
                                                Active & Visible to Customers
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-3 bg-light">
                                <button type="button" className="btn btn-light" onClick={() => productModalInstance.current?.hide()}>Cancel</button>
                                <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                    {editId ? "Update Product" : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* CATEGORY MANAGEMENT MODAL */}
            <div className="modal fade" ref={categoryModalRef} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-light border-0">
                            <h5 className="modal-title fw-bold">Manage Categories</h5>
                            <button type="button" className="btn-close" onClick={() => categoryModalInstance.current?.hide()}></button>
                        </div>
                        <div className="modal-body">
                            <div className="p-3 bg-light rounded border border-dashed mb-3">
                                <label className="fw-bold small mb-2 d-block">Add New Category</label>
                                <div className="d-flex gap-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Category name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                    />
                                    <button className="btn btn-sm btn-success px-3" onClick={handleAddCategory}>Add</button>
                                </div>
                            </div>

                            <label className="fw-bold small mb-2 d-block">Existing Categories</label>
                            <div className="category-list shadow-sm border rounded overflow-hidden">
                                {categories.length === 0 ? (
                                    <div className="p-3 text-center text-muted small">No categories found</div>
                                ) : (
                                    <div className="scrollbar-thin" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                        {categories.map(c => (
                                            <div key={c._id} className="d-flex justify-content-between align-items-center p-3 bg-white border-bottom last-border-0">
                                                {editCategoryId === c._id ? (
                                                    <div className="d-flex gap-1 w-100">
                                                        <input
                                                            className="form-control form-control-sm"
                                                            value={editCategoryName}
                                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button className="btn btn-sm btn-success" onClick={() => handleUpdateCategory(c._id)}>
                                                            <i className="bi bi-check-lg"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => setEditCategoryId(null)}>
                                                            <i className="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="fw-medium">{c.name}</span>
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-primary border-0"
                                                                onClick={() => { setEditCategoryId(c._id); setEditCategoryName(c.name); }}
                                                                title="Edit"
                                                            >
                                                                <i className="bi bi-pencil-fill"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger border-0"
                                                                onClick={() => handleDeleteCategory(c._id, c.name)}
                                                                title="Delete"
                                                            >
                                                                <i className="bi bi-trash-fill"></i>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer border-0 bg-light">
                            <button type="button" className="btn btn-secondary" onClick={() => categoryModalInstance.current?.hide()}>Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .extra-small { font-size: 0.7rem; }
                .cursor-pointer { cursor: pointer; }
                .border-dashed { border-style: dashed !important; }
                .font-normal { font-weight: normal !important; }
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
                .btn-xs { padding: 0.1rem 0.25rem; font-size: 0.75rem; }
                .last-border-0:last-child { border-bottom: 0 !important; }
            `}</style>
        </div>
    );
}
