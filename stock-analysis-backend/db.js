const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "nwind_server",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
