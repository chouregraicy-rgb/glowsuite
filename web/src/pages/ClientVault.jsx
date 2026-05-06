import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TAGS = ['VIP', 'Bridal', 'Regular', 'New', 'Loyal']
const TAG_COLORS = {
  VIP:     { bg:'#fef3c7', color:'#d97706' },
  Bridal:  { bg:'#fce7f3', color:'#db2777' },
  Regular: { bg:'#e0f2fe', color:'#0284c7' },
  New:     { bg:'#f0fdf4', color:'#16a34a' },
  Loyal:   { bg:'#ede9fe', color:'#7c3aed' },
}
const HAIR_TYPES = ['Normal','Oily','Dry','Curly','Wavy','Straight','Damaged','Color-treated']
const SKIN_TYPES = ['Normal','Oily','Dry','Combination','Sensitive','Mature']
const SOURCES    = ['Walk-in','Instagram','WhatsApp','Google','Referral','Facebook','Phone']
const COLORS     = ['#8b2252','#2563eb','#059669','#d97706','#7c3aed','#db2777','#0891b2']

function maskPhone(phone) {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return '••••••'
  return '+' + digits.slice(0,2) + ' XXXXX' + digits.slice(-4)
}

function initials(name) {
  return (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
}

// ── Assign Staff Sub-component ────────────────────────────────
function AssignStaff({ client, salonId, onUpdate }) {
  const [staff,  setStaff]  = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!salonId) return
    supabase
      .from('employees')
      .select('id, name, role')
      .eq('salon_id', salonId)
      .eq('status', 'active')
      .then(({ data }) => setStaff(data || []))
  }, [salonId])

  async function assign(empId) {
    if (!empId) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ assigned_staff_id: empId })
        .eq('id', client.id)
        .select()
        .single()
      if (error) throw error
      if (data) onUpdate(data)
    } catch (err) {
      console.error('assign staff:', err.message)
    } finally {
      setSaving(false)
    }
  }

  const current = staff.find(s => s.id === client.assigned_staff_id)

  return (
    <div>
      {current && (
        <div style={{ background:'#f0fdf4', borderRadius:8, padding:'8px 12px', marginBottom:8, fontSize:13, color:'#059669', fontWeight:600 }}>
          ✅ Currently assigned to: {current.name}
        </div>
      )}
      <select
        style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', background:'#faf9f7', color:'#1a0a0a', cursor:'pointer' }}
        value={client.assigned_staff_id || ''}
        onChange={e => assign(e.target.value)}
        disabled={saving}
      >
        <option value=''>— Select staff member —</option>
        {staff.map(s => (
          <option key={s.id} value={s.id}>{s.name} ({s.role || 'staff'})</option>
        ))}
      </select>
      {saving && <div style={{ fontSize:11, color:'#8b2252', marginTop:4 }}>Saving...</div>}
    </div>
  )
}

