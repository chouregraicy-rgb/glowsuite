import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { COUNTRIES, TAX_NAMES, DATE_FORMATS, SALON_TYPES, getCountry } from '../utils/globals'

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepDot({ n, current, label }) {
  const done = current > n
  const active = current === n
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500,
        background: done ? '#8B3A52' : active ? '#FDF0F3' : '#F8F5F0',
        color: done ? '#fff' : active ? '#8B3A52' : '#B0A89F',
        border: active ? '2px solid #8B3A52' : done ? 'none' : '1.5px solid #E8E0D8',
        transition: 'all 0.3s',
      }}>
        {done ? '✓' : n}
      </div>
      <div style={{ fontSize: 10, color: active ? '#8B3A52' : '#B0A89F', fontWeight: active ? 500 : 400, whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </div>
  )
}

function StepLine({ done }) {
  return (
    <div style={{
      flex: 1, height: 2, marginTop: -14,
      background: done ? '#8B3A52' : '#E8E0D8',
      transition: 'background 0.4s',
    }} />
  )
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={S.label}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#B0A89F' }}>{hint}</div>}
    </div>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
function Input({ ...props }) {
  return <input style={S.input} {...props} />
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
function Select({ ...props }) {
  return <select style={S.input} {...props} />
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | register
  const [step, setStep] = useState(1) // register steps 1-3
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  // Detect country from browser
  const [detectedCountry, setDetectedCountry] = useState('US')
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const match = COUNTRIES.find(c => c.timezone === tz)
      if (match) setDetectedCountry(match.code)
    } catch {}
  }, [])

  // ── Login form ──
  const [login, setLogin] = useState({ email: '', password: '' })

  // ── Register: Step 1 — Account ──
  const [account, setAccount] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'owner' })

  // ── Register: Step 2 — Salon details ──
  const [salon, setSalon] = useState({ salonName: '', salonType: '', countryCode: detectedCountry })
  useEffect(() => setSalon(s => ({ ...s, countryCode: detectedCountry })), [detectedCountry])

  // ── Register: Step 3 — Locale & contact ──
  const [locale, setLocale] = useState({ phone: '', taxName: '', taxRate: '', currency: '', currencySymbol: '', timezone: '', dateFormat: '' })

  // Auto-fill locale when country changes
  useEffect(() => {
    if (!salon.countryCode) return
    const c = getCountry(salon.countryCode)
    const tax = TAX_NAMES[salon.countryCode] || TAX_NAMES.DEFAULT
    const df = DATE_FORMATS[salon.countryCode] || DATE_FORMATS.DEFAULT
    setLocale(l => ({
      ...l,
      currency: c.currency,
      currencySymbol: c.symbol,
      timezone: c.timezone,
      dialCode: c.dial,
      taxName: tax.name,
      taxRate: String(tax.rate),
      dateFormat: df,
    }))
  }, [salon.countryCode])

  // ── Login submit ──
  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(login.email, login.password)
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/dashboard')
  }

  // ── Register step navigation ──
  function nextStep(e) {
    e.preventDefault()
    setError('')
    if (step === 1) {
      if (!account.name) return setError('Please enter your name')
      if (!account.email) return setError('Please enter your email')
      if (account.password.length < 6) return setError('Password must be at least 6 characters')
      if (account.password !== account.confirmPassword) return setError('Passwords do not match')
    }
    if (step === 2) {
      if (!salon.salonName) return setError('Please enter your salon name')
      if (!salon.salonType) return setError('Please select your salon type')
    }
    setStep(s => s + 1)
  }

  // ── Final submit ──
  async function handleRegister(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signUp({
      email: account.email,
      password: account.password,
      name: account.name,
      role: account.role,
      salonName: salon.salonName,
      salonType: salon.salonType,
      countryCode: salon.countryCode,
      currency: locale.currency,
      currencySymbol: locale.currencySymbol,
      timezone: locale.timezone,
      dialCode: locale.dialCode,
      phone: locale.phone,
      taxName: locale.taxName,
      taxRate: Number(locale.taxRate),
      dateFormat: locale.dateFormat,
    })
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/dashboard')
  }

  const selectedCountry = getCountry(salon.countryCode)

  return (
    <div style={S.page}>
      {/* LEFT PANEL */}
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.logo}>GlowSuite</div>
          <div style={S.tagline}>The complete operating system<br />for salons & spas — worldwide.</div>
          <div style={S.feats}>
            {[
              ['🛡', 'Client protection shield'],
              ['📊', 'Lead intelligence CRM'],
              ['✂️', 'Staff & salary manager'],
              ['👑', 'Bridal timeline planner'],
              ['🌍', 'Works in 25+ countries'],
              ['💳', 'Multi-currency billing'],
            ].map(([icon, text]) => (
              <div key={text} style={S.feat}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Available in
            </div>
            <details>
              <summary style={{
                fontSize: 13, color: 'rgba(255,255,255,0.75)', listStyle: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: 'rgba(255,255,255,0.08)',
                borderRadius: 8, cursor: 'pointer', userSelect: 'none'
              }}>
                <span>🌍</span>
                <span>25+ countries worldwide</span>
                <span style={{ marginLeft: 'auto', fontSize: 10 }}>▼</span>
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: 10, paddingLeft: 4 }}>
                {COUNTRIES.map(c => (
                  <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15 }}>{c.flag}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
        <div style={{ ...S.blob, top: -60, right: -60, width: 280, height: 280 }} />
        <div style={{ ...S.blob, bottom: 40, left: -80, width: 200, height: 200 }} />
      </div>

      {/* RIGHT PANEL */}
      <div style={S.right}>
        <div style={S.card}>

          {/* ── MODE TOGGLE ── */}
          <div style={S.toggle}>
            <button type="button" style={{ ...S.toggleBtn, ...(mode === 'login' ? S.toggleActive : {}) }}
              onClick={() => { setMode('login'); setStep(1); setError('') }}>
              Sign In
            </button>
            <button type="button" style={{ ...S.toggleBtn, ...(mode === 'register' ? S.toggleActive : {}) }}
              onClick={() => { setMode('register'); setStep(1); setError('') }}>
              Register
            </button>
          </div>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <div style={S.cardTitle}>Welcome back</div>
              <div style={S.cardSub}>Sign in to your GlowSuite account</div>
              <form onSubmit={handleLogin} style={S.form}>
                <Field label="Email address">
                  <Input type="email" placeholder="you@example.com"
                    value={login.email} onChange={e => setLogin(l => ({ ...l, email: e.target.value }))} required />
                </Field>
                <Field label="Password">
                  <Input type="password" placeholder="••••••••"
                    value={login.password} onChange={e => setLogin(l => ({ ...l, password: e.target.value }))} required />
                </Field>
                {error && <div style={S.errorBox}>{error}</div>}
                <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
              </form>
            </>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 28 }}>
                <StepDot n={1} current={step} label="Account" />
                <StepLine done={step > 1} />
                <StepDot n={2} current={step} label="Your Salon" />
                <StepLine done={step > 2} />
                <StepDot n={3} current={step} label="Location" />
              </div>

              {/* STEP 1 — Account */}
              {step === 1 && (
                <>
                  <div style={S.cardTitle}>Create your account</div>
                  <div style={S.cardSub}>Start your GlowSuite journey</div>

                  {/* Role selector */}
                  <div style={S.roleRow}>
                    {[
                      { r: 'owner', icon: '👑', name: 'Owner / Admin', desc: 'Full access' },
                      { r: 'employee', icon: '✂️', name: 'Staff Member', desc: 'Staff access' },
                    ].map(({ r, icon, name, desc }) => (
                      <button key={r} type="button"
                        style={{ ...S.roleBtn, ...(account.role === r ? S.roleBtnOn : {}) }}
                        onClick={() => setAccount(a => ({ ...a, role: r }))}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <div>
                          <div style={S.roleName}>{name}</div>
                          <div style={S.roleDesc}>{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={nextStep} style={S.form}>
                    <Field label="Full Name">
                      <Input placeholder="Priya Sharma" value={account.name}
                        onChange={e => setAccount(a => ({ ...a, name: e.target.value }))} />
                    </Field>
                    <Field label="Email Address">
                      <Input type="email" placeholder="you@example.com" value={account.email}
                        onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Password">
                        <Input type="password" placeholder="Min 6 chars" value={account.password}
                          onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} />
                      </Field>
                      <Field label="Confirm Password">
                        <Input type="password" placeholder="Repeat password" value={account.confirmPassword}
                          onChange={e => setAccount(a => ({ ...a, confirmPassword: e.target.value }))} />
                      </Field>
                    </div>
                    {error && <div style={S.errorBox}>{error}</div>}
                    <button type="submit" style={S.btn}>Continue →</button>
                  </form>
                </>
              )}

              {/* STEP 2 — Salon Details */}
              {step === 2 && (
                <>
                  <div style={S.cardTitle}>Tell us about your salon</div>
                  <div style={S.cardSub}>This helps us personalise your experience</div>
                  <form onSubmit={nextStep} style={S.form}>
                    <Field label="Salon / Business Name">
                      <Input placeholder="Glow Beauty Studio" value={salon.salonName}
                        onChange={e => setSalon(s => ({ ...s, salonName: e.target.value }))} />
                    </Field>
                    <Field label="Type of Business">
                      <div style={S.typeGrid}>
                        {SALON_TYPES.map(t => (
                          <button key={t.id} type="button"
                            style={{ ...S.typeBtn, ...(salon.salonType === t.id ? S.typeBtnOn : {}) }}
                            onClick={() => setSalon(s => ({ ...s, salonType: t.id }))}>
                            <span style={{ fontSize: 20 }}>{t.icon}</span>
                            <span style={{ fontSize: 11, marginTop: 3 }}>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Country">
                      <Select value={salon.countryCode}
                        onChange={e => setSalon(s => ({ ...s, countryCode: e.target.value }))}>
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </Select>
                    </Field>
                    {error && <div style={S.errorBox}>{error}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" style={S.backBtn} onClick={() => setStep(1)}>← Back</button>
                      <button type="submit" style={{ ...S.btn, flex: 1 }}>Continue →</button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 3 — Locale & Contact */}
              {step === 3 && (
                <>
                  <div style={S.cardTitle}>Locale & contact</div>
                  <div style={S.cardSub}>
                    <span style={{ marginRight: 6 }}>{selectedCountry.flag}</span>
                    Auto-filled for {selectedCountry.name} — edit if needed
                  </div>
                  <form onSubmit={handleRegister} style={S.form}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Currency" hint={`Symbol: ${locale.currencySymbol}`}>
                        <Input value={locale.currency}
                          onChange={e => setLocale(l => ({ ...l, currency: e.target.value }))} />
                      </Field>
                      <Field label="Currency Symbol">
                        <Input value={locale.currencySymbol}
                          onChange={e => setLocale(l => ({ ...l, currencySymbol: e.target.value }))} />
                      </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Tax Name (e.g. GST, VAT)">
                        <Input value={locale.taxName}
                          onChange={e => setLocale(l => ({ ...l, taxName: e.target.value }))} />
                      </Field>
                      <Field label="Tax Rate (%)">
                        <Input type="number" min="0" max="100" value={locale.taxRate}
                          onChange={e => setLocale(l => ({ ...l, taxRate: e.target.value }))} />
                      </Field>
                    </div>
                    <Field label="Date Format">
                      <Select value={locale.dateFormat}
                        onChange={e => setLocale(l => ({ ...l, dateFormat: e.target.value }))}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/12/2025)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/25/2025)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2025-12-25)</option>
                      </Select>
                    </Field>
                    <Field label="Timezone">
                      <Input value={locale.timezone}
                        onChange={e => setLocale(l => ({ ...l, timezone: e.target.value }))} />
                    </Field>
                    <Field label="Your Phone Number (optional)">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ ...S.input, width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', color: '#6B6258', fontSize: 13 }}>
                          {selectedCountry.flag} {selectedCountry.dial}
                        </div>
                        <Input placeholder="9876543210" value={locale.phone}
                          onChange={e => setLocale(l => ({ ...l, phone: e.target.value }))}
                          style={{ flex: 1 }} />
                      </div>
                    </Field>
                    {/* Summary box */}
                    <div style={S.summaryBox}>
                      <div style={S.summaryTitle}>Your setup summary</div>
                      <div style={S.summaryGrid}>
                        <span style={S.summaryKey}>Salon</span><span>{salon.salonName}</span>
                        <span style={S.summaryKey}>Country</span><span>{selectedCountry.flag} {selectedCountry.name}</span>
                        <span style={S.summaryKey}>Currency</span><span>{locale.currencySymbol} {locale.currency}</span>
                        <span style={S.summaryKey}>Tax</span><span>{locale.taxName} @ {locale.taxRate}%</span>
                        <span style={S.summaryKey}>Dates</span><span>{locale.dateFormat}</span>
                      </div>
                    </div>
                    {error && <div style={S.errorBox}>{error}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" style={S.backBtn} onClick={() => setStep(2)}>← Back</button>
                      <button type="submit" style={{ ...S.btn, flex: 1, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                        {loading ? 'Creating account...' : '🚀 Launch My Salon'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ROSE = '#8B3A52', ROSE_L = '#FDF0F3', INK = '#1A1208', MIST = '#F8F5F0', STONE = '#6B6258'

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: MIST },
  left: { width: 380, background: INK, padding: '56px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 },
  leftInner: { position: 'relative', zIndex: 1 },
  logo: { fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 600, color: '#F5DFA0', letterSpacing: '-1px', marginBottom: 10 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 36 },
  feats: { display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 36 },
  feat: { display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.72)', fontSize: 13.5 },
  flags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  blob: { position: 'absolute', borderRadius: '50%', background: '#F5DFA0', opacity: 0.07 },
  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' },
  card: { background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 480, boxShadow: '0 4px 40px rgba(0,0,0,0.07)' },
  toggle: { display: 'flex', background: MIST, borderRadius: 10, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, padding: '9px 0', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: STONE, transition: 'all 0.2s', fontFamily: 'inherit' },
  toggleActive: { background: '#fff', color: ROSE, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  cardTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: INK, marginBottom: 3 },
  cardSub: { fontSize: 13, color: STONE, marginBottom: 22 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { fontSize: 11.5, fontWeight: 500, color: STONE, letterSpacing: '0.3px', textTransform: 'uppercase' },
  input: { padding: '10px 13px', border: '1.5px solid #E8E0D8', borderRadius: 9, fontSize: 13.5, color: INK, outline: 'none', background: '#FDFAF8', fontFamily: 'inherit', width: '100%' },
  btn: { padding: '12px', background: ROSE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.2px', transition: 'opacity 0.2s' },
  backBtn: { padding: '12px 18px', background: MIST, color: STONE, border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  errorBox: { background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 8, padding: '9px 13px', fontSize: 12.5 },
  roleRow: { display: 'flex', gap: 10, marginBottom: 20 },
  roleBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px solid #E8E0D8', borderRadius: 10, background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit' },
  roleBtnOn: { borderColor: ROSE, background: ROSE_L },
  roleName: { fontSize: 13, fontWeight: 500, color: INK },
  roleDesc: { fontSize: 11, color: STONE },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  typeBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 6px', border: '1.5px solid #E8E0D8', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE, transition: 'all 0.2s' },
  typeBtnOn: { borderColor: ROSE, background: ROSE_L, color: ROSE },
  summaryBox: { background: '#F8F5F0', borderRadius: 10, padding: '14px 16px' },
  summaryTitle: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13, color: INK },
  summaryKey: { color: STONE, fontSize: 12 },
}
