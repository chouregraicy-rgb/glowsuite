// routes/clients.js
const express = require('express')
const router = express.Router()
const { verifyToken, ownerOnly } = require('../middleware/auth')
const { supabase } = require('../middleware/auth')

// Mask phone for employees — owner sees real number, staff sees masked
function maskPhone(phone, role) {
  if (!phone) return null
  if (role === 'owner') return phone
  // Show country code + last 5 digits only
  const digits = phone.replace(/\D/g, '')
  return '+' + digits.slice(0, 2) + ' XXXXX' + digits.slice(-5)
}

router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('salon_id', req.profile.salon_id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Mask phones for non-owners
  const masked = data.map(c => ({
    ...c,
    phone: maskPhone(c.phone, req.profile.role),
    phone_masked: req.profile.role !== 'owner'
  }))

  res.json({ clients: masked })
})

router.post('/', verifyToken, ownerOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...req.body, salon_id: req.profile.salon_id })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ client: data })
})

module.exports = router
