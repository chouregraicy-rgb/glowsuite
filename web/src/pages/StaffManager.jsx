import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AddStaffModal from '../components/AddStaffModal'

export default function StaffManager() {
  const { salonId, currencySymbol } = useAuth()
  const sym = currencySymbol || '₹'

  const [staff, setStaff]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [selected, setSelected]     = useState(null)
  const [view, setView]             = useState('cards') // 'cards' | 'leaderboard'

  useEffect(() => { if (salonId) fetchStaff() }, [salonId])

  async function fetchStaff() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('salon_id', salonId)
        .order('name')

      if (error) throw error
      setStaff(data || [])
    } catch (err) {
      console.error('fetchStaff:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function fmt(n) {
    if (!n) return sym + '0'
    if (n >= 1000) return sym + (n/1000).toFixed(1) + 'k'
    return sym + n
  }

  const totalSalary = staff.reduce((s, e) => s + (e.base_salary || 0), 0)

  // ── Styles ─────────────────────────────────────────────────────
  const P = {
    wrap:    { padding: '0 4px' },
    header:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
    title:   { fontSize:22, fontWeight:700, color:'#1a0a0a' },
    stats:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
    stat:    { background:'#fff', borderRadius:14, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)' },
    statL:   { fontSize:11, fontWeight:600, color:'#aaa', letterSpacing:'1px', marginBottom:6 },
    statV:   { fontSize:24, fontWeight:700, color:'#1a0a0a' },
    topBar:  { display:'flex', gap:8, marginBottom:20, alignItems:'center' },
    viewBtn: (a) => ({ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, background:a?'#8b2252':'#f5f3f0', color:a?'#fff':'#666' }),
    addBtn:  { marginLeft:'auto', padding:'8px 18px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' },
    grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
    card:    { background:'#fff', borderRadius:16, padding:20, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', cursor:'pointer', transition:'box-shadow .2s' },
    avatar:  (color) => ({ width:52, height:52, borderRadius:'50%', background:color||'#f5f3f0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, color:'#fff', flexShrink:0 }),
    badge:   (c) => ({ fontSize:10, padding:'2px 8px', borderRadius:12, background:c+'20', color:c, fontWeight:600 }),
    chip:    { fontSize:11, padding:'3px 8px', borderRadius:8, background:'#f5f3f0', color:'#666' },
    empty:   { textAlign:'center', padding:'60px 20px', color:'#aaa' },
    detail:  { position:'fixed', right:0, top:0, width:380, height:'100vh', background:'#fff', boxShadow:'-4px 0 24px rgba(0,0,0,0.1)', zIndex:100, overflowY:'auto', padding:28 },
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:99 },
  }

  const COLORS = ['#8b2252','#2563eb','#059669','#d97706','#7c3aed','#db2777']

  function initials(name) {
    return (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
  }

  function statusColor(s) {
    return s==='active'?'#10b981':s==='transferred'?'#f59e0b':'#ef4444'
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'#888',flexDirection:'column',gap:12}}>
      <div style={{fontSize:32}}>⏳</div>Loading staff...
    </div>
  )

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Staff Manager</div>
          <div style={{fontSize:13,color:'#888',marginTop:2}}>{staff.length} team members</div>
        </div>
      </div>

      {/* Stats */}
      <div style={P.stats}>
        {[
          { label:'TOTAL STAFF',    value: staff.length },
          { label:'ACTIVE',         value: staff.filter(s=>s.status==='active').length },
          { label:'MONTHLY PAYOUT', value: fmt(totalSalary) },
          { label:'AVG INCENTIVE',  value: staff.length ? Math.round(staff.reduce((s,e)=>s+(e.incentive_rate||0),0)/staff.length)+'%' : '0%' },
        ].map(s => (
          <div key={s.label} style={P.stat}>
            <div style={P.statL}>{s.label}</div>
            <div style={P.statV}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={P.topBar}>
        <button style={P.viewBtn(view==='cards')} onClick={()=>setView('cards')}>👤 Cards</button>
        <button style={P.viewBtn(view==='leaderboard')} onClick={()=>setView('leaderboard')}>🏆 Leaderboard</button>
        <button style={P.addBtn} onClick={()=>setShowAdd(true)}>+ Add Staff</button>
      </div>

      {/* Empty state */}
      {staff.length === 0 && (
        <div style={P.empty}>
          <div style={{fontSize:48,marginBottom:12}}>👥</div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:8,color:'#1a0a0a'}}>No staff yet</div>
          <div style={{fontSize:14,marginBottom:20}}>Add your first team member to get started</div>
          <button style={{...P.addBtn, marginLeft:0, padding:'10px 24px', fontSize:14}} onClick={()=>setShowAdd(true)}>
            + Add First Staff Member
          </button>
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && staff.length > 0 && (
        <div style={P.grid}>
          {staff.map((emp, i) => (
            <div key={emp.id} style={P.card} onClick={()=>setSelected(emp)}>
              <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
                <div style={P.avatar(COLORS[i%COLORS.length])}>{initials(emp.name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#1a0a0a',marginBottom:2}}>{emp.name}</div>
                  <div style={{fontSize:12,color:'#888',marginBottom:6}}>{emp.role || 'Staff'}</div>
                  <span style={P.badge(statusColor(emp.status||'active'))}>
                    {emp.status||'active'}
                  </span>
                </div>
              </div>

              {/* Specializations */}
              {emp.specializations?.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
                  {emp.specializations.slice(0,3).map(s=>(
                    <span key={s} style={P.chip}>{s}</span>
                  ))}
                  {emp.specializations.length > 3 && (
                    <span style={P.chip}>+{emp.specializations.length-3}</span>
                  )}
                </div>
              )}

              {/* Salary info */}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderTop:'1px solid #f0ede9',fontSize:13}}>
                <div>
                  <div style={{color:'#888',fontSize:11,marginBottom:2}}>Base Salary</div>
                  <div style={{fontWeight:700,color:'#1a0a0a'}}>{fmt(emp.base_salary)}/mo</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#888',fontSize:11,marginBottom:2}}>Incentive</div>
                  <div style={{fontWeight:700,color:'#8b2252'}}>{emp.incentive_rate||0}%</div>
                </div>
              </div>

              {emp.email && (
                <div style={{fontSize:11,color:'#aaa',marginTop:8}}>✉️ {emp.email}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard view */}
      {view === 'leaderboard' && staff.length > 0 && (
        <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>🏆 Staff Leaderboard</div>
          {staff.map((emp, i) => (
            <div key={emp.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid #f5f3f0',cursor:'pointer'}} onClick={()=>setSelected(emp)}>
              <div style={{fontSize:20,width:32,textAlign:'center'}}>
                {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
              </div>
              <div style={P.avatar(COLORS[i%COLORS.length])}>{initials(emp.name)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{emp.name}</div>
                <div style={{fontSize:12,color:'#888'}}>{emp.role||'Staff'}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:700,color:'#8b2252'}}>{fmt(emp.base_salary)}/mo</div>
                <div style={{fontSize:11,color:'#888'}}>{emp.incentive_rate||0}% incentive</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <>
          <div style={P.overlay} onClick={()=>setSelected(null)} />
          <div style={P.detail}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div style={{fontWeight:700,fontSize:18}}>Staff Details</div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>✕</button>
            </div>

            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{...P.avatar(COLORS[staff.indexOf(selected)%COLORS.length]),width:72,height:72,fontSize:24,margin:'0 auto 12px'}}>
                {initials(selected.name)}
              </div>
              <div style={{fontSize:18,fontWeight:700}}>{selected.name}</div>
              <div style={{fontSize:13,color:'#888',marginTop:4}}>{selected.role||'Staff'}</div>
              <span style={{...P.badge(statusColor(selected.status||'active')),marginTop:8,display:'inline-block'}}>
                {selected.status||'active'}
              </span>
            </div>

            {[
              ['Email', selected.email || '—'],
              ['Base Salary', fmt(selected.base_salary) + '/mo'],
              ['Incentive Rate', (selected.incentive_rate||0) + '%'],
              ['Salon ID', selected.salon_id?.slice(0,8) + '...'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f5f3f0',fontSize:13}}>
                <span style={{color:'#888'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}

            {selected.specializations?.length > 0 && (
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:600,color:'#888',marginBottom:8,textTransform:'uppercase',letterSpacing:'1px'}}>Specializations</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {selected.specializations.map(s=>(
                    <span key={s} style={{...P.chip,background:'#8b225215',color:'#8b2252'}}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Staff Modal */}
      {showAdd && (
        <AddStaffModal
          onClose={()=>setShowAdd(false)}
          onAdd={(emp)=>{ setStaff(s=>[...s, emp]); setShowAdd(false) }}
        />
      )}
    </div>
  )
}
