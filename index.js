index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Telemetry = require('./models/telemetry');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado correctamente'))
  .catch(err => console.error('Error MongoDB:', err));


// === POST: Recibe datos del ESP32 ===
app.post('/api/telemetry', async (req, res) => {
  try {
    const { temp, hum, timestamp } = req.body;

    if (temp === undefined || hum === undefined || !timestamp) {
      return res.status(400).json({ error: 'Faltan campos: temp, hum o timestamp' });
    }

    // Tiempo capturado por el ESP32
    const fechaESP = new Date(timestamp);
    if (isNaN(fechaESP.getTime())) {
      return res.status(400).json({ error: 'Formato de timestamp inválido' });
    }

    // Tiempo en el servidor al recibir los datos
    const serverTime = new Date();

    const nuevoDato = new Telemetry({
      temp,
      hum,
      timestamp_esp32: fechaESP,
      timestamp_server: serverTime
    });

    await nuevoDato.save();

    console.log('Dato guardado: ${temp}°C | ${hum}% | ESP32:${fechaESP.toISOString()} | SERVER:${serverTime.toISOString()}');

    res.status(201).json({
      message: 'Dato DHT22 guardado correctamente',
      id: nuevoDato._id
    });

  } catch (err) {
    console.error('Error guardando dato:', err);
    res.status(500).json({ error: err.message });
  }
});


// === GET: Registros ordenados por timestamp_server ===
app.get('/api/telemetry', async (req, res) => {
  try {
    const datos = await Telemetry.find().sort({ timestamp_server: -1 });
    res.json(datos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// === GET: Contador total ===
app.get('/api/telemetry/count', async (req, res) => {
  try {
    const count = await Telemetry.countDocuments();
    res.json({ total_registros: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Página raíz pequeña de prueba
app.get('/', (req, res) => {
  res.send(`
    <h1>ESP32 + DHT22 Telemetría</h1>
    <p><strong>Estado:</strong> API funcionando ✔️</p>
    <p><strong>POST:</strong> /api/telemetry</p>
    <p><strong>GET:</strong> /api/telemetry</p>
    <p><strong>Total registros:</strong> <span id="count">cargando...</span></p>

    <script>
      fetch('/api/telemetry/count')
        .then(r => r.json())
        .then(d => document.getElementById('count').textContent = d.total_registros);
    </script>
  `);
});


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:${PORT}');
  console.log('POST https://esp32-telemetry.onrender.com/api/telemetry');
});
