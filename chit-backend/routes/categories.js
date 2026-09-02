import express from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const router = express.Router();

// Get all categories sorted by order
router.get("/", async (req, res) => {
    try {
        let categories = await Category.find().sort({ order: 1, createdAt: 1, name: 1 });
        
        // Auto-fix any categories without order field
        const needsOrder = categories.some((c, idx) => c.order === undefined || c.order === null);
        if (needsOrder) {
            const bulkOps = categories.map((c, idx) => ({
                updateOne: {
                    filter: { _id: c._id },
                    update: { $set: { order: c.order !== undefined && c.order !== null ? c.order : idx } },
                },
            }));
            await Category.bulkWrite(bulkOps);
            categories = await Category.find().sort({ order: 1, createdAt: 1, name: 1 });
        }

        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reorder categories (supports both PUT and POST)
const handleCategoryReorder = async (req, res) => {
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

        await Category.bulkWrite(bulkOps);
        const updated = await Category.find().sort({ order: 1, createdAt: 1, name: 1 });
        res.json({ message: "Categories reordered successfully", categories: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

router.put("/reorder", handleCategoryReorder);
router.post("/reorder", handleCategoryReorder);

// Add a category
router.post("/", async (req, res) => {
    try {
        const count = await Category.countDocuments();
        const category = new Category({
            name: req.body.name,
            order: req.body.order !== undefined ? Number(req.body.order) : count,
        });

        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Bulk add categories
router.post("/bulk", async (req, res) => {
    try {
        const { categories } = req.body;
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ message: "Categories array is required" });
        }

        const currentCount = await Category.countDocuments();
        const categoriesWithOrder = categories.map((cat, idx) => ({
            ...cat,
            order: cat.order !== undefined ? cat.order : currentCount + idx,
        }));

        const createdCategories = await Category.insertMany(categoriesWithOrder);
        res.status(201).json(createdCategories);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a category
router.patch("/:id", async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        if (req.body.name) category.name = req.body.name;
        if (req.body.order !== undefined) category.order = Number(req.body.order);

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a category
router.delete("/:id", async (req, res) => {
    try {
        // Check if any products use this category
        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                message: `Cannot delete category. There are ${productCount} products still using it.`
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
