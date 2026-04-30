const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Keywords that trigger auto lead creation
const TRIGGER_WORDS = ['hi', 'hello', 'appointment', 'booking', 'bridal',
                       'price', 'rate', 'service', 'available', 'open']

// POST — WATI sends WhatsApp messages here
router.post('/', async (req, res) => {
  try {
    const msg = req.body
    console.log('📥 WhatsApp message received:', JSON.stringify(msg, null, 2))

    const phone   = msg.waId     || msg.from  || null
    const name    = msg.senderName            || 'WhatsApp Lead'
    const text    = (msg.text?.body || msg.text || '').toLowerCase()

    const isTriggered = TRIGGER_WORDS.some(w => text.includes(w))

    if (isTriggered && phone) {
      // Check if lead already exists for this phone
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .eq('salon_id', process.env.DEFAULT_SALON_ID)
        .maybeSingle()

      if (!existing) {
        await supabase.from('leads').insert({
          salon_id: process.env.DEFAULT_SALON_ID,
          source:   'whatsapp',
          status:   'new',
          name,
          phone,
          note:     `WhatsApp: "${msg.text?.body || text}"`
        })
        console.log(`✅ New WhatsApp lead created: ${name} (${phone})`)
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('WhatsApp webhook error:', err.message)
    res.sendStatus(200)
  }
})

module.exports = router