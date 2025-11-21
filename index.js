require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Telemetry = require('./models/Telemetry');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado correctamente'))
  .catch(err => console.error('Error MongoDB:', err));


// === APIs ===

// POST: Recibe datos del ESP32
app.post('/api/telemetry', async (req, res) => {
  try {
    const { temp, hum } = req.body;

    // Validación básica
    if (temp === undefined || hum === undefined) {
      return res.status(400).json({ error: 'Faltan campos: temp o hum' });
    }

    // Usar la hora REAL del servidor
    const fecha = new Date();

    const nuevoDato = new Telemetry({
      temp,
      hum,
      timestamp: fecha
    });

    await nuevoDato.save();

    console.log(`Dato guardado → ${temp}°C | ${hum}% | ${fecha.toISOString()}`);

    res.status(201).json({
      message: 'Dato guardado correctamente',
      id: nuevoDato._id,
      server_timestamp: fecha
    });

  } catch (err) {
    console.error('Error guardando dato:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET: Todos los registros
app.get('/api/telemetry', async (req, res) => {
  try {
    const datos = await Telemetry.find().sort({ timestamp: -1 });
    res.json(datos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET: Contador total de registros
app.get('/api/telemetry/count', async (req, res) => {
  try {
    const count = await Telemetry.countDocuments();
    res.json({ total_registros: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Página principal (opcional)
app.get('/', (req, res) => {
  res.send(`
    <h1>ESP32 + DHT22 Telemetría</h1>
    <p><strong>Estado:</strong> API funcionando</p>
    <p><strong>Endpoint POST:</strong> <code>/api/telemetry</code></p>
    <p><strong>Total registros:</strong> <span id="count">cargando...</span></p>

    <script>
      fetch('/api/telemetry/count')
        .then(r => r.json())
        .then(d => {
          document.getElementById('count').textContent = d.total_registros;
        });
    </script>
  `);
});


// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("POST → https://esp32-telemetry.onrender.com/api/telemetry");
});
