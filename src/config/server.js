require('dotenv').config();
const express = require('express');
const pool = require('./database');

const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({
      message: 'Servidor funcionando correctamente',
      database: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error en la conexión a la base de datos',
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
