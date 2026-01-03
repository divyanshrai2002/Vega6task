const express = require("express");
const Router = express.Router();
const { auth } = require("../middleware/Authmiddle");
// const Order = require("../models/OrderSchema");
// const OrderItem = require("../models/OrderItemSchema");
// const Product = require("../models/ProductSchema");
const { Order, OrderItem, Product } = require("../models");

// ==================== POST /api/orders - Create Order ====================
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


Router.post("/", auth(["admin", "customer"]), async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must contain at least one item"
            });
        }

        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            if (!item.productId || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Each item must have productId and quantity"
                });
            }

            const product = await Product.findByPk(item.productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${item.productId} not found`
                });
            }

            const quantity = parseInt(item.quantity);
            if (quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be greater than 0"
                });
            }

            const itemTotal = parseFloat(product.price) * quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                product_id: product.id,
                quantity,
                unit_price: product.price
            });
        }

        //  Create order
        const order = await Order.create({
            user_id: req.user.id,
            total_amount: totalAmount.toFixed(2),
            status: "PENDING"
        });


        for (const item of validatedItems) {
            await OrderItem.create({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            });
        }

        //  Fetch full order
        // console.log("Order associations:", Object.keys(Order.associations));

        const completeOrder = await Order.findByPk(order.id, {
            include: [{
                model: OrderItem,
                as: "items",
                include: [{
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "price"]
                }]
            }]
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: completeOrder
        });

    } catch (err) {
        console.error("ORDER CREATE ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (admin) or user orders (customer)
 *     tags: [Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *           example: PENDING
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

//   List Orders
Router.get("/", auth(["admin", "customer"]), async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};

        // Customers see only their orders
        if (req.user.role.toLowerCase() === "customer") {
            where.user_id = req.user.id;
        }

        if (status) {
            where.status = status.toUpperCase();
        }

        const { count, rows } = await Order.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["created_at", "DESC"]],
            include: [{
                model: OrderItem,
                as: "items",
                include: [{
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "price"]
                }]
            }]
        });

        res.json({
            success: true,
            orders: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (err) {
        console.error("GET ORDERS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
});
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
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
 *         description: Order retrieved successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */


// Get Single Order
Router.get("/:id", auth(["admin", "customer"]), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{
                model: OrderItem,
                as: "items",
                include: [{
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "price"]
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            req.user.role.toLowerCase() === "customer" &&
            order.user_id !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order"
            });
        }

        res.json({ success: true, order });

    } catch (err) {
        console.error("GET ORDER ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, CANCELLED]
 *                 example: CANCELLED
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

// PATCH /api/orders/:id/status
Router.patch("/:id/status", auth(["admin", "customer"]), async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ["PENDING", "PAID", "CANCELLED"];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${allowedStatuses.join(", ")}`
            });
        }

        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            req.user.role.toLowerCase() === "customer" &&
            order.user_id !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Customer can only cancel
        if (
            req.user.role.toLowerCase() === "customer" &&
            status !== "CANCELLED"
        ) {
            return res.status(403).json({
                success: false,
                message: "Customers can only cancel orders"
            });
        }

        await order.update({ status });

        res.json({
            success: true,
            message: "Order status updated",
            order
        });

    } catch (err) {
        console.error("UPDATE STATUS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
});

module.exports = Router;
