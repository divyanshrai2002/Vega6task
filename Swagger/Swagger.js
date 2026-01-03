const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Vega6 API Documentation",
            version: "1.0.0",
            description: "API documentation for Orders, Products, Users"
        },
        servers: [
            {
                url: "http://localhost:3000", // change port if needed
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ["./routes/*.js"], // scan route files
};

module.exports = swaggerJsdoc(options);
