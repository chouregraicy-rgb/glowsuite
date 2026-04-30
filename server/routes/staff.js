const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const { verifyToken, ownerOnly } = require('../middleware/auth')

// Admin client with service-role key (bypasses RLS — needed to create auth users)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── POST /api/staff/create ─────────────────────────────────────────────────
// Owner creates a new employee account.
// Generates a temp password, creates Supabase auth user, inserts into users table.
router.post('/create', verifyToken, ownerOnly, async (req, res) => {
  const {
    name,
    email,
    role = 'employee',
    base_salary = 0,
    incentive_rate = 0,
    specializations = []
  } = req.body

  const salon_id = req.profile.salon_id

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }

  // Generate a secure temp password
  const tempPassword = 'Glow@' + Math.random().toString(36).slice(2, 8).toUpperCase()

  try {
    // Step 1 — Create the Supabase Auth account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,   // auto-confirm so they can log in immediately
      user_metadata: { name, role }
    })

    if (authError) {
      // Handle duplicate email gracefully
      if (authError.message?.includes('already registered')) {
        return res.status(409).json({ error: 'An account with this email already exists.' })
      }
      throw authError
    }

    const userId = authData.user.id

    // Step 2 — Insert into the public users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        salon_id,
        role,
        name
      })

    if (profileError) throw profileError

    // Step 3 — Insert into employees table with salary details
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .insert({
        salon_id,
        user_id: userId,
        name,
        email,
        role,
        base_salary,
        incentive_rate,
        specializations,
        status: 'active'
      })
      .select()
      .single()

    if (empError) throw empError

    // Step 4 — Return credentials for the owner to share
    res.status(201).json({
      success: true,
      employee,
      credentials: {
        email,
        tempPassword,
        loginUrl: process.env.CLIENT_URL || 'http://localhost:5173',
        message: `Share these credentials with ${name}. They must change their password on first login.`
      }
    })

  } catch (err) {
    console.error('Create staff error:', err)
    res.status(500).json({ error: err.message || 'Failed to create staff account' })
  }
})

// ── GET /api/staff ─────────────────────────────────────────────────────────
// Owner fetches all employees for their salon.
router.get('/', verifyToken, ownerOnly, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('*')
    .eq('salon_id', req.profile.salon_id)
    .order('name')

  if (error) return res.status(500).json({ error: error.message })
  res.json({ staff: data })
})

// ── PATCH /api/staff/:id ───────────────────────────────────────────────────
// Update employee salary, incentive rate, status etc.
router.patch('/:id', verifyToken, ownerOnly, async (req, res) => {
  const { id } = req.params
  const updates = req.body

  // Prevent changing salon_id or user_id via this endpoint
  delete updates.salon_id
  delete updates.user_id
  delete updates.id

  const { data, error } = await supabaseAdmin
    .from('employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('salon_id', req.profile.salon_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ employee: data })
})

// ── POST /api/staff/:id/advance ────────────────────────────────────────────
// Record a salary advance for an employee.
router.post('/:id/advance', verifyToken, ownerOnly, async (req, res) => {
  const { id } = req.params
  const { amount, note = '' } = req.body

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' })
  }

  const { data, error } = await supabaseAdmin
    .from('salary_records')
    .insert({
      salon_id: req.profile.salon_id,
      employee_id: id,
      type: 'advance',
      amount,
      note,
      month: new Date().toISOString().slice(0, 7)   // "YYYY-MM"
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ record: data })
})

// ── POST /api/staff/:id/transfer ───────────────────────────────────────────
// Mark employee as transferred (client data stays with salon).
router.post('/:id/transfer', verifyToken, ownerOnly, async (req, res) => {
  const { id } = req.params
  const { transferredTo = '', notes = '' } = req.body

  const { data, error } = await supabaseAdmin
    .from('employees')
    .update({
      status: 'transferred',
      transfer_notes: notes,
      transferred_to: transferredTo,
      transferred_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('salon_id', req.profile.salon_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ employee: data, message: 'Employee transferred. All client data remains secured in GlowSuite.' })
})

module.exports = router
