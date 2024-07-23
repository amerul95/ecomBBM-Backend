// config/dbConfig.js
require('dotenv').config();

module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE_ECOM,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
