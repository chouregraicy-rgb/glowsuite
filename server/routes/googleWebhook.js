const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// POST — Google Ads sends lead form data here
router.post('/', async (req, res) => {
  try {
    const payload = req.body
    console.log('📥 Google lead received:', JSON.stringify(payload, null, 2))

    // Google sends user_column_data array with field name/value pairs
    const fields = {}
    for (const col of payload.user_column_data || []) {
      fields[col.column_name] = col.string_value
    }

    const name  = fields['Full Name']  || fields['FULL_NAME']  || 'Google Lead'
    const email = fields['Email']      || fields['EMAIL']       || null
    const phone = fields['Phone']      || fields['PHONE_NUMBER']|| null

    await supabase.from('leads').insert({
      salon_id: process.env.DEFAULT_SALON_ID,
      source:   'google',
      status:   'new',
      name,
      email,
      phone,
      note:     `Google Ads Lead | Campaign: ${payload.campaign_id || 'N/A'}`,
      meta:     payload
    })

    res.status(200).json({ status: 'ok' })
  } catch (err) {
    console.error('Google webhook error:', err.message)
    res.status(200).json({ status: 'ok' }) // Always return 200
  }
})

module.exports = router