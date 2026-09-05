import { useEffect, useState, useRef, useCallback } from "react";
import { Modal } from "bootstrap";
import { api, BACKEND_HOST } from "../api";

const getImageUrl = (imagePath) => {
    if (!imagePath) return `${BACKEND_HOST}/uploads/AD-preview.png`;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return `${BACKEND_HOST}/${cleanPath}`;
};

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

    // Accordion State (Collapsed by default: empty object)
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategoryAccordion = (catId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const expandAllCategories = () => {
        const all = {};
        categories.forEach(c => { all[c._id] = true; });
        all["uncategorized"] = true;
        setExpandedCategories(all);
    };

    const collapseAllCategories = () => {
        setExpandedCategories({});
    };

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
            productModalInstance.current = Modal.getOrCreateInstance(productModalRef.current);
        }
        if (categoryModalRef.current && !categoryModalInstance.current) {
            categoryModalInstance.current = Modal.getOrCreateInstance(categoryModalRef.current);
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
            category: categories.length > 0 ? categories[0]._id : "",
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
            category: p.category?._id || p.category || "",
            originalPrice: p.originalPrice,
            offerPrice: p.offerPrice,
            isActive: p.isActive,
            image: null
        });
        setPreview(p.image ? getImageUrl(p.image) : null);
        if (productModalInstance.current) {
            productModalInstance.current.show();
        }
    };

    const openProductModal = (defaultCatId = "") => {
        resetForm();
        if (defaultCatId) {
            setFormData(prev => ({ ...prev, category: defaultCatId }));
        }
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

    /* ==========================================
       CATEGORY REORDERING (UP / DOWN)
    ========================================== */
    const moveCategory = async (catId, direction) => {
        const index = categories.findIndex(c => c._id === catId);
        if (index === -1) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;

        const newCategories = [...categories];
        const [movedCategory] = newCategories.splice(index, 1);
        newCategories.splice(targetIndex, 0, movedCategory);

        // Optimistically update UI
        setCategories(newCategories);

        try {
            const orderedIds = newCategories.map(c => c._id);
            await api.post("/categories/reorder", { orderedIds });
            await fetchCategories();
            await fetchProducts();
        } catch (err) {
            console.error("Failed to reorder categories:", err);
            await fetchCategories(); // Revert on failure
        }
    };

    /* ==========================================
       PRODUCT REORDERING (UP / DOWN)
    ========================================== */
    const moveProduct = async (catId, productId, direction) => {
        const catProducts = products
            .filter(p => (p.category?._id || p.category) === catId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const index = catProducts.findIndex(p => p._id === productId);
        if (index === -1) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= catProducts.length) return;

        const newCatProducts = [...catProducts];
        const [moved] = newCatProducts.splice(index, 1);
        newCatProducts.splice(targetIndex, 0, moved);

        // Assign explicit new sequential order 0, 1, 2, ...
        const updatedCatProducts = newCatProducts.map((p, idx) => ({ ...p, order: idx }));

        // Optimistically update products state
        const otherProducts = products.filter(p => (p.category?._id || p.category) !== catId);
        setProducts([...otherProducts, ...updatedCatProducts]);

        try {
            const orderedIds = updatedCatProducts.map(p => p._id);
            await api.post("/products/reorder", { orderedIds });
            await fetchProducts();
        } catch (err) {
            console.error("Failed to reorder products:", err);
            await fetchProducts();
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await api.post("/categories", { name: newCategoryName.trim() });
            setCategories([...categories, res.data]);
            setFormData(prev => ({ ...prev, category: res.data._id }));
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
                if (formData.category === id) setFormData(prev => ({ ...prev, category: "" }));
                fetchProducts();
                alert("Category deleted successfully");
            } catch (err) {
                console.error(err);
                alert("Error: " + (err.response?.data?.message || "Failed to delete category"));
            }
        }
    };

    const handleUpdateCategory = async (id) => {
        if (!editCategoryName.trim()) return;
        try {
            const res = await api.patch(`/categories/${id}`, { name: editCategoryName.trim() });
            setCategories(categories.map(c => c._id === id ? res.data : c));
            setEditCategoryId(null);
            setEditCategoryName("");
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert("Error updating category: " + (err.response?.data?.message || err.message));
        }
    };

    // Selection handlers
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
                setSelectedProducts([]);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedProducts.length === 0) {
            alert("Please select products to update");
            return;
        }
        try {
            await api.post("/products/bulk-status", { ids: selectedProducts, isActive: status });
            fetchProducts();
            setSelectedProducts([]);
        } catch (err) {
            console.error(err);
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        if (products.length === 0) {
            alert("No products available to export");
            return;
        }
        const headers = ["Product Name", "Category", "Original Price", "Offer Price", "Status"];
        const rows = products.map(p => [
            `"${p.name.replace(/"/g, '""')}"`,
            `"${(p.category?.name || "Uncategorized").replace(/"/g, '""')}"`,
            p.originalPrice,
            p.offerPrice,
            p.isActive ? "Active" : "Disabled"
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `products_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Import CSV
    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
                if (lines.length <= 1) throw new Error("CSV file is empty or missing data rows.");

                const rows = lines.slice(1);
                const errors = [];
                const productsData = rows.map((line, idx) => {
                    const parts = line.split(",").map(s => s.trim().replace(/^"|"$/g, ''));
                    if (parts.length < 4) {
                        errors.push(`Row ${idx + 2}: Invalid column count`);
                        return null;
                    }
                    const [name, categoryName, originalPrice, offerPrice] = parts;
                    const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                    if (!cat) {
                        errors.push(`Row ${idx + 2}: Category "${categoryName}" does not exist`);
                        return null;
                    }
                    return {
                        name,
                        category: cat._id,
                        originalPrice: Number(originalPrice) || 0,
                        offerPrice: Number(offerPrice) || 0,
                        isActive: true
                    };
                }).filter(p => p !== null);

                if (errors.length > 0) {
                    alert("Import failed with errors:\n\n" + errors.join("\n"));
                    return;
                }

                await api.post("/products/bulk", { products: productsData });
                fetchProducts();
                alert(`Successfully imported ${productsData.length} products!`);
                e.target.value = "";
            } catch (err) {
                console.error("Import Error:", err);
                alert("Import failed: " + (err.response?.data?.message || err.message));
            }
        };
        reader.readAsText(file);
    };

    // Filter categories to display
    const displayedCategories = filterCategory
        ? categories.filter(c => c._id === filterCategory)
        : categories;

    // Check for products with no category
    const uncategorizedProducts = products.filter(p => !p.category || !categories.some(c => c._id === (p.category?._id || p.category)));

    return (
        <div className="container-fluid py-4 px-4">
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h4 className="fw-bold mb-1">Product Management</h4>
                    <p className="text-muted small mb-0">Group products category-wise and reorder placement (▲ / ▼)</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-outline-success btn-sm shadow-sm" onClick={() => prodImportRef.current.click()}>
                        <i className="bi bi-file-earmark-arrow-up me-1"></i> Import CSV
                    </button>
                    <input type="file" ref={prodImportRef} className="d-none" accept=".csv" onChange={handleImportCSV} />

                    <button className="btn btn-outline-primary btn-sm shadow-sm" onClick={handleExportCSV}>
                        <i className="bi bi-file-earmark-arrow-down me-1"></i> Export CSV
                    </button>
                    <button className="btn btn-outline-info btn-sm shadow-sm" onClick={() => categoryModalInstance.current?.show()}>
                        <i className="bi bi-tags me-1"></i> Manage Categories
                    </button>
                    <button className="btn btn-primary btn-sm shadow-sm" onClick={() => openProductModal()}>
                        <i className="bi bi-plus-lg me-1"></i> Add Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card shadow-sm border-0 mb-4 bg-white">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label fw-bold small text-secondary">Search Products</label>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search by product name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small text-secondary">Filter by Category</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories ({categories.length})</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold small text-secondary">Filter by Status</label>
                            <select
                                className="form-select form-select-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="true">Active Only</option>
                                <option value="false">Disabled Only</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary btn-sm w-100"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterCategory("");
                                    setFilterStatus("");
                                }}
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Selection Bar */}
            {selectedProducts.length > 0 && (
                <div className="alert alert-info d-flex justify-content-between align-items-center py-2 px-3 border-0 shadow-sm mb-4">
                    <span className="small"><strong>{selectedProducts.length}</strong> products selected</span>
                    <div className="btn-group btn-group-sm">
                        <button className="btn btn-success" onClick={() => handleBulkStatusUpdate(true)}>
                            <i className="bi bi-check-circle me-1"></i> Enable
                        </button>
                        <button className="btn btn-warning" onClick={() => handleBulkStatusUpdate(false)}>
                            <i className="bi bi-dash-circle me-1"></i> Disable
                        </button>
                        <button className="btn btn-danger" onClick={handleBulkDelete}>
                            <i className="bi bi-trash me-1"></i> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Category Accordion Header & Expand/Collapse Controls */}
            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                <div className="text-muted small">
                    Showing <strong>{displayedCategories.length}</strong> Categories ({products.length} Products Total)
                </div>
                <div className="btn-group btn-group-sm">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={expandAllCategories}
                        title="Expand all category accordions"
                    >
                        <i className="bi bi-arrows-expand me-1"></i> Expand All
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={collapseAllCategories}
                        title="Collapse all category accordions"
                    >
                        <i className="bi bi-arrows-collapse me-1"></i> Collapse All
                    </button>
                </div>
            </div>

            {/* CATEGORY-WISE ACCORDION SECTIONS */}
            {displayedCategories.map((cat, catIdx) => {
                const catProducts = products
                    .filter(p => (p.category?._id || p.category) === cat._id)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                const isExpanded = Boolean(expandedCategories[cat._id]);

                return (
                    <div key={cat._id} className="card shadow-sm border-0 mb-3 overflow-hidden">
                        {/* Category Header with Reorder Arrows & Collapse Toggle */}
                        <div
                            className="card-header d-flex justify-content-between align-items-center py-2 px-3 user-select-none"
                            style={{ backgroundColor: "#1B365D", color: "#ffffff", cursor: "pointer" }}
                            onClick={() => toggleCategoryAccordion(cat._id)}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <i className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"} text-warning fw-bold fs-6`}></i>
                                <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                                    #{catIdx + 1}
                                </span>
                                <h6 className="mb-0 fw-bold text-white text-uppercase letter-spacing-1">
                                    {cat.name}
                                </h6>
                                <span className="badge bg-light bg-opacity-25 text-white small">
                                    {catProducts.length} {catProducts.length === 1 ? "Product" : "Products"}
                                </span>
                            </div>

                            <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <div className="btn-group btn-group-sm" role="group" aria-label="Category Order">
                                    <button
                                        type="button"
                                        className="btn btn-outline-light btn-sm py-0 px-2"
                                        title="Move Category UP"
                                        disabled={categories.findIndex(c => c._id === cat._id) <= 0}
                                        onClick={(e) => { e.stopPropagation(); moveCategory(cat._id, "up"); }}
                                    >
                                        <i className="bi bi-arrow-up-circle-fill"></i> UP
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-light btn-sm py-0 px-2"
                                        title="Move Category DOWN"
                                        disabled={categories.findIndex(c => c._id === cat._id) >= categories.length - 1}
                                        onClick={(e) => { e.stopPropagation(); moveCategory(cat._id, "down"); }}
                                    >
                                        <i className="bi bi-arrow-down-circle-fill"></i> DOWN
                                    </button>
                                </div>

                                <button
                                    className="btn btn-warning btn-sm py-0 px-2 text-dark fw-semibold"
                                    onClick={(e) => { e.stopPropagation(); openProductModal(cat._id); }}
                                    title={`Add product under ${cat.name}`}
                                >
                                    <i className="bi bi-plus-lg"></i> Add
                                </button>
                            </div>
                        </div>

                        {/* Category Products Table (Shown only when expanded) */}
                        {isExpanded && (
                            <div className="card-body p-0 border-top">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light text-secondary small text-uppercase" style={{ backgroundColor: "#fff8e1" }}>
                                            <tr>
                                                <th className="ps-3" style={{ width: "40px" }}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={catProducts.length > 0 && catProducts.every(p => selectedProducts.includes(p._id))}
                                                        onChange={() => {
                                                            const catIds = catProducts.map(p => p._id);
                                                            const allSelected = catIds.every(id => selectedProducts.includes(id));
                                                            if (allSelected) {
                                                                setSelectedProducts(selectedProducts.filter(id => !catIds.includes(id)));
                                                            } else {
                                                                setSelectedProducts([...new Set([...selectedProducts, ...catIds])]);
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th style={{ width: "70px" }}>Order</th>
                                                <th style={{ width: "80px" }}>Image</th>
                                                <th>Product Name</th>
                                                <th style={{ width: "160px" }}>Price (Original / Offer)</th>
                                                <th style={{ width: "140px" }}>Status</th>
                                                <th className="text-center" style={{ width: "130px" }}>Reorder Product</th>
                                                <th className="text-center" style={{ width: "100px" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {catProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-4 text-muted small">
                                                        No products found in this category. Click <strong>Add</strong> to add the first product!
                                                    </td>
                                                </tr>
                                            ) : (
                                                catProducts.map((p, pIdx) => (
                                                    <tr key={p._id}>
                                                        <td className="ps-3">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={selectedProducts.includes(p._id)}
                                                                onChange={() => handleSelectProduct(p._id)}
                                                            />
                                                        </td>
                                                        <td className="fw-semibold text-muted small">
                                                            #{pIdx + 1}
                                                        </td>
                                                        <td>
                                                            <img
                                                                src={getImageUrl(p.image)}
                                                                alt={p.name}
                                                                className="rounded border"
                                                                style={{ width: "45px", height: "45px", objectFit: "cover" }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = getImageUrl(null);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="fw-semibold text-dark">{p.name}</td>
                                                        <td>
                                                            <span className="text-decoration-line-through text-muted small me-2">₹{p.originalPrice}</span>
                                                            <span className="fw-bold text-success">₹{p.offerPrice}</span>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-switch d-flex align-items-center gap-2">
                                                                <input
                                                                    className="form-check-input mt-0"
                                                                    type="checkbox"
                                                                    checked={p.isActive}
                                                                    onChange={() => toggleStatus(p)}
                                                                />
                                                                <span className={`badge ${p.isActive ? "bg-success" : "bg-danger"}`}>
                                                                    {p.isActive ? "Active" : "Disabled"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Product Move UP / DOWN Buttons */}
                                                        <td className="text-center">
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    title="Move Product UP"
                                                                    disabled={pIdx === 0}
                                                                    onClick={() => moveProduct(cat._id, p._id, "up")}
                                                                >
                                                                    <i className="bi bi-chevron-up"></i>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    title="Move Product DOWN"
                                                                    disabled={pIdx === catProducts.length - 1}
                                                                    onClick={() => moveProduct(cat._id, p._id, "down")}
                                                                >
                                                                    <i className="bi bi-chevron-down"></i>
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Edit & Delete Actions */}
                                                        <td className="text-center text-nowrap">
                                                            <button className="btn btn-sm btn-link text-primary p-0 me-2" onClick={() => handleEdit(p)} title="Edit Product">
                                                                <i className="bi bi-pencil-square fs-5"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDelete(p._id)} title="Delete Product">
                                                                <i className="bi bi-trash-fill fs-5"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* UNCATEGORIZED PRODUCTS IF ANY */}
            {uncategorizedProducts.length > 0 && (
                <div className="card shadow-sm border-0 mb-4 overflow-hidden">
                    <div
                        className="card-header bg-secondary text-white py-2 px-3 d-flex justify-content-between align-items-center user-select-none"
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleCategoryAccordion("uncategorized")}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <i className={`bi ${expandedCategories["uncategorized"] ? "bi-chevron-down" : "bi-chevron-right"} text-white fw-bold fs-6`}></i>
                            <h6 className="mb-0 fw-bold">Uncategorized Products ({uncategorizedProducts.length})</h6>
                        </div>
                    </div>
                    {expandedCategories["uncategorized"] && (
                        <div className="card-body p-0 border-top">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <tbody>
                                        {uncategorizedProducts.map((p, pIdx) => (
                                            <tr key={p._id}>
                                                <td style={{ width: "40px" }} className="ps-3">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedProducts.includes(p._id)}
                                                        onChange={() => handleSelectProduct(p._id)}
                                                    />
                                                </td>
                                                <td style={{ width: "70px" }}>#{pIdx + 1}</td>
                                                <td style={{ width: "80px" }}>
                                                    <img
                                                        src={getImageUrl(p.image)}
                                                        alt={p.name}
                                                        className="rounded border"
                                                        style={{ width: "45px", height: "45px", objectFit: "cover" }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = getImageUrl(null);
                                                        }}
                                                    />
                                                </td>
                                                <td className="fw-semibold">{p.name}</td>
                                                <td style={{ width: "160px" }}>₹{p.offerPrice}</td>
                                                <td style={{ width: "140px" }}>
                                                    <span className={`badge ${p.isActive ? "bg-success" : "bg-danger"}`}>{p.isActive ? "Active" : "Disabled"}</span>
                                                </td>
                                                <td className="text-center" style={{ width: "130px" }}>—</td>
                                                <td className="text-center text-nowrap" style={{ width: "100px" }}>
                                                    <button className="btn btn-sm btn-link text-primary p-0 me-2" onClick={() => handleEdit(p)}>
                                                        <i className="bi bi-pencil-square fs-5"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDelete(p._id)}>
                                                        <i className="bi bi-trash-fill fs-5"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PRODUCT MODAL (ADD / EDIT) */}
            <div className="modal fade" ref={productModalRef} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-light border-0">
                            <h5 className="modal-title fw-bold">{editId ? "Edit Product" : "Add New Product"}</h5>
                            <button type="button" className="btn-close" onClick={() => productModalInstance.current?.hide()}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
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
                                            className="form-select"
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
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
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-light border-0">
                            <h5 className="modal-title fw-bold">Manage Categories & Placement</h5>
                            <button type="button" className="btn-close" onClick={() => categoryModalInstance.current?.hide()}></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="p-3 bg-light rounded border border-dashed mb-3">
                                <label className="fw-bold small mb-2 d-block">Add New Category</label>
                                <div className="d-flex gap-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Enter category name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                    />
                                    <button className="btn btn-sm btn-success px-3" onClick={handleAddCategory}>
                                        <i className="bi bi-plus-lg me-1"></i> Add
                                    </button>
                                </div>
                            </div>

                            <label className="fw-bold small mb-2 d-block">Categories Placement Order (▲ / ▼)</label>
                            <div className="category-list shadow-sm border rounded overflow-hidden">
                                {categories.length === 0 ? (
                                    <div className="p-3 text-center text-muted small">No categories found</div>
                                ) : (
                                    <div className="scrollbar-thin" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                        {categories.map((c, idx) => (
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
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="badge bg-secondary">#{idx + 1}</span>
                                                            <span className="fw-semibold text-dark">{c.name}</span>
                                                        </div>

                                                        <div className="d-flex align-items-center gap-2">
                                                            {/* Reorder Buttons */}
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    disabled={idx === 0}
                                                                    onClick={() => moveCategory(c._id, "up")}
                                                                    title="Move Category UP"
                                                                >
                                                                    <i className="bi bi-chevron-up"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    disabled={idx === categories.length - 1}
                                                                    onClick={() => moveCategory(c._id, "down")}
                                                                    title="Move Category DOWN"
                                                                >
                                                                    <i className="bi bi-chevron-down"></i>
                                                                </button>
                                                            </div>

                                                            <div className="btn-group btn-group-sm ms-2">
                                                                <button
                                                                    className="btn btn-outline-primary border-0"
                                                                    onClick={() => { setEditCategoryId(c._id); setEditCategoryName(c.name); }}
                                                                    title="Edit Category Name"
                                                                >
                                                                    <i className="bi bi-pencil-fill"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger border-0"
                                                                    onClick={() => handleDeleteCategory(c._id, c.name)}
                                                                    title="Delete Category"
                                                                >
                                                                    <i className="bi bi-trash-fill"></i>
                                                                </button>
                                                            </div>
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
                .letter-spacing-1 { letter-spacing: 0.8px; }
                .border-dashed { border-style: dashed !important; }
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
                .last-border-0:last-child { border-bottom: 0 !important; }
            `}</style>
        </div>
    );
}
