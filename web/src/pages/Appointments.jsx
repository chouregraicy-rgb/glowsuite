import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['booked', 'confirmed', 'serving', 'done', 'cancelled']
const STATUS_COLORS = {
  booked:    '#f59e0b', confirmed: '#3b82f6',
  serving:   '#10b981', done:      '#6b7280', cancelled: '#ef4444'
}

const SERVICES = [
  'Hair Cut', 'Hair Color', 'Balayage', 'Keratin Treatment', 'Olaplex',
  'Bridal Makeup', 'HD Makeup', 'Airbrush Makeup',
  'Facial', 'Hydrafacial', 'Threading', 'Waxing',
  'Manicure', 'Pedicure', 'Nail Art', 'Gel Extensions',
  'Spa Massage', 'Hot Stone Massage', 'Body Wrap',
  'Bridal Package', 'Pre-Bridal Package', 'Mehendi',
]

const TIMES = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00'
]

function timeStr(t) {
  if (!t) return '—'
  try { return new Date('2000-01-01T' + t).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }
  catch { return t }
}

function generateToken(index) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const letter = letters[Math.floor(index / 1000) % letters.length]
  const num = String(index % 1000).padStart(3, '0')
  return '#' + letter + num
}

export default function Appointments() {
  const { salonId, currencySymbol } = useAuth()
  const sym = currencySymbol || '₹'

  const [appointments, setAppointments] = useState([])
  const [employees,    setEmployees]    = useState([])
  const [clients,      setClients]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [view,         setView]         = useState('list') // 'list' | 'timeline'
  const [showAdd,      setShowAdd]      = useState(false)
  const [selected,     setSelected]     = useState(null)
  const [filterDate,   setFilterDate]   = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState('all')
  const [saving,       setSaving]       = useState(false)
  const [formErr,      setFormErr]      = useState('')
  const [updating,     setUpdating]     = useState({})

  const [form, setForm] = useState({
    client_id: '', client_token: '', service_name: '',
    employee_id: '', date: new Date().toISOString().split('T')[0],
    start_time: '10:00', amount: '', notes: '', status: 'booked'
  })

  useEffect(() => { if (salonId) fetchAll() }, [salonId])
  useEffect(() => { if (salonId) fetchAppointments() }, [filterDate, salonId])

  async function fetchAll() {
    setLoading(true)
    try {
      await Promise.all([fetchAppointments(), fetchEmployees(), fetchClients()])
    } finally {
      setLoading(false)
    }
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, employees(name)')
      .eq('salon_id', salonId)
      .eq('date', filterDate)
      .order('start_time')
    if (!error) setAppointments(data || [])
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from('employees')
      .select('id, name, role')
      .eq('salon_id', salonId)
      .eq('status', 'active')
    setEmployees(data || [])
  }

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, name, token')
      .eq('salon_id', salonId)
      .order('name')
    setClients(data || [])
  }

  async function bookAppointment() {
    if (!form.service_name) { setFormErr('Service is required'); return }
    if (!form.date)         { setFormErr('Date is required'); return }
    if (!form.start_time)   { setFormErr('Time is required'); return }
    setSaving(true)
    setFormErr('')
    try {
      // Generate token if no client selected
      const token = form.client_id
        ? clients.find(c => c.id === form.client_id)?.token || generateToken(appointments.length)
        : form.client_token || generateToken(appointments.length)

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          salon_id:     salonId,
          client_id:    form.client_id || null,
          client_token: token,
          service_name: form.service_name,
          employee_id:  form.employee_id || null,
          date:         form.date,
          start_time:   form.start_time + ':00',
          amount:       parseFloat(form.amount) || 0,
          notes:        form.notes || null,
          status:       'booked',
        })
        .select('*, employees(name)')
        .single()

      if (error) throw error
      setAppointments(a => [...a, data].sort((x,y) => x.start_time > y.start_time ? 1 : -1))
      setForm({ client_id:'', client_token:'', service_name:'', employee_id:'', date:new Date().toISOString().split('T')[0], start_time:'10:00', amount:'', notes:'', status:'booked' })
      setShowAdd(false)
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(apt, newStatus) {
    setUpdating(u => ({ ...u, [apt.id]: true }))
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', apt.id)
        .select('*, employees(name)')
        .single()
      if (error) throw error
      setAppointments(a => a.map(x => x.id === apt.id ? data : x))
      if (selected?.id === apt.id) setSelected(data)
    } catch (err) {
      console.error('updateStatus:', err.message)
    } finally {
      setUpdating(u => ({ ...u, [apt.id]: false }))
    }
  }

  async function deleteAppointment(id) {
    if (!confirm('Cancel this appointment?')) return
    await supabase.from('appointments').delete().eq('id', id)
    setAppointments(a => a.filter(x => x.id !== id))
    setSelected(null)
  }

  const filtered = appointments.filter(a =>
    filterStatus === 'all' || a.status === filterStatus
  )

  const todayRevenue = appointments
    .filter(a => a.status === 'done')
    .reduce((s, a) => s + (a.amount || 0), 0)

  // ── Styles ────────────────────────────────────────────────────
  const S = {
    wrap:    { padding:'0 4px' },
    header:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
    title:   { fontSize:22, fontWeight:700, color:'#1a0a0a' },
    addBtn:  { padding:'8px 20px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' },
    stats:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
    stat:    { background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)' },
    statL:   { fontSize:11, color:'#aaa', fontWeight:600, letterSpacing:'1px', marginBottom:4 },
    statV:   { fontSize:22, fontWeight:700, color:'#1a0a0a' },
    toolbar: { display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' },
    dateInp: { padding:'8px 12px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:13, outline:'none', background:'#fff', color:'#1a0a0a' },
    viewBtn: (a) => ({ padding:'7px 16px', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, background:a?'#8b2252':'#f5f3f0', color:a?'#fff':'#666' }),
    fBtn:    (a) => ({ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:500, background:a?'#1a0a0a':'#f5f3f0', color:a?'#fff':'#666' }),
    card:    { background:'#fff', borderRadius:14, padding:16, marginBottom:10, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', cursor:'pointer', display:'flex', alignItems:'center', gap:12 },
    token:   { background:'#f5f3f0', borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, color:'#8b2252', minWidth:56, textAlign:'center', flexShrink:0 },
    badge:   (s) => ({ fontSize:10, padding:'3px 10px', borderRadius:20, background:(STATUS_COLORS[s]||'#888')+'20', color:STATUS_COLORS[s]||'#888', fontWeight:700 }),
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    modal:   { background:'#fff', borderRadius:20, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto', padding:28 },
    label:   { display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:14 },
    input:   { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1a0a0a', background:'#faf9f7' },
    sel:     { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1a0a0a', background:'#faf9f7' },
    saveBtn: { width:'100%', padding:'12px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:16 },
    err:     { background:'#fff0f0', border:'1px solid #fcc', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#c00', marginBottom:12 },
    panel:   { position:'fixed', right:0, top:0, width:400, height:'100vh', background:'#fff', boxShadow:'-4px 0 24px rgba(0,0,0,0.1)', zIndex:100, overflowY:'auto', padding:24 },
    panelOv: { position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', zIndex:99 },
    statusBtn:(a,s)=>({ padding:'6px 12px', borderRadius:20, border:a?'2px solid '+STATUS_COLORS[s]:'1.5px solid #e8e4df', background:a?(STATUS_COLORS[s]+'20'):'transparent', color:a?STATUS_COLORS[s]:'#888', cursor:'pointer', fontSize:11, fontWeight:a?700:500 }),
    grid2:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    empty:   { textAlign:'center', padding:'50px 20px', color:'#aaa' },
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#888', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>⏳</div>Loading appointments...
    </div>
  )

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Appointments</div>
          <div style={{ fontSize:13, color:'#888', marginTop:2 }}>{appointments.length} appointments on selected date</div>
        </div>
        <button style={S.addBtn} onClick={() => setShowAdd(true)}>+ Book Appointment</button>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[
          { label:'TOTAL TODAY',  value: appointments.length },
          { label:'CONFIRMED',    value: appointments.filter(a=>a.status==='confirmed').length },
          { label:'SERVING NOW',  value: appointments.filter(a=>a.status==='serving').length },
          { label:'DONE REVENUE', value: sym + todayRevenue.toLocaleString() },
        ].map(s => (
          <div key={s.label} style={S.stat}>
            <div style={S.statL}>{s.label}</div>
            <div style={S.statV}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <input type="date" style={S.dateInp} value={filterDate}
          onChange={e => setFilterDate(e.target.value)} />
        <button style={S.viewBtn(view==='list')}     onClick={() => setView('list')}>📋 List</button>
        <button style={S.viewBtn(view==='timeline')} onClick={() => setView('timeline')}>📅 Timeline</button>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button style={S.fBtn(filterStatus==='all')} onClick={() => setFilterStatus('all')}>All</button>
          {STATUSES.map(s => (
            <button key={s} style={S.fBtn(filterStatus===s)} onClick={() => setFilterStatus(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={S.empty}>
          <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#1a0a0a', marginBottom:8 }}>No appointments</div>
          <div style={{ fontSize:14, marginBottom:20 }}>No appointments found for this date</div>
          <button style={{ ...S.addBtn, padding:'10px 28px', fontSize:14 }} onClick={() => setShowAdd(true)}>
            + Book First Appointment
          </button>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && filtered.map(apt => (
        <div key={apt.id} style={S.card} onClick={() => setSelected(apt)}>
          <div style={S.token}>{apt.client_token || '#???'}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#1a0a0a', marginBottom:3 }}>{apt.service_name || 'Service'}</div>
            <div style={{ fontSize:12, color:'#888' }}>✂️ {apt.employees?.name || 'Unassigned'}</div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#555', marginBottom:4 }}>{timeStr(apt.start_time)}</div>
            <span style={S.badge(apt.status)}>{apt.status}</span>
          </div>
          {apt.amount > 0 && (
            <div style={{ fontSize:13, fontWeight:700, color:'#8b2252', flexShrink:0 }}>
              {sym}{apt.amount.toLocaleString()}
            </div>
          )}
        </div>
      ))}

      {/* ── TIMELINE VIEW ── */}
      {view === 'timeline' && filtered.length > 0 && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
          {TIMES.map(t => {
            const apts = filtered.filter(a => a.start_time?.slice(0,5) === t)
            return (
              <div key={t} style={{ display:'flex', gap:12, minHeight:40, borderBottom:'1px solid #f5f3f0', paddingBottom:4, paddingTop:4 }}>
                <div style={{ width:50, fontSize:11, color:'#aaa', fontWeight:600, paddingTop:6, flexShrink:0 }}>{t}</div>
                <div style={{ flex:1, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {apts.map(apt => (
                    <div key={apt.id}
                      onClick={() => setSelected(apt)}
                      style={{ background:(STATUS_COLORS[apt.status]||'#888')+'15', border:'1.5px solid '+(STATUS_COLORS[apt.status]||'#888')+'40', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>
                      <span style={{ fontWeight:700, color:'#8b2252' }}>{apt.client_token}</span>
                      <span style={{ color:'#555', marginLeft:6 }}>{apt.service_name}</span>
                      {apt.employees?.name && <span style={{ color:'#aaa', marginLeft:6 }}>· {apt.employees.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Book Appointment Modal ── */}
      {showAdd && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={S.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>+ Book Appointment</div>
              <button onClick={() => setShowAdd(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            {formErr && <div style={S.err}>⚠️ {formErr}</div>}

            <label style={S.label}>Client (from Vault)</label>
            <select style={S.sel} value={form.client_id}
              onChange={e => setForm(f => ({ ...f, client_id: e.target.value, client_token: clients.find(c=>c.id===e.target.value)?.token || '' }))}>
              <option value=''>— Walk-in / New client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.token})</option>)}
            </select>

            {!form.client_id && (
              <>
                <label style={S.label}>Client Token (for walk-in)</label>
                <input style={S.input} placeholder="e.g. #W001" value={form.client_token}
                  onChange={e => setForm(f => ({ ...f, client_token: e.target.value }))} />
              </>
            )}

            <label style={S.label}>Service *</label>
            <select style={S.sel} value={form.service_name}
              onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}>
              <option value=''>— Select service —</option>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>

            <label style={S.label}>Assign Staff</label>
            <select style={S.sel} value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
              <option value=''>— Unassigned —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role || 'staff'})</option>)}
            </select>

            <div style={S.grid2}>
              <div>
                <label style={S.label}>Date *</label>
                <input type="date" style={S.input} value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Time *</label>
                <select style={S.sel} value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}>
                  {TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <label style={S.label}>Amount ({sym})</label>
            <input type="number" style={S.input} placeholder="e.g. 2500"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

            <label style={S.label}>Notes</label>
            <textarea style={{ ...S.input, height:60, resize:'vertical' }} placeholder="Any special notes..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

            <button style={S.saveBtn} onClick={bookAppointment} disabled={saving}>
              {saving ? 'Booking...' : '📅 Book Appointment'}
            </button>
          </div>
        </div>
      )}

      {/* ── Appointment Detail Panel ── */}
      {selected && (
        <>
          <div style={S.panelOv} onClick={() => setSelected(null)} />
          <div style={S.panel}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700 }}>Appointment</div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            {/* Token + status */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:32, fontWeight:800, color:'#8b2252', marginBottom:8 }}>{selected.client_token}</div>
              <span style={{ ...S.badge(selected.status), fontSize:13, padding:'5px 16px' }}>{selected.status}</span>
            </div>

            {/* Details */}
            {[
              ['Service',  selected.service_name || '—'],
              ['Staff',    selected.employees?.name || 'Unassigned'],
              ['Date',     new Date(selected.date+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long'})],
              ['Time',     timeStr(selected.start_time)],
              ['Amount',   selected.amount ? sym+selected.amount.toLocaleString() : '—'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f5f3f0', fontSize:13 }}>
                <span style={{ color:'#888' }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}

            {selected.notes && (
              <div style={{ background:'#faf9f7', borderRadius:10, padding:12, marginTop:12, fontSize:13, color:'#555' }}>
                📝 {selected.notes}
              </div>
            )}

            {/* Update status */}
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#888', marginBottom:10, textTransform:'uppercase', letterSpacing:'1px' }}>
                Update Status
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {STATUSES.map(s => (
                  <button key={s} style={S.statusBtn(selected.status===s, s)}
                    onClick={() => updateStatus(selected, s)}
                    disabled={updating[selected.id]}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete */}
            <button onClick={() => deleteAppointment(selected.id)}
              style={{ marginTop:20, width:'100%', padding:'10px', background:'transparent', color:'#ef4444', border:'1px solid #ef4444', borderRadius:10, fontSize:13, cursor:'pointer', fontWeight:600 }}>
              🗑 Cancel Appointment
            </button>
          </div>
        </>
      )}
    </div>
  )
}
