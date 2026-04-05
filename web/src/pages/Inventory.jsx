import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '📦' },
  { id: 'hair', label: 'Hair', icon: '✂️' },
  { id: 'skin', label: 'Skin', icon: '✨' },
  { id: 'spa', label: 'Spa', icon: '🧖' },
  { id: 'nails', label: 'Nails', icon: '💅' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
  { id: 'equipment', label: 'Equipment', icon: '🔧' },
  { id: 'disposables', label: 'Disposables', icon: '🧻' },
]

const MOCK_INVENTORY = [
  // Hair
  { id: 1, name: 'Wella Color Cream — Ash Blonde', category: 'hair', unit: 'tube', quantity: 8, minStock: 5, costPerUnit: 450, sellingPrice: 0, barcode: 'WCC-001', supplier: 'Wella India', lastRestocked: '2026-03-15', usedThisMonth: 12 },
  { id: 2, name: 'Schwarzkopf BLOND ME Bleach', category: 'hair', unit: 'sachet', quantity: 3, minStock: 8, costPerUnit: 380, sellingPrice: 0, barcode: 'SKB-002', supplier: 'Schwarzkopf', lastRestocked: '2026-03-10', usedThisMonth: 18 },
  { id: 3, name: 'Olaplex No.3 Hair Perfector', category: 'hair', unit: 'bottle', quantity: 6, minStock: 4, costPerUnit: 2200, sellingPrice: 3500, barcode: 'OLP-003', supplier: 'Olaplex', lastRestocked: '2026-03-20', usedThisMonth: 5 },
  { id: 4, name: 'Keratin Treatment Solution', category: 'hair', unit: 'ml', quantity: 500, minStock: 300, costPerUnit: 2, sellingPrice: 0, barcode: 'KRT-004', supplier: 'Keratin World', lastRestocked: '2026-03-01', usedThisMonth: 1200 },
  { id: 5, name: 'Loreal Developer 20 Vol', category: 'hair', unit: 'ml', quantity: 2000, minStock: 500, costPerUnit: 0.5, sellingPrice: 0, barcode: 'LOR-005', supplier: 'Loreal Pro', lastRestocked: '2026-03-25', usedThisMonth: 800 },
  { id: 6, name: 'Toning Shampoo — Silver', category: 'hair', unit: 'bottle', quantity: 4, minStock: 3, costPerUnit: 850, sellingPrice: 1200, barcode: 'TOS-006', supplier: 'Fanola', lastRestocked: '2026-02-28', usedThisMonth: 3 },

  // Skin
  { id: 7, name: 'Dermalogica Daily Cleanser', category: 'skin', unit: 'bottle', quantity: 3, minStock: 4, costPerUnit: 1800, sellingPrice: 2800, barcode: 'DRM-007', supplier: 'Dermalogica', lastRestocked: '2026-03-05', usedThisMonth: 4 },
  { id: 8, name: 'Vitamin C Serum', category: 'skin', unit: 'bottle', quantity: 7, minStock: 3, costPerUnit: 1200, sellingPrice: 2200, barcode: 'VCS-008', supplier: 'The Ordinary', lastRestocked: '2026-03-18', usedThisMonth: 6 },
  { id: 9, name: 'AHA BHA Peel Solution', category: 'skin', unit: 'bottle', quantity: 2, minStock: 3, costPerUnit: 950, sellingPrice: 0, barcode: 'AHA-009', supplier: 'Medik8', lastRestocked: '2026-02-15', usedThisMonth: 8 },
  { id: 10, name: 'Hydrating Facial Mask', category: 'skin', unit: 'sheet', quantity: 45, minStock: 20, costPerUnit: 85, sellingPrice: 0, barcode: 'HFM-010', supplier: 'Dr. Jart', lastRestocked: '2026-03-22', usedThisMonth: 32 },

  // Spa
  { id: 11, name: 'Lavender Massage Oil', category: 'spa', unit: 'ml', quantity: 800, minStock: 500, costPerUnit: 1.2, sellingPrice: 0, barcode: 'LMO-011', supplier: 'Aroma Magic', lastRestocked: '2026-03-10', usedThisMonth: 600 },
  { id: 12, name: 'Coffee Body Scrub', category: 'spa', unit: 'g', quantity: 2000, minStock: 1000, costPerUnit: 0.4, sellingPrice: 0, barcode: 'CBS-012', supplier: 'Forest Essentials', lastRestocked: '2026-03-08', usedThisMonth: 1500 },
  { id: 13, name: 'Hot Stone Set (12 stones)', category: 'spa', unit: 'set', quantity: 2, minStock: 1, costPerUnit: 3500, sellingPrice: 0, barcode: 'HSS-013', supplier: 'SpaEquip', lastRestocked: '2025-12-01', usedThisMonth: 0 },
  { id: 14, name: 'Aromatherapy Diffuser Oil', category: 'spa', unit: 'bottle', quantity: 5, minStock: 3, costPerUnit: 650, sellingPrice: 0, barcode: 'ADO-014', supplier: 'Soulflower', lastRestocked: '2026-03-12', usedThisMonth: 2 },

  // Nails
  { id: 15, name: 'OPI Gel Base Coat', category: 'nails', unit: 'bottle', quantity: 4, minStock: 3, costPerUnit: 1200, sellingPrice: 0, barcode: 'OPI-015', supplier: 'OPI India', lastRestocked: '2026-03-01', usedThisMonth: 3 },
  { id: 16, name: 'Gel Nail Colors (pack of 12)', category: 'nails', unit: 'pack', quantity: 6, minStock: 4, costPerUnit: 2800, sellingPrice: 0, barcode: 'GNC-016', supplier: 'CND', lastRestocked: '2026-03-15', usedThisMonth: 4 },
  { id: 17, name: 'Acrylic Powder — Clear', category: 'nails', unit: 'g', quantity: 150, minStock: 100, costPerUnit: 3, sellingPrice: 0, barcode: 'APC-017', supplier: 'MMA Nails', lastRestocked: '2026-03-20', usedThisMonth: 80 },
  { id: 18, name: 'UV/LED Nail Lamp', category: 'nails', unit: 'unit', quantity: 2, minStock: 1, costPerUnit: 4500, sellingPrice: 0, barcode: 'UVL-018', supplier: 'Gelish', lastRestocked: '2025-10-01', usedThisMonth: 0 },

  // Makeup
  { id: 19, name: 'MAC Studio Fix Foundation', category: 'makeup', unit: 'bottle', quantity: 8, minStock: 5, costPerUnit: 2800, sellingPrice: 3800, barcode: 'MAC-019', supplier: 'MAC Cosmetics', lastRestocked: '2026-03-10', usedThisMonth: 6 },
  { id: 20, name: 'Airbrush Makeup Kit', category: 'makeup', unit: 'kit', quantity: 1, minStock: 1, costPerUnit: 18000, sellingPrice: 0, barcode: 'AMK-020', supplier: 'Dinair', lastRestocked: '2025-11-01', usedThisMonth: 0 },
  { id: 21, name: 'Setting Spray — Long Wear', category: 'makeup', unit: 'bottle', quantity: 5, minStock: 3, costPerUnit: 1500, sellingPrice: 0, barcode: 'SSP-021', supplier: 'Urban Decay', lastRestocked: '2026-03-05', usedThisMonth: 4 },

  // Disposables
  { id: 22, name: 'Disposable Towels', category: 'disposables', unit: 'piece', quantity: 200, minStock: 100, costPerUnit: 12, sellingPrice: 0, barcode: 'DPT-022', supplier: 'Laundry Co', lastRestocked: '2026-03-25', usedThisMonth: 180 },
  { id: 23, name: 'Gloves (box of 100)', category: 'disposables', unit: 'box', quantity: 4, minStock: 3, costPerUnit: 350, sellingPrice: 0, barcode: 'GLV-023', supplier: 'MedSupply', lastRestocked: '2026-03-20', usedThisMonth: 2 },
  { id: 24, name: 'Foil Sheets', category: 'disposables', unit: 'sheet', quantity: 300, minStock: 200, costPerUnit: 2, sellingPrice: 0, barcode: 'FLS-024', supplier: 'HairSupply', lastRestocked: '2026-03-15', usedThisMonth: 250 },
]

