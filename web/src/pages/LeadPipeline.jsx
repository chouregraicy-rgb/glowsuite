import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'new', label: 'New', color: '#185FA5', bg: '#E6F1FB' },
  { id: 'contacted', label: 'Contacted', color: '#BA7517', bg: '#FAEEDA' },
  { id: 'appointment_set', label: 'Appt Set', color: '#8B3A52', bg: '#FDF0F3' },
  { id: 'serving', label: 'Serving', color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'done', label: 'Done', color: '#3B6D11', bg: '#EAF3DE' },
  { id: 'follow_up', label: 'Follow Up', color: '#854F0B', bg: '#FAEEDA' },
  { id: 'converted', label: 'Converted', color: '#533AB7', bg: '#EEEDFE' },
]

const SOURCES = ['WhatsApp', 'Instagram', 'Google', 'Walk-in', 'Referral', 'Call', 'Facebook', 'Other']
const SOURCE_EMOJI = { WhatsApp: '💬', Instagram: '📱', Google: '🌐', 'Walk-in': '🚶', Referral: '👥', Call: '📞', Facebook: '👤', Other: '✨' }

const SERVICES = ['Hair Color', 'Bridal Package', 'Haircut + Style', 'Makeup', 'Facial', 'Nail Art', 'Spa Package', 'Keratin', 'Custom Package', 'Consultation']

