import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AddStaffModal from '../components/AddStaffModal'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TODAY = new Date()
const CURRENT_MONTH = MONTHS[TODAY.getMonth()]

const MOCK_STAFF = [
  {
    id: 1, name: 'Kavitha R.', role: 'Senior Stylist', phone: '+91 98400 11111',
    email: 'kavitha@gmail.com', joinDate: '2022-03-15', salaryBase: 22000,
    incentiveRate: 10, advanceBalance: 5000, status: 'active',
    specialization: ['Hair Color', 'Bridal', 'Keratin'],
    attendance: { present: 22, absent: 1, halfDay: 1, leave: 0 },
    thisMonthServices: 48, thisMonthRevenue: 142000,
    incentiveEarned: 14200, netSalary: 31200,
    color: '#8B3A52', bg: '#FDF0F3',
    transfers: [],
    advances: [{ date: '2026-03-10', amount: 5000, reason: 'Medical emergency', status: 'pending' }],
  },
  {
    id: 2, name: 'Sneha M.', role: 'Makeup Artist', phone: '+91 98400 22222',
    email: 'sneha@gmail.com', joinDate: '2023-01-10', salaryBase: 18000,
    incentiveRate: 10, advanceBalance: 0, status: 'active',
    specialization: ['Bridal Makeup', 'Party Makeup', 'Airbrush'],
    attendance: { present: 23, absent: 0, halfDay: 1, leave: 0 },
    thisMonthServices: 35, thisMonthRevenue: 98000,
    incentiveEarned: 9800, netSalary: 27800,
    color: '#0F6E56', bg: '#E1F5EE',
    transfers: [],
    advances: [],
  },
  {
    id: 3, name: 'Latha D.', role: 'Hair Specialist', phone: '+91 98400 33333',
    email: 'latha@gmail.com', joinDate: '2021-06-20', salaryBase: 20000,
    incentiveRate: 8, advanceBalance: 2000, status: 'active',
    specialization: ['Hair Cut', 'Balayage', 'Smoothening'],
    attendance: { present: 20, absent: 2, halfDay: 2, leave: 0 },
    thisMonthServices: 42, thisMonthRevenue: 88000,
    incentiveEarned: 7040, netSalary: 25040,
    color: '#185FA5', bg: '#E6F1FB',
    transfers: [{ date: '2024-06-01', from: 'Koregaon Branch', to: 'Main Branch', reason: 'Client demand' }],
    advances: [{ date: '2026-02-20', amount: 2000, reason: 'Travel expense', status: 'pending' }],
  },
  {
    id: 4, name: 'Bindhu P.', role: 'Nail Tech', phone: '+91 98400 44444',
    email: 'bindhu@gmail.com', joinDate: '2023-08-01', salaryBase: 15000,
    incentiveRate: 10, advanceBalance: 0, status: 'active',
    specialization: ['Gel Nails', 'Nail Art', 'Extensions'],
    attendance: { present: 21, absent: 1, halfDay: 1, leave: 1 },
    thisMonthServices: 28, thisMonthRevenue: 52000,
    incentiveEarned: 5200, netSalary: 20200,
    color: '#BA7517', bg: '#FAEEDA',
    transfers: [],
    advances: [],
  },
  {
    id: 5, name: 'Preethi K.', role: 'Skin Therapist', phone: '+91 98400 55555',
    email: 'preethi@gmail.com', joinDate: '2024-02-15', salaryBase: 17000,
    incentiveRate: 8, advanceBalance: 0, status: 'active',
    specialization: ['Facial', 'Spa', 'Massage'],
    attendance: { present: 19, absent: 3, halfDay: 1, leave: 1 },
    thisMonthServices: 31, thisMonthRevenue: 74000,
    incentiveEarned: 5920, netSalary: 22920,
    color: '#533AB7', bg: '#EEEDFE',
    transfers: [],
    advances: [],
  },
]

