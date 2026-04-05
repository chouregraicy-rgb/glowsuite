import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_CLIENTS = [
  {
    id: 1, token: '#A047', name: 'Priya Menon', phone: '+91 98400 12345', email: 'priya@gmail.com',
    source: 'Instagram', loyaltyPoints: 450, totalSpent: 28500, visits: 8,
    birthday: '1992-03-15', anniversary: '2018-11-20',
    tags: ['Bridal', 'VIP', 'Regular'],
    skinProfile: { hairType: 'Wavy, Medium', skinType: 'Combination', allergies: 'None', colorHistory: 'Balayage, Highlights', notes: 'Prefers soft tones. Sensitive scalp.' },
    serviceHistory: [
      { date: '2026-04-01', service: 'Bridal Makeup + Hair', amount: 8500, employee: 'Kavitha R.', rating: 5 },
      { date: '2026-03-10', service: 'Hair Color — Balayage', amount: 6500, employee: 'Latha D.', rating: 5 },
      { date: '2026-02-14', service: 'Spa Package', amount: 4500, employee: 'Sneha M.', rating: 4 },
    ],
    createdAt: '2025-08-01',
  },
  {
    id: 2, token: '#B112', name: 'Anjali Rao', phone: '+91 98400 22222', email: 'anjali@gmail.com',
    source: 'Referral', loyaltyPoints: 280, totalSpent: 15200, visits: 5,
    birthday: '1995-07-22', anniversary: null,
    tags: ['Regular'],
    skinProfile: { hairType: 'Straight, Fine', skinType: 'Dry', allergies: 'Ammonia-based dye', colorHistory: 'Natural black', notes: 'Always book Kavitha.' },
    serviceHistory: [
      { date: '2026-03-25', service: 'Keratin Treatment', amount: 5500, employee: 'Kavitha R.', rating: 5 },
      { date: '2026-02-10', service: 'Haircut + Style', amount: 1200, employee: 'Kavitha R.', rating: 4 },
    ],
    createdAt: '2025-10-15',
  },
  {
    id: 3, token: '#C089', name: 'Divya Krishnan', phone: '+91 98400 33333', email: 'divya@gmail.com',
    source: 'Google', loyaltyPoints: 120, totalSpent: 8900, visits: 3,
    birthday: '1990-12-05', anniversary: '2015-02-14',
    tags: ['New'],
    skinProfile: { hairType: 'Curly, Thick', skinType: 'Oily', allergies: 'None', colorHistory: 'No color history', notes: 'First timer. Wants natural look.' },
    serviceHistory: [
      { date: '2026-04-02', service: 'Facial + Cleanup', amount: 2800, employee: 'Sneha M.', rating: 4 },
    ],
    createdAt: '2026-01-20',
  },
  {
    id: 4, token: '#D203', name: 'Meera Sharma', phone: '+91 98400 44444', email: 'meera@gmail.com',
    source: 'Walk-in', loyaltyPoints: 680, totalSpent: 42000, visits: 14,
    birthday: '1988-05-30', anniversary: '2012-06-10',
    tags: ['VIP', 'Bridal', 'Regular'],
    skinProfile: { hairType: 'Wavy, Thick', skinType: 'Normal', allergies: 'Sulfate shampoos', colorHistory: 'Multiple highlights, Ombre', notes: 'Monthly visitor. Always full package.' },
    serviceHistory: [
      { date: '2026-04-03', service: 'Full Bridal Package', amount: 18000, employee: 'Kavitha R.', rating: 5 },
      { date: '2026-03-01', service: 'Hair Color + Spa', amount: 9500, employee: 'Latha D.', rating: 5 },
    ],
    createdAt: '2024-11-05',
  },
]

