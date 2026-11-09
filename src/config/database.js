const mysql = require("mysql2/promise");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  timezone: "-06:00",
  connectTimeout: 5000,
});

// DATETIME representa hora civil del taller; también fijar el reloj de la sesión SQL.
pool.on("connection", (connection) => {
  connection.query("SET time_zone = '-06:00'", (error) => {
    if (error) connection.destroy();
  });
});

module.exports = pool;
