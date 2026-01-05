# 🛒 E-commerce REST API (Node.js + Express + Sequelize)

A complete **E-commerce Backend API** built using **Node.js, Express, Sequelize (MySQL)** with **JWT Authentication, Role-based Access Control, Swagger API Documentation, Rate Limiting**, and secure best practices.

This project is suitable for learning, internships, and production-ready backend structure.

---

## 🚀 Features

* 🔐 JWT Authentication (Login & Register)
* 👥 Role-based Authorization (Admin / Customer)
* 📦 Product Management
* 🧾 Order & Order Items Management
* 🛡️ Rate Limiting for sensitive APIs
* 📘 Swagger API Documentation
* 🔑 Password Hashing using bcrypt
* 🌐 CORS Enabled
* 🗄️ Sequelize ORM with MySQL

---

## 🧰 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **ORM:** Sequelize
* **Authentication:** JWT
* **Documentation:** Swagger (swagger-jsdoc + swagger-ui-express)
* **Security:** bcrypt, express-rate-limit

---

## 📁 Project Structure

```bash
project-root/
│
├── config/
│   └── database.js
│
├── models/
│   ├── UserSchema.js
│   ├── ProductSchema.js
│   ├── OrderSchema.js
│   ├── OrderItemSchema.js
│   └── index.js
│
├
│
├── middleware/
│   ├── Authmiddle.js
│   
│
├── swagger/
│   └── swagger.js
│
├── .env
├── index.js
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables (.env)

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ecommerce_db

JWT_SECRET=secretkey123
```

---

## 🗄️ Database Setup

1. Create a MySQL database manually:

```sql
CREATE DATABASE vega6task;
```

2. Update your `.env` file with database credentials:

```env

DB_NAME=vega6task
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
```

3. Sequelize will automatically sync tables when the server starts:

```js
sequelize.sync({ alter: false });
```

> ⚠️ Use `alter: false` or `sync: false` in production to avoid data loss.

## 🔐 Authentication APIs

### Register User

```
POST /auth/register
```

### Login User

```
POST /auth/login
```

### Get Logged-in User

```
GET /auth/me
Authorization: Bearer <token>
```

---

## 📦 Product APIs

* Create Product (Admin)
* Get All Products
* Update Product (Admin)
* Delete Product (Admin)

---

## 🧾 Order APIs

* Create Order
* Get Order by ID
* Get My Orders
* Order Items handled via associations

---

## 🛡️ Rate Limiting

Applied on sensitive APIs like:

* Login

* Register

* Order Creation

Example:

```js
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5
});
```

---

## 📘 Swagger API Documentation

### Access Swagger UI

```
http://localhost:3000/api-docs
```

Swagger is configured using **JSDoc comments** above routes.

Example:

```js
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
```

---

## ▶️ Run the Project

### Install Dependencies

```bash
npm install
```

### Start Server

```bash
nodemon app.js
```

or

```bash
node index.js
```

---

## 🧪 Testing

* Use **Postman** for API testing
* Use **Swagger UI** for interactive API testing

---

## 🔐 Security Best Practices Used

* Password Hashing (bcrypt)
* JWT Token Expiry
* Rate Limiting
* Role-based Authorization
* Environment Variables

---

##

---

## 👨‍💻 Author

**Divyansh Kumar Rai**


---

##
