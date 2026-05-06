import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['present', 'absent', 'half', 'leave']
const STATUS_COLORS = {
  present: '#10b981', absent: '#ef4444', half: '#f59e0b', leave: '#6366f1'
}
const STATUS_BG = {
  present: '#f0fdf4', absent: '#fff0f0', half: '#fffbeb', leave: '#eef2ff'
}
const STATUS_LABELS = {
  present: '✅ Present', absent: '❌ Absent', half: '🌓 Half Day', leave: '🏖 Leave'
}

// Get current time as HH:MM:SS string for Supabase TIME column
function getNowTime() {
  const d = new Date()
  return d.getHours().toString().padStart(2,'0') + ':' +
         d.getMinutes().toString().padStart(2,'0') + ':00'
}

// Display time from HH:MM:SS string
function displayTime(t) {
  if (!t) return '—'
  try {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'pm' : 'am'
    const h12  = hour % 12 || 12
    return h12 + ':' + m + ' ' + ampm
  } catch { return t }
}

export default function AttendanceManager() {
  const { salonId } = useAuth()
  const today        = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)

  const [employees,   setEmployees]   = useState([])
  const [attendance,  setAttendance]  = useState([])
  const [monthly,     setMonthly]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState({})
  const [view,        setView]        = useState('today')
  const [month,       setMonth]       = useState(currentMonth)

  useEffect(() => { if (salonId) fetchAll() }, [salonId])
  useEffect(() => { if (salonId && view === 'monthly') fetchMonthly() }, [month, view, salonId])

  async function fetchAll() {
    setLoading(true)
    try {
      const { data: emps } = await supabase
        .from('employees')
        .select('id, name, role, status')
        .eq('salon_id', salonId)
        .eq('status', 'active')
        .order('name')
      setEmployees(emps || [])

      const { data: att } = await supabase
        .from('attendance')
        .select('*')
        .eq('salon_id', salonId)
        .eq('date', today)
      setAttendance(att || [])
    } catch (err) {
      console.error('fetchAll:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMonthly() {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('salon_id', salonId)
      .gte('date', month + '-01')
      .lte('date', month + '-31')
      .order('date')
    setMonthly(data || [])
  }

  function getRecord(empId) {
    return attendance.find(a => a.employee_id === empId)
  }

  async function markAttendance(empId, status) {
    setSaving(s => ({ ...s, [empId]: true }))
    try {
      const existing = getRecord(empId)
      const nowTime  = getNowTime()

      if (existing) {
        const updates = { status }
        if (status === 'present' && !existing.check_in) updates.check_in = nowTime
        if (status === 'half'    && !existing.check_in) updates.check_in = nowTime
        if (status === 'absent' || status === 'leave') {
          updates.check_in  = null
          updates.check_out = null
        }

        const { data, error } = await supabase
          .from('attendance')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        setAttendance(a => a.map(r => r.id === existing.id ? data : r))
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            salon_id:    salonId,
            employee_id: empId,
            date:        today,
            status,
            check_in:    (status === 'present' || status === 'half') ? nowTime : null,
          })
          .select()
          .single()
        if (error) throw error
        setAttendance(a => [...a, data])
      }
    } catch (err) {
      console.error('markAttendance:', err.message)
      alert('Error saving attendance: ' + err.message)
    } finally {
      setSaving(s => ({ ...s, [empId]: false }))
    }
  }

  async function markCheckOut(empId) {
    setSaving(s => ({ ...s, [empId]: true }))
    try {
      const record = getRecord(empId)
      if (!record) return

      const nowTime = getNowTime()

      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out: nowTime })
        .eq('id', record.id)
        .select()
        .single()
      if (error) throw error
      setAttendance(a => a.map(r => r.id === record.id ? data : r))
    } catch (err) {
      console.error('markCheckOut:', err.message)
      alert('Error checking out: ' + err.message)
    } finally {
      setSaving(s => ({ ...s, [empId]: false }))
    }
  }

  function getDaysInMonth(ym) {
    const [y, m] = ym.split('-').map(Number)
    return new Date(y, m, 0).getDate()
  }

  function getMonthDays() {
    const days = getDaysInMonth(month)
    return Array.from({ length: days }, (_, i) => {
      const d = String(i + 1).padStart(2, '0')
      return month + '-' + d
    })
  }

  function changeMonth(dir) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setMonth(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'))
  }

  const todayPresent = attendance.filter(a => a.status === 'present' || a.status === 'half').length
  const todayAbsent  = employees.length - todayPresent
  const todayLeave   = attendance.filter(a => a.status === 'leave').length
  const notMarked    = employees.filter(e => !getRecord(e.id)).length

  const COLORS = ['#8b2252','#2563eb','#059669','#d97706','#7c3aed','#db2777']
  function initials(name) { return (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) }

  // ── Styles ────────────────────────────────────────────────────
  const S = {
    wrap:     { padding:'0 4px' },
    title:    { fontSize:22, fontWeight:700, color:'#1a0a0a', marginBottom:4 },
    sub:      { fontSize:13, color:'#888', marginBottom:24 },
    stats:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
    stat:     { background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', textAlign:'center' },
    statN:    { fontSize:28, fontWeight:700, marginBottom:4 },
    statL:    { fontSize:12, color:'#888' },
    tabs:     { display:'flex', gap:8, marginBottom:20 },
    tab:      (a) => ({ padding:'8px 20px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, background:a?'#8b2252':'#f5f3f0', color:a?'#fff':'#666' }),
    card:     { background:'#fff', borderRadius:16, padding:20, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', marginBottom:12 },
    empRow:   { display:'flex', alignItems:'center', gap:14 },
    avatar:   (c) => ({ width:44, height:44, borderRadius:'50%', background:c, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, color:'#fff', flexShrink:0 }),
    btnRow:   { display:'flex', gap:6, marginTop:12, flexWrap:'wrap' },
    statusBtn:(active, status) => ({
      padding:'6px 14px', borderRadius:20,
      border: active ? '2px solid '+STATUS_COLORS[status] : '1.5px solid #e8e4df',
      background: active ? STATUS_BG[status] : 'transparent',
      color: active ? STATUS_COLORS[status] : '#888',
      cursor:'pointer', fontSize:12, fontWeight:active?700:500
    }),
    timeBox:  { display:'flex', gap:12, marginTop:10, fontSize:12, color:'#555', alignItems:'center', flexWrap:'wrap' },
    timePill: { background:'#f5f3f0', borderRadius:8, padding:'4px 10px', fontWeight:600 },
    coBtn:    { padding:'5px 14px', borderRadius:20, border:'none', background:'#1a0a0a', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' },
    markAll:  { display:'block', margin:'0 auto', padding:'10px 28px', background:'#10b981', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:16 },
    calWrap:  { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflowX:'auto' },
    navRow:   { display:'flex', alignItems:'center', gap:12, marginBottom:16 },
    navBtn:   { padding:'6px 14px', border:'1px solid #e8e4df', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 },
    calTh:    { padding:'8px 4px', color:'#aaa', fontWeight:600, textAlign:'center', borderBottom:'1px solid #f0ede9', minWidth:26, fontSize:11 },
    calTd:    { padding:'3px', textAlign:'center' },
    calDot:   (s) => ({ width:22, height:22, borderRadius:'50%', background: s ? STATUS_BG[s] : '#f5f3f0', color: s ? STATUS_COLORS[s] : '#ddd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, margin:'0 auto' }),
    legend:   { display:'flex', gap:16, marginTop:12, flexWrap:'wrap' },
    legItem:  { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#555' },
    legDot:   (c) => ({ width:12, height:12, borderRadius:'50%', background:c }),
    empty:    { textAlign:'center', padding:'60px 20px', color:'#aaa' },
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#888', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>⏳</div>Loading attendance...
    </div>
  )

  if (employees.length === 0) return (
    <div style={S.empty}>
      <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
      <div style={{ fontSize:18, fontWeight:700, color:'#1a0a0a', marginBottom:8 }}>No staff yet</div>
      <div style={{ fontSize:14 }}>Add staff members first to manage attendance.</div>
    </div>
  )

  const days = getMonthDays()

  return (
    <div style={S.wrap}>
      <div style={S.title}>Attendance Manager</div>
      <div style={S.sub}>
        📅 {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[
          { label:'Present Today', value: todayPresent, color:'#10b981' },
          { label:'Absent',        value: todayAbsent,  color:'#ef4444' },
          { label:'On Leave',      value: todayLeave,   color:'#6366f1' },
          { label:'Not Marked',    value: notMarked,    color:'#f59e0b' },
        ].map(s => (
          <div key={s.label} style={S.stat}>
            <div style={{ ...S.statN, color: s.color }}>{s.value}</div>
            <div style={S.statL}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        <button style={S.tab(view==='today')}   onClick={() => setView('today')}>📋 Today's Attendance</button>
        <button style={S.tab(view==='monthly')} onClick={() => { setView('monthly'); fetchMonthly() }}>📅 Monthly Calendar</button>
      </div>

      {/* ── TODAY VIEW ── */}
      {view === 'today' && (
        <div>
          {employees.map((emp, i) => {
            const record   = getRecord(emp.id)
            const status   = record?.status
            const isSaving = saving[emp.id]

            return (
              <div key={emp.id} style={S.card}>
                <div style={S.empRow}>
                  <div style={S.avatar(COLORS[i % COLORS.length])}>{initials(emp.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1a0a0a', marginBottom:2 }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{emp.role || 'Staff'}</div>
                  </div>
                  {status ? (
                    <span style={{ fontSize:13, fontWeight:600, color:STATUS_COLORS[status], background:STATUS_BG[status], padding:'4px 12px', borderRadius:20 }}>
                      {STATUS_LABELS[status]}
                    </span>
                  ) : (
                    <span style={{ fontSize:12, color:'#f59e0b', background:'#fffbeb', padding:'4px 12px', borderRadius:20, fontWeight:600 }}>
                      ⏳ Not marked
                    </span>
                  )}
                </div>

                {/* Status buttons */}
                <div style={S.btnRow}>
                  {STATUSES.map(s => (
                    <button key={s} style={S.statusBtn(status===s, s)}
                      onClick={() => !isSaving && markAttendance(emp.id, s)}
                      disabled={isSaving}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* Check in/out times */}
                {record && (
                  <div style={S.timeBox}>
                    <div>
                      <span style={{ color:'#aaa' }}>Check In: </span>
                      <span style={S.timePill}>{displayTime(record.check_in)}</span>
                    </div>
                    <div>
                      <span style={{ color:'#aaa' }}>Check Out: </span>
                      <span style={S.timePill}>{displayTime(record.check_out)}</span>
                    </div>
                    {record.check_in && !record.check_out && (record.status==='present'||record.status==='half') && (
                      <button style={S.coBtn} onClick={() => markCheckOut(emp.id)} disabled={isSaving}>
                        {isSaving ? '...' : '🚪 Check Out'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Mark All Present */}
          <button style={S.markAll} onClick={async () => {
            for (const emp of employees) {
              if (!getRecord(emp.id)) await markAttendance(emp.id, 'present')
            }
          }}>
            ✅ Mark All Present
          </button>
        </div>
      )}

      {/* ── MONTHLY VIEW ── */}
      {view === 'monthly' && (
        <div style={S.calWrap}>
          <div style={S.navRow}>
            <button style={S.navBtn} onClick={() => changeMonth(-1)}>◀</button>
            <div style={{ fontWeight:700, fontSize:16 }}>
              {new Date(month+'-01').toLocaleDateString('en-IN',{ month:'long', year:'numeric' })}
            </div>
            <button style={S.navBtn} onClick={() => changeMonth(1)}>▶</button>
          </div>

          <table style={{ borderCollapse:'collapse', width:'100%', fontSize:12 }}>
            <thead>
              <tr>
                <th style={{ ...S.calTh, textAlign:'left', minWidth:120 }}>Staff</th>
                {days.map(d => (
                  <th key={d} style={S.calTh}>{parseInt(d.split('-')[2])}</th>
                ))}
                <th style={S.calTh}>P</th>
                <th style={S.calTh}>A</th>
                <th style={S.calTh}>H</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const empRecords = monthly.filter(a => a.employee_id === emp.id)
                const present = empRecords.filter(a => a.status==='present').length
                const absent  = empRecords.filter(a => a.status==='absent').length
                const half    = empRecords.filter(a => a.status==='half').length
                return (
                  <tr key={emp.id}>
                    <td style={{ padding:'6px 4px', fontWeight:600, fontSize:13, whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ ...S.avatar(COLORS[i%COLORS.length]), width:26, height:26, fontSize:10 }}>
                          {initials(emp.name)}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    {days.map(d => {
                      const rec = monthly.find(a => a.employee_id===emp.id && a.date===d)
                      const s   = rec?.status
                      const isToday = d === today
                      return (
                        <td key={d} style={{ ...S.calTd, background: isToday?'#faf5ff':'transparent' }}>
                          <div style={S.calDot(s)}>
                            {s ? (s==='present'?'P':s==='absent'?'A':s==='half'?'H':'L') : '·'}
                          </div>
                        </td>
                      )
                    })}
                    <td style={{ ...S.calTd, fontWeight:700, color:'#10b981' }}>{present}</td>
                    <td style={{ ...S.calTd, fontWeight:700, color:'#ef4444' }}>{absent}</td>
                    <td style={{ ...S.calTd, fontWeight:700, color:'#f59e0b' }}>{half}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Legend */}
          <div style={S.legend}>
            {Object.entries(STATUS_COLORS).map(([s,c]) => (
              <div key={s} style={S.legItem}>
                <div style={S.legDot(c)} />
                <span>{STATUS_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
