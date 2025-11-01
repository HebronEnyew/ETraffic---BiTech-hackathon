const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testConnection() {
    try {
        const [rows] = await db.query("SELECT 1 + 1 AS result");
        console.log("Database connected! Test query result:", rows[0].result);
    } catch (err) {
        console.error("Database connection failed:", err);
    }
}

testConnection();

module.exports = db;
