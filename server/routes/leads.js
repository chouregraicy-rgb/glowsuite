// routes/leads.js — stub (full implementation already in previous session)
const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/auth')
const { supabase } = require('../middleware/auth')

router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('salon_id', req.profile.salon_id)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ leads: data })
})

router.post('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .insert({ ...req.body, salon_id: req.profile.salon_id })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ lead: data })
})

router.patch('/:id', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('salon_id', req.profile.salon_id)
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ lead: data })
})

module.exports = router
