import express from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const router = express.Router();

// Get all categories
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a category
router.post("/", async (req, res) => {
    const category = new Category({
        name: req.body.name,
    });

    try {
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

        const createdCategories = await Category.insertMany(categories);
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
