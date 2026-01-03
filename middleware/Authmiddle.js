const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

dotenv.config();

// Auth middleware
const auth = (allowedRoles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No token provided" });

        const [type, token] = authHeader.split(" ");
        if (type !== "Bearer" || !token) return res.status(401).json({ message: "Invalid token format" });

        jwt.verify(token, process.env.JWT_SECRET || "secretkey123", (err, decoded) => {
            if (err) return res.status(401).json({ message: "Invalid token" });

            req.user = decoded;

            // Case-insensitive role check
            const userRole = decoded.role.toLowerCase();
            const allowed = allowedRoles.map(r => r.toLowerCase());

            if (allowed.length > 0 && !allowed.includes(userRole)) {
                return res.status(403).json({ message: "Access denied: you cannot access this route" });
            }

            next();
        });
    };
};

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

module.exports = { auth, upload };
