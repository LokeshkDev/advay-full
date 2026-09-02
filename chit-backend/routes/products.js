import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Product from "../models/Product.js";

const router = express.Router();

// MULTER SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Get all products with filtering
router.get("/", async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let query = {};

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by status
        if (status !== undefined && status !== "") {
            query.isActive = status === "true";
        }

        // Search by name
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        let products = await Product.find(query)
            .populate("category")
            .sort({ order: 1, createdAt: 1 });

        // Auto-fix any products without order field
        const needsOrder = products.some((p) => p.order === undefined || p.order === null);
        if (needsOrder) {
            const bulkOps = products.map((p, idx) => ({
                updateOne: {
                    filter: { _id: p._id },
                    update: { $set: { order: p.order !== undefined && p.order !== null ? p.order : idx } },
                },
            }));
            await Product.bulkWrite(bulkOps);
            products = await Product.find(query)
                .populate("category")
                .sort({ order: 1, createdAt: 1 });
        }

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reorder products (supports both PUT and POST)
const handleProductReorder = async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: "orderedIds array is required" });
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { order: index } },
            },
        }));

        await Product.bulkWrite(bulkOps);
        res.json({ message: "Products reordered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

router.put("/reorder", handleProductReorder);
router.post("/reorder", handleProductReorder);

// Add a product
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const count = await Product.countDocuments({ category: req.body.category });
        const product = new Product({
            name: req.body.name,
            image: req.file ? req.file.path : null,
            category: req.body.category,
            originalPrice: req.body.originalPrice,
            offerPrice: req.body.offerPrice,
            isActive: req.body.isActive === "true" || req.body.isActive === true,
            order: req.body.order !== undefined ? Number(req.body.order) : count,
        });

        const newProduct = await product.save();
        const populatedProduct = await Product.findById(newProduct._id).populate(
            "category"
        );
        res.status(201).json(populatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Bulk add products
router.post("/bulk", async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products array is required" });
        }

        const createdProducts = await Product.insertMany(products);
        const populatedProducts = await Product.find({
            _id: { $in: createdProducts.map((p) => p._id) },
        }).populate("category");

        res.status(201).json(populatedProducts);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Bulk delete products
router.post("/bulk-delete", async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Product IDs array is required" });
        }

        // Get products to delete their images
        const products = await Product.find({ _id: { $in: ids } });

        // Delete image files
        products.forEach(product => {
            if (product.image && fs.existsSync(product.image)) {
                fs.unlinkSync(product.image);
            }
        });

        await Product.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${ids.length} products deleted successfully` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk update status
router.post("/bulk-status", async (req, res) => {
    try {
        const { ids, isActive } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Product IDs array is required" });
        }

        await Product.updateMany({ _id: { $in: ids } }, { isActive });
        const updatedProducts = await Product.find({
            _id: { $in: ids },
        }).populate("category");

        res.json(updatedProducts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a product
router.patch("/:id", upload.single("image"), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (req.body.name) product.name = req.body.name;

        // If new image is uploaded, delete old image
        if (req.file) {
            if (product.image && fs.existsSync(product.image)) {
                fs.unlinkSync(product.image);
            }
            product.image = req.file.path;
        }

        if (req.body.category) product.category = req.body.category;
        if (req.body.originalPrice) product.originalPrice = req.body.originalPrice;
        if (req.body.offerPrice) product.offerPrice = req.body.offerPrice;
        if (req.body.isActive !== undefined) {
            product.isActive = req.body.isActive === "true" || req.body.isActive === true;
        }
        if (req.body.order !== undefined) {
            product.order = Number(req.body.order);
        }

        const updatedProduct = await product.save();
        const populatedProduct = await Product.findById(
            updatedProduct._id
        ).populate("category");
        res.json(populatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a product
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Delete image file if exists
        if (product.image && fs.existsSync(product.image)) {
            fs.unlinkSync(product.image);
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
