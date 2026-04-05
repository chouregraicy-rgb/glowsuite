import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LeadPipeline from './LeadPipeline'
import ClientVault from './ClientVault'
import Appointments from './Appointments'
import ServiceCatalog from './ServiceCatalog'
import StaffManager from './StaffManager'
import Billing from './Billing'
import BridalTimeline from './BridalTimeline'
import Reports from './Reports'
import Inventory from './Inventory'
// ─── ICONS (inline SVG) ──────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  clients: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  leads: "M18 20V10M12 20V4M6 20v-6",
  appointments: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  staff: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  billing: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  inventory: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16",
  reports: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  signout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  clock: "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  trending: "M23 6l-9.5 9.5-5-5L1 18",
}

// ─── NAV ITEMS ───────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'leads', label: 'Lead Pipeline', icon: 'leads' },
  { id: 'appointments', label: 'Appointments', icon: 'appointments' },
  { id: 'clients', label: 'Client Vault', icon: 'shield' },
  { id: 'staff', label: 'Staff', icon: 'staff' },
  { id: 'billing', label: 'Billing', icon: 'billing' },
  { id: 'inventory', label: 'Inventory', icon: 'inventory' },
  { id: 'bridal', label: 'Bridal 👑', icon: 'shield' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

// ─── MOCK DATA (replaced by Supabase queries later) ──────────────────────────
const MOCK_STATS = (sym) => [
  { label: "Today's Revenue", value: `${sym}14,820`, change: '+12%', up: true },
  { label: 'Clients Served', value: '23', change: '+3 walk-ins', up: true },
  { label: 'Open Leads', value: '11', change: '4 hot leads', up: true },
  { label: 'Staff on Duty', value: '5/6', change: '1 absent', up: false },
]

const MOCK_APPOINTMENTS = [
  { token: '#A047', service: 'Bridal Makeup + Hair', employee: 'Kavitha R.', time: '11:00 AM', status: 'serving' },
  { token: '#B112', service: 'Custom Package — Glow', employee: 'Sneha M.', time: '1:30 PM', status: 'confirmed' },
  { token: '#C089', service: 'Consult + Color', employee: 'Latha D.', time: '3:00 PM', status: 'booked' },
  { token: '#A051', service: 'Bridal Registry — Trial', employee: 'Kavitha R.', time: '4:30 PM', status: 'booked' },
  { token: '#D203', service: 'Nail Art + Extensions', employee: 'Bindhu P.', time: '5:00 PM', status: 'confirmed' },
]

const MOCK_LEADS = [
  { name: 'Anjali R.', source: 'Instagram', status: 'new', time: '10 min ago' },
  { name: 'Divya K.', source: 'WhatsApp', status: 'contacted', time: '1 hr ago' },
  { name: 'Sneha T.', source: 'Walk-in', status: 'booked', time: '2 hrs ago' },
  { name: 'Pooja V.', source: 'Google', status: 'serving', time: 'Now' },
  { name: 'Ritu S.', source: 'Referral', status: 'done', time: 'Today' },
]

const MOCK_STAFF = [
  { name: 'Kavitha R.', role: 'Senior Stylist', status: 'busy', clients: 3, earnings: '₹2,400' },
  { name: 'Sneha M.', role: 'Makeup Artist', status: 'available', clients: 2, earnings: '₹1,800' },
  { name: 'Latha D.', role: 'Hair Specialist', status: 'busy', clients: 2, earnings: '₹1,600' },
  { name: 'Bindhu P.', role: 'Nail Tech', status: 'available', clients: 1, earnings: '₹900' },
  { name: 'Preethi K.', role: 'Skin Therapist', status: 'break', clients: 0, earnings: '₹600' },
]

const SOURCE_EMOJI = { Instagram: '📱', WhatsApp: '💬', 'Walk-in': '🚶', Google: '🌐', Referral: '👥', Call: '📞' }
const STATUS_COLORS = {
  new: { bg: '#E6F1FB', color: '#185FA5' },
  contacted: { bg: '#FAEEDA', color: '#BA7517' },
  booked: { bg: '#E1F5EE', color: '#0F6E56' },
  serving: { bg: '#FDF0F3', color: '#8B3A52' },
  done: { bg: '#F1EFE8', color: '#5F5E5A' },
  confirmed: { bg: '#E1F5EE', color: '#0F6E56' },
  available: { bg: '#E1F5EE', color: '#0F6E56' },
  busy: { bg: '#FDF0F3', color: '#8B3A52' },
  break: { bg: '#FAEEDA', color: '#BA7517' },
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, up, delay }) {
  return (
    <div style={{ ...S.statCard, animationDelay: `${delay}ms` }} className="fadeUp">
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      <div style={{ ...S.statChange, color: up ? '#0F6E56' : '#993C1D' }}>
        {up ? '↑' : '↓'} {change}
      </div>
    </div>
  )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.new
  return (
    <span style={{ ...S.badge, background: c.bg, color: c.color }}>
      {status}
    </span>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile, signOut, currencySymbol } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [time, setTime] = useState(new Date())

  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const salonName = profile?.salons?.name || 'Your Salon'
  const ownerName = profile?.name || 'Owner'

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const stats = MOCK_STATS(sym)

  return (
    <div style={S.app}>
      {/* ── SIDEBAR ── */}
      <aside style={{ ...S.sidebar, width: sidebarOpen ? 240 : 64 }}>
        {/* Brand */}
        <div style={S.brand} onClick={() => setSidebarOpen(o => !o)}>
          <div style={S.brandLogo}>G</div>
          {sidebarOpen && <div style={S.brandName}>GlowSuite</div>}
        </div>

        {/* Salon info */}
        {sidebarOpen && (
          <div style={S.salonInfo}>
            <div style={S.salonName}>{salonName}</div>
            <div style={S.salonOwner}>{ownerName} · Owner</div>
          </div>
        )}

        <div style={S.navDivider} />

        {/* Nav */}
        <nav style={S.nav}>
          {NAV.map(item => (
            <button key={item.id}
              style={{ ...S.navItem, ...(active === item.id ? S.navItemActive : {}) }}
              onClick={() => setActive(item.id)}
              title={!sidebarOpen ? item.label : ''}>
              <span style={{ color: active === item.id ? '#8B3A52' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                <Icon d={ICONS[item.icon]} size={18} />
              </span>
              {sidebarOpen && <span style={S.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <button style={S.signOutBtn} onClick={handleSignOut} title="Sign out">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}><Icon d={ICONS.signout} size={18} /></span>
          {sidebarOpen && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Sign Out</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          <div>
            <div style={S.pageTitle}>
              {NAV.find(n => n.id === active)?.label || 'Dashboard'}
            </div>
            <div style={S.pageDate}>
              {time.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={S.notifBtn}><Icon d={ICONS.bell} size={18} /></div>
            <button style={S.addBtn} onClick={() => setActive('appointments')}>
              <Icon d={ICONS.plus} size={16} /> New Appointment
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={S.content}>

          {active === 'dashboard' && (
            <>
              {/* Stats */}
              <div style={S.statsGrid}>
                {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 80} />)}
              </div>

              <div style={S.twoCol}>
                {/* Today's Appointments */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <div style={S.cardTitle}>Today's appointments</div>
                    <button style={S.linkBtn} onClick={() => setActive('appointments')}>View all →</button>
                  </div>
                  {MOCK_APPOINTMENTS.map(a => (
                    <div key={a.token} style={S.apptRow}>
                      <div style={S.apptToken}>{a.token}</div>
                      <div style={{ flex: 1 }}>
                        <div style={S.apptService}>{a.service}</div>
                        <div style={S.apptEmployee}>✂️ {a.employee}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={S.apptTime}>{a.time}</div>
                        <Badge status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lead Activity */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <div style={S.cardTitle}>Lead activity</div>
                    <button style={S.linkBtn} onClick={() => setActive('leads')}>Pipeline →</button>
                  </div>
                  {MOCK_LEADS.map(l => (
                    <div key={l.name} style={S.leadRow}>
                      <div style={S.leadAvatar}>{l.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={S.leadName}>{l.name}</div>
                        <div style={S.leadSource}>{SOURCE_EMOJI[l.source]} {l.source}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Badge status={l.status} />
                        <div style={S.leadTime}>{l.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Overview */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}>Staff on duty today</div>
                  <button style={S.linkBtn} onClick={() => setActive('staff')}>Manage staff →</button>
                </div>
                <div style={S.staffGrid}>
                  {MOCK_STAFF.map(emp => (
                    <div key={emp.name} style={S.staffCard}>
                      <div style={S.staffAvatar}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={S.staffName}>{emp.name}</div>
                      <div style={S.staffRole}>{emp.role}</div>
                      <Badge status={emp.status} />
                      <div style={S.staffStats}>
                        <span>{emp.clients} clients</span>
                        <span style={{ color: '#0F6E56', fontWeight: 500 }}>{emp.earnings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div style={S.quickGrid}>
                {[
                  { label: 'Add New Client', icon: '🛡', desc: 'Register with phone masking', page: 'clients' },
                  { label: 'New Lead', icon: '📊', desc: 'Capture from any source', page: 'leads' },
                  { label: 'Create Invoice', icon: '💳', desc: 'Bill & collect payment', page: 'billing' },
                  { label: 'Bridal Booking', icon: '👑', desc: 'Full bridal timeline', page: 'appointments' },
                ].map(q => (
                  <button key={q.label} style={S.quickCard} onClick={() => setActive(q.page)}>
                    <span style={{ fontSize: 24 }}>{q.icon}</span>
                    <div style={S.quickLabel}>{q.label}</div>
                    <div style={S.quickDesc}>{q.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── OTHER PAGES (placeholders) ── */}
          {active === 'leads' && <LeadPipeline />}
          {active === 'clients' && <ClientVault />}
          {active === 'appointments' && <Appointments />}
          {active === 'settings' && <ServiceCatalog />}
          {active === 'staff' && <StaffManager />}
          {active === 'billing' && <Billing />}
          {active === 'bridal' && <BridalTimeline />}
          {active === 'reports' && <Reports />}
          {active === 'inventory' && <Inventory />}
          {active !== 'dashboard' && active !== 'leads' && active !== 'clients' && active !== 'appointments' && active !== 'settings' && active !== 'staff' && active !== 'billing' && active !== 'bridal' && active !== 'reports' &&  active !== 'inventory' && (
            <div style={S.placeholder}>
              <div style={S.placeholderIcon}>
                <Icon d={ICONS[NAV.find(n => n.id === active)?.icon || 'dashboard']} size={40} />
              </div>
              <div style={S.placeholderTitle}>
                {NAV.find(n => n.id === active)?.label}
              </div>
              <div style={S.placeholderSub}>
                This module is being built. It will include full {NAV.find(n => n.id === active)?.label.toLowerCase()} functionality connected to Supabase.
              </div>
              <button style={S.addBtn} onClick={() => setActive('dashboard')}>
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fadeUp { animation: fadeUp 0.4s ease forwards; opacity: 0; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ROSE = '#8B3A52', INK = '#1A1208', MIST = '#F8F5F0', STONE = '#6B6258'

const S = {
  app: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: MIST },

  // Sidebar
  sidebar: { background: '#1A1208', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.25s ease', overflow: 'hidden', position: 'sticky', top: 0, height: '100vh' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  brandLogo: { width: 32, height: 32, borderRadius: 8, background: '#8B3A52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5DFA0', fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, flexShrink: 0 },
  brandName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: '#F5DFA0', whiteSpace: 'nowrap' },
  salonInfo: { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  salonName: { fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  salonOwner: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  navDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' },
  nav: { flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left' },
  navItemActive: { background: 'rgba(139,58,82,0.2)' },
  navLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', fontWeight: 400 },
  signOutBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', border: 'none', background: 'transparent', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.06)' },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { background: '#fff', borderBottom: '0.5px solid #E8E0D8', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  pageTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  pageDate: { fontSize: 12, color: STONE, marginTop: 1 },
  notifBtn: { width: 36, height: 36, borderRadius: 8, border: '0.5px solid #E8E0D8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: STONE, background: '#fff' },
  addBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  // Content
  content: { flex: 1, padding: '24px 28px', overflowY: 'auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '16px 18px' },
  statLabel: { fontSize: 11, color: STONE, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 },
  statValue: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: INK, lineHeight: 1 },
  statChange: { fontSize: 11, marginTop: 6, fontWeight: 500 },

  // Two col
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, padding: '18px 20px', marginBottom: 0 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: INK },
  linkBtn: { fontSize: 12, color: ROSE, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },

  // Appointments
  apptRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F0EAE4' },
  apptToken: { fontSize: 12, fontWeight: 500, color: '#8B3A52', background: '#FDF0F3', padding: '3px 8px', borderRadius: 6, flexShrink: 0 },
  apptService: { fontSize: 13, color: INK, fontWeight: 400 },
  apptEmployee: { fontSize: 11, color: STONE, marginTop: 2 },
  apptTime: { fontSize: 12, color: STONE, marginBottom: 4 },

  // Leads
  leadRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F0EAE4' },
  leadAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#FDF0F3', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, flexShrink: 0 },
  leadName: { fontSize: 13, color: INK },
  leadSource: { fontSize: 11, color: STONE, marginTop: 1 },
  leadTime: { fontSize: 10, color: '#B0A89F', marginTop: 4 },

  // Badge
  badge: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500, display: 'inline-block' },

  // Staff
  staffGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 4 },
  staffCard: { background: MIST, borderRadius: 10, padding: '14px 12px', textAlign: 'center' },
  staffAvatar: { width: 44, height: 44, borderRadius: '50%', background: '#FDF0F3', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, margin: '0 auto 8px' },
  staffName: { fontSize: 13, fontWeight: 500, color: INK, marginBottom: 2 },
  staffRole: { fontSize: 11, color: STONE, marginBottom: 6 },
  staffStats: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: STONE, marginTop: 6 },

  // Quick actions
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 },
  quickCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '18px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4 },
  quickLabel: { fontSize: 13, fontWeight: 500, color: INK, marginTop: 6 },
  quickDesc: { fontSize: 11, color: STONE },

  // Placeholder
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, textAlign: 'center' },
  placeholderIcon: { color: '#E8E0D8', marginBottom: 8 },
  placeholderTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: INK },
  placeholderSub: { fontSize: 14, color: STONE, maxWidth: 360, lineHeight: 1.6 },
}
