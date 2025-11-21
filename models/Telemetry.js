const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  temp: {
    type: Number,
    required: true
  },
  hum: {
    type: Number,
    required: true
  },
  timestamp_esp32: {
    type: Date,
    required: true
  },
  timestamp_server: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: false // desactiva createdAt y updatedAt porque ya tienes tus propios timestamps
});

module.exports = mongoose.model('Telemetry', telemetrySchema);
