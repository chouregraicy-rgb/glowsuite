import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_BRIDES = [
  {
    id: 1,
    name: 'Priya Menon',
    token: '#A047',
    weddingDate: '2026-12-15',
    phone: '+91 98400 12345',
    package: 'Complete Bridal Package',
    packageAmount: 85000,
    advancePaid: 25000,
    assignedStaff: 'Kavitha R.',
    venue: 'Taj Hotel, Mumbai',
    sessions: [
      { id: 1, type: 'Consultation', date: '2026-04-10', time: '11:00 AM', status: 'scheduled', notes: 'Discuss look, colors, references', amount: 0 },
      { id: 2, type: 'Pre-Bridal Facial 1', date: '2026-05-15', time: '10:00 AM', status: 'scheduled', notes: 'Deep cleansing + brightening', amount: 4500 },
      { id: 3, type: 'Pre-Bridal Facial 2', date: '2026-07-15', time: '10:00 AM', status: 'scheduled', notes: 'Anti-ageing + glow', amount: 4500 },
      { id: 4, type: 'Pre-Bridal Facial 3', date: '2026-09-15', time: '10:00 AM', status: 'scheduled', notes: 'Final glow prep', amount: 4500 },
      { id: 5, type: 'Hair Trial', date: '2026-11-01', time: '10:00 AM', status: 'scheduled', notes: 'Test bridal hairstyle', amount: 5000 },
      { id: 6, type: 'Makeup Trial', date: '2026-11-15', time: '10:00 AM', status: 'scheduled', notes: 'Airbrush trial look', amount: 5000 },
      { id: 7, type: 'Pre-Bridal Spa', date: '2026-12-08', time: '10:00 AM', status: 'scheduled', notes: 'Full body polishing + massage', amount: 9000 },
      { id: 8, type: 'Mehendi', date: '2026-12-13', time: '5:00 PM', status: 'scheduled', notes: 'Full hands + feet mehendi', amount: 8000 },
      { id: 9, type: 'Bridal Makeup — D-Day', date: '2026-12-15', time: '6:00 AM', status: 'scheduled', notes: 'Full bridal look + hair', amount: 25000 },
    ],
    checklist: [
      { id: 1, task: 'Consultation done', done: false },
      { id: 2, task: 'Reference photos collected', done: false },
      { id: 3, task: 'Skin type analyzed', done: false },
      { id: 4, task: 'Diet & skin routine shared', done: false },
      { id: 5, task: 'Trial makeup done', done: false },
      { id: 6, task: 'Trial hair done', done: false },
      { id: 7, task: 'Lehenga color confirmed', done: false },
      { id: 8, task: 'Jewelry discussed', done: false },
      { id: 9, task: 'D-Day timing confirmed', done: false },
      { id: 10, task: 'Advance payment received', done: true },
      { id: 11, task: 'Emergency kit prepared', done: false },
      { id: 12, task: 'Transport to venue arranged', done: false },
    ],
  },
  {
    id: 2,
    name: 'Meera Sharma',
    token: '#D203',
    weddingDate: '2026-06-20',
    phone: '+91 98400 44444',
    package: 'Pre-Bridal + D-Day Package',
    packageAmount: 55000,
    advancePaid: 15000,
    assignedStaff: 'Kavitha R.',
    venue: 'ITC Grand, Delhi',
    sessions: [
      { id: 1, type: 'Consultation', date: '2026-04-05', time: '2:00 PM', status: 'done', notes: 'Done — going for natural dewy look', amount: 0 },
      { id: 2, type: 'Pre-Bridal Facial 1', date: '2026-04-20', time: '11:00 AM', status: 'scheduled', notes: 'Brightening session', amount: 4500 },
      { id: 3, type: 'Makeup Trial', date: '2026-05-25', time: '10:00 AM', status: 'scheduled', notes: 'Natural bridal look trial', amount: 5000 },
      { id: 4, type: 'Pre-Bridal Spa', date: '2026-06-13', time: '10:00 AM', status: 'scheduled', notes: 'Body polishing + massage', amount: 9000 },
      { id: 5, type: 'Bridal Makeup — D-Day', date: '2026-06-20', time: '5:00 AM', status: 'scheduled', notes: 'Natural dewy bridal look', amount: 20000 },
    ],
    checklist: [
      { id: 1, task: 'Consultation done', done: true },
      { id: 2, task: 'Reference photos collected', done: true },
      { id: 3, task: 'Skin type analyzed', done: true },
      { id: 4, task: 'Trial makeup done', done: false },
      { id: 5, task: 'D-Day timing confirmed', done: false },
      { id: 6, task: 'Advance payment received', done: true },
    ],
  },
]

