import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STAGES = [
  { id: 'new',             label: '🆕 New',          color: '#6366f1' },
  { id: 'contacted',       label: '📞 Contacted',     color: '#f59e0b' },
  { id: 'appointment_set', label: '📅 Appt Set',      color: '#3b82f6' },
  { id: 'serving',         label: '✂️ Serving',       color: '#10b981' },
  { id: 'done',            label: '✅ Done',           color: '#6b7280' },
  { id: 'converted',       label: '⭐ Converted',     color: '#8b5cf6' },
]

const SOURCES = [
  { value: 'instagram',  label: '📸 Instagram' },
  { value: 'facebook',   label: '👥 Facebook' },
  { value: 'whatsapp',   label: '💬 WhatsApp' },
  { value: 'google',     label: '🔍 Google' },
  { value: 'walkin',     label: '🚶 Walk-in' },
  { value: 'referral',   label: '🤝 Referral' },
  { value: 'phone',      label: '📞 Phone' },
]

const SOURCE_ICONS = {
  instagram:'📸', facebook:'👥', whatsapp:'💬',
  google:'🔍', walkin:'🚶', referral:'🤝', phone:'📞'
}

export default function LeadPipeline() {
  const { salonId, currencySymbol } = useAuth()
  const sym = currencySymbol || '₹'

  const [leads, setLeads]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [filterSrc, setFilterSrc] = useState('all')
  const [moving, setMoving]       = useState({})

  // Add lead form
  const [form, setForm] = useState({ name:'', phone:'', source:'instagram', service:'', note:'' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (salonId) fetchLeads() }, [salonId])

  async function fetchLeads() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('fetchLeads:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addLead() {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          salon_id: salonId,
          name:     form.name.trim(),
          phone:    form.phone.trim() || null,
          source:   form.source,
          service:  form.service.trim() || null,
          note:     form.note.trim() || null,
          status:   'new',
        })
        .select().single()
      if (error) throw error
      setLeads(l => [data, ...l])
      setForm({ name:'', phone:'', source:'instagram', service:'', note:'' })
      setShowAdd(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function moveStage(lead, newStatus) {
    setMoving(m => ({ ...m, [lead.id]: true }))
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id)
        .select().single()
      if (error) throw error
      setLeads(l => l.map(x => x.id === lead.id ? data : x))
      if (selected?.id === lead.id) setSelected(data)
    } catch (err) {
      console.error('moveStage:', err.message)
    } finally {
      setMoving(m => ({ ...m, [lead.id]: false }))
    }
  }

  async function addNote(leadId, note) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ note })
        .eq('id', leadId)
        .select().single()
      if (error) throw error
      setLeads(l => l.map(x => x.id === leadId ? data : x))
      if (selected?.id === leadId) setSelected(data)
    } catch (err) {
      console.error('addNote:', err.message)
    }
  }

  async function deleteLead(id) {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    setLeads(l => l.filter(x => x.id !== id))
    setSelected(null)
  }

  // Filter
  const filtered = leads.filter(l => filterSrc === 'all' || l.source === filterSrc)

  // Group by stage
  function stageLeads(stageId) {
    return filtered.filter(l => (l.status || 'new') === stageId)
  }

  // Stats
  const totalValue    = leads.filter(l=>l.amount).reduce((s,l)=>s+(l.amount||0),0)
  const convertedCount = leads.filter(l=>l.status==='converted').length
  const convRate      = leads.length ? Math.round((convertedCount/leads.length)*100) : 0

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
    filters: { display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' },
    fBtn:    (a) => ({ padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:500, background:a?'#8b2252':'#f5f3f0', color:a?'#fff':'#666' }),
    board:   { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, overflowX:'auto', minWidth:900 },
    col:     { background:'#f5f3f0', borderRadius:14, padding:12, minHeight:200 },
    colHead: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
    colTitle:{ fontSize:12, fontWeight:700, color:'#555' },
    colCount:{ fontSize:11, background:'#fff', borderRadius:10, padding:'2px 8px', color:'#888', fontWeight:600 },
    card:    { background:'#fff', borderRadius:10, padding:12, marginBottom:8, cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'box-shadow .2s' },
    cardName:{ fontSize:13, fontWeight:700, color:'#1a0a0a', marginBottom:4 },
    cardSrc: { fontSize:11, color:'#888', marginBottom:6 },
    cardAmt: { fontSize:12, fontWeight:700, color:'#8b2252' },
    // Modal
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    modal:   { background:'#fff', borderRadius:20, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', padding:28 },
    label:   { display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
    input:   { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:14, color:'#1a0a0a', background:'#faf9f7' },
    sel:     { width:'100%', padding:'10px 14px', border:'1.5px solid #e8e4df', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:14, color:'#1a0a0a', background:'#faf9f7' },
    saveBtn: { width:'100%', padding:'12px', background:'#8b2252', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer' },
    err:     { background:'#fff0f0', border:'1px solid #fcc', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#c00', marginBottom:12 },
    // Detail panel
    panel:   { position:'fixed', right:0, top:0, width:380, height:'100vh', background:'#fff', boxShadow:'-4px 0 24px rgba(0,0,0,0.1)', zIndex:100, overflowY:'auto', padding:24 },
    panelOv: { position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', zIndex:99 },
    stageBtn:(a,c)=>({ padding:'6px 12px', borderRadius:20, border: a?'2px solid '+c:'1.5px solid #e8e4df', background:a?c+'20':'transparent', color:a?c:'#888', cursor:'pointer', fontSize:11, fontWeight:a?700:500 }),
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'#888',flexDirection:'column',gap:12}}>
      <div style={{fontSize:32}}>⏳</div>Loading leads...
    </div>
  )

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Lead Pipeline</div>
          <div style={{fontSize:13,color:'#888',marginTop:2}}>{leads.length} total leads</div>
        </div>
        <button style={S.addBtn} onClick={()=>setShowAdd(true)}>+ Add Lead</button>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[
          { label:'TOTAL LEADS',   value: leads.length },
          { label:'CONVERTED',     value: convertedCount },
          { label:'CONV. RATE',    value: convRate+'%' },
          { label:'PIPELINE VALUE',value: sym+(totalValue/1000).toFixed(1)+'k' },
        ].map(s=>(
          <div key={s.label} style={S.stat}>
            <div style={S.statL}>{s.label}</div>
            <div style={S.statV}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Source filters */}
      <div style={S.filters}>
        <button style={S.fBtn(filterSrc==='all')} onClick={()=>setFilterSrc('all')}>All ({leads.length})</button>
        {SOURCES.map(src => {
          const count = leads.filter(l=>l.source===src.value).length
          if (!count) return null
          return (
            <button key={src.value} style={S.fBtn(filterSrc===src.value)} onClick={()=>setFilterSrc(src.value)}>
              {src.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Kanban board */}
      <div style={{overflowX:'auto'}}>
        <div style={S.board}>
          {STAGES.map(stage => {
            const cards = stageLeads(stage.id)
            return (
              <div key={stage.id} style={S.col}>
                <div style={S.colHead}>
                  <div style={{...S.colTitle, color: stage.color}}>{stage.label}</div>
                  <span style={S.colCount}>{cards.length}</span>
                </div>

                {cards.length === 0 && (
                  <div style={{textAlign:'center',color:'#ccc',fontSize:12,padding:'20px 0'}}>Empty</div>
                )}

                {cards.map(lead => (
                  <div key={lead.id} style={S.card} onClick={()=>setSelected(lead)}>
                    <div style={S.cardName}>{lead.name}</div>
                    <div style={S.cardSrc}>
                      {SOURCE_ICONS[lead.source]||'📋'} {lead.source}
                      {lead.service && <span style={{color:'#aaa'}}> · {lead.service}</span>}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      {lead.amount ? <div style={S.cardAmt}>{sym}{lead.amount.toLocaleString()}</div> : <div/>}
                      <div style={{fontSize:10,color:'#bbb'}}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </div>
                    </div>
                    {moving[lead.id] && <div style={{fontSize:10,color:'#8b2252',marginTop:4}}>Moving...</div>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Add Lead Modal ── */}
      {showAdd && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={S.modal}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:700}}>+ Add New Lead</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>✕</button>
            </div>
            {formError && <div style={S.err}>⚠️ {formError}</div>}
            <label style={S.label}>Name *</label>
            <input style={S.input} placeholder="Client name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <label style={S.label}>Phone</label>
            <input style={S.input} placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            <label style={S.label}>Source</label>
            <select style={S.sel} value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
              {SOURCES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <label style={S.label}>Service Interested In</label>
            <input style={S.input} placeholder="e.g. Bridal Package, Hair Color" value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} />
            <label style={S.label}>Note</label>
            <textarea style={{...S.input,height:70,resize:'vertical'}} placeholder="Any notes..." value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
            <button style={S.saveBtn} onClick={addLead} disabled={saving}>
              {saving ? 'Adding...' : '+ Add Lead'}
            </button>
          </div>
        </div>
      )}

      {/* ── Lead Detail Panel ── */}
      {selected && (
        <>
          <div style={S.panelOv} onClick={()=>setSelected(null)} />
          <div style={S.panel}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:17,fontWeight:700}}>{selected.name}</div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888'}}>✕</button>
            </div>

            {/* Info */}
            {[
              ['Source',  (SOURCE_ICONS[selected.source]||'📋')+' '+selected.source],
              ['Phone',   selected.phone || '—'],
              ['Service', selected.service || '—'],
              ['Added',   new Date(selected.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f5f3f0',fontSize:13}}>
                <span style={{color:'#888'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}

            {/* Move stage */}
            <div style={{marginTop:20,marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:'#888',marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Move to Stage</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {STAGES.map(stage=>(
                  <button key={stage.id}
                    style={S.stageBtn((selected.status||'new')===stage.id, stage.color)}
                    onClick={()=>moveStage(selected, stage.id)}
                    disabled={moving[selected.id]}>
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'#888',marginBottom:8,textTransform:'uppercase',letterSpacing:'1px'}}>Notes</div>
              <NoteEditor lead={selected} onSave={addNote} />
            </div>

            {/* Delete */}
            <button onClick={()=>deleteLead(selected.id)}
              style={{marginTop:20,width:'100%',padding:'10px',background:'transparent',color:'#ef4444',border:'1px solid #ef4444',borderRadius:10,fontSize:13,cursor:'pointer',fontWeight:600}}>
              🗑 Delete Lead
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Note editor component ─────────────────────────────────────
function NoteEditor({ lead, onSave }) {
  const [text, setText] = useState(lead.note || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setText(lead.note || '') }, [lead.id])

  async function save() {
    await onSave(lead.id, text)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <textarea
        style={{width:'100%',padding:'10px',border:'1.5px solid #e8e4df',borderRadius:10,fontSize:13,outline:'none',resize:'vertical',height:80,boxSizing:'border-box',color:'#1a0a0a',background:'#faf9f7'}}
        placeholder="Add a note..."
        value={text}
        onChange={e=>setText(e.target.value)}
      />
      <button onClick={save}
        style={{marginTop:6,padding:'7px 18px',background: saved?'#10b981':'#8b2252',color:'#fff',border:'none',borderRadius:8,fontSize:13,cursor:'pointer',fontWeight:600}}>
        {saved ? '✅ Saved!' : 'Save Note'}
      </button>
    </div>
  )
}
