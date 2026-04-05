import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const ROLES = ['Senior Stylist', 'Stylist', 'Makeup Artist', 'Hair Specialist', 'Nail Tech', 'Skin Therapist', 'Spa Therapist', 'Massage Therapist', 'Receptionist', 'Assistant']
const SPECIALIZATIONS = ['Hair Color', 'Balayage', 'Keratin', 'Bridal', 'Makeup', 'Airbrush', 'Nail Art', 'Gel Nails', 'Facial', 'Spa', 'Massage', 'Threading', 'Mehendi']

function CredentialsCard({ credentials, name, onClose }) {
  const [copied, setCopied] = useState(false)

  function copyAll() {
    const text = `GlowSuite Login Credentials for ${name}\n\nEmail: ${credentials.email}\nPassword: ${credentials.tempPassword}\nLogin: ${credentials.loginUrl}\n\nNote: Please change your password after first login.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <div style={S.title}>Account Created!</div>
          <div style={{ fontSize: 13, color: '#6B6258', marginTop: 4 }}>
            Share these login credentials with <strong>{name}</strong>
          </div>
        </div>

        <div style={S.credBox}>
          <div style={S.credRow}>
            <span style={S.credKey}>Email</span>
            <span style={S.credVal}>{credentials.email}</span>
          </div>
          <div style={S.credRow}>
            <span style={S.credKey}>Password</span>
            <span style={{ ...S.credVal, fontFamily: 'monospace', color: '#8B3A52', fontSize: 16, fontWeight: 700 }}>
              {credentials.tempPassword}
            </span>
          </div>
          <div style={S.credRow}>
            <span style={S.credKey}>Login URL</span>
            <span style={{ ...S.credVal, color: '#185FA5', fontSize: 11 }}>{credentials.loginUrl}</span>
          </div>
        </div>

        <div style={S.noteBox}>
          ⚠️ Save this password now — it won't be shown again. Ask {name} to change it after first login.
        </div>

        <div style={S.shieldBox}>
          🛡 This employee will see <strong>only their assigned appointments</strong> with masked client tokens. Real phone numbers and client details are hidden from staff.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button style={{ ...S.copyBtn, background: copied ? '#0F6E56' : '#1A1208' }} onClick={copyAll}>
            {copied ? '✓ Copied!' : '📋 Copy Credentials'}
          </button>
          <button style={S.closeBtn} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

export default function AddStaffModal({ onClose, onAdd, sym }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    role: 'Stylist',
    salaryBase: 15000,
    incentiveRate: 10,
    specialization: [],
  })

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleSpec(spec) {
    setForm(f => ({
      ...f,
      specialization: f.specialization.includes(spec)
        ? f.specialization.filter(s => s !== spec)
        : [...f.specialization, spec]
    }))
  }

  async function handleCreate() {
    if (!form.name || !form.email) { setError('Name and email are required'); return }
    setError('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('Not logged in. Please refresh and try again.')
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}/api/staff/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          designation: form.role,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      setCredentials({
        email: data.credentials.email,
        tempPassword: data.credentials.tempPassword,
        loginUrl: window.location.origin + '/login',
      })
      onAdd({ ...form, id: data.staff.id })

    } catch (err) {
      setError('Could not connect to server. Make sure the server is running on port 4000.')
    }

    setLoading(false)
  }

  if (credentials) {
    return <CredentialsCard credentials={credentials} name={form.name} onClose={onClose} />
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <div style={S.title}>Add New Staff Member</div>
          <button style={S.xBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.steps}>
          {['Personal', 'Salary', 'Skills'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ ...S.stepDot, background: step > i + 1 ? '#0F6E56' : step === i + 1 ? '#8B3A52' : '#E8E0D8', color: step >= i + 1 ? '#fff' : '#B0A89F' }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: step === i + 1 ? '#8B3A52' : '#B0A89F', fontWeight: step === i + 1 ? 500 : 400 }}>{label}</span>
              {i < 2 && <div style={{ width: 24, height: 1, background: '#E8E0D8', marginLeft: 2 }} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={S.form}>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Full Name *</label>
                <input style={S.input} value={form.name} onChange={e => up('name', e.target.value)} placeholder="Kavitha R." />
              </div>
              <div style={S.field}>
                <label style={S.label}>Role / Designation</label>
                <select style={S.input} value={form.role} onChange={e => up('role', e.target.value)}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Email Address *</label>
                <input style={S.input} type="email" value={form.email} onChange={e => up('email', e.target.value)} placeholder="kavitha@email.com" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Phone Number</label>
                <input style={S.input} value={form.phone} onChange={e => up('phone', e.target.value)} placeholder="+91 98000 00000" />
              </div>
            </div>
            <div style={S.infoBox}>
              🛡 A login account will be created for this email. The employee will only see their own schedule with <strong>masked client tokens</strong> — no real client details.
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={S.form}>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Base Salary ({sym}/month)</label>
                <input style={S.input} type="number" value={form.salaryBase} onChange={e => up('salaryBase', Number(e.target.value))} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Incentive Rate (%)</label>
                <input style={S.input} type="number" value={form.incentiveRate} onChange={e => up('incentiveRate', Number(e.target.value))} min="0" max="30" />
              </div>
            </div>
            <div style={S.salaryPreview}>
              <div style={{ fontSize: 11, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Salary Preview</div>
              <div style={S.salaryRow}><span>Base salary</span><span>{sym}{form.salaryBase.toLocaleString()}</span></div>
              <div style={S.salaryRow}><span>If revenue = {sym}50,000</span><span style={{ color: '#0F6E56' }}>+ {sym}{Math.round(50000 * form.incentiveRate / 100).toLocaleString()} incentive</span></div>
              <div style={{ ...S.salaryRow, fontWeight: 600, borderTop: '0.5px solid #E8E0D8', paddingTop: 8, marginTop: 4, color: '#1A1208' }}>
                <span>Estimated net</span>
                <span style={{ color: '#8B3A52' }}>{sym}{(form.salaryBase + Math.round(50000 * form.incentiveRate / 100)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={S.form}>
            <div style={{ fontSize: 12, color: '#6B6258', marginBottom: 12 }}>Select this employee's specializations:</div>
            <div style={S.specGrid}>
              {SPECIALIZATIONS.map(spec => (
                <button key={spec} type="button"
                  style={{ ...S.specBtn, ...(form.specialization.includes(spec) ? S.specBtnOn : {}) }}
                  onClick={() => toggleSpec(spec)}>
                  {form.specialization.includes(spec) ? '✓ ' : ''}{spec}
                </button>
              ))}
            </div>
            <div style={S.summaryBox}>
              <div style={{ fontSize: 11, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Summary</div>
              <div style={S.salaryRow}><span>Name</span><span style={{ fontWeight: 500 }}>{form.name}</span></div>
              <div style={S.salaryRow}><span>Role</span><span>{form.role}</span></div>
              <div style={S.salaryRow}><span>Email</span><span>{form.email}</span></div>
              <div style={S.salaryRow}><span>Base salary</span><span>{sym}{form.salaryBase.toLocaleString()}/mo</span></div>
              <div style={S.salaryRow}><span>Incentive</span><span>{form.incentiveRate}%</span></div>
              <div style={S.salaryRow}><span>Skills</span><span>{form.specialization.length > 0 ? form.specialization.join(', ') : 'None selected'}</span></div>
            </div>
          </div>
        )}

        {error && <div style={S.errorBox}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {step > 1 && <button style={S.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>}
          {step < 3 && (
            <button style={{ ...S.nextBtn, flex: 1 }} onClick={() => {
              if (step === 1 && (!form.name || !form.email)) { setError('Name and email are required'); return }
              setError('')
              setStep(s => s + 1)
            }}>
              Continue →
            </button>
          )}
          {step === 3 && (
            <button style={{ ...S.createBtn, flex: 1, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={handleCreate}>
              {loading ? 'Creating account...' : '🚀 Create Staff Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const ROSE = '#8B3A52', INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0'

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 48px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  xBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  steps: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 },
  stepDot: { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '9px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  infoBox: { background: '#E1F5EE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#085041', lineHeight: 1.5 },
  salaryPreview: { background: MIST, borderRadius: 10, padding: '12px 14px' },
  salaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: STONE, padding: '4px 0' },
  specGrid: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  specBtn: { padding: '6px 12px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  specBtnOn: { background: '#FDF0F3', color: ROSE, border: `0.5px solid ${ROSE}`, fontWeight: 500 },
  summaryBox: { background: MIST, borderRadius: 10, padding: '12px 14px' },
  errorBox: { background: '#FFF0F0', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginTop: 8 },
  backBtn: { padding: '10px 16px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  nextBtn: { padding: '10px', background: INK, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  createBtn: { padding: '10px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  credBox: { background: MIST, borderRadius: 10, padding: '14px 16px', marginBottom: 12 },
  credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #E8E0D8' },
  credKey: { fontSize: 11, color: STONE, textTransform: 'uppercase', letterSpacing: '0.4px' },
  credVal: { fontSize: 13, fontWeight: 500, color: INK },
  noteBox: { background: '#FAEEDA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6B4C1A', marginBottom: 10, lineHeight: 1.5 },
  shieldBox: { background: '#E1F5EE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#085041', lineHeight: 1.5 },
  copyBtn: { flex: 1, padding: '10px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' },
  closeBtn: { padding: '10px 20px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
}