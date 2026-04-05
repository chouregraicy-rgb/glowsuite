import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase.js'

const TODAY_LABEL = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

const MY_APPOINTMENTS = [
  { id: 1, clientToken: '#A047', service: 'Bridal Makeup + Hair', time: '10:00 AM', duration: 180, amount: 8500, status: 'serving', notes: 'Pre-bridal trial. Client prefers soft tones.', checklist: [{ task: 'Skin prep + primer', done: true }, { task: 'Foundation + contouring', done: true }, { task: 'Eye makeup', done: false }, { task: 'Lips', done: false }, { task: 'Hair styling', done: false }, { task: 'Setting spray', done: false }] },
  { id: 2, clientToken: '#B112', service: 'Hair Color — Balayage', time: '1:30 PM', duration: 120, amount: 6500, status: 'upcoming', notes: 'No ammonia dye.', checklist: [{ task: 'Consultation + patch test', done: false }, { task: 'Sectioning', done: false }, { task: 'Color application', done: false }, { task: 'Processing time', done: false }, { task: 'Rinse + toning', done: false }, { task: 'Blowdry + finish', done: false }] },
  { id: 3, clientToken: '#D203', service: 'Keratin Treatment', time: '4:00 PM', duration: 120, amount: 5500, status: 'upcoming', notes: '', checklist: [{ task: 'Clarifying shampoo', done: false }, { task: 'Apply keratin solution', done: false }, { task: 'Processing (45 min)', done: false }, { task: 'Blow dry', done: false }, { task: 'Flat iron seal', done: false }] },
]

const MY_EARNINGS = {
  thisMonth: { base: 22000, incentive: 14200, advance: 5000, net: 31200, servicesCount: 48, revenue: 142000 },
  weeklyEarnings: [{ week: 'W1', amount: 8200 }, { week: 'W2', amount: 11400 }, { week: 'W3', amount: 9800 }, { week: 'W4', amount: 10800 }],
}

const MY_ATTENDANCE = { present: 22, absent: 1, halfDay: 1, leave: 0, checkedIn: true, checkInTime: '9:02 AM', checkOutTime: null }

const MESSAGES = [
  { id: 1, from: 'Owner', text: 'Great work on the bridal trial today!', time: '8:45 AM', read: true },
  { id: 2, from: 'Owner', text: "Tomorrow's 11am slot has been rescheduled to 3pm.", time: 'Yesterday', read: false },
]

const STATUS = {
  serving:  { label: 'Serving Now', color: '#8B3A52', bg: '#FDF0F3' },
  upcoming: { label: 'Upcoming',    color: '#185FA5', bg: '#E6F1FB' },
  done:     { label: 'Done',        color: '#0F6E56', bg: '#E1F5EE' },
  cancelled:{ label: 'Cancelled',   color: '#993C1D', bg: '#FAECE7' },
}

