require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}))
app.use(express.json())

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'GlowSuite API', version: '1.0.0' })
})

// ── Routes ────────────────────────────────────────────────────
app.use('/api/staff',    require('./routes/staff'))
app.use('/api/leads',    require('./routes/leads'))
app.use('/api/clients',  require('./routes/clients'))

// Webhook routes (Meta / Google / WhatsApp)
app.use('/webhook/meta',      require('./routes/metaWebhook'))
app.use('/webhook/google',    require('./routes/googleWebhook'))
app.use('/webhook/whatsapp',  require('./routes/whatsappWebhook'))

// ── 404 fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

app.listen(PORT, () => {
  console.log(`🚀 GlowSuite API running on port ${PORT}`)
  console.log(`   Client origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
})
