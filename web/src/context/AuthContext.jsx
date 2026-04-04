import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('*, salons(*)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  // Full global signup — creates salon with all locale settings
  async function signUp({ email, password, name, role, salonName, salonType,
    countryCode, currency, currencySymbol, timezone, dialCode,
    phone, taxName, taxRate, dateFormat }) {

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } }
    })
    if (authError) return { error: authError }

    let salonId = null
    if (role === 'owner') {
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .insert({
          name: salonName,
          owner_id: authData.user.id,
          settings: {
            salonType, countryCode, currency, currencySymbol,
            timezone, taxName, taxRate, dateFormat,
            paymentModes: ['cash', 'card'],
            language: 'en',
          }
        })
        .select().single()
      if (salonError) return { error: salonError }
      salonId = salon.id
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        role,
        salon_id: salonId,
        phone: dialCode && phone ? `${dialCode}${phone}` : null,
      })
    if (profileError) return { error: profileError }

    return { data: authData }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Helper — get salon currency symbol
  const currencySymbol = profile?.salons?.settings?.currencySymbol || '$'
  const timezone = profile?.salons?.settings?.timezone || 'UTC'
  const dateFormat = profile?.salons?.settings?.dateFormat || 'DD/MM/YYYY'
  const countryCode = profile?.salons?.settings?.countryCode || 'US'

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn, signUp, signOut,
      currencySymbol, timezone, dateFormat, countryCode
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
