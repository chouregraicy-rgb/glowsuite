import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SOURCE_ICONS = {
  instagram: '📸', facebook: '👥', whatsapp: '💬',
  google: '🔍', walkin: '🚶', referral: '🤝',
  'walk-in': '🚶', phone: '📞'
}

const STATUS_COLORS = {
  new: '#6366f1', contacted: '#f59e0b', appointment_set: '#3b82f6',
  serving: '#10b981', done: '#6b7280', converted: '#8b5cf6',
  booked: '#3b82f6', confirmed: '#10b981', cancelled: '#ef4444'
}

export default function DashboardHome({ sym }) {
  const { salonId, currencySymbol } = useAuth()
  const currency = sym || currencySymbol || '₹'

  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState({ todayRevenue:0, revenueChange:0, clientsServed:0, walkIns:0, openLeads:0, hotLeads:0, staffOnDuty:0, staffTotal:0, absentCount:0 })
  const [appointments, setAppointments] = useState([])
  const [leads, setLeads]               = useState([])
  const [staff, setStaff]               = useState([])

  useEffect(() => { if (salonId) fetchAll() }, [salonId])

  function fmt(n) {
    if (!n) return currency + '0'
    if (n >= 100000) return currency + (n/100000).toFixed(1) + 'L'
    if (n >= 1000)   return currency + (n/1000).toFixed(1) + 'k'
    return currency + n.toLocaleString()
  }

  function timeStr(t) {
    if (!t) return ''
    try { return new Date('2000-01-01T' + t).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }
    catch { return t }
  }

  async function fetchAll() {
    setLoading(true)
    try {
      const today     = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0]

      // Revenue today
      const { data: todayInv } = await supabase.from('invoices').select('total,payment_mode')
        .eq('salon_id', salonId).eq('status','paid')
        .gte('created_at', today+'T00:00:00').lte('created_at', today+'T23:59:59')

      const { data: yestInv } = await supabase.from('invoices').select('total')
        .eq('salon_id', salonId).eq('status','paid')
        .gte('created_at', yesterday+'T00:00:00').lte('created_at', yesterday+'T23:59:59')

      const todayRev  = (todayInv||[]).reduce((s,i)=>s+(i.total||0),0)
      const yestRev   = (yestInv||[]).reduce((s,i)=>s+(i.total||0),0)
      const revChange = yestRev>0 ? Math.round(((todayRev-yestRev)/yestRev)*100) : 0
      const walkIns   = (todayInv||[]).filter(i=>i.payment_mode==='cash').length

      // Leads
      const { count: openLeads } = await supabase.from('leads').select('*',{count:'exact',head:true})
        .eq('salon_id',salonId).in('status',['new','contacted','appointment_set'])
      const { count: hotLeads } = await supabase.from('leads').select('*',{count:'exact',head:true})
        .eq('salon_id',salonId).eq('status','appointment_set')

      // Staff
      const { data: allStaff } = await supabase.from('employees').select('id,name,role,specializations')
        .eq('salon_id',salonId).eq('status','active')
      const { data: attend } = await supabase.from('attendance').select('employee_id,status,check_in')
        .eq('salon_id',salonId).eq('date',today)

      const presentIds = new Set((attend||[]).filter(a=>a.status==='present'||a.status==='half').map(a=>a.employee_id))
      const absentCount = (allStaff||[]).filter(s=>!presentIds.has(s.id)).length
      const attByEmp = {}
      ;(attend||[]).forEach(a=>{attByEmp[a.employee_id]=a})

      setStats({ todayRevenue:todayRev, revenueChange:revChange, clientsServed:(todayInv||[]).length,
        walkIns, openLeads:openLeads||0, hotLeads:hotLeads||0,
        staffOnDuty:(allStaff||[]).length-absentCount, staffTotal:(allStaff||[]).length, absentCount })

      setStaff((allStaff||[]).map(e=>({
        ...e,
        attendance: attByEmp[e.id]?.status||'absent',
        initials: e.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
      })))

      // Appointments today
      const { data: apts } = await supabase.from('appointments')
        .select('id,start_time,status,service_name,amount,client_token,employees(name)')
        .eq('salon_id',salonId).eq('date',today).order('start_time').limit(8)
      setAppointments(apts||[])

      // Recent leads
      const { data: recentLeads } = await supabase.from('leads')
        .select('id,name,source,status,created_at').eq('salon_id',salonId)
        .order('created_at',{ascending:false}).limit(6)
      setLeads(recentLeads||[])

    } catch(err) { console.error('Dashboard error:', err) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#888',fontSize:15,flexDirection:'column',gap:12}}>
      <div style={{fontSize:32}}>⏳</div>Loading live data...
    </div>
  )

  const STAT_CARDS = [
    { label:"TODAY'S REVENUE", value:fmt(stats.todayRevenue),
      sub: (stats.revenueChange>=0?'↑ +':'↓ ')+Math.abs(stats.revenueChange)+'% vs yesterday',
      color: stats.revenueChange>=0?'#10b981':'#ef4444' },
    { label:'CLIENTS SERVED', value:stats.clientsServed, sub:`↑ +${stats.walkIns} walk-ins`, color:'#10b981' },
    { label:'OPEN LEADS', value:stats.openLeads, sub:`↑ ${stats.hotLeads} hot leads`, color:'#f59e0b' },
    { label:'STAFF ON DUTY', value:`${stats.staffOnDuty}/${stats.staffTotal}`,
      sub: stats.absentCount>0?`↓ ${stats.absentCount} absent`:'✓ Full team',
      color: stats.absentCount>0?'#ef4444':'#10b981' },
  ]

  return (
    <div>
      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,marginBottom:28}}>
        {STAT_CARDS.map(c=>(
          <div key={c.label} style={{background:'#fff',borderRadius:16,padding:'20px 24px',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:11,fontWeight:600,color:'#aaa',letterSpacing:'1px',marginBottom:8}}>{c.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:'#1a0a0a',marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:12,color:c.color,fontWeight:500}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>

        {/* Appointments */}
        <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:16}}>Today's appointments</div>
            <button onClick={fetchAll} style={{fontSize:11,color:'#8b2252',background:'none',border:'none',cursor:'pointer'}}>↻ Refresh</button>
          </div>
          {appointments.length===0 ? (
            <div style={{textAlign:'center',color:'#aaa',padding:'32px 0',fontSize:14}}>No appointments today yet</div>
          ) : appointments.map(apt=>(
            <div key={apt.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f5f3f0'}}>
              <div style={{background:'#f5f3f0',borderRadius:8,padding:'4px 8px',fontSize:11,fontWeight:700,color:'#8b2252',minWidth:52,textAlign:'center'}}>
                {apt.client_token||'#???'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{apt.service_name||'Service'}</div>
                <div style={{fontSize:11,color:'#888'}}>✂️ {apt.employees?.name||'Unassigned'}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:12,color:'#555',marginBottom:2}}>{timeStr(apt.start_time)}</div>
                <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:(STATUS_COLORS[apt.status]||'#888')+'20',color:STATUS_COLORS[apt.status]||'#888'}}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Leads */}
        <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>Lead activity</div>
          {leads.length===0 ? (
            <div style={{textAlign:'center',color:'#aaa',padding:'32px 0',fontSize:14}}>No leads yet — add your first lead!</div>
          ) : leads.map(lead=>(
            <div key={lead.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f5f3f0'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#f5f3f0',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#8b2252',flexShrink:0}}>
                {lead.name?.charAt(0)?.toUpperCase()||'?'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{lead.name}</div>
                <div style={{fontSize:11,color:'#888'}}>{SOURCE_ICONS[lead.source]||'📋'} {lead.source}</div>
              </div>
              <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:(STATUS_COLORS[lead.status]||'#888')+'20',color:STATUS_COLORS[lead.status]||'#888'}}>
                {lead.status?.replace('_',' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff */}
      <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>Staff on duty today</div>
        {staff.length===0 ? (
          <div style={{textAlign:'center',color:'#aaa',padding:'24px 0',fontSize:14}}>No staff added yet</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
            {staff.map(emp=>(
              <div key={emp.id} style={{background:'#faf9f7',borderRadius:12,padding:16,textAlign:'center'}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:emp.attendance==='absent'?'#fee2e2':'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',fontWeight:700,fontSize:15,color:emp.attendance==='absent'?'#ef4444':'#10b981'}}>
                  {emp.initials}
                </div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{emp.name}</div>
                <div style={{fontSize:11,color:'#888',marginBottom:4}}>{emp.role||'Staff'}</div>
                <div style={{fontSize:11,fontWeight:600,color:emp.attendance==='absent'?'#ef4444':'#10b981'}}>
                  {emp.attendance==='absent'?'● Absent':'● On duty'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