function getStockStatus(item) {
  if (item.quantity <= 0) return { label: 'Out of Stock', color: '#993C1D', bg: '#FAECE7' }
  if (item.quantity <= item.minStock) return { label: 'Low Stock', color: '#BA7517', bg: '#FAEEDA' }
  return { label: 'In Stock', color: '#0F6E56', bg: '#E1F5EE' }
}

// ─── ADD ITEM MODAL ───────────────────────────────────────────────────────────
function AddItemModal({ onClose, onAdd, sym }) {
  const [form, setForm] = useState({ name: '', category: 'hair', unit: 'bottle', quantity: 0, minStock: 5, costPerUnit: 0, supplier: '', barcode: '' })
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    onAdd({ id: Date.now(), ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), costPerUnit: Number(form.costPerUnit), sellingPrice: 0, lastRestocked: new Date().toISOString().split('T')[0], usedThisMonth: 0 })
    onClose()
  }

  return (
    <div style={Mo.overlay}>
      <div style={Mo.modal}>
        <div style={Mo.header}><div style={Mo.title}>Add Inventory Item</div><button style={Mo.close} onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit} style={Mo.form}>
          <div style={Mo.grid2}>
            <div style={{ ...Mo.field, gridColumn: '1/-1' }}><label style={Mo.label}>Product Name *</label><input style={Mo.input} required value={form.name} onChange={e => up('name', e.target.value)} placeholder="e.g. Wella Color Cream" /></div>
            <div style={Mo.field}><label style={Mo.label}>Category</label>
              <select style={Mo.input} value={form.category} onChange={e => up('category', e.target.value)}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div style={Mo.field}><label style={Mo.label}>Unit</label><input style={Mo.input} value={form.unit} onChange={e => up('unit', e.target.value)} placeholder="bottle / ml / g / piece" /></div>
            <div style={Mo.field}><label style={Mo.label}>Current Quantity</label><input style={Mo.input} type="number" value={form.quantity} onChange={e => up('quantity', e.target.value)} /></div>
            <div style={Mo.field}><label style={Mo.label}>Min Stock Alert</label><input style={Mo.input} type="number" value={form.minStock} onChange={e => up('minStock', e.target.value)} /></div>
            <div style={Mo.field}><label style={Mo.label}>Cost Per Unit ({sym})</label><input style={Mo.input} type="number" value={form.costPerUnit} onChange={e => up('costPerUnit', e.target.value)} /></div>
            <div style={Mo.field}><label style={Mo.label}>Barcode</label><input style={Mo.input} value={form.barcode} onChange={e => up('barcode', e.target.value)} placeholder="Scan or type" /></div>
            <div style={{ ...Mo.field, gridColumn: '1/-1' }}><label style={Mo.label}>Supplier</label><input style={Mo.input} value={form.supplier} onChange={e => up('supplier', e.target.value)} placeholder="Supplier name" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" style={Mo.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={Mo.submitBtn}>Add Item →</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── RESTOCK MODAL ────────────────────────────────────────────────────────────
