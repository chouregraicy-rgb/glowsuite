import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const HOURS = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '1:00', '1:30', '2:00', '2:30', '3:00', '3:30', '4:00', '4:30', '5:00', '5:30', '6:00']

const STAFF = [
  { id: 1, name: 'Kavitha R.', role: 'Senior Stylist', color: '#8B3A52', bg: '#FDF0F3' },
  { id: 2, name: 'Sneha M.', role: 'Makeup Artist', color: '#0F6E56', bg: '#E1F5EE' },
  { id: 3, name: 'Latha D.', role: 'Hair Specialist', color: '#185FA5', bg: '#E6F1FB' },
  { id: 4, name: 'Bindhu P.', role: 'Nail Tech', color: '#BA7517', bg: '#FAEEDA' },
]

const SERVICES = [
  { name: 'Bridal Makeup + Hair', duration: 180, price: 8500, category: 'Bridal' },
  { name: 'Hair Color — Balayage', duration: 120, price: 6500, category: 'Hair' },
  { name: 'Keratin Treatment', duration: 120, price: 5500, category: 'Hair' },
  { name: 'Facial + Cleanup', duration: 60, price: 2800, category: 'Skin' },
  { name: 'Haircut + Style', duration: 45, price: 1200, category: 'Hair' },
  { name: 'Nail Art + Extensions', duration: 90, price: 3200, category: 'Nails' },
  { name: 'Spa Package', duration: 120, price: 4500, category: 'Spa' },
  { name: 'Consultation', duration: 30, price: 500, category: 'General' },
]

const STATUS_CONFIG = {
  booked:     { label: 'Booked',     color: '#185FA5', bg: '#E6F1FB' },
  confirmed:  { label: 'Confirmed',  color: '#0F6E56', bg: '#E1F5EE' },
  serving:    { label: 'Serving',    color: '#8B3A52', bg: '#FDF0F3' },
  done:       { label: 'Done',       color: '#3B6D11', bg: '#EAF3DE' },
  cancelled:  { label: 'Cancelled',  color: '#993C1D', bg: '#FAECE7' },
  no_show:    { label: 'No Show',    color: '#854F0B', bg: '#FAEEDA' },
  rescheduled:{ label: 'Rescheduled',color: '#533AB7', bg: '#EEEDFE' },
}

const CLIENTS = [
  { id: 1, token: '#A047', name: 'Priya Menon' },
  { id: 2, token: '#B112', name: 'Anjali Rao' },
  { id: 3, token: '#C089', name: 'Divya Krishnan' },
  { id: 4, token: '#D203', name: 'Meera Sharma' },
]

// ─── MOCK APPOINTMENTS ────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]
const MOCK_APPOINTMENTS = [
  { id: 1, clientToken: '#A047', clientName: 'Priya Menon', service: 'Bridal Makeup + Hair', staffId: 1, date: TODAY, time: '10:00', duration: 180, amount: 8500, status: 'serving', notes: 'Pre-bridal trial' },
  { id: 2, clientToken: '#B112', clientName: 'Anjali Rao', service: 'Keratin Treatment', staffId: 3, date: TODAY, time: '11:00', duration: 120, amount: 5500, status: 'confirmed', notes: '' },
  { id: 3, clientToken: '#C089', clientName: 'Divya Krishnan', service: 'Facial + Cleanup', staffId: 2, date: TODAY, time: '2:00', duration: 60, amount: 2800, status: 'booked', notes: 'First visit' },
  { id: 4, clientToken: '#D203', clientName: 'Meera Sharma', service: 'Hair Color — Balayage', staffId: 3, date: TODAY, time: '3:00', duration: 120, amount: 6500, status: 'booked', notes: '' },
  { id: 5, clientToken: '#A047', clientName: 'Priya Menon', service: 'Nail Art + Extensions', staffId: 4, date: TODAY, time: '4:30', duration: 90, amount: 3200, status: 'booked', notes: '' },
]

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.booked
  return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: c.bg, color: c.color, fontWeight: 500 }}>{c.label}</span>
}

