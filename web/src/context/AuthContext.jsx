import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)  // users table row
  const [salon, setSalon]         = useState(null)   // salons table row
  const [loading, setLoading]     = useState(true)

  // Derived helpers
  const role            = profile?.role || null
  const salonId         = profile?.salon_id || null
  const currencySymbol  = salon?.settings?.currencySymbol || '₹'
  const taxName         = salon?.settings?.taxName || 'GST'
  const taxRate         = salon?.settings?.taxRate || 18
  const dateFormat      = salon?.settings?.dateFormat || 'DD/MM/YYYY'
  const timezone        = salon?.settings?.timezone || 'Asia/Kolkata'

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await loadProfile(session.user.id)
        else {
          setProfile(null)
          setSalon(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) throw profileError

      setProfile(profileData)

      // Load salon if profile exists
      if (profileData?.salon_id) {
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('id', profileData.salon_id)
          .maybeSingle()
        setSalon(salonData)
      }
    } catch (err) {
      console.error('loadProfile error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── REGISTER (Owner) ──────────────────────────────────────────
  async function registerOwner({ name, email, password, salonName, settings }) {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'owner' } }
    })
    if (authError) throw authError

    const userId = authData.user.id

    // 2. Create salon
    const { data: salonData, error: salonError } = await supabase
      .from('salons')
      .insert({ name: salonName, owner_id: userId, plan: 'starter', settings })
      .select()
      .single()
    if (salonError) throw salonError

    // 3. Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({ id: userId, salon_id: salonData.id, role: 'owner', name })
    if (profileError) throw profileError

    return { user: authData.user, salon: salonData }
  }

  // ── SIGN IN ───────────────────────────────────────────────────
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // ── SIGN OUT ──────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSalon(null)
  }

  // ── UPDATE SALON SETTINGS ─────────────────────────────────────
  async function updateSalonSettings(newSettings) {
    if (!salonId) return
    const merged = { ...salon?.settings, ...newSettings }
    const { data, error } = await supabase
      .from('salons')
      .update({ settings: merged })
      .eq('id', salonId)
      .select()
      .single()
    if (error) throw error
    setSalon(data)
    return data
  }

  const value = {
    user, profile, salon, loading,
    role, salonId,
    currencySymbol, taxName, taxRate, dateFormat, timezone,
    registerOwner, signIn, signOut, updateSalonSettings,
    refreshProfile: () => user && loadProfile(user.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
