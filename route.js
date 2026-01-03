const express = require("express");
const dotenv = require("dotenv");
const User = require("./models/schema");   // Adjust path to your User model
const Product = require("./models/ProductSchema"); // Adjust path
const Router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { auth, upload } = require("./middleware/Authmiddle");

dotenv.config();

Router.post("/register", async (req, res) => {
    try {
        const { username, role, adminId, email, password } = req.body;

        if (!username || !role || !email || !password)
            return res.status(400).json({ message: "All fields required" });

        // Admin must have adminId
        if (role.toLowerCase() === "admin" && (!adminId || adminId.trim() === "")) {
            return res.status(400).json({ message: "Admin ID is required when role is Admin" });
        }

        // Check if user exists
        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(409).json({ message: "User already exists" });

        // Hash password
        const hashedPass = await bcrypt.hash(password, 10);

        // Create user
        await User.create({
            username,
            role,
            adminId: role.toLowerCase() === "admin" ? adminId : null,
            email,
            password: hashedPass,
        });

        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.log("REGISTER ERROR:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

const otpStore = {}; // In-memory store for demo

Router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;
    console.log("OTP stored:", otp, "for", email);

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
                pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"BlogApp" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otp}`,
        });

        res.json({ success: true, message: "OTP sent to email" });
    } catch (err) {
        console.error("Error sending OTP:", err);
        res.status(500).json({ success: false, message: "Failed to send OTP", error: err.message });
    }
});

Router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email & OTP required" });

    if (otpStore[email] && String(otpStore[email]) === String(otp)) {
        delete otpStore[email];
        return res.json({ success: true, message: "OTP verified successfully" });
    }

    res.status(400).json({ success: false, message: "Invalid OTP" });
});


Router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create JWT token with --> id, username, email, role
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role      // VERY IMPORTANT
            },
            process.env.JWT_SECRET || "secretkey123",
            { expiresIn: "2d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* ---------------------- PROTECTED ROUTES ---------------------- */

// Home page, admin and customer
Router.get("/", auth(["admin", "customer"]), (req, res) => {
    res.status(200).json({ message: "Welcome to home page", user: req.user });
});

// Products list, admin and customer
Router.get("/products", auth(["admin", "customer"]), async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json({ success: true, products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Add product, admin only
Router.post("/add-product", auth(["admin"]), upload.single("photo"), async (req, res) => {
    try {
        const { name, price, feature } = req.body;

        const product = await Product.create({
            product_photo: req.file.filename,
            product_name: name,
            product_price: price,
            small_feature: feature
        });

        res.json({ success: true, product });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete product, admin only
Router.delete("/delete/:id", auth(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        await product.destroy();
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = Router;
