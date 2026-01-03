const express = require("express");
const Product = require("../models/ProductSchema");
const Router = express.Router();
const { auth, upload } = require("../middleware/Authmiddle");
const { Op } = require("sequelize");


/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination and filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: iphone
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: IPHN-001
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// GET /products - List all products with pagination and filters
Router.get("/", auth(["admin", "customer"]), async (req, res) => {
    try {
        const { page = 1, limit = 10, name, sku } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause for filters
        const where = {};
        if (name) {
            where.product_name = { [Op.like]: `%${name}%` };
        }
        if (sku) {
            where.sku = { [Op.like]: `%${sku}%` };
        }

        const { count, rows: products } = await Product.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            products,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ...existing code...
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */


// GET /products/:id - Get single product
Router.get("/:id", auth(["admin", "customer"]), async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, product });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});



/**
 * @swagger
 * /products/create-product:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15
 *               sku:
 *                 type: string
 *                 example: IPHN-015
 *               price:
 *                 type: number
 *                 example: 79999
 *               stock:
 *                 type: integer
 *                 example: 50
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// POST /products - Create new product (ADMIN only)
Router.post("/create-product", auth(["admin"]), upload.single("photo"), async (req, res) => {
    try {
        const { name, price, sku, stock } = req.body;

        if (!name || !sku || !price) {
            return res.status(400).json({ success: false, message: "Name,sku and price are required" });
        }

        const productData = {
            name: name,
            sku: sku,
            price: price,
            stock: stock

        };

        // Only add photo if file was uploaded
        if (req.file) {
            productData.product_photo = req.file.filename;
        }

        const product = await Product.create(productData);

        res.json({ success: true, product });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});



/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product details (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Samsung Galaxy S24
 *               sku:
 *                 type: string
 *                 example: SSG-024
 *               price:
 *                 type: number
 *                 example: 69999
 *               stock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: No fields provided
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */

// PUT /products/:id - Update product (ADMIN only)
Router.put("/:id", auth(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, sku, stock } = req.body;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (sku !== undefined) updateData.sku = sku;
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;


        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided to update"
            });
        }

        await product.update(updateData);

        res.json({
            success: true,
            product
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}
);




/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 7
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */

// DELETE /products/:id - Delete product (ADMIN only)
Router.delete("/:id", auth(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        await product.destroy();
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = Router;