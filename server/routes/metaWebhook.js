const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// GET — Meta calls this once to verify your webhook URL
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified')
    return res.status(200).send(challenge)
  }
  res.sendStatus(403)
})

// POST — Meta sends lead data here when someone fills your ad form
router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (body.object !== 'page') return res.sendStatus(200)

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue

        const leadgenId = change.value?.leadgen_id
        const pageId    = change.value?.page_id
        const formId    = change.value?.form_id

        console.log('📥 Meta lead received:', { leadgenId, pageId, formId })

        // Save raw lead to Supabase leads table
        await supabase.from('leads').insert({
          salon_id:   process.env.DEFAULT_SALON_ID,
          source:     'facebook',
          status:     'new',
          name:       'Meta Lead #' + leadgenId,
          phone:      null,
          note:       `Form ID: ${formId} | Page ID: ${pageId} | Lead ID: ${leadgenId}`,
          meta:       change.value
        })
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Meta webhook error:', err.message)
    res.sendStatus(200) // Always return 200 to Meta
  }
})

module.exports = router