function RestockModal({ item, onClose, onRestock, sym }) {
  const [qty, setQty] = useState('')
  return (
    <div style={Mo.overlay}>
      <div style={{ ...Mo.modal, maxWidth: 360 }}>
        <div style={Mo.header}><div style={Mo.title}>Restock Item</div><button style={Mo.close} onClick={onClose}>✕</button></div>
        <div style={{ fontSize: 14, color: '#6B6258', marginBottom: 16 }}>{item.name}</div>
        <div style={{ background: '#F8F5F0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B6258' }}>Current stock</span>
            <span style={{ fontWeight: 500 }}>{item.quantity} {item.unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ color: '#6B6258' }}>Min stock alert</span>
            <span style={{ fontWeight: 500 }}>{item.minStock} {item.unit}</span>
          </div>
        </div>
        <div style={Mo.field}>
          <label style={Mo.label}>Add quantity ({item.unit})</label>
          <input style={Mo.input} type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" autoFocus />
        </div>
        {qty && <div style={{ fontSize: 13, color: '#0F6E56', marginTop: 8 }}>New total: {item.quantity + Number(qty)} {item.unit} · Cost: {sym}{(Number(qty) * item.costPerUnit).toLocaleString()}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button style={Mo.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={Mo.submitBtn} onClick={() => { onRestock(item.id, Number(qty)); onClose() }}>Restock →</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Inventory() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [items, setItems] = useState(MOCK_INVENTORY)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [restockItem, setRestockItem] = useState(null)
  const [sortBy, setSortBy] = useState('name')

  const lowStock = items.filter(i => i.quantity <= i.minStock)
  const outOfStock = items.filter(i => i.quantity <= 0)
  const totalValue = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)

  const filtered = items.filter(i => {
    const matchCat = activeCategory === 'all' || i.category === activeCategory
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.barcode.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'stock') return a.quantity - b.quantity
    if (sortBy === 'value') return (b.quantity * b.costPerUnit) - (a.quantity * a.costPerUnit)
    return 0
  })

  function handleRestock(id, qty) {
    setItems(items.map(i => i.id === id ? { ...i, quantity: i.quantity + qty, lastRestocked: new Date().toISOString().split('T')[0] } : i))
  }

  function handleAdd(item) { setItems(prev => [item, ...prev]) }

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Inventory Management</div>
          <div style={S.sub}>Track products, stock levels and usage per service</div>
        </div>
        <button style={S.addBtn} onClick={() => setShowAdd(true)}>+ Add Item</button>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[
          { label: 'Total Products', value: items.length, color: '#185FA5' },
          { label: 'Low Stock Alerts', value: lowStock.length, color: '#BA7517' },
          { label: 'Out of Stock', value: outOfStock.length, color: '#993C1D' },
          { label: 'Total Stock Value', value: `${sym}${Math.round(totalValue).toLocaleString()}`, color: '#0F6E56' },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div style={S.alertBox}>
          <span style={{ fontWeight: 500 }}>⚠️ Low Stock Alert</span>
          <span style={{ color: '#6B4C1A', fontSize: 13 }}>
            {lowStock.map(i => i.name).join(' · ')}
          </span>
          <span style={{ fontSize: 12, color: '#BA7517' }}>Restock soon!</span>
        </div>
      )}

      {/* Filters */}
      <div style={S.filterRow}>
        <div style={S.catPills}>
          {CATEGORIES.map(c => (
            <button key={c.id} style={{ ...S.catBtn, ...(activeCategory === c.id ? S.catBtnOn : {}) }} onClick={() => setActiveCategory(c.id)}>
              {c.icon} {c.label}
              {c.id !== 'all' && <span style={S.catCount}>{items.filter(i => i.category === c.id).length}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input style={S.search} placeholder="🔍  Search or scan barcode..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={S.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock Level</option>
            <option value="value">Sort: Value</option>
          </select>
        </div>
      </div>

      {/* Inventory table */}
      <div style={S.table}>
        <div style={S.tableHeader}>
          <span style={{ flex: 3 }}>Product</span>
          <span style={{ flex: 1, textAlign: 'center' }}>Category</span>
          <span style={{ flex: 1, textAlign: 'center' }}>Stock</span>
          <span style={{ flex: 1, textAlign: 'center' }}>Used/Month</span>
          <span style={{ flex: 1, textAlign: 'right' }}>Cost/Unit</span>
          <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
          <span style={{ flex: 1, textAlign: 'center' }}>Action</span>
        </div>
        {filtered.map(item => {
          const status = getStockStatus(item)
          const cat = CATEGORIES.find(c => c.id === item.category)
          return (
            <div key={item.id} style={{ ...S.row, background: item.quantity <= item.minStock ? '#FFFBF5' : '#fff' }}>
              <div style={{ flex: 3 }}>
                <div style={S.itemName}>{item.name}</div>
                <div style={S.itemMeta}>🏷 {item.barcode} · {item.supplier}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={S.catTag}>{cat?.icon} {cat?.label}</span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: item.quantity <= item.minStock ? '#BA7517' : '#1A1208' }}>
                  {item.quantity}
                </div>
                <div style={{ fontSize: 10, color: '#B0A89F' }}>{item.unit}</div>
                <div style={{ fontSize: 9, color: '#B0A89F' }}>min: {item.minStock}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#6B6258' }}>
                {item.usedThisMonth} {item.unit}
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#1A1208' }}>
                {sym}{item.costPerUnit.toLocaleString()}
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, background: status.bg, color: status.color, fontWeight: 500 }}>
                  {status.label}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <button style={S.restockBtn} onClick={() => setRestockItem(item)}>+ Restock</button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div style={S.empty}>No items found</div>}
      </div>

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={handleAdd} sym={sym} />}
      {restockItem && <RestockModal item={restockItem} onClose={() => setRestockItem(null)} onRestock={handleRestock} sym={sym} />}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const INK = '#1A1208', STONE = '#6B6258', MIST = '#F8F5F0', ROSE = '#8B3A52'

const S = {
  wrap: { fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: INK },
  sub: { fontSize: 12, color: STONE, marginTop: 3 },
  addBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  alertBox: { display: 'flex', alignItems: 'center', gap: 12, background: '#FAEEDA', border: '0.5px solid #F5DFA0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, flexWrap: 'wrap' },
  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  catPills: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  catBtn: { padding: '5px 12px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE, display: 'flex', alignItems: 'center', gap: 4 },
  catBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  catCount: { background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '0 5px', fontSize: 10 },
  search: { padding: '8px 14px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', width: 220 },
  sortSelect: { padding: '8px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: INK },
  table: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '10px 16px', background: MIST, fontSize: 10, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px' },
  row: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #F8F5F0' },
  itemName: { fontSize: 13, fontWeight: 500, color: INK, marginBottom: 2 },
  itemMeta: { fontSize: 11, color: STONE },
  catTag: { fontSize: 11, color: STONE },
  restockBtn: { padding: '4px 10px', background: '#E1F5EE', color: '#0F6E56', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  empty: { textAlign: 'center', color: '#B0A89F', padding: 40, fontSize: 13 },
}

const Mo = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 48px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: INK },
  close: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px' },
  input: { padding: '9px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  cancelBtn: { padding: '9px 18px', background: MIST, color: STONE, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '9px 20px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}
