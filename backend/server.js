const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");
const app = express();

dotenv.config();


app.use(cors());
app.use(express.json()); // for receiving JSON bodies


db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to MySQL database");
        connection.release();
    }
});