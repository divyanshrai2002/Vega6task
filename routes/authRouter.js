const express = require("express");
const dotenv = require("dotenv");
const User = require("../models/UserSchema");
const Router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { auth } = require("../middleware/Authmiddle");
const {rateLimit} = require("express-rate-limit");

dotenv.config();

const otpStore = {};

// POST /auth/register
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - role
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: divyansh
 *               role:
 *                 type: string
 *                 example: customer
 *               adminId:
 *                 type: string
 *                 example: ADMIN123
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 2,
  message: "Too many attempts, try again later"
});
Router.post("/register",limiter, async (req, res) => {
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
        const user = await User.create({
            username,
            role,
            adminId: role.toLowerCase() === "admin" ? adminId : null,
            email,
            password: hashedPass,
        });

        res.status(201).json({
            message: "Registration successful",
            // user: {
            //     id: user.id,
            //     username: user.username,
            //     email: user.email,
            //     role: user.role
            // }
        });
    } catch (error) {
        console.log("REGISTER ERROR:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: divyansh
 *                     email:
 *                       type: string
 *                       example: test@gmail.com
 *                     role:
 *                       type: string
 *                       example: customer
 *       400:
 *         description: Email and password required
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */


// POST /auth/login
Router.post("/login",limiter, async (req, res) => {
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

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
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


/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: divyansh
 *                     email:
 *                       type: string
 *                       example: test@gmail.com
 *                     role:
 *                       type: string
 *                       example: customer
 *                     adminId:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// GET /auth/me - Get current user info
Router.get("/me",limiter,auth(["admin", "customer"]), async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                adminId: user.adminId,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// POST /auth/send-otp
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
            from: `"vega6Task" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
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


// POST /auth/verify-otp
Router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email & OTP required" });

    if (otpStore[email] && String(otpStore[email]) === String(otp)) {
        delete otpStore[email];
        return res.json({ success: true, message: "OTP verified successfully" });
    }

    res.status(400).json({ success: false, message: "Invalid OTP" });
});

module.exports = Router;