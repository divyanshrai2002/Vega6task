const sequelize = require("../Connection/database");

const User = require("./UserSchema");
const Product = require("./ProductSchema");
const Order = require("./OrderSchema");
const OrderItem = require("./OrderItemSchema");


User.hasMany(Order, {
    foreignKey: "user_id",
    as: "orders",
    onDelete: "CASCADE"
});

Order.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
});

Order.hasMany(OrderItem, {
    foreignKey: "order_id",
    as: "items",
    onDelete: "CASCADE"
});

OrderItem.belongsTo(Order, {
    foreignKey: "order_id",
    as: "order"
});


Product.hasMany(OrderItem, {
    foreignKey: "product_id",
    as: "orderItems"
});

OrderItem.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product"
});

const syncDB = async () => {
    try {
        await sequelize.sync({ alter: false });
        console.log(" All models synced successfully");
    } catch (error) {
        console.error(" Sync failed:", error);
    }
};

syncDB();
module.exports = {
    sequelize,
    User,
    Product,
    Order,
    OrderItem
};