const SESSION_TYPES = ['Consultation', 'Pre-Bridal Facial', 'Hair Trial', 'Makeup Trial', 'Pre-Bridal Spa', 'Mehendi', 'Body Polishing', 'Nail Session', 'Bridal Makeup — D-Day', 'Post-Bridal']
const SESSION_COLORS = {
  'Consultation': { color: '#185FA5', bg: '#E6F1FB' },
  'Pre-Bridal Facial': { color: '#0F6E56', bg: '#E1F5EE' },
  'Pre-Bridal Facial 1': { color: '#0F6E56', bg: '#E1F5EE' },
  'Pre-Bridal Facial 2': { color: '#0F6E56', bg: '#E1F5EE' },
  'Pre-Bridal Facial 3': { color: '#0F6E56', bg: '#E1F5EE' },
  'Hair Trial': { color: '#8B3A52', bg: '#FDF0F3' },
  'Makeup Trial': { color: '#8B3A52', bg: '#FDF0F3' },
  'Pre-Bridal Spa': { color: '#533AB7', bg: '#EEEDFE' },
  'Mehendi': { color: '#3B6D11', bg: '#EAF3DE' },
  'Body Polishing': { color: '#533AB7', bg: '#EEEDFE' },
  'Bridal Makeup — D-Day': { color: '#BA7517', bg: '#FAEEDA' },
  'Post-Bridal': { color: '#6B6258', bg: '#F8F5F0' },
}