// ─── BOOK APPOINTMENT MODAL ───────────────────────────────────────────────────
function BookModal({ onClose, onBook, sym }) {
  const [form, setForm] = useState({ clientId: '', service: '', staffId: '', date: TODAY, time: '10:00', notes: '' })
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const selectedService = SERVICES.find(s => s.name === form.service)
  const selectedClient = CLIENTS.find(c => c.id === Number(form.clientId))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.clientId || !form.service || !form.staffId) return
    onBook({
      id: Date.now(),
      clientToken: selectedClient.token,
      clientName: selectedClient.name,
      service: form.service,
      staffId: Number(form.staffId),
      date: form.date,
      time: form.time,
      duration: selectedService?.duration || 60,
      amount: selectedService?.price || 0,
      status: 'booked',
      notes: form.notes,
    })
    onClose()
  }

  return (
    <div style={Mo.overlay}>
      <div style={Mo.modal}>
        <div style={Mo.header}>
          <div style={Mo.title}>New Appointment</div>
          <button style={Mo.close} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={Mo.form}>
          <div style={Mo.field}>
            <label style={Mo.label}>Client *</label>
            <select style={Mo.input} value={form.clientId} onChange={e => up('clientId', e.target.value)} required>
              <option value="">Select client...</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.token} — {c.name}</option>)}
            </select>
            <div style={Mo.hint}>🛡 Staff will only see the client token, not the name</div>
          </div>
          <div style={Mo.field}>
            <label style={Mo.label}>Service *</label>
            <select style={Mo.input} value={form.service} onChange={e => up('service', e.target.value)} required>
              <option value="">Select service...</option>
              {SERVICES.map(s => <option key={s.name} value={s.name}>{s.name} — {sym}{s.price.toLocaleString()} ({s.duration} min)</option>)}
            </select>
          </div>
          <div style={Mo.field}>
            <label style={Mo.label}>Assign to Staff *</label>
            <select style={Mo.input} value={form.staffId} onChange={e => up('staffId', e.target.value)} required>
              <option value="">Select staff...</option>
              {STAFF.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={Mo.field}>
              <label style={Mo.label}>Date *</label>
              <input style={Mo.input} type="date" value={form.date} onChange={e => up('date', e.target.value)} required />
            </div>
            <div style={Mo.field}>
              <label style={Mo.label}>Time *</label>
              <select style={Mo.input} value={form.time} onChange={e => up('time', e.target.value)}>
                {HOURS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          {selectedService && (
            <div style={Mo.summaryBox}>
              <div style={Mo.summaryRow}><span>Service</span><span>{selectedService.name}</span></div>
              <div style={Mo.summaryRow}><span>Duration</span><span>{selectedService.duration} minutes</span></div>
              <div style={Mo.summaryRow}><span>Amount</span><span style={{ color: '#0F6E56', fontWeight: 500 }}>{sym}{selectedService.price.toLocaleString()}</span></div>
            </div>
          )}
          <div style={Mo.field}>
            <label style={Mo.label}>Notes</label>
            <textarea style={{ ...Mo.input, height: 60, resize: 'vertical' }} value={form.notes} onChange={e => up('notes', e.target.value)} placeholder="Any special instructions..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" style={Mo.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={Mo.submitBtn}>Book Appointment →</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── APPOINTMENT DETAIL PANEL ─────────────────────────────────────────────────
function ApptDetail({ appt, onClose, onStatusChange, sym }) {
  const staff = STAFF.find(s => s.id === appt.staffId)
  const statusOrder = ['booked', 'confirmed', 'serving', 'done']
  const currentIdx = statusOrder.indexOf(appt.status)

  return (
    <div style={Dt.overlay}>
      <div style={Dt.panel}>
        <div style={Dt.header}>
          <div>
            <div style={Dt.service}>{appt.service}</div>
            <div style={Dt.meta}>{appt.date} · {appt.time}</div>
          </div>
          <button style={Dt.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={Dt.progressBar}>
          {statusOrder.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ ...Dt.progressDot, background: i <= currentIdx ? STATUS_CONFIG[s].color : '#E8E0D8' }} />
              <div style={{ fontSize: 9, color: i <= currentIdx ? STATUS_CONFIG[s].color : '#B0A89F', fontWeight: i === currentIdx ? 600 : 400 }}>
                {STATUS_CONFIG[s].label}
              </div>
            </div>
          ))}
        </div>

        {/* Client token (masked) */}
        <div style={Dt.tokenBox}>
          <div style={Dt.tokenLabel}>🛡 Client (masked)</div>
          <div style={Dt.tokenVal}>{appt.clientToken}</div>
          <div style={Dt.clientName}>{appt.clientName}</div>
        </div>

        {/* Details */}
        <div style={Dt.detailGrid}>
          <div style={Dt.detailItem}><span style={Dt.detailKey}>Staff</span><span style={{ ...Dt.detailVal, color: staff?.color }}>{staff?.name}</span></div>
          <div style={Dt.detailItem}><span style={Dt.detailKey}>Role</span><span style={Dt.detailVal}>{staff?.role}</span></div>
          <div style={Dt.detailItem}><span style={Dt.detailKey}>Duration</span><span style={Dt.detailVal}>{appt.duration} min</span></div>
          <div style={Dt.detailItem}><span style={Dt.detailKey}>Amount</span><span style={{ ...Dt.detailVal, color: '#0F6E56' }}>{sym}{appt.amount.toLocaleString()}</span></div>
        </div>
        {appt.notes && <div style={Dt.notesBox}>📝 {appt.notes}</div>}

        {/* Status actions */}
        <div style={Dt.actionsTitle}>Update status</div>
        <div style={Dt.actions}>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <button key={key}
              style={{ ...Dt.actionBtn, background: appt.status === key ? val.bg : '#fff', color: appt.status === key ? val.color : '#6B6258', border: `0.5px solid ${appt.status === key ? val.color : '#E8E0D8'}` }}
              onClick={() => onStatusChange(appt.id, key)}>
              {val.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TIMELINE VIEW ────────────────────────────────────────────────────────────
function TimelineView({ appointments, onSelect, sym }) {
  return (
    <div style={T.wrap}>
      {/* Staff columns header */}
      <div style={T.header}>
        <div style={T.timeCol} />
        {STAFF.map(s => (
          <div key={s.id} style={{ ...T.staffCol, borderBottom: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: s.color }}>{s.name}</div>
            <div style={{ fontSize: 11, color: '#6B6258' }}>{s.role}</div>
          </div>
        ))}
      </div>

      {/* Time rows */}
      <div style={T.body}>
        {HOURS.map(hour => (
          <div key={hour} style={T.row}>
            <div style={T.timeLabel}>{hour}</div>
            {STAFF.map(staff => {
              const appt = appointments.find(a => a.staffId === staff.id && a.time === hour)
              return (
                <div key={staff.id} style={T.cell}>
                  {appt && (
                    <div style={{ ...T.apptBlock, background: staff.bg, borderLeft: `3px solid ${staff.color}` }}
                      onClick={() => onSelect(appt)}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: staff.color }}>{appt.clientToken}</div>
                      <div style={{ fontSize: 10, color: '#6B6258', marginTop: 2 }}>{appt.service.length > 18 ? appt.service.slice(0, 18) + '…' : appt.service}</div>
                      <StatusBadge status={appt.status} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Appointments() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS)
  const [view, setView] = useState('list') // list | timeline
  const [showBook, setShowBook] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState(TODAY)

  const filtered = appointments.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchDate = !filterDate || a.date === filterDate
    return matchStatus && matchDate
  })

  function handleBook(appt) { setAppointments(a => [...a, appt]) }
  function handleStatusChange(id, status) {
    setAppointments(a => a.map(ap => ap.id === id ? { ...ap, status } : ap))
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const todayAppts = appointments.filter(a => a.date === TODAY)
  const revenue = todayAppts.filter(a => a.status === 'done').reduce((s, a) => s + a.amount, 0)
  const serving = todayAppts.filter(a => a.status === 'serving').length

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Appointments</div>
          <div style={P.sub}>Dispatch, track and manage all bookings</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={P.viewToggle}>
            <button style={{ ...P.viewBtn, ...(view === 'list' ? P.viewBtnOn : {}) }} onClick={() => setView('list')}>List</button>
            <button style={{ ...P.viewBtn, ...(view === 'timeline' ? P.viewBtnOn : {}) }} onClick={() => setView('timeline')}>Timeline</button>
          </div>
          <button style={P.bookBtn} onClick={() => setShowBook(true)}>+ Book</button>
        </div>
      </div>

      {/* Stats */}
      <div style={P.statsRow}>
        {[
          { label: "Today's appointments", value: todayAppts.length, color: '#185FA5' },
          { label: 'Currently serving', value: serving, color: '#8B3A52' },
          { label: 'Completed today', value: todayAppts.filter(a => a.status === 'done').length, color: '#0F6E56' },
          { label: "Today's revenue", value: `${sym}${revenue.toLocaleString()}`, color: '#533AB7' },
        ].map(s => (
          <div key={s.label} style={P.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={P.filters}>
        <input type="date" style={P.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <div style={P.statusFilters}>
          <button style={{ ...P.fBtn, ...(filterStatus === 'all' ? P.fBtnOn : {}) }} onClick={() => setFilterStatus('all')}>All</button>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} style={{ ...P.fBtn, ...(filterStatus === k ? { background: v.bg, color: v.color, border: `0.5px solid ${v.color}` } : {}) }}
              onClick={() => setFilterStatus(k)}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div style={P.list}>
          {filtered.length === 0 && <div style={P.empty}>No appointments found</div>}
          {filtered.map(a => {
            const staff = STAFF.find(s => s.id === a.staffId)
            return (
              <div key={a.id} style={P.apptRow} onClick={() => setSelected(a)}>
                <div style={P.timeBlock}>
                  <div style={P.time}>{a.time}</div>
                  <div style={P.duration}>{a.duration}m</div>
                </div>
                <div style={{ ...P.staffDot, background: staff?.color }} />
                <div style={{ flex: 1 }}>
                  <div style={P.apptService}>{a.service}</div>
                  <div style={P.apptMeta}>
                    <span style={{ ...P.clientToken, background: staff?.bg, color: staff?.color }}>{a.clientToken}</span>
                    <span>✂️ {staff?.name}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={P.amount}>{sym}{a.amount.toLocaleString()}</div>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline view */}
      {view === 'timeline' && <TimelineView appointments={filtered} onSelect={setSelected} sym={sym} />}

      {showBook && <BookModal onClose={() => setShowBook(false)} onBook={handleBook} sym={sym} />}
      {selected && <ApptDetail appt={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} sym={sym} />}
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
  bookBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  viewToggle: { display: 'flex', background: MIST, borderRadius: 8, padding: 3 },
  viewBtn: { padding: '6px 14px', border: 'none', background: 'transparent', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: STONE, fontFamily: 'inherit', fontWeight: 500 },
  viewBtnOn: { background: '#fff', color: ROSE },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  filters: { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  dateInput: { padding: '7px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: INK },
  statusFilters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  fBtn: { padding: '5px 12px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 11, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  fBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { textAlign: 'center', color: '#B0A89F', padding: 40 },
  apptRow: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' },
  timeBlock: { textAlign: 'center', minWidth: 44 },
  time: { fontSize: 14, fontWeight: 500, color: INK },
  duration: { fontSize: 10, color: STONE },
  staffDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  apptService: { fontSize: 14, fontWeight: 500, color: INK, marginBottom: 4 },
  apptMeta: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: STONE },
  clientToken: { padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 },
  amount: { fontSize: 13, fontWeight: 500, color: '#0F6E56', marginBottom: 4 },
}

const T = {
  wrap: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, overflow: 'auto' },
  header: { display: 'flex', borderBottom: '0.5px solid #E8E0D8', position: 'sticky', top: 0, background: '#fff', zIndex: 2 },
  timeCol: { width: 56, flexShrink: 0 },
  staffCol: { flex: 1, padding: '12px 8px', textAlign: 'center', minWidth: 130 },
  body: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', borderBottom: '0.5px solid #F8F5F0', minHeight: 52 },
  timeLabel: { width: 56, flexShrink: 0, fontSize: 11, color: '#B0A89F', padding: '4px 6px', borderRight: '0.5px solid #F0EAE4', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 6 },
  cell: { flex: 1, padding: '3px', borderRight: '0.5px solid #F8F5F0', minWidth: 130 },
  apptBlock: { borderRadius: 8, padding: '6px 8px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: 3 },
}

const Dt = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  panel: { width: 400, background: '#fff', height: '100vh', overflowY: 'auto', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  service: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  meta: { fontSize: 12, color: STONE, marginTop: 3 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  progressBar: { display: 'flex', gap: 4, marginBottom: 20, padding: '12px 0', borderBottom: '0.5px solid #F0EAE4' },
  progressDot: { width: 10, height: 10, borderRadius: '50%', margin: '0 auto 4px' },
  tokenBox: { background: '#FDF0F3', borderRadius: 10, padding: '12px 14px', marginBottom: 14 },
  tokenLabel: { fontSize: 10, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  tokenVal: { fontSize: 20, fontWeight: 600, color: ROSE, fontFamily: 'monospace' },
  clientName: { fontSize: 12, color: STONE, marginTop: 2 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  detailItem: { background: MIST, borderRadius: 8, padding: '8px 10px' },
  detailKey: { fontSize: 10, color: '#B0A89F', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.3px' },
  detailVal: { fontSize: 13, fontWeight: 500, color: INK },
  notesBox: { background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#6B4C1A', marginBottom: 14 },
  actionsTitle: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  actionBtn: { padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
}

const Mo = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 500, boxShadow: '0 8px 48px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  close: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '9px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  hint: { fontSize: 11, color: ROSE, marginTop: 2 },
  summaryBox: { background: MIST, borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: INK },
  cancelBtn: { padding: '9px 18px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '9px 20px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