// ─── ATTENDANCE CALENDAR ──────────────────────────────────────────────────────
function AttendanceCalendar({ staff }) {
  const daysInMonth = 26 // working days
  const colors = { P: '#E1F5EE', A: '#FAECE7', H: '#FAEEDA', L: '#EEEDFE' }
  const textColors = { P: '#0F6E56', A: '#993C1D', H: '#854F0B', L: '#533AB7' }
  const mock = Array.from({ length: daysInMonth }, (_, i) => {
    if (i < staff.attendance.absent) return 'A'
    if (i < staff.attendance.absent + staff.attendance.halfDay) return 'H'
    if (i < staff.attendance.absent + staff.attendance.halfDay + staff.attendance.leave) return 'L'
    return 'P'
  }).sort(() => Math.random() - 0.5)

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        {[['P', 'Present'], ['A', 'Absent'], ['H', 'Half Day'], ['L', 'Leave']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B6258' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[k] }} />
            {v}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 4 }}>
        {mock.map((status, i) => (
          <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 4, background: colors[status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: textColors[status], fontWeight: 500 }}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── STAFF DETAIL PANEL ───────────────────────────────────────────────────────
function StaffDetail({ staff, onClose, sym, onAdvanceApprove }) {
  const [tab, setTab] = useState('overview')
  const [showAdvance, setShowAdvance] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '' })

  const attendanceTotal = staff.attendance.present + staff.attendance.absent + staff.attendance.halfDay + staff.attendance.leave

  return (
    <div style={D.overlay}>
      <div style={D.panel}>
        {/* Header */}
        <div style={D.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ ...D.avatar, background: staff.bg, color: staff.color }}>{staff.name[0]}</div>
            <div>
              <div style={D.name}>{staff.name}</div>
              <div style={D.role}>{staff.role}</div>
            </div>
          </div>
          <button style={D.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Quick stats */}
        <div style={D.statsRow}>
          <div style={D.statItem}><div style={D.statVal}>{staff.thisMonthServices}</div><div style={D.statKey}>Services</div></div>
          <div style={D.statItem}><div style={{ ...D.statVal, color: '#0F6E56' }}>{sym}{staff.thisMonthRevenue.toLocaleString()}</div><div style={D.statKey}>Revenue</div></div>
          <div style={D.statItem}><div style={D.statVal}>{staff.attendance.present}/{attendanceTotal}</div><div style={D.statKey}>Attendance</div></div>
          <div style={D.statItem}><div style={{ ...D.statVal, color: staff.color }}>{sym}{staff.netSalary.toLocaleString()}</div><div style={D.statKey}>Net Pay</div></div>
        </div>

        {/* Tabs */}
        <div style={D.tabs}>
          {['overview', 'salary', 'attendance', 'advances', 'transfers'].map(t => (
            <button key={t} style={{ ...D.tab, ...(tab === t ? D.tabOn : {}) }} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div style={D.content}>
            {[
              ['Phone', staff.phone],
              ['Email', staff.email],
              ['Joined', new Date(staff.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
              ['Base Salary', `${sym}${staff.salaryBase.toLocaleString()}/month`],
              ['Incentive Rate', `${staff.incentiveRate}% of service revenue`],
            ].map(([k, v]) => (
              <div key={k} style={D.infoRow}>
                <span style={D.infoKey}>{k}</span>
                <span style={D.infoVal}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={D.sectionTitle}>Specializations</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {staff.specialization.map(sp => (
                  <span key={sp} style={{ ...D.specTag, background: staff.bg, color: staff.color }}>{sp}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Salary */}
        {tab === 'salary' && (
          <div style={D.content}>
            <div style={D.sectionTitle}>{CURRENT_MONTH} 2026 — Salary Breakdown</div>
            <div style={D.salaryCard}>
              {[
                { label: 'Base Salary', value: staff.salaryBase, color: '#1A1208' },
                { label: `Incentive (${staff.incentiveRate}% of ${sym}${staff.thisMonthRevenue.toLocaleString()})`, value: staff.incentiveEarned, color: '#0F6E56' },
                { label: 'Advance Deduction', value: -staff.advanceBalance, color: '#993C1D' },
              ].map(row => (
                <div key={row.label} style={D.salaryRow}>
                  <span style={{ fontSize: 13, color: '#6B6258' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: row.color }}>
                    {row.value < 0 ? `- ${sym}${Math.abs(row.value).toLocaleString()}` : `${sym}${row.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
              <div style={D.salaryTotal}>
                <span>Net Payable</span>
                <span style={{ color: staff.color }}>{sym}{staff.netSalary.toLocaleString()}</span>
              </div>
            </div>
            <button style={{ ...D.actionBtn, marginTop: 14, background: '#0F6E56', color: '#fff', border: 'none' }}>
              ✓ Mark as Paid for {CURRENT_MONTH}
            </button>
          </div>
        )}

        {/* Attendance */}
        {tab === 'attendance' && (
          <div style={D.content}>
            <div style={D.sectionTitle}>{CURRENT_MONTH} 2026 — Attendance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Present', value: staff.attendance.present, color: '#0F6E56' },
                { label: 'Absent', value: staff.attendance.absent, color: '#993C1D' },
                { label: 'Half Day', value: staff.attendance.halfDay, color: '#854F0B' },
                { label: 'Leave', value: staff.attendance.leave, color: '#533AB7' },
              ].map(s => (
                <div key={s.label} style={{ background: '#F8F5F0', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#6B6258', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <AttendanceCalendar staff={staff} />
          </div>
        )}

        {/* Advances */}
        {tab === 'advances' && (
          <div style={D.content}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={D.sectionTitle}>Salary Advances</div>
              <button style={{ ...D.actionBtn, fontSize: 12, padding: '5px 12px' }} onClick={() => setShowAdvance(!showAdvance)}>
                + New Advance
              </button>
            </div>
            {showAdvance && (
              <div style={{ background: '#F8F5F0', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={D.infoKey}>Amount</label>
                    <input style={D.miniInput} type="number" placeholder="5000" value={advanceForm.amount} onChange={e => setAdvanceForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label style={D.infoKey}>Reason</label>
                    <input style={D.miniInput} placeholder="Reason..." value={advanceForm.reason} onChange={e => setAdvanceForm(f => ({ ...f, reason: e.target.value }))} />
                  </div>
                </div>
                <button style={{ ...D.actionBtn, background: '#8B3A52', color: '#fff', border: 'none', fontSize: 12 }}>
                  Approve Advance
                </button>
              </div>
            )}
            {staff.advances.length === 0 && <div style={D.empty}>No advances taken</div>}
            {staff.advances.map((a, i) => (
              <div key={i} style={D.advanceItem}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1208' }}>{sym}{a.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#6B6258', marginTop: 2 }}>{a.reason} · {a.date}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#FAEEDA', color: '#854F0B', fontWeight: 500 }}>{a.status}</span>
              </div>
            ))}
            {staff.advanceBalance > 0 && (
              <div style={{ marginTop: 14, background: '#FAECE7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#993C1D' }}>
                ⚠️ Outstanding advance: {sym}{staff.advanceBalance.toLocaleString()} (will be deducted from next salary)
              </div>
            )}
          </div>
        )}

        {/* Transfers */}
        {tab === 'transfers' && (
          <div style={D.content}>
            <div style={D.sectionTitle}>Transfer History</div>
            {staff.transfers.length === 0 && <div style={D.empty}>No transfers on record</div>}
            {staff.transfers.map((t, i) => (
              <div key={i} style={D.transferItem}>
                <div style={D.transferIcon}>↔</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1208' }}>{t.from} → {t.to}</div>
                  <div style={{ fontSize: 11, color: '#6B6258', marginTop: 2 }}>{t.date} · {t.reason}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, background: '#FDF0F3', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#8B3A52' }}>
              🛡 Client contacts are NOT transferred with the employee. All client data stays with the salon.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── STAFF CARD ───────────────────────────────────────────────────────────────
function StaffCard({ staff, onClick, sym }) {
  const attendancePct = Math.round((staff.attendance.present / (staff.attendance.present + staff.attendance.absent + staff.attendance.halfDay + staff.attendance.leave)) * 100)
  return (
    <div style={C.card} onClick={() => onClick(staff)}>
      <div style={C.top}>
        <div style={{ ...C.avatar, background: staff.bg, color: staff.color }}>{staff.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={C.name}>{staff.name}</div>
          <div style={C.role}>{staff.role}</div>
        </div>
        <div style={{ ...C.status, background: '#E1F5EE', color: '#0F6E56' }}>Active</div>
      </div>
      <div style={C.specs}>
        {staff.specialization.slice(0, 2).map(s => (
          <span key={s} style={{ ...C.spec, background: staff.bg, color: staff.color }}>{s}</span>
        ))}
        {staff.specialization.length > 2 && <span style={{ ...C.spec, background: '#F8F5F0', color: '#6B6258' }}>+{staff.specialization.length - 2}</span>}
      </div>
      <div style={C.stats}>
        <div style={C.stat}><span style={C.statVal}>{staff.thisMonthServices}</span><span style={C.statKey}>services</span></div>
        <div style={C.stat}><span style={{ ...C.statVal, color: '#0F6E56' }}>{sym}{staff.thisMonthRevenue.toLocaleString()}</span><span style={C.statKey}>revenue</span></div>
        <div style={C.stat}><span style={{ ...C.statVal, color: attendancePct >= 90 ? '#0F6E56' : '#993C1D' }}>{attendancePct}%</span><span style={C.statKey}>attendance</span></div>
        <div style={C.stat}><span style={{ ...C.statVal, color: staff.color }}>{sym}{staff.netSalary.toLocaleString()}</span><span style={C.statKey}>net pay</span></div>
      </div>
      {staff.advanceBalance > 0 && (
        <div style={C.advanceAlert}>⚠️ Advance pending: {sym}{staff.advanceBalance.toLocaleString()}</div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StaffManager() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [staff] = useState(MOCK_STAFF)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('cards') // cards | leaderboard

  const totalRevenue = staff.reduce((s, e) => s + e.thisMonthRevenue, 0)
  const totalSalary = staff.reduce((s, e) => s + e.netSalary, 0)
  const topPerformer = [...staff].sort((a, b) => b.thisMonthRevenue - a.thisMonthRevenue)[0]

  const sorted = view === 'leaderboard'
    ? [...staff].sort((a, b) => b.thisMonthRevenue - a.thisMonthRevenue)
    : staff

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Staff Manager</div>
          <div style={P.sub}>{CURRENT_MONTH} 2026 — Attendance, Salary & Performance</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={P.toggle}>
            <button style={{ ...P.toggleBtn, ...(view === 'cards' ? P.toggleOn : {}) }} onClick={() => setView('cards')}>Cards</button>
            <button style={{ ...P.toggleBtn, ...(view === 'leaderboard' ? P.toggleOn : {}) }} onClick={() => setView('leaderboard')}>🏆 Leaderboard</button>
          </div>
          <button style={P.addBtn} onClick={() => setShowAddStaff(true)}>+ Add Staff</button>
        </div>
      </div>

      {/* Stats */}
      <div style={P.statsRow}>
        {[
          { label: 'Total Staff', value: staff.length, color: '#185FA5' },
          { label: 'Monthly Revenue', value: `${sym}${totalRevenue.toLocaleString()}`, color: '#0F6E56' },
          { label: 'Total Salary Payout', value: `${sym}${totalSalary.toLocaleString()}`, color: '#8B3A52' },
          { label: 'Top Performer', value: topPerformer.name.split(' ')[0], color: '#BA7517' },
        ].map(s => (
          <div key={s.label} style={P.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard view */}
      {view === 'leaderboard' && (
        <div style={P.leaderboard}>
          <div style={P.lbHeader}>
            <span style={{ flex: 0.4 }}>Rank</span>
            <span style={{ flex: 2 }}>Staff</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Services</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Revenue</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Incentive</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Attendance</span>
          </div>
          {sorted.map((emp, i) => (
            <div key={emp.id} style={{ ...P.lbRow, background: i === 0 ? '#FAEEDA' : '#fff' }} onClick={() => setSelected(emp)}>
              <span style={{ flex: 0.4, fontSize: 18, fontWeight: 600, color: i === 0 ? '#BA7517' : i === 1 ? '#888' : '#BA7517' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </span>
              <span style={{ flex: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1208' }}>{emp.name}</div>
                <div style={{ fontSize: 11, color: '#6B6258' }}>{emp.role}</div>
              </span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>{emp.thisMonthServices}</span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>{sym}{emp.thisMonthRevenue.toLocaleString()}</span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#8B3A52', fontWeight: 500 }}>{sym}{emp.incentiveEarned.toLocaleString()}</span>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13 }}>{emp.attendance.present}/{emp.attendance.present + emp.attendance.absent + emp.attendance.halfDay + emp.attendance.leave}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div style={P.grid}>
          {staff.map(emp => <StaffCard key={emp.id} staff={emp} onClick={setSelected} sym={sym} />)}
        </div>
      )}

      {showAddStaff && <AddStaffModal onClose={() => setShowAddStaff(false)} onAdd={emp => setStaff(s => [...s, emp])} sym={sym} />}
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
  toggle: { display: 'flex', background: MIST, borderRadius: 8, padding: 3 },
  toggleBtn: { padding: '6px 14px', border: 'none', background: 'transparent', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: STONE, fontFamily: 'inherit', fontWeight: 500 },
  toggleOn: { background: '#fff', color: ROSE },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  leaderboard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, overflow: 'hidden' },
  lbHeader: { display: 'flex', padding: '10px 16px', background: MIST, fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px' },
  lbRow: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #F8F5F0', cursor: 'pointer' },
}

const C = {
  card: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, padding: 16, cursor: 'pointer' },
  top: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 500, color: INK },
  role: { fontSize: 11, color: STONE, marginTop: 1 },
  status: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500 },
  specs: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  spec: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, borderTop: '0.5px solid #F0EAE4', paddingTop: 10 },
  stat: { display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center' },
  statVal: { fontSize: 13, fontWeight: 500, color: INK },
  statKey: { fontSize: 9, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  advanceAlert: { marginTop: 10, background: '#FAECE7', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: '#993C1D' },
}

const D = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 },
  panel: { width: 440, background: '#fff', height: '100vh', overflowY: 'auto', padding: 24, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 500, flexShrink: 0 },
  name: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  role: { fontSize: 12, color: STONE, marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 },
  statItem: { background: MIST, borderRadius: 8, padding: '8px', textAlign: 'center' },
  statVal: { fontSize: 14, fontWeight: 600, color: INK },
  statKey: { fontSize: 9, color: STONE, marginTop: 2, textTransform: 'uppercase' },
  tabs: { display: 'flex', gap: 0, background: MIST, borderRadius: 10, padding: 3, marginBottom: 16, flexWrap: 'wrap' },
  tab: { flex: 1, padding: '7px 4px', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 11, cursor: 'pointer', color: STONE, fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' },
  tabOn: { background: '#fff', color: ROSE },
  content: { paddingTop: 4 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #F0EAE4', fontSize: 13 },
  infoKey: { color: STONE, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3px' },
  infoVal: { color: INK, fontWeight: 500, fontSize: 13 },
  sectionTitle: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  specTag: { fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 500 },
  salaryCard: { background: MIST, borderRadius: 10, padding: '14px 16px' },
  salaryRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #E8E0D8' },
  salaryTotal: { display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 15, fontWeight: 600, color: INK },
  actionBtn: { padding: '8px 16px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: STONE, background: '#fff', width: '100%' },
  miniInput: { width: '100%', padding: '7px 10px', border: '0.5px solid #E8E0D8', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', marginTop: 4 },
  advanceItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #F0EAE4' },
  transferItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F0EAE4' },
  transferIcon: { width: 32, height: 32, borderRadius: '50%', background: '#EEEDFE', color: '#533AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  empty: { textAlign: 'center', color: '#B0A89F', padding: '20px 0', fontSize: 13 },
}