function getSessionColor(type) {
  return SESSION_COLORS[type] || { color: '#6B6258', bg: '#F8F5F0' }
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── ADD BRIDE MODAL ──────────────────────────────────────────────────────────
function AddBrideModal({ onClose, onAdd, sym }) {
  const [form, setForm] = useState({ name: '', weddingDate: '', phone: '', package: 'Complete Bridal Package', packageAmount: 85000, advancePaid: 0, assignedStaff: 'Kavitha R.', venue: '' })
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    const token = '#' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String(Math.floor(Math.random() * 900) + 100)
    onAdd({ id: Date.now(), token, ...form, sessions: [], checklist: [] })
    onClose()
  }

  return (
    <div style={Mo.overlay}>
      <div style={Mo.modal}>
        <div style={Mo.header}><div style={Mo.title}>Add Bridal Booking</div><button style={Mo.close} onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit} style={Mo.form}>
          <div style={Mo.grid2}>
            <div style={Mo.field}><label style={Mo.label}>Bride's Name *</label><input style={Mo.input} required value={form.name} onChange={e => up('name', e.target.value)} placeholder="Priya Sharma" /></div>
            <div style={Mo.field}><label style={Mo.label}>Wedding Date *</label><input style={Mo.input} type="date" required value={form.weddingDate} onChange={e => up('weddingDate', e.target.value)} /></div>
            <div style={Mo.field}><label style={Mo.label}>Phone</label><input style={Mo.input} value={form.phone} onChange={e => up('phone', e.target.value)} placeholder="+91 98000 00000" /></div>
            <div style={Mo.field}><label style={Mo.label}>Venue</label><input style={Mo.input} value={form.venue} onChange={e => up('venue', e.target.value)} placeholder="Hotel name, city" /></div>
            <div style={Mo.field}><label style={Mo.label}>Package</label><input style={Mo.input} value={form.package} onChange={e => up('package', e.target.value)} /></div>
            <div style={Mo.field}><label style={Mo.label}>Package Amount ({sym})</label><input style={Mo.input} type="number" value={form.packageAmount} onChange={e => up('packageAmount', Number(e.target.value))} /></div>
            <div style={Mo.field}><label style={Mo.label}>Advance Paid ({sym})</label><input style={Mo.input} type="number" value={form.advancePaid} onChange={e => up('advancePaid', Number(e.target.value))} /></div>
            <div style={Mo.field}><label style={Mo.label}>Assigned Staff</label><input style={Mo.input} value={form.assignedStaff} onChange={e => up('assignedStaff', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" style={Mo.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={Mo.submitBtn}>Add Bridal Booking 👑</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── BRIDE DETAIL ─────────────────────────────────────────────────────────────
function BrideDetail({ bride, onClose, onUpdate, sym }) {
  const [tab, setTab] = useState('timeline')
  const days = daysUntil(bride.weddingDate)
  const completedSessions = bride.sessions.filter(s => s.status === 'done').length
  const checkedTasks = bride.checklist.filter(t => t.done).length
  const balance = bride.packageAmount - bride.advancePaid

  function toggleTask(id) {
    const updated = { ...bride, checklist: bride.checklist.map(t => t.id === id ? { ...t, done: !t.done } : t) }
    onUpdate(updated)
  }

  function markSession(id, status) {
    const updated = { ...bride, sessions: bride.sessions.map(s => s.id === id ? { ...s, status } : s) }
    onUpdate(updated)
  }

  return (
    <div style={D.overlay}>
      <div style={D.panel}>
        {/* Header */}
        <div style={D.header}>
          <div>
            <div style={D.name}>{bride.name} 👑</div>
            <div style={D.meta}>{bride.token} · {bride.assignedStaff}</div>
          </div>
          <button style={D.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Countdown */}
        <div style={{ ...D.countdown, background: days <= 30 ? '#FAECE7' : days <= 90 ? '#FAEEDA' : '#E1F5EE' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: days <= 30 ? '#993C1D' : days <= 90 ? '#BA7517' : '#0F6E56', fontFamily: "'Cormorant Garamond', serif" }}>
            {days}
          </div>
          <div style={{ fontSize: 12, color: '#6B6258', marginTop: 2 }}>days to wedding</div>
          <div style={{ fontSize: 11, color: '#6B6258', marginTop: 4 }}>📅 {formatDate(bride.weddingDate)}</div>
          {bride.venue && <div style={{ fontSize: 11, color: '#6B6258' }}>📍 {bride.venue}</div>}
        </div>

        {/* Progress */}
        <div style={D.progressRow}>
          <div style={D.progressItem}>
            <div style={D.progressVal}>{completedSessions}/{bride.sessions.length}</div>
            <div style={D.progressKey}>Sessions done</div>
            <div style={D.progressBar}><div style={{ ...D.progressFill, width: `${bride.sessions.length ? (completedSessions / bride.sessions.length) * 100 : 0}%`, background: '#8B3A52' }} /></div>
          </div>
          <div style={D.progressItem}>
            <div style={D.progressVal}>{checkedTasks}/{bride.checklist.length}</div>
            <div style={D.progressKey}>Tasks done</div>
            <div style={D.progressBar}><div style={{ ...D.progressFill, width: `${bride.checklist.length ? (checkedTasks / bride.checklist.length) * 100 : 0}%`, background: '#0F6E56' }} /></div>
          </div>
        </div>

        {/* Payment */}
        <div style={D.paymentBox}>
          <div style={D.payRow}><span>Package</span><span style={{ fontWeight: 500 }}>{sym}{bride.packageAmount.toLocaleString()}</span></div>
          <div style={D.payRow}><span>Advance paid</span><span style={{ color: '#0F6E56', fontWeight: 500 }}>− {sym}{bride.advancePaid.toLocaleString()}</span></div>
          <div style={{ ...D.payRow, fontWeight: 600, color: balance > 0 ? '#993C1D' : '#0F6E56', borderTop: '0.5px solid #E8E0D8', paddingTop: 6, marginTop: 4 }}>
            <span>Balance due</span><span>{sym}{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={D.tabs}>
          {['timeline', 'checklist'].map(t => (
            <button key={t} style={{ ...D.tab, ...(tab === t ? D.tabOn : {}) }} onClick={() => setTab(t)}>
              {t === 'timeline' ? '📅 Timeline' : '✅ Checklist'}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {tab === 'timeline' && (
          <div style={D.content}>
            {bride.sessions.map((s, i) => {
              const c = getSessionColor(s.type)
              const isPast = new Date(s.date) < new Date()
              return (
                <div key={s.id} style={D.sessionItem}>
                  <div style={{ ...D.sessionDot, background: s.status === 'done' ? '#0F6E56' : c.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ ...D.sessionType, background: c.bg, color: c.color }}>{s.type}</span>
                      {s.amount > 0 && <span style={D.sessionAmt}>{sym}{s.amount.toLocaleString()}</span>}
                    </div>
                    <div style={D.sessionDate}>{formatDate(s.date)} · {s.time}</div>
                    {s.notes && <div style={D.sessionNotes}>{s.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {s.status === 'done'
                      ? <span style={D.doneBadge}>✓ Done</span>
                      : <button style={D.markDoneBtn} onClick={() => markSession(s.id, 'done')}>Mark done</button>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Checklist */}
        {tab === 'checklist' && (
          <div style={D.content}>
            <div style={{ fontSize: 11, color: '#6B6258', marginBottom: 12 }}>
              {checkedTasks} of {bride.checklist.length} tasks completed
            </div>
            {bride.checklist.map(task => (
              <div key={task.id} style={D.checkItem} onClick={() => toggleTask(task.id)}>
                <div style={{ ...D.checkbox, background: task.done ? '#0F6E56' : '#fff', borderColor: task.done ? '#0F6E56' : '#E8E0D8' }}>
                  {task.done && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: task.done ? '#B0A89F' : '#1A1208', textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.task}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BRIDE CARD ───────────────────────────────────────────────────────────────
function BrideCard({ bride, onClick, sym }) {
  const days = daysUntil(bride.weddingDate)
  const completedSessions = bride.sessions.filter(s => s.status === 'done').length
  const urgency = days <= 30 ? { color: '#993C1D', bg: '#FAECE7' } : days <= 90 ? { color: '#BA7517', bg: '#FAEEDA' } : { color: '#0F6E56', bg: '#E1F5EE' }
  const nextSession = bride.sessions.find(s => s.status !== 'done')

  return (
    <div style={Bc.card} onClick={() => onClick(bride)}>
      <div style={Bc.top}>
        <div style={Bc.avatar}>👑</div>
        <div style={{ flex: 1 }}>
          <div style={Bc.name}>{bride.name}</div>
          <div style={Bc.token}>{bride.token} · {bride.assignedStaff}</div>
        </div>
        <div style={{ ...Bc.countdown, background: urgency.bg, color: urgency.color }}>
          <div style={Bc.days}>{days}</div>
          <div style={Bc.daysLabel}>days</div>
        </div>
      </div>
      <div style={Bc.weddingDate}>📅 Wedding: {formatDate(bride.weddingDate)}</div>
      {bride.venue && <div style={Bc.venue}>📍 {bride.venue}</div>}
      <div style={Bc.stats}>
        <div style={Bc.stat}><span style={Bc.statVal}>{completedSessions}/{bride.sessions.length}</span><span style={Bc.statKey}>sessions</span></div>
        <div style={Bc.stat}><span style={Bc.statVal}>{sym}{bride.packageAmount.toLocaleString()}</span><span style={Bc.statKey}>package</span></div>
        <div style={Bc.stat}><span style={{ ...Bc.statVal, color: '#993C1D' }}>{sym}{(bride.packageAmount - bride.advancePaid).toLocaleString()}</span><span style={Bc.statKey}>balance</span></div>
      </div>
      {nextSession && (
        <div style={Bc.nextSession}>
          <span style={{ ...Bc.nextDot, background: getSessionColor(nextSession.type).color }} />
          Next: {nextSession.type} · {formatDate(nextSession.date)}
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BridalTimeline() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [brides, setBrides] = useState(MOCK_BRIDES)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')

  function updateBride(updated) {
    setBrides(b => b.map(bride => bride.id === updated.id ? updated : bride))
    setSelected(updated)
  }

  const sorted = [...brides].sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate))
  const filtered = sorted.filter(b => {
    const days = daysUntil(b.weddingDate)
    if (filter === 'urgent') return days <= 30
    if (filter === 'soon') return days > 30 && days <= 90
    if (filter === 'upcoming') return days > 90
    return true
  })

  const totalRevenue = brides.reduce((s, b) => s + b.packageAmount, 0)
  const totalReceived = brides.reduce((s, b) => s + b.advancePaid, 0)
  const urgent = brides.filter(b => daysUntil(b.weddingDate) <= 30).length

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Bridal Timeline Manager</div>
          <div style={P.sub}>Track every bride's journey from consultation to D-Day</div>
        </div>
        <button style={P.addBtn} onClick={() => setShowAdd(true)}>+ Add Bridal Booking</button>
      </div>

      {/* Stats */}
      <div style={P.statsRow}>
        {[
          { label: 'Total Bookings', value: brides.length, color: '#8B3A52' },
          { label: 'Urgent (< 30 days)', value: urgent, color: '#993C1D' },
          { label: 'Total Package Value', value: `${sym}${totalRevenue.toLocaleString()}`, color: '#0F6E56' },
          { label: 'Advance Collected', value: `${sym}${totalReceived.toLocaleString()}`, color: '#185FA5' },
        ].map(s => (
          <div key={s.label} style={P.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={P.filters}>
        {[
          { id: 'all', label: '👑 All Brides' },
          { id: 'urgent', label: '🔴 Urgent (< 30 days)' },
          { id: 'soon', label: '🟡 Soon (30-90 days)' },
          { id: 'upcoming', label: '🟢 Upcoming (> 90 days)' },
        ].map(f => (
          <button key={f.id} style={{ ...P.fBtn, ...(filter === f.id ? P.fBtnOn : {}) }} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Bride cards */}
      <div style={P.grid}>
        {filtered.map(b => <BrideCard key={b.id} bride={b} onClick={setSelected} sym={sym} />)}
        {filtered.length === 0 && <div style={P.empty}>No bridal bookings in this category</div>}
      </div>

      {showAdd && <AddBrideModal onClose={() => setShowAdd(false)} onAdd={b => setBrides(br => [...br, b])} sym={sym} />}
      {selected && <BrideDetail bride={selected} onClose={() => setSelected(null)} onUpdate={updateBride} sym={sym} />}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0', ROSE = '#8B3A52'

const P = {
  wrap: { fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: INK },
  sub: { fontSize: 12, color: STONE, marginTop: 3 },
  addBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  fBtn: { padding: '6px 14px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  fBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: '#B0A89F', padding: 40 },
}

const Bc = {
  card: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, padding: 16, cursor: 'pointer' },
  top: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  name: { fontSize: 15, fontWeight: 500, color: INK },
  token: { fontSize: 11, color: STONE, marginTop: 2 },
  countdown: { textAlign: 'center', padding: '6px 10px', borderRadius: 10, flexShrink: 0 },
  days: { fontSize: 20, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" },
  daysLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px' },
  weddingDate: { fontSize: 12, color: STONE, marginBottom: 3 },
  venue: { fontSize: 11, color: STONE, marginBottom: 10 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, borderTop: '0.5px solid #F0EAE4', borderBottom: '0.5px solid #F0EAE4', padding: '8px 0', margin: '8px 0' },
  stat: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 },
  statVal: { fontSize: 13, fontWeight: 500, color: INK },
  statKey: { fontSize: 9, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  nextSession: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: STONE },
  nextDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
}

const D = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  panel: { width: 440, background: '#fff', height: '100vh', overflowY: 'auto', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  name: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  meta: { fontSize: 12, color: STONE, marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  countdown: { borderRadius: 12, padding: '14px', textAlign: 'center', marginBottom: 16 },
  progressRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  progressItem: { background: MIST, borderRadius: 8, padding: '10px 12px' },
  progressVal: { fontSize: 18, fontWeight: 600, color: INK, fontFamily: "'Cormorant Garamond', serif" },
  progressKey: { fontSize: 10, color: STONE, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' },
  progressBar: { height: 4, background: '#E8E0D8', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, transition: 'width 0.3s' },
  paymentBox: { background: MIST, borderRadius: 8, padding: '10px 14px', marginBottom: 14 },
  payRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: STONE, padding: '3px 0' },
  tabs: { display: 'flex', gap: 0, background: MIST, borderRadius: 10, padding: 3, marginBottom: 14 },
  tab: { flex: 1, padding: '8px', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: STONE, fontFamily: 'inherit', fontWeight: 500 },
  tabOn: { background: '#fff', color: ROSE },
  content: { paddingTop: 4 },
  sessionItem: { display: 'flex', gap: 10, paddingBottom: 14, alignItems: 'flex-start' },
  sessionDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4 },
  sessionType: { fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500, display: 'inline-block' },
  sessionAmt: { fontSize: 11, color: '#0F6E56', fontWeight: 500 },
  sessionDate: { fontSize: 11, color: STONE, marginTop: 3 },
  sessionNotes: { fontSize: 11, color: '#B0A89F', marginTop: 2, fontStyle: 'italic' },
  doneBadge: { fontSize: 10, padding: '3px 8px', borderRadius: 10, background: '#E1F5EE', color: '#0F6E56', fontWeight: 500, whiteSpace: 'nowrap' },
  markDoneBtn: { fontSize: 10, padding: '3px 8px', borderRadius: 10, background: '#FDF0F3', color: ROSE, border: `0.5px solid ${ROSE}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F8F5F0', cursor: 'pointer' },
  checkbox: { width: 20, height: 20, borderRadius: 6, border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
}

const Mo = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 8px 48px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  close: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '9px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  cancelBtn: { padding: '9px 18px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '9px 20px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
