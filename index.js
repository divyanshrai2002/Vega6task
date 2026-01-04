const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// const path = require("path");
const authRouter = require("./routes/authRouter");
const productRouter = require("./routes/productRouter");
const orderRouter = require("./routes/OrderRouter");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./Swagger/Swagger");


dotenv.config();

const app = express();

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files for product photos
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// API Routes
app.use("/auth", authRouter);
app.use("/products", productRouter);
app.use("/orders", orderRouter);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ success: true, message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});