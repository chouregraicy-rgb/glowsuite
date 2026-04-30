const { createClient } = require('@supabase/supabase-js')

// Use service-role client to verify tokens server-side
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * verifyToken — checks the Bearer JWT from the request header.
 * Attaches req.user (Supabase auth user) and req.profile (users table row).
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  // Verify the JWT with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = user

  // Fetch the user's profile (role + salon_id)
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('id, role, salon_id, name')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    return res.status(403).json({ error: 'User profile not found' })
  }

  req.profile = profile
  next()
}

/**
 * ownerOnly — must be used AFTER verifyToken.
 * Blocks employees from owner-only endpoints.
 */
function ownerOnly(req, res, next) {
  if (req.profile?.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' })
  }
  next()
}

module.exports = { verifyToken, ownerOnly, supabase }
