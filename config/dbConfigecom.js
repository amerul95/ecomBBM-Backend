// config/dbConfig.js
require('dotenv').config();

module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE_ECOM,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