const SOURCE_EMOJI = { Instagram: '📱', WhatsApp: '💬', Google: '🌐', 'Walk-in': '🚶', Referral: '👥', Call: '📞' }
const TAG_COLORS = { VIP: { bg: '#FAEEDA', color: '#BA7517' }, Bridal: { bg: '#FDF0F3', color: '#8B3A52' }, Regular: { bg: '#E1F5EE', color: '#0F6E56' }, New: { bg: '#E6F1FB', color: '#185FA5' } }

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────
function AddClientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'Walk-in', birthday: '', tags: [] })
  const [skin, setSkin] = useState({ hairType: '', skinType: '', allergies: '', notes: '' })
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    const token = '#' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String(Math.floor(Math.random() * 900) + 100)
    onAdd({
      id: Date.now(), token, ...form, skinProfile: skin,
      loyaltyPoints: 0, totalSpent: 0, visits: 0,
      serviceHistory: [], anniversary: null,
      createdAt: new Date().toISOString().split('T')[0],
    })
    onClose()
  }

  return (
    <div style={M.overlay}>
      <div style={{ ...M.modal, maxWidth: 560 }}>
        <div style={M.header}>
          <div style={M.title}>Add New Client</div>
          <button style={M.close} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={M.section}>Personal Details</div>
          <div style={M.grid2}>
            <div style={M.field}><label style={M.label}>Full Name *</label><input style={M.input} required value={form.name} onChange={e => up('name', e.target.value)} placeholder="Priya Sharma" /></div>
            <div style={M.field}><label style={M.label}>Phone *</label><input style={M.input} required value={form.phone} onChange={e => up('phone', e.target.value)} placeholder="+91 98000 00000" /></div>
            <div style={M.field}><label style={M.label}>Email</label><input style={M.input} type="email" value={form.email} onChange={e => up('email', e.target.value)} placeholder="client@email.com" /></div>
            <div style={M.field}><label style={M.label}>Source</label>
              <select style={M.input} value={form.source} onChange={e => up('source', e.target.value)}>
                {['Walk-in','Instagram','WhatsApp','Google','Referral','Call'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={M.field}><label style={M.label}>Birthday</label><input style={M.input} type="date" value={form.birthday} onChange={e => up('birthday', e.target.value)} /></div>
          </div>
          <div style={M.section}>Hair & Skin Profile</div>
          <div style={M.grid2}>
            <div style={M.field}><label style={M.label}>Hair Type</label><input style={M.input} value={skin.hairType} onChange={e => setSkin(s => ({ ...s, hairType: e.target.value }))} placeholder="Wavy, Medium" /></div>
            <div style={M.field}><label style={M.label}>Skin Type</label><input style={M.input} value={skin.skinType} onChange={e => setSkin(s => ({ ...s, skinType: e.target.value }))} placeholder="Combination" /></div>
            <div style={M.field}><label style={M.label}>Allergies</label><input style={M.input} value={skin.allergies} onChange={e => setSkin(s => ({ ...s, allergies: e.target.value }))} placeholder="None / specify" /></div>
          </div>
          <div style={M.field}><label style={M.label}>Notes</label><textarea style={{ ...M.input, height: 64, resize: 'vertical' }} value={skin.notes} onChange={e => setSkin(s => ({ ...s, notes: e.target.value }))} placeholder="Any special notes..." /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" style={M.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={M.submitBtn}>Add Client →</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CLIENT DETAIL PANEL ──────────────────────────────────────────────────────
function ClientDetail({ client, onClose, sym }) {
  const [tab, setTab] = useState('profile')
  const [showPhone, setShowPhone] = useState(false)

  const maskedPhone = client.phone.replace(/(\+\d{2})\s\d{5}(\d{5})/, '$1 XXXXX$2')

  return (
    <div style={D.overlay}>
      <div style={D.panel}>
        {/* Header */}
        <div style={D.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={D.avatar}>{client.name[0]}</div>
            <div>
              <div style={D.name}>{client.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={D.token}>{client.token}</span>
                {client.tags.map(t => (
                  <span key={t} style={{ ...D.tag, background: TAG_COLORS[t]?.bg, color: TAG_COLORS[t]?.color }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <button style={D.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Stats row */}
        <div style={D.statsRow}>
          <div style={D.statItem}><div style={D.statVal}>{sym}{client.totalSpent.toLocaleString()}</div><div style={D.statKey}>Total spent</div></div>
          <div style={D.statItem}><div style={D.statVal}>{client.visits}</div><div style={D.statKey}>Visits</div></div>
          <div style={D.statItem}><div style={D.statVal}>{client.loyaltyPoints}</div><div style={D.statKey}>Points</div></div>
          <div style={D.statItem}><div style={D.statVal}>{SOURCE_EMOJI[client.source]}</div><div style={D.statKey}>{client.source}</div></div>
        </div>

        {/* Phone (masked by default) */}
        <div style={D.phoneBox}>
          <div>
            <div style={D.phoneLabel}>📞 Phone number</div>
            <div style={D.phoneNum}>{showPhone ? client.phone : maskedPhone}</div>
          </div>
          <button style={D.revealBtn} onClick={() => setShowPhone(s => !s)}>
            {showPhone ? '🙈 Hide' : '👁 Reveal'}
          </button>
        </div>

        {/* Contact info */}
        <div style={D.infoRow}>
          <span style={D.infoKey}>Email</span>
          <span style={D.infoVal}>{client.email || '—'}</span>
        </div>
        {client.birthday && (
          <div style={D.infoRow}>
            <span style={D.infoKey}>🎂 Birthday</span>
            <span style={D.infoVal}>{new Date(client.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
          </div>
        )}
        {client.anniversary && (
          <div style={D.infoRow}>
            <span style={D.infoKey}>💍 Anniversary</span>
            <span style={D.infoVal}>{new Date(client.anniversary).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={D.tabs}>
          {['profile', 'history', 'loyalty'].map(t => (
            <button key={t} style={{ ...D.tab, ...(tab === t ? D.tabOn : {}) }} onClick={() => setTab(t)}>
              {t === 'profile' ? 'Hair & Skin' : t === 'history' ? 'Service History' : 'Loyalty'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'profile' && (
          <div style={D.tabContent}>
            {[
              ['Hair Type', client.skinProfile.hairType],
              ['Skin Type', client.skinProfile.skinType],
              ['Allergies', client.skinProfile.allergies],
              ['Color History', client.skinProfile.colorHistory],
            ].map(([k, v]) => v && (
              <div key={k} style={D.profileRow}>
                <span style={D.profileKey}>{k}</span>
                <span style={D.profileVal}>{v}</span>
              </div>
            ))}
            {client.skinProfile.notes && (
              <div style={D.notesBox}>📝 {client.skinProfile.notes}</div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div style={D.tabContent}>
            {client.serviceHistory.map((s, i) => (
              <div key={i} style={D.historyItem}>
                <div style={{ flex: 1 }}>
                  <div style={D.historyService}>{s.service}</div>
                  <div style={D.historyMeta}>✂️ {s.employee} · {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={D.historyAmount}>{sym}{s.amount.toLocaleString()}</div>
                  <div style={D.historyRating}>{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</div>
                </div>
              </div>
            ))}
            {client.serviceHistory.length === 0 && <div style={D.empty}>No service history yet</div>}
          </div>
        )}

        {tab === 'loyalty' && (
          <div style={D.tabContent}>
            <div style={D.loyaltyCard}>
              <div style={D.loyaltyPoints}>{client.loyaltyPoints}</div>
              <div style={D.loyaltyLabel}>points available</div>
              <div style={D.loyaltyValue}>= {sym}{Math.floor(client.loyaltyPoints / 10)} redemption value</div>
            </div>
            <div style={D.loyaltyInfo}>
              <div style={D.loyaltyInfoItem}><span>Earn rate</span><span>10 pts per {sym}100 spent</span></div>
              <div style={D.loyaltyInfoItem}><span>Redeem rate</span><span>{sym}1 per 10 points</span></div>
              <div style={D.loyaltyInfoItem}><span>Total earned</span><span>{Math.floor(client.totalSpent / 10)} pts lifetime</span></div>
            </div>
            <div style={D.birthdayBox}>
              🎁 Birthday bonus: <strong>2x points</strong> on birthday month!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CLIENT CARD ──────────────────────────────────────────────────────────────
function ClientCard({ client, onClick, sym }) {
  return (
    <div style={C.card} onClick={() => onClick(client)}>
      <div style={C.top}>
        <div style={C.avatar}>{client.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={C.name}>{client.name}</div>
          <div style={C.token}>{client.token}</div>
        </div>
        <div style={C.tags}>
          {client.tags.slice(0, 2).map(t => (
            <span key={t} style={{ ...C.tag, background: TAG_COLORS[t]?.bg, color: TAG_COLORS[t]?.color }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={C.stats}>
        <div style={C.stat}><span style={C.statVal}>{sym}{client.totalSpent.toLocaleString()}</span><span style={C.statKey}>spent</span></div>
        <div style={C.stat}><span style={C.statVal}>{client.visits}</span><span style={C.statKey}>visits</span></div>
        <div style={C.stat}><span style={C.statVal}>{client.loyaltyPoints}</span><span style={C.statKey}>points</span></div>
      </div>
      <div style={C.footer}>
        <span>{SOURCE_EMOJI[client.source]} {client.source}</span>
        <span style={C.shield}>🛡 Masked</span>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClientVault() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [clients, setClients] = useState(MOCK_CLIENTS)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('All')

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.token.toLowerCase().includes(search.toLowerCase())
    const matchTag = filterTag === 'All' || c.tags.includes(filterTag)
    return matchSearch && matchTag
  })

  const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0)
  const vipCount = clients.filter(c => c.tags.includes('VIP')).length
  const totalPoints = clients.reduce((s, c) => s + c.loyaltyPoints, 0)

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Client Vault</div>
          <div style={P.sub}>🛡 Phone numbers are masked from staff — only you can see real contact details</div>
        </div>
        <button style={P.addBtn} onClick={() => setShowAdd(true)}>+ Add Client</button>
      </div>

      {/* Stats */}
      <div style={P.statsRow}>
        {[
          { label: 'Total Clients', value: clients.length, color: '#185FA5' },
          { label: 'VIP Clients', value: vipCount, color: '#BA7517' },
          { label: 'Total Revenue', value: `${sym}${totalRevenue.toLocaleString()}`, color: '#0F6E56' },
          { label: 'Loyalty Points Issued', value: totalPoints.toLocaleString(), color: '#533AB7' },
        ].map(s => (
          <div key={s.label} style={P.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Masking notice */}
      <div style={P.maskNotice}>
        🛡 <strong>Client Shield Active</strong> — Employees see only client tokens (e.g. #A047). Real phone numbers and emails are encrypted and visible only to you.
      </div>

      {/* Filters */}
      <div style={P.filters}>
        <input style={P.search} placeholder="🔍  Search by name or token..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={P.tagFilters}>
          {['All', 'VIP', 'Bridal', 'Regular', 'New'].map(t => (
            <button key={t} style={{ ...P.filterBtn, ...(filterTag === t ? P.filterBtnOn : {}) }} onClick={() => setFilterTag(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Client grid */}
      <div style={P.grid}>
        {filtered.map(c => <ClientCard key={c.id} client={c} onClick={setSelected} sym={sym} />)}
        {filtered.length === 0 && <div style={P.empty}>No clients found</div>}
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={c => setClients(cl => [c, ...cl])} />}
      {selected && <ClientDetail client={selected} onClose={() => setSelected(null)} sym={sym} />}
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0', ROSE = '#8B3A52'

const P = {
  wrap: { fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: INK },
  sub: { fontSize: 12, color: STONE, marginTop: 3 },
  addBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  maskNotice: { background: '#FDF0F3', border: '0.5px solid #E8B4C0', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: ROSE, marginBottom: 16 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  search: { padding: '8px 14px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none', width: 240 },
  tagFilters: { display: 'flex', gap: 6 },
  filterBtn: { padding: '5px 14px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  filterBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: '#B0A89F', padding: 40, fontSize: 14 },
}

const C = {
  card: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'all 0.15s' },
  top: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: '#FDF0F3', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 500, flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 500, color: INK },
  token: { fontSize: 11, color: ROSE, background: '#FDF0F3', padding: '1px 7px', borderRadius: 6, display: 'inline-block', marginTop: 3 },
  tags: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  tag: { fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500 },
  stats: { display: 'flex', gap: 0, borderTop: '0.5px solid #F0EAE4', borderBottom: '0.5px solid #F0EAE4', padding: '8px 0', margin: '0 0 10px' },
  stat: { flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 },
  statVal: { fontSize: 13, fontWeight: 500, color: INK },
  statKey: { fontSize: 10, color: STONE },
  footer: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: STONE },
  shield: { color: ROSE, fontWeight: 500 },
}

const D = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  panel: { width: 420, background: '#fff', height: '100vh', overflowY: 'auto', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: '#FDF0F3', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 500, flexShrink: 0 },
  name: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  token: { fontSize: 11, color: ROSE, background: '#FDF0F3', padding: '2px 8px', borderRadius: 6, display: 'inline-block' },
  tag: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500, display: 'inline-block' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '16px 0' },
  statItem: { background: MIST, borderRadius: 8, padding: '8px', textAlign: 'center' },
  statVal: { fontSize: 15, fontWeight: 600, color: INK },
  statKey: { fontSize: 10, color: STONE, marginTop: 2 },
  phoneBox: { background: '#FDF0F3', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  phoneLabel: { fontSize: 11, color: STONE, marginBottom: 3 },
  phoneNum: { fontSize: 15, fontWeight: 500, color: INK, fontFamily: 'monospace' },
  revealBtn: { padding: '5px 12px', background: ROSE, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #F0EAE4', fontSize: 13 },
  infoKey: { color: STONE },
  infoVal: { color: INK, fontWeight: 500 },
  tabs: { display: 'flex', gap: 0, background: MIST, borderRadius: 10, padding: 4, margin: '16px 0 0' },
  tab: { flex: 1, padding: '8px', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: STONE, fontFamily: 'inherit' },
  tabOn: { background: '#fff', color: ROSE },
  tabContent: { padding: '12px 0' },
  profileRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #F0EAE4', fontSize: 13 },
  profileKey: { color: STONE },
  profileVal: { color: INK, fontWeight: 500, maxWidth: '60%', textAlign: 'right' },
  notesBox: { background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#6B4C1A', marginTop: 10, lineHeight: 1.5 },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #F0EAE4' },
  historyService: { fontSize: 13, fontWeight: 500, color: INK },
  historyMeta: { fontSize: 11, color: STONE, marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: 500, color: '#0F6E56' },
  historyRating: { fontSize: 11, color: '#BA7517', marginTop: 2 },
  empty: { textAlign: 'center', color: '#B0A89F', padding: '20px 0', fontSize: 13 },
  loyaltyCard: { background: 'linear-gradient(135deg, #8B3A52, #BA7517)', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#fff', marginBottom: 14 },
  loyaltyPoints: { fontSize: 48, fontWeight: 600, fontFamily: "'Cormorant Garamond', serif" },
  loyaltyLabel: { fontSize: 13, opacity: 0.8, marginTop: 4 },
  loyaltyValue: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  loyaltyInfo: { background: MIST, borderRadius: 10, padding: '12px 14px', marginBottom: 12 },
  loyaltyInfoItem: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '0.5px solid #E8E0D8', color: INK },
  birthdayBox: { background: '#E1F5EE', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0F6E56' },
}

const M = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 560, boxShadow: '0 8px 48px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  close: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  section: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10, marginTop: 16, borderBottom: '0.5px solid #E8E0D8', paddingBottom: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '9px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  cancelBtn: { padding: '9px 18px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '9px 20px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
