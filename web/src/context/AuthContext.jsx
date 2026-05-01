import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [salon, setSalon]     = useState(null)
  const [loading, setLoading] = useState(true)

  const role           = profile?.role || null
  const salonId        = profile?.salon_id || null
  const currencySymbol = salon?.settings?.currencySymbol || '₹'
  const taxName        = salon?.settings?.taxName || 'GST'
  const taxRate        = salon?.settings?.taxRate || 18

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id, mounted)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user.id, mounted)
        } else {
          setUser(null)
          setProfile(null)
          setSalon(null)
          setLoading(false)
        }
      }
    )

    // Safety timeout — never stay loading more than 8 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 8000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [])

  async function loadProfile(userId, mounted = true) {
    try {
      const { data: profileData } = await supabase
        .from('users').select('*').eq('id', userId).maybeSingle()

      if (!mounted) return
      setProfile(profileData)

      if (profileData?.salon_id) {
        const { data: salonData } = await supabase
          .from('salons').select('*').eq('id', profileData.salon_id).maybeSingle()
        if (mounted) setSalon(salonData)
      }
    } catch (err) {
      console.error('loadProfile:', err.message)
    } finally {
      if (mounted) setLoading(false)
    }
  }

  async function registerOwner({ name, email, password, salonName, settings }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { name, role: 'owner' } } })
    if (authError) throw authError
    const userId = authData.user.id
    const { data: salonData, error: salonError } = await supabase.from('salons').insert({ name: salonName, owner_id: userId, plan: 'starter', settings }).select().single()
    if (salonError) throw salonError
    const { error: profileError } = await supabase.from('users').insert({ id: userId, salon_id: salonData.id, role: 'owner', name })
    if (profileError) throw profileError
    return { user: authData.user, salon: salonData }
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setSalon(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, salon, loading, role, salonId, currencySymbol, taxName, taxRate, registerOwner, signIn, signOut, refreshProfile: () => user && loadProfile(user.id) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)