// ── Main ClientVault Component ────────────────────────────────
export default function ClientVault() {
  const { salonId, currencySymbol } = useAuth()
  const sym = currencySymbol || '₹'

  const [clients,   setClients]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [selected,  setSelected]  = useState(null)
  const [revealed,  setRevealed]  = useState({})
  const [showAdd,   setShowAdd]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [formErr,   setFormErr]   = useState('')

  const [form, setForm] = useState({
    name:'', phone:'', email:'', source:'Walk-in',
    tags:[], hair_type:'', skin_type:'', allergies:'', notes:''
  })

  useEffect(() => { if (salonId) fetchClients() }, [salonId])

  async function fetchClients() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('fetchClients:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function generateToken(index) {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const letter = letters[Math.floor(index / 1000) % letters.length]
    const num = String(index % 1000).padStart(3, '0')
    return '#' + letter + num
  }

  async function addClient() {
    if (!form.name.trim()) { setFormErr('Name is required'); return }
    setSaving(true)
    setFormErr('')
    try {
      const token = generateToken(clients.length)
      const { data, error } = await supabase
        .from('clients')
        .insert({
          salon_id:      salonId,
          name:          form.name.trim(),
          phone:         form.phone.trim() || null,
          email:         form.email.trim() || null,
          source:        form.source,
          tags:          form.tags,
          hair_type:     form.hair_type || null,
          skin_type:     form.skin_type || null,
          allergies:     form.allergies.trim() || null,
          notes:         form.notes.trim() || null,
          token,
          loyalty_points: 0,
          total_spent:    0,
        })
        .select()
        .single()
      if (error) throw error
      setClients(c => [data, ...c])
      setForm({ name:'', phone:'', email:'', source:'Walk-in', tags:[], hair_type:'', skin_type:'', allergies:'', notes:'' })
      setShowAdd(false)
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleFormTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags, tag]
    }))
  }

  function toggleReveal(id) {
    setRevealed(r => ({ ...r, [id]: !r[id] }))
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.token?.includes(search.toUpperCase())
    const matchTag = filterTag === 'all' || (c.tags||[]).includes(filterTag)
    return matchSearch && matchTag
  })

  const totalSpent = clients.reduce((s,c) => s+(c.total_spent||0), 0)
  const vipCount   = clients.filter(c=>(c.tags||[]).includes('VIP')).length

  // ── Styles ──────────────────────────────────────────────────
  const S = {
    wrap:    { padding:'0 4px' },
    header:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
    title:   { fontSize:22, fontWeight:700, color:'#1a0a0a' },
    addBtn:  { padding:'8px 20px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' },
    stats:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
    stat:    { background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)' },
    statL:   { fontSize:11, color:'#aaa', fontWeight:600, letterSpacing:'1px', marginBottom:4 },
    statV:   { fontSize:22, fontWeight:700, color:'#1a0a0a' },
    toolbar: { display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' },
    search:  { flex:1, minWidth:180, padding:'9px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', background:'#faf9f7' },
    fBtn:    (a) => ({ padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:500, background:a?'#8b2252':'#f5f3f0', color:a?'#fff':'#666' }),
    grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 },
    card:    { background:'#fff', borderRadius:16, padding:20, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', cursor:'pointer' },
    avatar:  (c) => ({ width:48, height:48, borderRadius:'50%', background:c, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:17, color:'#fff', flexShrink:0 }),
    token:   { fontSize:11, fontWeight:700, color:'#8b2252', background:'#fce7f3', padding:'2px 8px', borderRadius:8 },
    tag:     (t) => ({ fontSize:10, padding:'2px 8px', borderRadius:10, background:TAG_COLORS[t]?.bg||'#f5f3f0', color:TAG_COLORS[t]?.color||'#666', fontWeight:600 }),
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    modal:   { background:'#fff', borderRadius:20, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', padding:28 },
    label:   { display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:14 },
    input:   { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1a0a0a', background:'#faf9f7' },
    sel:     { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1a0a0a', background:'#faf9f7' },
    saveBtn: { width:'100%', padding:'12px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:20 },
    err:     { background:'#fff0f0', border:'1px solid #fcc', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#c00', marginBottom:12 },
    chip:    (a) => ({ padding:'5px 12px', borderRadius:20, border:a?'2px solid #8b2252':'1.5px solid #e8e4df', background:a?'#fce7f3':'transparent', color:a?'#8b2252':'#666', cursor:'pointer', fontSize:12, fontWeight:a?600:400 }),
    panel:   { position:'fixed', right:0, top:0, width:420, height:'100vh', background:'#fff', boxShadow:'-4px 0 24px rgba(0,0,0,0.1)', zIndex:100, overflowY:'auto', padding:24 },
    panelOv: { position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', zIndex:99 },
    row:     { display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f5f3f0', fontSize:13 },
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#888', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>⏳</div>
      Loading client vault...
    </div>
  )

  return (
    <div style={S.wrap}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Client Vault 🛡</div>
          <div style={{ fontSize:13, color:'#888', marginTop:2 }}>{clients.length} clients · Phone numbers encrypted</div>
        </div>
        <button style={S.addBtn} onClick={() => setShowAdd(true)}>+ Add Client</button>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[
          { label:'TOTAL CLIENTS', value: clients.length },
          { label:'VIP CLIENTS',   value: vipCount },
          { label:'TOTAL REVENUE', value: sym + (totalSpent/1000).toFixed(1) + 'k' },
          { label:'AVG SPEND',     value: clients.length ? sym + Math.round(totalSpent/clients.length).toLocaleString() : sym + '0' },
        ].map(s => (
          <div key={s.label} style={S.stat}>
            <div style={S.statL}>{s.label}</div>
            <div style={S.statV}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Shield notice */}
      <div style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:12, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#4338ca' }}>
        🛡 <strong>Client Shield Active</strong> — Phone numbers are masked for staff. Only owners can reveal.
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <input style={S.search} placeholder="🔍 Search by name or token..." value={search} onChange={e => setSearch(e.target.value)} />
        <button style={S.fBtn(filterTag==='all')} onClick={() => setFilterTag('all')}>All</button>
        {TAGS.map(t => (
          <button key={t} style={S.fBtn(filterTag===t)} onClick={() => setFilterTag(t)}>{t}</button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#aaa' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👤</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#1a0a0a', marginBottom:8 }}>
            {clients.length === 0 ? 'No clients yet' : 'No clients found'}
          </div>
          <div style={{ fontSize:14, marginBottom:20 }}>
            {clients.length === 0 ? 'Add your first client to get started' : 'Try a different search or filter'}
          </div>
          {clients.length === 0 && (
            <button style={{ ...S.addBtn, padding:'10px 28px', fontSize:14 }} onClick={() => setShowAdd(true)}>
              + Add First Client
            </button>
          )}
        </div>
      )}

      {/* Client grid */}
      <div style={S.grid}>
        {filtered.map((client, i) => {
          const isRevealed = revealed[client.id]
          return (
            <div key={client.id} style={S.card} onClick={() => setSelected(client)}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                <div style={S.avatar(COLORS[i % COLORS.length])}>{initials(client.name)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1a0a0a' }}>{client.name}</div>
                    {client.token && <span style={S.token}>{client.token}</span>}
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {(client.tags||[]).map(t => (
                      <span key={t} style={S.tag(t)}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone masking */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f5f3f0', borderRadius:8, padding:'7px 12px', marginBottom:10 }}>
                <span style={{ fontSize:13, color:'#555', fontFamily:'monospace' }}>
                  📱 {isRevealed ? (client.phone || 'No phone') : maskPhone(client.phone)}
                </span>
                {client.phone && (
                  <button
                    onClick={e => { e.stopPropagation(); toggleReveal(client.id) }}
                    style={{ fontSize:11, padding:'3px 10px', border:'none', borderRadius:6, background:isRevealed?'#8b2252':'#1a0a0a', color:'#fff', cursor:'pointer', fontWeight:600 }}
                  >
                    {isRevealed ? '🙈 Hide' : '👁 Reveal'}
                  </button>
                )}
              </div>

              {/* Mini stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, fontSize:12 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ color:'#888', marginBottom:2 }}>Spent</div>
                  <div style={{ fontWeight:700, color:'#8b2252' }}>{sym}{(client.total_spent||0).toLocaleString()}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ color:'#888', marginBottom:2 }}>Points</div>
                  <div style={{ fontWeight:700, color:'#6366f1' }}>{client.loyalty_points||0}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ color:'#888', marginBottom:2 }}>Source</div>
                  <div style={{ fontWeight:600, color:'#555' }}>{client.source||'—'}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add Client Modal ── */}
      {showAdd && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={S.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>+ Add New Client</div>
              <button onClick={() => setShowAdd(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            {formErr && <div style={S.err}>⚠️ {formErr}</div>}

            <label style={S.label}>Full Name *</label>
            <input style={S.input} placeholder="e.g. Priya Sharma" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />

            <label style={S.label}>Phone</label>
            <input style={S.input} placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />

            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="priya@example.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />

            <label style={S.label}>Source</label>
            <select style={S.sel} value={form.source} onChange={e => setForm(f=>({...f,source:e.target.value}))}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>

            <label style={S.label}>Tags</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:4 }}>
              {TAGS.map(t => (
                <button key={t} style={S.chip(form.tags.includes(t))} onClick={() => toggleFormTag(t)}>{t}</button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={S.label}>Hair Type</label>
                <select style={S.sel} value={form.hair_type} onChange={e => setForm(f=>({...f,hair_type:e.target.value}))}>
                  <option value=''>Select...</option>
                  {HAIR_TYPES.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Skin Type</label>
                <select style={S.sel} value={form.skin_type} onChange={e => setForm(f=>({...f,skin_type:e.target.value}))}>
                  <option value=''>Select...</option>
                  {SKIN_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <label style={S.label}>Allergies / Sensitivities</label>
            <input style={S.input} placeholder="e.g. Ammonia, Peanuts" value={form.allergies} onChange={e => setForm(f=>({...f,allergies:e.target.value}))} />

            <label style={S.label}>Notes</label>
            <textarea style={{ ...S.input, height:60, resize:'vertical' }} placeholder="Any special notes..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />

            <button style={S.saveBtn} onClick={addClient} disabled={saving}>
              {saving ? 'Adding...' : '+ Add Client'}
            </button>
          </div>
        </div>
      )}

      {/* ── Client Detail Panel ── */}
      {selected && (
        <>
          <div style={S.panelOv} onClick={() => setSelected(null)} />
          <div style={S.panel}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700 }}>Client Profile</div>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            {/* Avatar */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ ...S.avatar(COLORS[clients.indexOf(selected) % COLORS.length]), width:64, height:64, fontSize:22, margin:'0 auto 10px' }}>
                {initials(selected.name)}
              </div>
              <div style={{ fontSize:18, fontWeight:700 }}>{selected.name}</div>
              {selected.token && (
                <div style={{ ...S.token, display:'inline-block', marginTop:6 }}>{selected.token}</div>
              )}
              <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:8, flexWrap:'wrap' }}>
                {(selected.tags||[]).map(t => <span key={t} style={S.tag(t)}>{t}</span>)}
              </div>
            </div>

            {/* Protected phone */}
            <div style={{ background:'#eef2ff', borderRadius:12, padding:14, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:11, color:'#6366f1', fontWeight:600, marginBottom:4 }}>🛡 PROTECTED PHONE</div>
                <div style={{ fontSize:14, fontFamily:'monospace', fontWeight:600 }}>
                  {revealed[selected.id] ? (selected.phone || 'No phone') : maskPhone(selected.phone)}
                </div>
              </div>
              {selected.phone && (
                <button
                  onClick={() => toggleReveal(selected.id)}
                  style={{ padding:'6px 14px', background:revealed[selected.id]?'#8b2252':'#6366f1', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}
                >
                  {revealed[selected.id] ? '🙈 Hide' : '👁 Reveal'}
                </button>
              )}
            </div>

            {/* Assign Staff */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#888', marginBottom:8, textTransform:'uppercase', letterSpacing:'1px' }}>
                👤 Assign Staff
              </div>
              <AssignStaff
                client={selected}
                salonId={salonId}
                onUpdate={(updated) => {
                  setClients(c => c.map(x => x.id === updated.id ? updated : x))
                  setSelected(updated)
                }}
              />
            </div>

            {/* Details */}
            {[
              ['Email',       selected.email      || '—'],
              ['Source',      selected.source     || '—'],
              ['Hair Type',   selected.hair_type  || '—'],
              ['Skin Type',   selected.skin_type  || '—'],
              ['Allergies',   selected.allergies  || '—'],
              ['Total Spent', sym + (selected.total_spent||0).toLocaleString()],
              ['Loyalty Pts', (selected.loyalty_points||0) + ' pts'],
              ['Joined',      new Date(selected.created_at).toLocaleDateString('en-IN',{ day:'numeric', month:'long', year:'numeric' })],
            ].map(([k,v]) => (
              <div key={k} style={S.row}>
                <span style={{ color:'#888' }}>{k}</span>
                <span style={{ fontWeight:600, maxWidth:220, textAlign:'right' }}>{v}</span>
              </div>
            ))}

            {/* Notes */}
            {selected.notes && (
              <div style={{ marginTop:16, background:'#faf9f7', borderRadius:10, padding:12, fontSize:13, color:'#555', lineHeight:1.6 }}>
                <div style={{ fontWeight:600, marginBottom:4, color:'#1a0a0a' }}>📝 Notes</div>
                {selected.notes}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )
}