const INITIAL_LEADS = [
  { id: 1, name: 'Anjali Rao', phone: '+91 98400 11111', source: 'Instagram', status: 'new', service: 'Bridal Package', notes: 'Interested in Dec wedding package', amount: null, createdAt: '2026-04-04T08:00:00', timeline: [{ action: 'Lead created from Instagram DM', at: '8:00 AM', by: 'Owner' }] },
  { id: 2, name: 'Divya Krishnan', phone: '+91 98400 22222', source: 'WhatsApp', status: 'new', service: 'Hair Color', notes: 'Asked about balayage pricing', amount: null, createdAt: '2026-04-04T09:30:00', timeline: [{ action: 'Lead created via WhatsApp', at: '9:30 AM', by: 'Owner' }] },
  { id: 3, name: 'Meera Sharma', phone: '+91 98400 33333', source: 'Google', status: 'contacted', service: 'Facial', notes: 'Called back, interested in Sunday slot', amount: null, createdAt: '2026-04-04T10:00:00', timeline: [{ action: 'Lead created from Google search', at: '10:00 AM', by: 'Owner' }, { action: 'Called client — interested in Sunday', at: '10:30 AM', by: 'Owner' }] },
  { id: 4, name: 'Priya Nair', phone: '+91 98400 44444', source: 'Referral', status: 'contacted', service: 'Bridal Package', notes: 'Referred by Anjali (prev client)', amount: null, createdAt: '2026-04-04T10:15:00', timeline: [{ action: 'Referral lead from existing client', at: '10:15 AM', by: 'Owner' }, { action: 'WhatsApp sent — awaiting reply', at: '11:00 AM', by: 'Owner' }] },
  { id: 5, name: 'Sneha Menon', phone: '+91 98400 55555', source: 'Walk-in', status: 'appointment_set', service: 'Keratin', notes: 'Appointment set for Sat 3pm', amount: null, createdAt: '2026-04-04T11:00:00', timeline: [{ action: 'Walk-in enquiry', at: '11:00 AM', by: 'Owner' }, { action: 'Appointment booked — Sat 3:00 PM', at: '11:15 AM', by: 'Owner' }] },
  { id: 6, name: 'Lakshmi Pillai', phone: '+91 98400 66666', source: 'Instagram', status: 'serving', service: 'Spa Package', notes: 'Currently being served by Kavitha', amount: 3500, createdAt: '2026-04-03T14:00:00', timeline: [{ action: 'Instagram DM enquiry', at: 'Yesterday 2PM', by: 'Owner' }, { action: 'Appointment confirmed', at: 'Yesterday 3PM', by: 'Owner' }, { action: 'Service started', at: '1:30 PM today', by: 'Kavitha' }] },
  { id: 7, name: 'Nisha Balan', phone: '+91 98400 77777', source: 'Call', status: 'done', service: 'Hair Color', notes: 'Loved the result! Wants monthly visit', amount: 2800, createdAt: '2026-04-03T10:00:00', timeline: [{ action: 'Phone enquiry', at: 'Yesterday 10AM', by: 'Owner' }, { action: 'Appointment confirmed', at: 'Yesterday 11AM', by: 'Owner' }, { action: 'Service completed — happy client!', at: '12:00 PM', by: 'Sneha' }] },
  { id: 8, name: 'Ritu Desai', phone: '+91 98400 88888', source: 'WhatsApp', status: 'follow_up', service: 'Bridal Package', notes: 'Quoted ₹45k, thinking about it', amount: 45000, createdAt: '2026-04-02T09:00:00', timeline: [{ action: 'WhatsApp enquiry for bridal', at: '2 days ago', by: 'Owner' }, { action: 'Quotation sent — ₹45,000', at: '2 days ago', by: 'Owner' }, { action: 'Follow-up scheduled for Monday', at: 'Yesterday', by: 'Owner' }] },
  { id: 9, name: 'Ananya Iyer', phone: '+91 98400 99999', source: 'Google', status: 'converted', service: 'Bridal Package', notes: 'Paid advance ₹10k. Wedding Dec 15', amount: 65000, createdAt: '2026-04-01T10:00:00', timeline: [{ action: 'Google search enquiry', at: '3 days ago', by: 'Owner' }, { action: 'Bridal consultation done', at: '2 days ago', by: 'Owner' }, { action: 'Advance paid ₹10,000 — CONVERTED!', at: 'Yesterday', by: 'Owner' }] },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getStage(id) { return STAGES.find(s => s.id === id) || STAGES[0] }

function StageTag({ status, small }) {
  const s = getStage(status)
  return (
    <span style={{ fontSize: small ? 10 : 11, padding: small ? '2px 7px' : '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

// ─── ADD LEAD MODAL ───────────────────────────────────────────────────────────
function AddLeadModal({ onClose, onAdd, currencySymbol }) {
  const [form, setForm] = useState({ name: '', phone: '', source: 'WhatsApp', service: '', notes: '' })
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.source) return
    onAdd({
      id: Date.now(),
      ...form,
      status: 'new',
      amount: null,
      createdAt: new Date().toISOString(),
      timeline: [{ action: `Lead created — source: ${form.source}`, at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), by: 'Owner' }]
    })
    onClose()
  }

  return (
    <div style={M.overlay}>
      <div style={M.modal}>
        <div style={M.modalHeader}>
          <div style={M.modalTitle}>Add New Lead</div>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={M.form}>
          <div style={M.row}>
            <div style={M.field}>
              <label style={M.label}>Client Name *</label>
              <input style={M.input} placeholder="Priya Sharma" value={form.name} onChange={e => up('name', e.target.value)} required />
            </div>
            <div style={M.field}>
              <label style={M.label}>Phone Number</label>
              <input style={M.input} placeholder="+91 98000 00000" value={form.phone} onChange={e => up('phone', e.target.value)} />
            </div>
          </div>
          <div style={M.row}>
            <div style={M.field}>
              <label style={M.label}>Lead Source *</label>
              <select style={M.input} value={form.source} onChange={e => up('source', e.target.value)}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={M.field}>
              <label style={M.label}>Interested Service</label>
              <select style={M.input} value={form.service} onChange={e => up('service', e.target.value)}>
                <option value="">Select service...</option>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={M.field}>
            <label style={M.label}>Notes</label>
            <textarea style={{ ...M.input, height: 72, resize: 'vertical' }} placeholder="Any details about the enquiry..." value={form.notes} onChange={e => up('notes', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={M.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={M.submitBtn}>Add Lead →</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── LEAD DETAIL PANEL ────────────────────────────────────────────────────────
function LeadDetail({ lead, onClose, onUpdate, currencySymbol }) {
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState(lead.amount || '')

  function moveStage(direction) {
    const idx = STAGES.findIndex(s => s.id === lead.status)
    const next = STAGES[idx + direction]
    if (!next) return
    const entry = { action: `Status moved to "${next.label}"`, at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), by: 'Owner' }
    onUpdate(lead.id, { status: next.id, timeline: [...lead.timeline, entry] })
  }

  function addNote() {
    if (!note.trim()) return
    const entry = { action: note.trim(), at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), by: 'Owner' }
    onUpdate(lead.id, { timeline: [...lead.timeline, entry] })
    setNote('')
  }

  function saveAmount() {
    onUpdate(lead.id, { amount: Number(amount) })
  }

  const stageIdx = STAGES.findIndex(s => s.id === lead.status)

  return (
    <div style={D.panel}>
      <div style={D.header}>
        <div>
          <div style={D.name}>{lead.name}</div>
          <div style={D.meta}>{SOURCE_EMOJI[lead.source]} {lead.source} · {lead.service || 'No service set'}</div>
        </div>
        <button style={D.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Stage progress */}
      <div style={D.stageBar}>
        {STAGES.map((s, i) => (
          <div key={s.id} style={{ ...D.stageDot, background: i <= stageIdx ? s.color : '#E8E0D8' }}
            title={s.label} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <StageTag status={lead.status} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={D.moveBtn} onClick={() => moveStage(-1)} disabled={stageIdx === 0}>← Back</button>
          <button style={{ ...D.moveBtn, background: '#8B3A52', color: '#fff' }} onClick={() => moveStage(1)} disabled={stageIdx === STAGES.length - 1}>Next →</button>
        </div>
      </div>

      {/* Info */}
      <div style={D.infoGrid}>
        <div style={D.infoItem}><span style={D.infoKey}>Phone</span><span style={D.infoVal}>{lead.phone || '—'}</span></div>
        <div style={D.infoItem}><span style={D.infoKey}>Service</span><span style={D.infoVal}>{lead.service || '—'}</span></div>
        <div style={D.infoItem}><span style={D.infoKey}>Created</span><span style={D.infoVal}>{new Date(lead.createdAt).toLocaleDateString()}</span></div>
        <div style={D.infoItem}>
          <span style={D.infoKey}>Amount ({currencySymbol})</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input style={{ ...D.miniInput }} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            <button style={D.saveBtn} onClick={saveAmount}>Save</button>
          </div>
        </div>
      </div>

      {/* Notes */}
      {lead.notes && <div style={D.notesBox}>{lead.notes}</div>}

      {/* Timeline */}
      <div style={D.timelineTitle}>Activity timeline</div>
      <div style={D.timeline}>
        {lead.timeline.map((t, i) => (
          <div key={i} style={D.timelineItem}>
            <div style={D.timelineDot} />
            <div style={{ flex: 1 }}>
              <div style={D.timelineAction}>{t.action}</div>
              <div style={D.timelineMeta}>{t.at} · {t.by}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add note */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input style={{ ...D.miniInput, flex: 1 }} placeholder="Add a note or update..." value={note} onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()} />
        <button style={{ ...D.saveBtn, padding: '8px 14px' }} onClick={addNote}>Add</button>
      </div>
    </div>
  )
}

// ─── KANBAN CARD ─────────────────────────────────────────────────────────────
function LeadCard({ lead, onClick, sym }) {
  return (
    <div style={K.card} onClick={() => onClick(lead)}>
      <div style={K.cardTop}>
        <div style={K.avatar}>{lead.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={K.name}>{lead.name}</div>
          <div style={K.source}>{SOURCE_EMOJI[lead.source]} {lead.source}</div>
        </div>
      </div>
      {lead.service && <div style={K.service}>{lead.service}</div>}
      {lead.amount && <div style={K.amount}>{sym}{lead.amount.toLocaleString()}</div>}
      <div style={K.time}>{new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LeadPipeline() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '$'
  const [leads, setLeads] = useState(INITIAL_LEADS)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filterSource, setFilterSource] = useState('All')
  const [search, setSearch] = useState('')

  function addLead(lead) {
    setLeads(l => [lead, ...l])
  }

  function updateLead(id, updates) {
    setLeads(l => l.map(lead => lead.id === id ? { ...lead, ...updates } : lead))
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }))
  }

  const filtered = leads.filter(l => {
    const matchSrc = filterSource === 'All' || l.source === filterSource
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.service?.toLowerCase().includes(search.toLowerCase())
    return matchSrc && matchSearch
  })

  // Stats
  const totalRevenue = leads.filter(l => l.amount).reduce((s, l) => s + l.amount, 0)
  const converted = leads.filter(l => l.status === 'converted').length
  const hotLeads = leads.filter(l => ['appointment_set', 'serving'].includes(l.status)).length

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Lead Pipeline</div>
          <div style={P.sub}>Track every enquiry from first contact to conversion</div>
        </div>
        <button style={P.addBtn} onClick={() => setShowAdd(true)}>+ Add Lead</button>
      </div>

      {/* Summary stats */}
      <div style={P.summaryRow}>
        {[
          { label: 'Total Leads', value: leads.length, color: '#185FA5' },
          { label: 'Hot Leads', value: hotLeads, color: '#8B3A52' },
          { label: 'Converted', value: converted, color: '#3B6D11' },
          { label: 'Pipeline Value', value: `${sym}${totalRevenue.toLocaleString()}`, color: '#533AB7' },
        ].map(s => (
          <div key={s.label} style={P.summaryCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={P.filters}>
        <input style={P.search} placeholder="🔍  Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={P.sourceFilters}>
          {['All', ...SOURCES].map(s => (
            <button key={s} style={{ ...P.filterBtn, ...(filterSource === s ? P.filterBtnOn : {}) }}
              onClick={() => setFilterSource(s)}>
              {s !== 'All' && SOURCE_EMOJI[s]} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div style={P.board}>
        {STAGES.map(stage => {
          const stageLeads = filtered.filter(l => l.status === stage.id)
          return (
            <div key={stage.id} style={P.column}>
              <div style={P.colHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ ...P.colDot, background: stage.color }} />
                  <span style={P.colTitle}>{stage.label}</span>
                </div>
                <span style={{ ...P.colCount, background: stage.bg, color: stage.color }}>{stageLeads.length}</span>
              </div>
              <div style={P.cards}>
                {stageLeads.length === 0 && (
                  <div style={P.emptyCol}>No leads</div>
                )}
                {stageLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onClick={setSelected} sym={sym} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add lead modal */}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={addLead} currencySymbol={sym} />}

      {/* Lead detail panel */}
      {selected && (
        <div style={D.overlay}>
          <LeadDetail lead={selected} onClose={() => setSelected(null)} onUpdate={updateLead} currencySymbol={sym} />
        </div>
      )}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0', ROSE = '#8B3A52'

const P = {
  wrap: { padding: '0', fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: INK },
  sub: { fontSize: 13, color: STONE, marginTop: 2 },
  addBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 },
  summaryCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  filters: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  search: { padding: '8px 14px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none', width: 220 },
  sourceFilters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: { padding: '5px 12px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 11, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  filterBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  board: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' },
  column: { flex: '0 0 200px', background: MIST, borderRadius: 12, padding: '10px 8px', minHeight: 300 },
  colHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', marginBottom: 10 },
  colDot: { width: 8, height: 8, borderRadius: '50%' },
  colTitle: { fontSize: 12, fontWeight: 500, color: INK },
  colCount: { fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 500 },
  cards: { display: 'flex', flexDirection: 'column', gap: 8 },
  emptyCol: { textAlign: 'center', fontSize: 11, color: '#C0B8B0', padding: '20px 0' },
}

const K = {
  card: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px', cursor: 'pointer', transition: 'all 0.15s' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: '#FDF0F3', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 },
  name: { fontSize: 13, fontWeight: 500, color: INK, lineHeight: 1.3 },
  source: { fontSize: 11, color: STONE, marginTop: 1 },
  service: { fontSize: 11, color: '#8B3A52', background: '#FDF0F3', padding: '2px 7px', borderRadius: 6, display: 'inline-block', marginBottom: 4 },
  amount: { fontSize: 12, fontWeight: 500, color: '#0F6E56', marginTop: 4 },
  time: { fontSize: 10, color: '#B0A89F', marginTop: 6 },
}

const D = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  panel: { width: 400, background: '#fff', height: '100vh', overflowY: 'auto', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  name: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  meta: { fontSize: 12, color: STONE, marginTop: 3 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE, padding: 4 },
  stageBar: { display: 'flex', gap: 4, marginBottom: 8 },
  stageDot: { flex: 1, height: 4, borderRadius: 2, transition: 'background 0.3s' },
  moveBtn: { padding: '6px 12px', border: '0.5px solid #E8E0D8', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', background: '#fff', color: INK },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' },
  infoItem: { background: MIST, borderRadius: 8, padding: '8px 10px' },
  infoKey: { fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 3 },
  infoVal: { fontSize: 13, color: INK, fontWeight: 500 },
  miniInput: { padding: '6px 10px', border: '0.5px solid #E8E0D8', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', width: '100%' },
  saveBtn: { padding: '6px 12px', background: ROSE, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  notesBox: { background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#6B4C1A', marginBottom: 16, lineHeight: 1.5 },
  timelineTitle: { fontSize: 11, fontWeight: 500, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' },
  timelineDot: { width: 8, height: 8, borderRadius: '50%', background: ROSE, flexShrink: 0, marginTop: 4 },
  timelineAction: { fontSize: 13, color: INK, lineHeight: 1.4 },
  timelineMeta: { fontSize: 11, color: '#B0A89F', marginTop: 2 },
}

const M = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 16, padding: '28px 28px', width: '100%', maxWidth: 520, boxShadow: '0 8px 48px rgba(0,0,0,0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '9px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  cancelBtn: { padding: '9px 18px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '9px 20px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
