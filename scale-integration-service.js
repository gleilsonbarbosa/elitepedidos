const axios = require("axios");
const express = require("express");
const cors = require("cors");
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { SerialPortStream } = require('@serialport/stream');
const { autoDetect } = require('@serialport/bindings-cpp');

// Configuration
const SUPABASE_URL = "https://afceshaeqqmbrtudlhwz.supabase.co/rest/v1/pesagem_temp";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmY2VzaGFlcXFtYnJ0dWRsaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODU3MTEsImV4cCI6MjA2MDI2MTcxMX0.-d9660Q-9wg89z0roOw4-czkWxq2fxdKOJX9SilKz2U";
const PORT = 4000;
const SCALE_BAUD_RATE = 4800; // Common for Toledo scales
const SEND_INTERVAL = 1000; // Send weight every 1 second even if unchanged

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Setup serial port for scale
let port;
let lastWeight = 0;
let lastSentWeight = 0;
let lastSentTime = 0;
let isConnected = false;

// Function to detect and connect to scale
async function connectToScale() {
  try {
    // Get list of available ports
    const Binding = autoDetect();
    const ports = await Binding.list();
    console.log("🔍 Portas disponíveis:", ports.map(p => p.path));
    
    if (ports.length === 0) {
      console.log("⚠️ Nenhuma porta serial encontrada");
      return false;
    }
    
    // Try to connect to each port until we find the scale
    for (const portInfo of ports) {
      try {
        console.log(`🔌 Tentando conectar à porta ${portInfo.path}...`);
        
        port = new SerialPort({ 
          path: portInfo.path, 
          baudRate: SCALE_BAUD_RATE,
          autoOpen: false
        });
        
        // Open port with timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Timeout connecting to port"));
          }, 3000);
          
          port.open(err => {
            clearTimeout(timeout);
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        // Setup parser
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        
        // Setup data handler
        parser.on('data', (data) => {
          try {
            // Parse weight data from scale (format depends on your scale model)
            // This example assumes Toledo Prix 3 Fit format
            const match = data.match(/([ST|US]),([GS|NT]),([+-])(\d+\.?\d*)(kg|g)/i);
            
            if (match) {
              const [, status, type, sign, value, unit] = match;
              const weight = parseFloat(value) * (sign === '-' ? -1 : 1);
              const isStable = status.toUpperCase() === 'ST';
              
              if (isStable && weight > 0) {
                lastWeight = weight;
                console.log(`✅ Peso estável: ${weight}${unit}`);
                
                // Send to Supabase if weight changed or interval elapsed
                const now = Date.now();
                if (weight !== lastSentWeight || (now - lastSentTime) > SEND_INTERVAL) {
                  sendWeightToSupabase(weight);
                  lastSentWeight = weight;
                  lastSentTime = now;
                }
              }
            }
          } catch (err) {
            console.error("❌ Erro ao processar dados da balança:", err);
          }
        });
        
        console.log(`✅ Conectado à balança na porta ${portInfo.path}`);
        isConnected = true;
        return true;
      } catch (err) {
        console.log(`❌ Falha ao conectar na porta ${portInfo.path}: ${err.message}`);
        // Close port if it was opened
        if (port && port.isOpen) {
          await new Promise(resolve => port.close(resolve));
        }
      }
    }
    
    console.error("❌ Não foi possível conectar a nenhuma balança");
    return false;
  } catch (err) {
    console.error(`❌ Erro ao detectar portas: ${err.message}`);
    return false;
  }
}

// Try to connect to scale on startup
connectToScale().then(success => {
  if (!success) {
    console.log("⚠️ Continuando sem conexão com a balança");
  }
});

// Retry connection every 30 seconds if not connected
setInterval(() => {
  if (!isConnected) {
    console.log("🔄 Tentando reconectar à balança...");
    connectToScale();
  }
}, 30000);

// Setup interval to send weight periodically even if unchanged
// This allows continuous weighing of the same item
setInterval(() => {
  if (isConnected && lastWeight > 0) {
    const now = Date.now();
    if ((now - lastSentTime) > SEND_INTERVAL) {
      sendWeightToSupabase(lastWeight);
      lastSentTime = now;
      console.log(`🔄 Enviando peso periódico: ${lastWeight}`);
    }
  }
}, SEND_INTERVAL);

// Setup cleanup interval to delete old records from Supabase
setInterval(async () => {
  try {
    // Delete records older than 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    await axios.delete(`${SUPABASE_URL}?criado_em=lt.${fiveMinutesAgo.toISOString()}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }
    });
    console.log("🧹 Limpeza de registros antigos realizada");
  } catch (err) {
    console.error("❌ Erro ao limpar registros antigos:", err.message);
  }
}, 60000); // Run cleanup every minute

// Function to send weight to Supabase
async function sendWeightToSupabase(weight) {
  try {
    await axios.post(SUPABASE_URL, {
      peso: weight,
      criado_em: new Date().toISOString()
    }, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }
    });
    console.log("✅ Peso enviado para Supabase:", weight);
  } catch (err) {
    console.error("❌ Erro ao enviar peso para Supabase:", err.message);
  }
}

// API endpoint to get current weight
app.get("/peso", (req, res) => {
  if (isConnected && lastWeight > 0) {
    res.json({ peso: lastWeight });
  } else {
    res.status(404).json({ 
      error: "Nenhum peso disponível", 
      connected: isConnected,
      message: isConnected ? "Balança conectada, mas sem peso" : "Balança não conectada"
    });
  }
});

// API endpoint to get connection status
app.get("/status", (req, res) => {
  res.json({ 
    connected: isConnected,
    lastWeight: lastWeight > 0 ? lastWeight : null,
    lastUpdate: lastSentTime > 0 ? new Date(lastSentTime).toISOString() : null
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Endpoint de peso disponível em http://localhost:${PORT}/peso`);
  console.log(`🔌 Endpoint de status disponível em http://localhost:${PORT}/status`);
});