function ApptDetail({ appt, onClose, onUpdate }) {
  const [checklist, setChecklist] = useState(appt.checklist)
  function toggleTask(i) {
    const updated = checklist.map((t, idx) => idx === i ? { ...t, done: !t.done } : t)
    setChecklist(updated)
    onUpdate(appt.id, updated)
  }
  const done = checklist.filter(t => t.done).length
  const pct = Math.round((done / checklist.length) * 100)
  const s = STATUS[appt.status] || STATUS.upcoming
  return (
    <div style={D.overlay}>
      <div style={D.panel}>
        <div style={D.header}>
          <div>
            <div style={D.service}>{appt.service}</div>
            <div style={D.meta}>{appt.time} · {appt.duration} min</div>
          </div>
          <button style={D.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={D.tokenBox}>
          <div style={D.tokenLabel}>🛡 Your client (masked for privacy)</div>
          <div style={D.token}>{appt.clientToken}</div>
          <div style={D.tokenSub}>Contact owner for client details</div>
        </div>
        <div style={{ ...D.statusBadge, background: s.bg, color: s.color }}>{s.label}</div>
        {appt.notes && (
          <div style={D.notesBox}>
            <div style={D.notesTitle}>📋 Notes from owner</div>
            <div style={D.notesText}>{appt.notes}</div>
          </div>
        )}
        <div style={D.checklistTitle}>
          Service Checklist · {done}/{checklist.length} done
          <div style={D.progressBar}><div style={{ ...D.progressFill, width: `${pct}%` }} /></div>
        </div>
        {checklist.map((task, i) => (
          <div key={i} style={D.checkItem} onClick={() => toggleTask(i)}>
            <div style={{ ...D.checkbox, background: task.done ? '#0F6E56' : '#fff', borderColor: task.done ? '#0F6E56' : '#E8E0D8' }}>
              {task.done && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
            </div>
            <span style={{ fontSize: 14, color: task.done ? '#B0A89F' : '#1A1208', textDecoration: task.done ? 'line-through' : 'none' }}>{task.task}</span>
          </div>
        ))}
        {pct === 100 && <button style={D.markDoneBtn}>✓ Mark Service as Complete</button>}
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('schedule')
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [appointments, setAppointments] = useState(MY_APPOINTMENTS)
  const [checkedIn, setCheckedIn] = useState(MY_ATTENDANCE.checkedIn)
  const [checkInTime] = useState(MY_ATTENDANCE.checkInTime)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState(MESSAGES)
  const [unread] = useState(messages.filter(m => !m.read).length)
  const [time, setTime] = useState(new Date())

  // Change password state
  const [showPwdChange, setShowPwdChange] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const EMPLOYEE = {
    name: profile?.name || 'Employee',
    role: profile?.designation || profile?.role || 'Staff',
    incentiveRate: 10,
  }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function updateChecklist(apptId, checklist) {
    setAppointments(a => a.map(ap => ap.id === apptId ? { ...ap, checklist } : ap))
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleChangePassword() {
    if (newPwd.length < 6) { setPwdMsg('Minimum 6 characters required'); return }
    if (newPwd !== confirmPwd) { setPwdMsg('Passwords do not match'); return }
    setPwdLoading(true)
    setPwdMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { setPwdMsg(error.message); setPwdLoading(false); return }
    setPwdMsg('✅ Password changed successfully!')
    setNewPwd('')
    setConfirmPwd('')
    setPwdLoading(false)
    setTimeout(() => { setShowPwdChange(false); setPwdMsg('') }, 2000)
  }

  const servingNow = appointments.find(a => a.status === 'serving')

  return (
    <div style={E.app}>
      {/* TOP BAR */}
      <div style={E.topbar}>
        <div style={E.topLeft}>
          <div style={E.brandLogo}>G</div>
          <div>
            <div style={E.empName}>{EMPLOYEE.name}</div>
            <div style={E.empRole}>{EMPLOYEE.role}</div>
          </div>
        </div>
        <div style={E.topRight}>
          <div style={E.clock}>{time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
          {unread > 0 && <div style={E.notifDot}>{unread}</div>}
        </div>
      </div>

      {/* TODAY BANNER */}
      <div style={E.todayBanner}>
        <div>
          <div style={E.todayDate}>{TODAY_LABEL}</div>
          <div style={E.todayStats}>{appointments.length} appointments · {appointments.filter(a => a.status === 'done').length} done</div>
        </div>
        <button style={{ ...E.checkInBtn, background: checkedIn ? '#FAECE7' : '#E1F5EE', color: checkedIn ? '#993C1D' : '#0F6E56' }}
          onClick={() => setCheckedIn(!checkedIn)}>
          {checkedIn ? `✓ Checked in ${checkInTime}` : '⏱ Check In'}
        </button>
      </div>

      {/* SERVING NOW */}
      {servingNow && (
        <div style={E.servingAlert} onClick={() => setSelectedAppt(servingNow)}>
          <div style={E.servingDot} />
          <div style={{ flex: 1 }}>
            <div style={E.servingLabel}>Currently serving</div>
            <div style={E.servingService}>{servingNow.service} · {servingNow.clientToken}</div>
          </div>
          <div style={E.servingArrow}>→</div>
        </div>
      )}

      {/* TABS */}
      <div style={E.tabs}>
        {[
          { id: 'schedule', label: '📅 Schedule' },
          { id: 'earnings', label: '💰 Earnings' },
          { id: 'attendance', label: '⏰ Attendance' },
          { id: 'messages', label: `💬 Messages${unread > 0 ? ` (${unread})` : ''}` },
        ].map(t => (
          <button key={t.id} style={{ ...E.tab, ...(tab === t.id ? E.tabOn : {}) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={E.content}>

        {tab === 'schedule' && (
          <div>
            <div style={E.sectionTitle}>Today's Appointments</div>
            {appointments.map(appt => {
              const s = STATUS[appt.status] || STATUS.upcoming
              const done = appt.checklist.filter(t => t.done).length
              return (
                <div key={appt.id} style={E.apptCard} onClick={() => setSelectedAppt(appt)}>
                  <div style={E.apptTime}>{appt.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={E.apptService}>{appt.service}</div>
                    <div style={E.apptToken}>🛡 {appt.clientToken} · {appt.duration} min</div>
                    <div style={E.apptProgress}>
                      <div style={E.apptProgressBar}>
                        <div style={{ ...E.apptProgressFill, width: `${(done / appt.checklist.length) * 100}%` }} />
                      </div>
                      <span style={E.apptProgressText}>{done}/{appt.checklist.length} tasks</span>
                    </div>
                  </div>
                  <span style={{ ...E.statusBadge, background: s.bg, color: s.color }}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'earnings' && (
          <div>
            <div style={E.sectionTitle}>My Earnings — This Month</div>
            <div style={E.earningsCard}>
              <div style={E.earningsLabel}>Net Salary</div>
              <div style={E.earningsAmount}>₹{MY_EARNINGS.thisMonth.net.toLocaleString()}</div>
              <div style={E.earningsSub}>{MY_EARNINGS.thisMonth.servicesCount} services · ₹{MY_EARNINGS.thisMonth.revenue.toLocaleString()} revenue</div>
            </div>
            <div style={E.breakdownCard}>
              {[
                { label: 'Base Salary', value: MY_EARNINGS.thisMonth.base, color: '#1A1208' },
                { label: `Incentive (${EMPLOYEE.incentiveRate}%)`, value: MY_EARNINGS.thisMonth.incentive, color: '#0F6E56' },
                { label: 'Advance Deduction', value: -MY_EARNINGS.thisMonth.advance, color: '#993C1D' },
              ].map(row => (
                <div key={row.label} style={E.breakdownRow}>
                  <span style={{ fontSize: 13, color: '#6B6258' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: row.color }}>
                    {row.value < 0 ? `- ₹${Math.abs(row.value).toLocaleString()}` : `₹${row.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
              <div style={E.breakdownTotal}>
                <span>Net Payable</span>
                <span style={{ color: '#8B3A52' }}>₹{MY_EARNINGS.thisMonth.net.toLocaleString()}</span>
              </div>
            </div>
            <div style={E.sectionTitle}>Weekly Performance</div>
            <div style={E.weeklyGrid}>
              {MY_EARNINGS.weeklyEarnings.map(w => (
                <div key={w.week} style={E.weekCard}>
                  <div style={E.weekLabel}>{w.week}</div>
                  <div style={E.weekAmount}>₹{(w.amount / 1000).toFixed(1)}k</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'attendance' && (
          <div>
            <div style={E.sectionTitle}>This Month's Attendance</div>
            <div style={E.attendanceGrid}>
              {[
                { label: 'Present', value: MY_ATTENDANCE.present, color: '#0F6E56', bg: '#E1F5EE' },
                { label: 'Absent', value: MY_ATTENDANCE.absent, color: '#993C1D', bg: '#FAECE7' },
                { label: 'Half Day', value: MY_ATTENDANCE.halfDay, color: '#BA7517', bg: '#FAEEDA' },
                { label: 'Leave', value: MY_ATTENDANCE.leave, color: '#533AB7', bg: '#EEEDFE' },
              ].map(a => (
                <div key={a.label} style={{ ...E.attendanceCard, background: a.bg }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: a.color }}>{a.value}</div>
                  <div style={{ fontSize: 11, color: a.color, marginTop: 2 }}>{a.label}</div>
                </div>
              ))}
            </div>
            <div style={E.checkInCard}>
              <div style={E.checkInTitle}>Today's Check-in</div>
              <div style={E.checkInRow}>
                <div>
                  <div style={E.checkInLabel}>Check In</div>
                  <div style={E.checkInTime}>{checkedIn ? checkInTime : '—'}</div>
                </div>
                <div>
                  <div style={E.checkInLabel}>Check Out</div>
                  <div style={E.checkInTime}>{MY_ATTENDANCE.checkOutTime || '—'}</div>
                </div>
                <button style={{ ...E.checkInBtn2, background: checkedIn ? '#FAECE7' : '#E1F5EE', color: checkedIn ? '#993C1D' : '#0F6E56' }}
                  onClick={() => setCheckedIn(!checkedIn)}>
                  {checkedIn ? 'Check Out' : 'Check In'}
                </button>
              </div>
            </div>
            <div style={E.attendanceNote}>📍 GPS-verified attendance · Managed by owner</div>
          </div>
        )}

        {tab === 'messages' && (
          <div>
            <div style={E.sectionTitle}>Messages from Owner</div>
            <div style={E.messagesList}>
              {messages.map(m => (
                <div key={m.id} style={{ ...E.messageItem, background: m.read ? '#fff' : '#FDF0F3' }}>
                  <div style={E.messageFrom}>👤 {m.from}</div>
                  <div style={E.messageText}>{m.text}</div>
                  <div style={E.messageTime}>{m.time}</div>
                  {!m.read && <div style={E.unreadDot} />}
                </div>
              ))}
            </div>
            <div style={E.messageInputRow}>
              <input style={E.messageInput} placeholder="Reply to owner..." value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newMessage.trim()) {
                    setMessages(m => [...m, { id: Date.now(), from: 'Me', text: newMessage, time: 'Just now', read: true }])
                    setNewMessage('')
                  }
                }} />
              <button style={E.sendBtn} onClick={() => {
                if (newMessage.trim()) {
                  setMessages(m => [...m, { id: Date.now(), from: 'Me', text: newMessage, time: 'Just now', read: true }])
                  setNewMessage('')
                }
              }}>Send</button>
            </div>
            <div style={E.messageNote}>🛡 You can only message the owner. Client contact details are not shared.</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={E.footer}>
        {showPwdChange ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1208' }}>🔑 Change Password</div>
            <input
              style={{ padding: '10px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
            />
            <input
              style={{ padding: '10px 12px', border: '1px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              type="password"
              placeholder="Confirm new password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
            />
            {pwdMsg && (
              <div style={{ fontSize: 12, color: pwdMsg.includes('✅') ? '#0F6E56' : '#C62828', padding: '6px 10px', background: pwdMsg.includes('✅') ? '#E1F5EE' : '#FFF0F0', borderRadius: 6 }}>
                {pwdMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, padding: '10px', background: '#8B3A52', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: pwdLoading ? 0.7 : 1 }}
                onClick={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                style={{ flex: 1, padding: '10px', background: '#F8F5F0', color: '#6B6258', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => { setShowPwdChange(false); setNewPwd(''); setConfirmPwd(''); setPwdMsg('') }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...E.signOutBtn, flex: 1, background: '#FDF0F3', color: '#8B3A52' }} onClick={() => setShowPwdChange(true)}>
              🔑 Change Password
            </button>
            <button style={{ ...E.signOutBtn, flex: 1 }} onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </div>

      {selectedAppt && (
        <ApptDetail appt={selectedAppt} onClose={() => setSelectedAppt(null)} onUpdate={updateChecklist} />
      )}
    </div>
  )
}

const ROSE = '#8B3A52', INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0'

const E = {
  app: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: MIST, fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' },
  topbar: { background: INK, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: 9, background: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5DFA0', fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600 },
  empName: { fontSize: 14, fontWeight: 500, color: '#fff' },
  empRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  clock: { fontSize: 18, fontWeight: 600, color: '#F5DFA0', fontFamily: "'Cormorant Garamond', serif" },
  notifDot: { width: 20, height: 20, borderRadius: '50%', background: ROSE, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 },
  todayBanner: { background: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #E8E0D8' },
  todayDate: { fontSize: 14, fontWeight: 500, color: INK },
  todayStats: { fontSize: 11, color: STONE, marginTop: 2 },
  checkInBtn: { padding: '7px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  servingAlert: { background: '#FDF0F3', border: '0.5px solid #E8B4C0', margin: '12px 16px', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  servingDot: { width: 10, height: 10, borderRadius: '50%', background: ROSE, flexShrink: 0 },
  servingLabel: { fontSize: 10, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px' },
  servingService: { fontSize: 13, fontWeight: 500, color: INK, marginTop: 2 },
  servingArrow: { color: ROSE, fontSize: 16 },
  tabs: { display: 'flex', background: '#fff', borderBottom: '0.5px solid #E8E0D8', overflowX: 'auto' },
  tab: { flex: 1, padding: '12px 8px', border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', color: STONE, fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap', borderBottom: '2px solid transparent' },
  tabOn: { color: ROSE, borderBottom: `2px solid ${ROSE}` },
  content: { flex: 1, padding: '16px' },
  sectionTitle: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, marginTop: 4 },
  apptCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '14px', marginBottom: 10, display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' },
  apptTime: { fontSize: 13, fontWeight: 600, color: ROSE, minWidth: 58, paddingTop: 2 },
  apptService: { fontSize: 14, fontWeight: 500, color: INK, marginBottom: 3 },
  apptToken: { fontSize: 12, color: STONE, marginBottom: 6 },
  apptProgress: { display: 'flex', alignItems: 'center', gap: 8 },
  apptProgressBar: { flex: 1, height: 4, background: '#F0EAE4', borderRadius: 2, overflow: 'hidden' },
  apptProgressFill: { height: '100%', background: ROSE, borderRadius: 2 },
  apptProgressText: { fontSize: 10, color: STONE, whiteSpace: 'nowrap' },
  statusBadge: { fontSize: 10, padding: '3px 8px', borderRadius: 10, fontWeight: 500, display: 'inline-block' },
  earningsCard: { background: INK, borderRadius: 14, padding: '20px', marginBottom: 12, textAlign: 'center' },
  earningsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 },
  earningsAmount: { fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 600, color: '#F5DFA0' },
  earningsSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  breakdownCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '14px 16px', marginBottom: 16 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #F8F5F0' },
  breakdownTotal: { display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 16, fontWeight: 600, color: INK },
  weeklyGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 },
  weekCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px', textAlign: 'center' },
  weekLabel: { fontSize: 10, color: STONE, marginBottom: 4 },
  weekAmount: { fontSize: 15, fontWeight: 600, color: ROSE },
  attendanceGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 },
  attendanceCard: { borderRadius: 10, padding: '12px', textAlign: 'center' },
  checkInCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '14px 16px', marginBottom: 10 },
  checkInTitle: { fontSize: 12, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 },
  checkInRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  checkInLabel: { fontSize: 10, color: STONE },
  checkInTime: { fontSize: 16, fontWeight: 600, color: INK, marginTop: 2 },
  checkInBtn2: { padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  attendanceNote: { fontSize: 11, color: '#B0A89F', textAlign: 'center' },
  messagesList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 },
  messageItem: { border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '12px 14px', position: 'relative' },
  messageFrom: { fontSize: 11, fontWeight: 500, color: STONE, marginBottom: 4 },
  messageText: { fontSize: 13, color: INK, lineHeight: 1.5 },
  messageTime: { fontSize: 10, color: '#B0A89F', marginTop: 6 },
  unreadDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: ROSE },
  messageInputRow: { display: 'flex', gap: 8, marginBottom: 10 },
  messageInput: { flex: 1, padding: '10px 14px', border: '0.5px solid #E8E0D8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' },
  sendBtn: { padding: '10px 16px', background: ROSE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  messageNote: { fontSize: 11, color: '#B0A89F', textAlign: 'center' },
  footer: { padding: '12px 16px', borderTop: '0.5px solid #E8E0D8', background: '#fff' },
  signOutBtn: { padding: '10px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
}

const D = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 },
  panel: { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxHeight: '85vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  service: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: '#1A1208' },
  meta: { fontSize: 12, color: '#6B6258', marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B6258' },
  tokenBox: { background: '#FDF0F3', borderRadius: 10, padding: '12px 14px', marginBottom: 12, textAlign: 'center' },
  tokenLabel: { fontSize: 10, color: '#6B6258', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  token: { fontSize: 28, fontWeight: 700, color: '#8B3A52', fontFamily: "'Cormorant Garamond', serif", letterSpacing: 2 },
  tokenSub: { fontSize: 11, color: '#B0A89F', marginTop: 4 },
  statusBadge: { display: 'inline-block', fontSize: 11, padding: '4px 12px', borderRadius: 10, fontWeight: 500, marginBottom: 12 },
  notesBox: { background: '#FAEEDA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 },
  notesTitle: { fontSize: 11, fontWeight: 500, color: '#6B4C1A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  notesText: { fontSize: 13, color: '#6B4C1A', lineHeight: 1.5 },
  checklistTitle: { fontSize: 12, fontWeight: 500, color: '#6B6258', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 },
  progressBar: { height: 4, background: '#F0EAE4', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', background: '#8B3A52', borderRadius: 2, transition: 'width 0.3s' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F8F5F0', cursor: 'pointer' },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  markDoneBtn: { width: '100%', padding: '12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 14 },
}