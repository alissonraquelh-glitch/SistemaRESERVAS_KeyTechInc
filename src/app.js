const express = require('express');
const pool = require('./config/database');
const clientesRoutes = require('./routes/usuariosRoutes');
const vehiculosRoutes = require('./routes/vehiculosRoutes');
const citasRoutes = require('./routes/citasRoutes');

const app = express();

app.use(express.json());
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/citas', citasRoutes);

app.get('/', async (req, res) => {
  return res.json({ message: "Bienvenido al backend"});
});

app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok');
    res.json({
      message: 'Servidor funcionando correctamente',
      database: rows[0],
    });
  } catch (error) {
    res.status(503).json({
      message: 'No se pudo conectar con la base de datos.' + error,
    });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos.' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || error.code === 'WARN_DATA_OUT_OF_RANGE') {
    return res.status(400).json({ message: 'Los datos no cumplen las restricciones del modelo.' });
  }

  console.error('Error en la solicitud:', error.message);
  return res.status(500).json({ message: 'Ocurrió un error interno.' });
});

function start(port = Number(process.env.PORT) || 3000) {
  return app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };