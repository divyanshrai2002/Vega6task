const sequelize = require("../Connection/database");

const User = require("./UserSchema");
const Product = require("./ProductSchema");
const Order = require("./OrderSchema");
const OrderItem = require("./OrderItemSchema");

/* ================= USER ↔ ORDER ================= */
User.hasMany(Order, {
    foreignKey: "user_id",
    as: "orders",
    onDelete: "CASCADE"
});

Order.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});

/* ================= ORDER ↔ ORDER ITEM ================= */
Order.hasMany(OrderItem, {
    foreignKey: "order_id",
    as: "items",
    onDelete: "CASCADE"
});

OrderItem.belongsTo(Order, {
    foreignKey: "order_id",
    as: "order"
});

/* ================= PRODUCT ↔ ORDER ITEM ================= */
Product.hasMany(OrderItem, {
    foreignKey: "product_id",
    as: "orderItems"
});

OrderItem.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product"
});

module.exports = {
    sequelize,
    User,
    Product,
    Order,
    OrderItem
};
