import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const SPECIALIZATIONS = [
  'Hair Color', 'Bridal Makeup', 'Keratin Treatment', 'Hair Cut',
  'Skin Facial', 'Threading', 'Waxing', 'Nail Art',
  'Gel Extensions', 'Spa Massage', 'Mehendi', 'Eyebrows'
]

const ROLES = [
  { value: 'employee', label: '✂️ Stylist / Therapist' },
  { value: 'senior',   label: '⭐ Senior Stylist' },
  { value: 'manager',  label: '👔 Manager' },
  { value: 'trainee',  label: '🎓 Trainee' },
]

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
  modal:   { background:'#fff', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', fontFamily:'Inter,sans-serif' },
  header:  { padding:'24px 28px 16px', borderBottom:'1px solid #f0ede9', display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:   { fontSize:18, fontWeight:700, color:'#1a0a0a' },
  close:   { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888', padding:4 },
  body:    { padding:'24px 28px' },
  label:   { display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
  input:   { width:'100%', padding:'11px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1a0a0a', background:'#faf9f7' },
  sel:     { width:'100%', padding:'11px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1a0a0a', background:'#faf9f7' },
  row:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  mb:      { marginBottom:16 },
  btn:     { width:'100%', padding:'13px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer' },
  btnOut:  { width:'100%', padding:'13px', background:'transparent', color:'#8b2252', border:'1.5px solid #8b2252', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer' },
  err:     { background:'#fff0f0', border:'1px solid #fcc', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#c00', marginBottom:16 },
  ok:      { background:'#f0fff4', border:'1px solid #9f9', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#060', marginBottom:16 },
  chip:    (active) => ({ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1.5px solid', borderColor: active?'#8b2252':'#e8e4df', background: active?'#8b225215':'transparent', color: active?'#8b2252':'#666' }),
  cred:    { background:'#1a0a0a', borderRadius:12, padding:20, marginTop:16 },
  credRow: { display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 },
  credKey: { color:'rgba(255,255,255,0.5)' },
  credVal: { color:'#c9956b', fontWeight:600, fontFamily:'monospace' },
  steps:   { display:'flex', gap:8, marginBottom:24 },
  stepDot: (a, d) => ({ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0, background: d?'#8b2252':a?'#8b2252':'#e8e4df', color:(a||d)?'#fff':'#999' }),
  stepLine:{ flex:1, height:2, background:'#e8e4df', alignSelf:'center' },
}

export default function AddStaffModal({ onClose, onAdd }) {
  const { salonId, salon, profile } = useAuth()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [credentials, setCredentials] = useState(null)

  const [form, setForm] = useState({
    name: '', email: '', role: 'employee',
    baseSalary: '', incentiveRate: 10,
    specializations: []
  })

  function setF(k, v) { setForm(f => ({...f, [k]: v})) }

  function toggleSpec(s) {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter(x => x !== s)
        : [...f.specializations, s]
    }))
  }

  function validateStep1() {
    if (!form.name.trim())  return 'Full name is required'
    if (!form.email.trim()) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email'
    return ''
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  async function handleCreate() {
    setError('')
    setLoading(true)

    try {
      // Generate temp password
      const tempPassword = 'Glow@' + Math.random().toString(36).slice(2,8).toUpperCase()

      // 1. Get current session token to call our server
      const { data: { session } } = await supabase.auth.getSession()

      // 2. Try server API first (creates Supabase auth user)
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
      let userId = null

      try {
        const res = await fetch(`${serverUrl}/api/staff/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            base_salary: parseFloat(form.baseSalary) || 0,
            incentive_rate: parseFloat(form.incentiveRate) || 0,
            specializations: form.specializations
          })
        })

        if (res.ok) {
          const data = await res.json()
          userId = data.employee?.user_id
          setCredentials({ email: form.email, tempPassword: data.credentials?.tempPassword || tempPassword })
        } else {
          throw new Error('Server unavailable')
        }
      } catch {
        // Fallback: direct Supabase insert (without auth account creation)
        // This adds to employees table — owner shares credentials manually
        const { data: emp, error: empErr } = await supabase
          .from('employees')
          .insert({
            salon_id: salonId,
            name: form.name,
            email: form.email,
            role: form.role,
            base_salary: parseFloat(form.baseSalary) || 0,
            incentive_rate: parseFloat(form.incentiveRate) || 0,
            specializations: form.specializations,
            status: 'active'
          })
          .select()
          .single()

        if (empErr) throw empErr

        setCredentials({ email: form.email, tempPassword, note: 'Share login URL with staff. Account setup pending server.' })
        if (onAdd) onAdd(emp)
      }

      setStep(4) // success step

    } catch (err) {
      let msg = err.message || 'Failed to create staff'
      if (msg.includes('duplicate') || msg.includes('already')) msg = 'An employee with this email already exists.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div style={S.title}>
            {step < 4 ? '+ Add Staff Member' : '✅ Staff Account Created'}
          </div>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          {/* Step indicators */}
          {step < 4 && (
            <div style={S.steps}>
              {[1,2,3].map((n,i) => (
                <div key={n} style={{display:'flex',alignItems:'center',flex:i<2?1:'auto',gap:8}}>
                  <div style={S.stepDot(step===n, step>n)}>{step>n?'✓':n}</div>
                  {i < 2 && <div style={S.stepLine} />}
                </div>
              ))}
            </div>
          )}

          {error && <div style={S.err}>⚠️ {error}</div>}

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <>
              <p style={{fontSize:13,color:'#888',marginBottom:20}}>Step 1 of 3 — Basic information</p>
              <div style={S.mb}>
                <label style={S.label}>Full Name *</label>
                <input style={S.input} placeholder="e.g. Kavitha R." value={form.name} onChange={e=>setF('name',e.target.value)} />
              </div>
              <div style={S.mb}>
                <label style={S.label}>Email Address *</label>
                <input style={S.input} type="email" placeholder="kavitha@example.com" value={form.email} onChange={e=>setF('email',e.target.value)} />
              </div>
              <div style={S.mb}>
                <label style={S.label}>Role</label>
                <select style={S.sel} value={form.role} onChange={e=>setF('role',e.target.value)}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <button style={S.btn} onClick={nextStep}>Continue →</button>
            </>
          )}

          {/* Step 2 — Salary */}
          {step === 2 && (
            <>
              <p style={{fontSize:13,color:'#888',marginBottom:20}}>Step 2 of 3 — Salary & incentives</p>
              <div style={S.row}>
                <div>
                  <label style={S.label}>Base Salary ({salon?.settings?.currencySymbol||'₹'}/month)</label>
                  <input style={S.input} type="number" placeholder="e.g. 15000" value={form.baseSalary} onChange={e=>setF('baseSalary',e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>Incentive Rate (%)</label>
                  <input style={S.input} type="number" placeholder="e.g. 10" min="0" max="50" value={form.incentiveRate} onChange={e=>setF('incentiveRate',e.target.value)} />
                </div>
              </div>

              {/* Live preview */}
              {form.baseSalary && (
                <div style={{background:'#faf9f7',borderRadius:10,padding:14,marginBottom:16,fontSize:13}}>
                  <div style={{fontWeight:600,marginBottom:8,color:'#1a0a0a'}}>💰 Estimated monthly pay</div>
                  <div style={{display:'flex',justifyContent:'space-between',color:'#666',marginBottom:4}}>
                    <span>Base salary</span>
                    <span>{salon?.settings?.currencySymbol||'₹'}{parseFloat(form.baseSalary||0).toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',color:'#666',marginBottom:4}}>
                    <span>Incentive (on revenue)</span>
                    <span>{form.incentiveRate}% of services</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:'#8b2252',borderTop:'1px solid #e8e4df',paddingTop:8,marginTop:4}}>
                    <span>Guaranteed base</span>
                    <span>{salon?.settings?.currencySymbol||'₹'}{parseFloat(form.baseSalary||0).toLocaleString()}/mo</span>
                  </div>
                </div>
              )}

              <div style={{display:'flex',gap:8}}>
                <button style={S.btnOut} onClick={()=>setStep(1)}>← Back</button>
                <button style={S.btn} onClick={nextStep}>Continue →</button>
              </div>
            </>
          )}

          {/* Step 3 — Specializations */}
          {step === 3 && (
            <>
              <p style={{fontSize:13,color:'#888',marginBottom:20}}>Step 3 of 3 — Specializations</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
                {SPECIALIZATIONS.map(s => (
                  <button key={s} style={S.chip(form.specializations.includes(s))} onClick={()=>toggleSpec(s)}>
                    {form.specializations.includes(s)?'✓ ':''}{s}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div style={{background:'#faf9f7',borderRadius:12,padding:16,marginBottom:16}}>
                {[
                  ['Name', form.name],
                  ['Email', form.email],
                  ['Role', ROLES.find(r=>r.value===form.role)?.label],
                  ['Base Salary', `${salon?.settings?.currencySymbol||'₹'}${parseFloat(form.baseSalary||0).toLocaleString()}/mo`],
                  ['Incentive', `${form.incentiveRate}%`],
                  ['Skills', form.specializations.length ? form.specializations.join(', ') : 'General'],
                ].map(([k,v]) => (
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f0ede9',fontSize:13}}>
                    <span style={{color:'#888'}}>{k}</span>
                    <span style={{fontWeight:600,color:'#1a0a0a',maxWidth:260,textAlign:'right'}}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button style={S.btnOut} onClick={()=>setStep(2)}>← Back</button>
                <button style={S.btn} onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creating account...' : '🚀 Create Staff Account'}
                </button>
              </div>
            </>
          )}

          {/* Step 4 — Success + credentials */}
          {step === 4 && credentials && (
            <>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontSize:48,marginBottom:8}}>🎉</div>
                <div style={{fontSize:16,fontWeight:700,color:'#1a0a0a',marginBottom:4}}>
                  {form.name} has been added!
                </div>
                <div style={{fontSize:13,color:'#888'}}>
                  Share these login credentials with your staff member.
                </div>
              </div>

              <div style={S.cred}>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12,textTransform:'uppercase',letterSpacing:'1px'}}>
                  🔐 Login Credentials
                </div>
                {[
                  ['Login URL', window.location.origin + '/login'],
                  ['Email', credentials.email],
                  ['Password', credentials.tempPassword],
                ].map(([k,v]) => (
                  <div key={k} style={S.credRow}>
                    <span style={S.credKey}>{k}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={S.credVal}>{v}</span>
                      <button onClick={()=>copyText(v)} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:4,color:'#fff',fontSize:10,padding:'2px 6px',cursor:'pointer'}}>
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:12,lineHeight:1.5}}>
                  ⚠️ Share these securely. Staff should change password on first login.
                </div>
              </div>

              <div style={{display:'flex',gap:8,marginTop:16}}>
                <button style={S.btnOut} onClick={()=>{setStep(1);setForm({name:'',email:'',role:'employee',baseSalary:'',incentiveRate:10,specializations:[]});setCredentials(null);setError('')}}>
                  + Add Another
                </button>
                <button style={S.btn} onClick={onClose}>Done ✓</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
