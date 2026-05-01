import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { COUNTRIES } from '../utils/globals'

// ── Styles ────────────────────────────────────────────────────
const S = {
  wrap:    { display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif" },
  left:    { width:340, background:'#1a0a0a', color:'#fff', padding:'48px 36px', display:'flex', flexDirection:'column', flexShrink:0 },
  logo:    { fontSize:28, fontWeight:700, color:'#c9956b', marginBottom:8 },
  tagline: { fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:40, lineHeight:1.6 },
  feat:    { display:'flex', alignItems:'center', gap:10, marginBottom:14, fontSize:13, color:'rgba(255,255,255,0.75)' },
  right:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#faf9f7', padding:24 },
  card:    { background:'#fff', borderRadius:20, padding:'40px 44px', width:'100%', maxWidth:460, boxShadow:'0 4px 32px rgba(0,0,0,0.08)' },
  tabs:    { display:'flex', background:'#f5f3f0', borderRadius:12, padding:4, marginBottom:32 },
  tab:     { flex:1, padding:'10px 0', border:'none', borderRadius:9, cursor:'pointer', fontSize:14, fontWeight:500, transition:'all .2s' },
  tabA:    { background:'#fff', color:'#1a0a0a', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  tabI:    { background:'transparent', color:'#888' },
  label:   { display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
  input:   { width:'100%', padding:'12px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:16, color:'#1a0a0a', background:'#faf9f7' },
  btn:     { width:'100%', padding:'13px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:8 },
  btnOut:  { width:'100%', padding:'13px', background:'transparent', color:'#8b2252', border:'1.5px solid #8b2252', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:8 },
  err:     { background:'#fff0f0', border:'1px solid #fcc', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#c00', marginBottom:16 },
  ok:      { background:'#f0fff4', border:'1px solid #9f9', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#060', marginBottom:16 },
  step:    { display:'flex', gap:8, marginBottom:28 },
  stepDot: (active, done) => ({
    width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:12, fontWeight:700, flexShrink:0,
    background: done ? '#8b2252' : active ? '#8b2252' : '#e8e4df',
    color: (active || done) ? '#fff' : '#999'
  }),
  stepLine:{ flex:1, height:2, background:'#e8e4df', alignSelf:'center', margin:'0 4px' },
  sel:     { width:'100%', padding:'12px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:16, color:'#1a0a0a', background:'#faf9f7' },
  grid2:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  sumRow:  { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0ede9', fontSize:13 },
  sumKey:  { color:'#888' },
  sumVal:  { fontWeight:600, color:'#1a0a0a' },
}

const FEATURES = [
  { icon:'🛡', text:'Client protection shield' },
  { icon:'📊', text:'Lead intelligence CRM' },
  { icon:'✂️', text:'Staff & salary manager' },
  { icon:'👑', text:'Bridal timeline planner' },
  { icon:'🌍', text:'Works in 25+ countries' },
  { icon:'💳', text:'Multi-currency billing' },
]

const SALON_TYPES = [
  { value:'beauty', label:'💄 Beauty Salon' },
  { value:'spa',    label:'🧖 Spa & Wellness' },
  { value:'unisex', label:'✂️ Unisex Salon' },
  { value:'bridal', label:'👑 Bridal Studio' },
  { value:'nails',  label:'💅 Nail Studio' },
  { value:'barber', label:'💈 Barbershop' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const { signIn, registerOwner } = useAuth()

  const [mode, setMode]       = useState('signin')  // 'signin' | 'register'
  const [step, setStep]       = useState(1)          // 1 | 2 | 3
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Sign in fields
  const [siEmail, setSiEmail] = useState('')
  const [siPass,  setSiPass]  = useState('')

  // Register fields
  const [reg, setReg] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    salonName: '', salonType: 'beauty',
    countryCode: 'IN', currency: 'INR', currencySymbol: '₹',
    timezone: 'Asia/Kolkata', taxName: 'GST', taxRate: 18,
    dateFormat: 'DD/MM/YYYY', dialCode: '+91'
  })

  function setR(key, val) {
    setReg(r => ({ ...r, [key]: val }))
  }

  function handleCountryChange(code) {
    const c = COUNTRIES.find(x => x.code === code)
    if (!c) return
    setReg(r => ({
      ...r,
      countryCode:    c.code,
      currency:       c.currency,
      currencySymbol: c.symbol,
      timezone:       c.timezone,
      taxName:        c.taxName,
      taxRate:        c.taxRate,
      dateFormat:     c.dateFormat,
      dialCode:       c.dialCode
    }))
  }

  // ── Sign In ───────────────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email: siEmail, password: siPass })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // ── Register step validation ──────────────────────────────────
  function validateStep1() {
    if (!reg.name.trim())  return 'Full name is required'
    if (!reg.email.trim()) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(reg.email)) return 'Enter a valid email'
    if (reg.password.length < 6) return 'Password must be at least 6 characters'
    if (reg.password !== reg.confirmPassword) return 'Passwords do not match'
    return ''
  }

  function validateStep2() {
    if (!reg.salonName.trim()) return 'Salon name is required'
    return ''
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  // ── Final Register submit ─────────────────────────────────────
  async function handleRegister() {
    setError('')
    setLoading(true)
    try {
      const settings = {
        salonType:      reg.salonType,
        countryCode:    reg.countryCode,
        currency:       reg.currency,
        currencySymbol: reg.currencySymbol,
        timezone:       reg.timezone,
        taxName:        reg.taxName,
        taxRate:        reg.taxRate,
        dateFormat:     reg.dateFormat,
        dialCode:       reg.dialCode,
      }
      await registerOwner({
        name:      reg.name,
        email:     reg.email,
        password:  reg.password,
        salonName: reg.salonName,
        settings,
      })
      setSuccess('Account created! Redirecting...')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      // Common errors with friendly messages
      let msg = err.message || 'Registration failed'
      if (msg.includes('already registered') || msg.includes('already exists')) {
        msg = 'This email is already registered. Please sign in instead.'
      } else if (msg.includes('rate limit') || msg.includes('email rate')) {
        msg = 'Too many attempts. Please wait a few minutes and try again.'
      } else if (msg.includes('row-level security') || msg.includes('violates')) {
        msg = 'Setup error. Please contact support with code: RLS-001'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {/* Left panel */}
      <div style={S.left}>
        <div style={S.logo}>GlowSuite</div>
        <div style={S.tagline}>The complete operating system<br />for salons & spas — worldwide.</div>
        {FEATURES.map(f => (
          <div key={f.text} style={S.feat}>
            <span style={{ fontSize:18 }}>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
        <div style={{ marginTop:'auto', paddingTop:32 }}>
          <details style={{ cursor:'pointer' }}>
            <summary style={{ fontSize:13, color:'rgba(255,255,255,0.5)', listStyle:'none', display:'flex', alignItems:'center', gap:8 }}>
              <span>🌍</span><span>Available in 25+ countries</span><span style={{ marginLeft:'auto' }}>▼</span>
            </summary>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', marginTop:10 }}>
              {COUNTRIES.slice(0,16).map(c => (
                <div key={c.code} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:14 }}>{c.flag}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{c.name}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        <div style={S.card}>
          {/* Tabs */}
          <div style={S.tabs}>
            {['signin','register'].map(m => (
              <button key={m} style={{ ...S.tab, ...(mode===m ? S.tabA : S.tabI) }}
                onClick={() => { setMode(m); setStep(1); setError(''); setSuccess('') }}>
                {m === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error   && <div style={S.err}>⚠️ {error}</div>}
          {success && <div style={S.ok}>✅ {success}</div>}

          {/* ── SIGN IN ── */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn}>
              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Welcome back</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:24 }}>Sign in to your GlowSuite account</p>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" placeholder="you@example.com"
                value={siEmail} onChange={e => setSiEmail(e.target.value)} required />
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" placeholder="••••••••"
                value={siPass} onChange={e => setSiPass(e.target.value)} required />
              <button style={S.btn} type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
              <p style={{ textAlign:'center', fontSize:13, color:'#888', marginTop:16 }}>
                New salon?{' '}
                <span style={{ color:'#8b2252', cursor:'pointer', fontWeight:600 }}
                  onClick={() => { setMode('register'); setError('') }}>
                  Create your account
                </span>
              </p>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <div>
              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>
                {step === 1 ? 'Create your account' : step === 2 ? 'Your salon details' : 'Confirm & launch'}
              </h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:20 }}>
                {step === 1 ? 'Step 1 of 3 — Account credentials' :
                 step === 2 ? 'Step 2 of 3 — Salon & location' :
                              'Step 3 of 3 — Review & launch'}
              </p>

              {/* Step indicators */}
              <div style={S.step}>
                {[1,2,3].map((n, i) => (
                  <>
                    <div key={n} style={S.stepDot(step===n, step>n)}>{step>n ? '✓' : n}</div>
                    {i < 2 && <div style={S.stepLine} />}
                  </>
                ))}
              </div>

              {/* Step 1 — Account */}
              {step === 1 && (
                <>
                  <label style={S.label}>Full Name</label>
                  <input style={S.input} placeholder="Kamlesh Choure"
                    value={reg.name} onChange={e => setR('name', e.target.value)} />
                  <label style={S.label}>Email Address</label>
                  <input style={S.input} type="email" placeholder="you@example.com"
                    value={reg.email} onChange={e => setR('email', e.target.value)} />
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Password</label>
                      <input style={S.input} type="password" placeholder="Min 6 chars"
                        value={reg.password} onChange={e => setR('password', e.target.value)} />
                    </div>
                    <div>
                      <label style={S.label}>Confirm Password</label>
                      <input style={S.input} type="password" placeholder="Repeat password"
                        value={reg.confirmPassword} onChange={e => setR('confirmPassword', e.target.value)} />
                    </div>
                  </div>
                  <button style={S.btn} onClick={nextStep}>Continue →</button>
                </>
              )}

              {/* Step 2 — Salon */}
              {step === 2 && (
                <>
                  <label style={S.label}>Salon / Business Name</label>
                  <input style={S.input} placeholder="e.g. Hyfy Beauty Studio"
                    value={reg.salonName} onChange={e => setR('salonName', e.target.value)} />
                  <label style={S.label}>Salon Type</label>
                  <select style={S.sel} value={reg.salonType} onChange={e => setR('salonType', e.target.value)}>
                    {SALON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label style={S.label}>Country</label>
                  <select style={S.sel} value={reg.countryCode} onChange={e => handleCountryChange(e.target.value)}>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Currency</label>
                      <input style={{ ...S.input, background:'#f5f3f0', color:'#666' }} value={`${reg.currencySymbol} ${reg.currency}`} readOnly />
                    </div>
                    <div>
                      <label style={S.label}>Tax</label>
                      <input style={{ ...S.input, background:'#f5f3f0', color:'#666' }}
                        value={`${reg.taxName} ${reg.taxRate}%`} readOnly />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button style={S.btnOut} onClick={() => setStep(1)}>← Back</button>
                    <button style={S.btn} onClick={nextStep}>Continue →</button>
                  </div>
                </>
              )}

              {/* Step 3 — Confirm */}
              {step === 3 && (
                <>
                  <div style={{ background:'#faf9f7', borderRadius:12, padding:16, marginBottom:20 }}>
                    {[
                      ['Owner',    reg.name],
                      ['Email',    reg.email],
                      ['Salon',    reg.salonName],
                      ['Type',     SALON_TYPES.find(t=>t.value===reg.salonType)?.label],
                      ['Country',  COUNTRIES.find(c=>c.code===reg.countryCode)?.name],
                      ['Currency', `${reg.currencySymbol} (${reg.currency})`],
                      ['Tax',      `${reg.taxName} @ ${reg.taxRate}%`],
                      ['Timezone', reg.timezone],
                    ].map(([k,v]) => (
                      <div key={k} style={S.sumRow}>
                        <span style={S.sumKey}>{k}</span>
                        <span style={S.sumVal}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button style={S.btnOut} onClick={() => setStep(2)}>← Back</button>
                    <button style={S.btn} onClick={handleRegister} disabled={loading}>
                      {loading ? 'Creating salon...' : '🚀 Launch My Salon'}
                    </button>
                  </div>
                </>
              )}

              <p style={{ textAlign:'center', fontSize:12, color:'#aaa', marginTop:16 }}>
                Already have an account?{' '}
                <span style={{ color:'#8b2252', cursor:'pointer' }}
                  onClick={() => { setMode('signin'); setStep(1); setError('') }}>
                  Sign in
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
