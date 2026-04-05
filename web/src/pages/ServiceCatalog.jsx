import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ALL_SERVICES, SERVICE_CATEGORIES, getServicesByCategory } from '../utils/services'

export default function ServiceCatalog() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [prices, setPrices] = useState({})

  const displayed = ALL_SERVICES.filter(s => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const catCounts = {}
  ALL_SERVICES.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1 })

  function getPrice(service) {
    return prices[service.id] ?? service.price
  }

  function updatePrice(id, val) {
    setPrices(p => ({ ...p, [id]: Number(val) }))
    setEditingId(null)
  }

  const totalServices = ALL_SERVICES.length
  const categories = SERVICE_CATEGORIES.length
  const avgPrice = Math.round(ALL_SERVICES.reduce((s, sv) => s + sv.price, 0) / ALL_SERVICES.filter(s => s.price > 0).length)

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Service Catalog</div>
          <div style={S.sub}>{totalServices} services across {categories} categories — click any price to customize</div>
        </div>
        <button style={S.addBtn}>+ Add Custom Service</button>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[
          { label: 'Total Services', value: totalServices, color: '#185FA5' },
          { label: 'Categories', value: categories, color: '#8B3A52' },
          { label: 'Avg Price', value: `${sym}${avgPrice.toLocaleString()}`, color: '#0F6E56' },
          { label: 'Popular Services', value: ALL_SERVICES.filter(s => s.popular).length, color: '#BA7517' },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category pills */}
      <div style={S.catRow}>
        <button style={{ ...S.catBtn, ...(activeCategory === 'all' ? S.catBtnOn : {}) }} onClick={() => setActiveCategory('all')}>
          ⭐ All ({totalServices})
        </button>
        {SERVICE_CATEGORIES.map(c => (
          <button key={c.id}
            style={{ ...S.catBtn, ...(activeCategory === c.id ? { background: c.bg, color: c.color, border: `0.5px solid ${c.color}` } : {}) }}
            onClick={() => setActiveCategory(c.id)}>
            {c.icon} {c.label} ({catCounts[c.id] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <input style={S.search} placeholder="🔍  Search services..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Services table */}
      <div style={S.table}>
        <div style={S.tableHeader}>
          <div style={{ flex: 3 }}>Service</div>
          <div style={{ flex: 1, textAlign: 'center' }}>Duration</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Price</div>
          <div style={{ flex: 1, textAlign: 'center' }}>Popular</div>
        </div>

        {SERVICE_CATEGORIES.filter(c => activeCategory === 'all' || activeCategory === c.id).map(cat => {
          const catServices = displayed.filter(s => s.category === cat.id)
          if (catServices.length === 0) return null
          return (
            <div key={cat.id}>
              <div style={{ ...S.catGroupHeader, background: cat.bg, color: cat.color }}>
                {cat.icon} {cat.label}
              </div>
              {catServices.map(service => (
                <div key={service.id} style={S.row}>
                  <div style={{ flex: 3 }}>
                    <div style={S.serviceName}>{service.name}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#6B6258' }}>
                    {service.duration} min
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    {editingId === service.id ? (
                      <input
                        style={S.priceInput}
                        defaultValue={getPrice(service)}
                        autoFocus
                        type="number"
                        onBlur={e => updatePrice(service.id, e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updatePrice(service.id, e.target.value)}
                      />
                    ) : (
                      <span style={S.price} onClick={() => setEditingId(service.id)}
                        title="Click to edit price">
                        {sym}{getPrice(service).toLocaleString()}
                        <span style={S.editHint}>✏️</span>
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    {service.popular && <span style={S.popularBadge}>⭐ Popular</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div style={S.hint}>💡 Click any price to customize it for your salon. Changes are saved locally — Supabase sync coming next.</div>
    </div>
  )
}

const INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0', ROSE = '#8B3A52'

const S = {
  wrap: { fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: INK },
  sub: { fontSize: 12, color: STONE, marginTop: 3 },
  addBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  catRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  catBtn: { padding: '6px 14px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE, whiteSpace: 'nowrap' },
  catBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  search: { width: '100%', padding: '9px 14px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', marginBottom: 16 },
  table: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '10px 16px', background: MIST, borderBottom: '0.5px solid #E8E0D8', fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px' },
  catGroupHeader: { padding: '8px 16px', fontSize: 12, fontWeight: 500, letterSpacing: '0.3px' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '0.5px solid #F8F5F0' },
  serviceName: { fontSize: 13, color: INK },
  price: { fontSize: 13, fontWeight: 500, color: '#0F6E56', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 },
  editHint: { fontSize: 10, opacity: 0.5 },
  priceInput: { width: 80, padding: '3px 8px', border: '1px solid #8B3A52', borderRadius: 6, fontSize: 13, textAlign: 'right', fontFamily: 'inherit', outline: 'none' },
  popularBadge: { fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#FAEEDA', color: '#BA7517', fontWeight: 500 },
  hint: { marginTop: 14, fontSize: 12, color: '#B0A89F', textAlign: 'center' },
}
