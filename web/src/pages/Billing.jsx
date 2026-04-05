import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { ALL_SERVICES, SERVICE_CATEGORIES, getCategoryInfo } from '../utils/services'

// ─── MOCK INVOICES ────────────────────────────────────────────────────────────
const MOCK_INVOICES = [
  { id: 'INV-001', clientToken: '#A047', clientName: 'Priya Menon', date: '2026-04-04', items: [{ name: 'Bridal Makeup + Hair', qty: 1, price: 8500 }, { name: 'Hair Color — Balayage', qty: 1, price: 6500 }], subtotal: 15000, tax: 2700, discount: 500, total: 17200, paymentMode: 'card', status: 'paid', staff: 'Kavitha R.' },
  { id: 'INV-002', clientToken: '#B112', clientName: 'Anjali Rao', date: '2026-04-04', items: [{ name: 'Keratin Treatment', qty: 1, price: 5500 }], subtotal: 5500, tax: 990, discount: 0, total: 6490, paymentMode: 'upi', status: 'paid', staff: 'Latha D.' },
  { id: 'INV-003', clientToken: '#D203', clientName: 'Meera Sharma', date: '2026-04-03', items: [{ name: 'Full Bridal Package', qty: 1, price: 45000 }, { name: 'Pre-Wedding Glow Package', qty: 1, price: 15000 }], subtotal: 60000, tax: 10800, discount: 5000, total: 65800, paymentMode: 'card', status: 'paid', staff: 'Kavitha R.' },
  { id: 'INV-004', clientToken: '#C089', clientName: 'Divya Krishnan', date: '2026-04-04', items: [{ name: 'Facial + Cleanup', qty: 1, price: 2800 }], subtotal: 2800, tax: 504, discount: 0, total: 3304, paymentMode: 'cash', status: 'pending', staff: 'Sneha M.' },
]

const PAYMENT_MODES = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'upi', label: 'UPI / QR', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'credit', label: 'Credit', icon: '📋' },
  { id: 'advance', label: 'Advance', icon: '🔖' },
]

const CLIENTS = [
  { id: 1, token: '#A047', name: 'Priya Menon', loyaltyPoints: 450 },
  { id: 2, token: '#B112', name: 'Anjali Rao', loyaltyPoints: 280 },
  { id: 3, token: '#C089', name: 'Divya Krishnan', loyaltyPoints: 120 },
  { id: 4, token: '#D203', name: 'Meera Sharma', loyaltyPoints: 680 },
]

// ─── INVOICE PRINT VIEW ───────────────────────────────────────────────────────
function InvoiceView({ invoice, sym, taxName, onClose }) {
  return (
    <div style={Iv.overlay}>
      <div style={Iv.modal}>
        <div style={Iv.header}>
          <div style={Iv.brandName}>GlowSuite</div>
          <div style={Iv.invoiceId}>{invoice.id}</div>
        </div>
        <div style={Iv.meta}>
          <div><span style={Iv.metaKey}>Client</span><span style={Iv.metaVal}>{invoice.clientToken}</span></div>
          <div><span style={Iv.metaKey}>Date</span><span style={Iv.metaVal}>{invoice.date}</span></div>
          <div><span style={Iv.metaKey}>Staff</span><span style={Iv.metaVal}>{invoice.staff}</span></div>
          <div><span style={Iv.metaKey}>Payment</span><span style={Iv.metaVal}>{invoice.paymentMode.toUpperCase()}</span></div>
        </div>
        <table style={Iv.table}>
          <thead>
            <tr style={Iv.th}>
              <td style={{ flex: 3 }}>Service</td>
              <td style={{ flex: 1, textAlign: 'center' }}>Qty</td>
              <td style={{ flex: 1, textAlign: 'right' }}>Amount</td>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} style={Iv.tr}>
                <td style={{ flex: 3, fontSize: 13 }}>{item.name}</td>
                <td style={{ flex: 1, textAlign: 'center', fontSize: 13 }}>{item.qty}</td>
                <td style={{ flex: 1, textAlign: 'right', fontSize: 13 }}>{sym}{item.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={Iv.totals}>
          <div style={Iv.totalRow}><span>Subtotal</span><span>{sym}{invoice.subtotal.toLocaleString()}</span></div>
          {invoice.discount > 0 && <div style={{ ...Iv.totalRow, color: '#0F6E56' }}><span>Discount</span><span>- {sym}{invoice.discount.toLocaleString()}</span></div>}
          <div style={Iv.totalRow}><span>{taxName} (18%)</span><span>{sym}{invoice.tax.toLocaleString()}</span></div>
          <div style={Iv.grandTotal}><span>Total</span><span>{sym}{invoice.total.toLocaleString()}</span></div>
        </div>
        <div style={Iv.footer}>Thank you for visiting! · Powered by GlowSuite</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button style={Iv.printBtn} onClick={() => window.print()}>🖨 Print</button>
          <button style={Iv.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── POS / NEW INVOICE ────────────────────────────────────────────────────────
function NewInvoice({ onClose, onSave, sym, taxName, taxRate }) {
  const [clientId, setClientId] = useState('')
  const [items, setItems] = useState([])
  const [paymentMode, setPaymentMode] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [usePoints, setUsePoints] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeRef = useRef(null)

  const client = CLIENTS.find(c => c.id === Number(clientId))
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const pointsDiscount = usePoints && client ? Math.min(Math.floor(client.loyaltyPoints / 10), subtotal) : 0
  const totalDiscount = Number(discount) + pointsDiscount
  const tax = Math.round((subtotal - totalDiscount) * (taxRate / 100))
  const total = subtotal - totalDiscount + tax

  function addItem(service) {
    const existing = items.find(i => i.name === service.name)
    if (existing) {
      setItems(items.map(i => i.name === service.name ? { ...i, qty: i.qty + 1 } : i))
    } else {
      setItems([...items, { name: service.name, qty: 1, price: service.price }])
    }
  }

  function removeItem(name) { setItems(items.filter(i => i.name !== name)) }
  function updateQty(name, qty) {
    if (qty < 1) return removeItem(name)
    setItems(items.map(i => i.name === name ? { ...i, qty } : i))
  }

  function handleBarcode(e) {
    if (e.key === 'Enter') {
      const code = barcodeInput.trim()
      const service = ALL_SERVICES.find(s => s.id === code || s.name.toLowerCase().includes(code.toLowerCase()))
      if (service) addItem(service)
      setBarcodeInput('')
    }
  }

  function handleSave() {
    if (!clientId || items.length === 0) return
    const invoice = {
      id: `INV-${String(Date.now()).slice(-4)}`,
      clientToken: client.token,
      clientName: client.name,
      date: new Date().toISOString().split('T')[0],
      items, subtotal, tax, discount: totalDiscount,
      total, paymentMode, status: 'paid',
      staff: 'Kavitha R.',
    }
    onSave(invoice)
    onClose()
  }

  const filteredServices = ALL_SERVICES.filter(s => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={Pos.overlay}>
      <div style={Pos.modal}>
        {/* Left — Service picker */}
        <div style={Pos.left}>
          <div style={Pos.leftHeader}>
            <div style={Pos.leftTitle}>Select Services</div>
            {/* Barcode scanner input */}
            <div style={Pos.barcodeRow}>
              <span style={{ fontSize: 16 }}>🏷</span>
              <input ref={barcodeRef} style={Pos.barcodeInput}
                placeholder="Scan barcode or search..."
                value={barcodeInput}
                onChange={e => { setBarcodeInput(e.target.value); setSearch(e.target.value) }}
                onKeyDown={handleBarcode} />
            </div>
          </div>

          {/* Category pills */}
          <div style={Pos.catRow}>
            <button style={{ ...Pos.catBtn, ...(activeCategory === 'all' ? Pos.catBtnOn : {}) }}
              onClick={() => setActiveCategory('all')}>All</button>
            {SERVICE_CATEGORIES.map(c => (
              <button key={c.id}
                style={{ ...Pos.catBtn, ...(activeCategory === c.id ? { background: c.bg, color: c.color, border: `0.5px solid ${c.color}` } : {}) }}
                onClick={() => setActiveCategory(c.id)}>
                {c.icon}
              </button>
            ))}
          </div>

          {/* Services grid */}
          <div style={Pos.servicesGrid}>
            {filteredServices.slice(0, 40).map(s => {
              const cat = getCategoryInfo(s.category)
              const inCart = items.find(i => i.name === s.name)
              return (
                <button key={s.id} style={{ ...Pos.serviceBtn, ...(inCart ? { border: `1.5px solid ${cat.color}`, background: cat.bg } : {}) }}
                  onClick={() => addItem(s)}>
                  <div style={Pos.serviceBtnName}>{s.name}</div>
                  <div style={{ ...Pos.serviceBtnPrice, color: cat.color }}>{sym}{s.price.toLocaleString()}</div>
                  {inCart && <div style={{ ...Pos.inCartBadge, background: cat.color }}>×{inCart.qty}</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right — Bill */}
        <div style={Pos.right}>
          <div style={Pos.rightHeader}>
            <div style={Pos.rightTitle}>Bill</div>
            <button style={Pos.closeBtn} onClick={onClose}>✕</button>
          </div>

          {/* Client selector */}
          <div style={Pos.field}>
            <label style={Pos.label}>Client</label>
            <select style={Pos.input} value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select client...</option>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.token} — {c.name}</option>)}
            </select>
          </div>

          {/* Cart items */}
          <div style={Pos.cart}>
            {items.length === 0 && <div style={Pos.emptyCart}>Tap services to add →</div>}
            {items.map(item => (
              <div key={item.name} style={Pos.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={Pos.cartName}>{item.name}</div>
                  <div style={Pos.cartPrice}>{sym}{item.price.toLocaleString()} each</div>
                </div>
                <div style={Pos.qtyRow}>
                  <button style={Pos.qtyBtn} onClick={() => updateQty(item.name, item.qty - 1)}>−</button>
                  <span style={Pos.qty}>{item.qty}</span>
                  <button style={Pos.qtyBtn} onClick={() => updateQty(item.name, item.qty + 1)}>+</button>
                </div>
                <div style={Pos.cartTotal}>{sym}{(item.price * item.qty).toLocaleString()}</div>
                <button style={Pos.removeBtn} onClick={() => removeItem(item.name)}>✕</button>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div style={Pos.field}>
            <label style={Pos.label}>Discount ({sym})</label>
            <input style={Pos.input} type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
          </div>

          {/* Loyalty points */}
          {client && client.loyaltyPoints > 0 && (
            <div style={Pos.loyaltyRow}>
              <label style={{ fontSize: 13, color: '#6B6258' }}>
                Use {client.loyaltyPoints} loyalty points (= {sym}{Math.floor(client.loyaltyPoints / 10)})
              </label>
              <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} />
            </div>
          )}

          {/* Totals */}
          <div style={Pos.totals}>
            <div style={Pos.totalRow}><span>Subtotal</span><span>{sym}{subtotal.toLocaleString()}</span></div>
            {totalDiscount > 0 && <div style={{ ...Pos.totalRow, color: '#0F6E56' }}><span>Discount</span><span>− {sym}{totalDiscount.toLocaleString()}</span></div>}
            <div style={Pos.totalRow}><span>{taxName} ({taxRate}%)</span><span>{sym}{tax.toLocaleString()}</span></div>
            <div style={Pos.grandTotal}><span>Total</span><span>{sym}{total.toLocaleString()}</span></div>
          </div>

          {/* Payment mode */}
          <div style={Pos.paymentGrid}>
            {PAYMENT_MODES.map(pm => (
              <button key={pm.id}
                style={{ ...Pos.payBtn, ...(paymentMode === pm.id ? Pos.payBtnOn : {}) }}
                onClick={() => setPaymentMode(pm.id)}>
                <span style={{ fontSize: 18 }}>{pm.icon}</span>
                <span style={{ fontSize: 11 }}>{pm.label}</span>
              </button>
            ))}
          </div>

          <button style={{ ...Pos.saveBtn, opacity: !clientId || items.length === 0 ? 0.5 : 1 }}
            disabled={!clientId || items.length === 0}
            onClick={handleSave}>
            ✓ Generate Invoice — {sym}{total.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN BILLING PAGE ────────────────────────────────────────────────────────
export default function Billing() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const taxName = profile?.salons?.settings?.taxName || 'GST'
  const taxRate = profile?.salons?.settings?.taxRate || 18

  const [invoices, setInvoices] = useState(MOCK_INVOICES)
  const [showNew, setShowNew] = useState(false)
  const [viewInvoice, setViewInvoice] = useState(null)
  const [filterMode, setFilterMode] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = invoices.filter(inv => {
    const matchMode = filterMode === 'all' || inv.paymentMode === filterMode
    const matchSearch = !search || inv.clientToken.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase())
    return matchMode && matchSearch
  })

  const todayTotal = invoices.filter(i => i.date === new Date().toISOString().split('T')[0]).reduce((s, i) => s + i.total, 0)
  const byMode = PAYMENT_MODES.reduce((acc, pm) => {
    acc[pm.id] = invoices.filter(i => i.paymentMode === pm.id).reduce((s, i) => s + i.total, 0)
    return acc
  }, {})

  return (
    <div style={P.wrap}>
      {/* Header */}
      <div style={P.header}>
        <div>
          <div style={P.title}>Billing & POS</div>
          <div style={P.sub}>Invoices, payments and barcode scanner</div>
        </div>
        <button style={P.newBtn} onClick={() => setShowNew(true)}>+ New Invoice</button>
      </div>

      {/* Stats */}
      <div style={P.statsRow}>
        {[
          { label: "Today's collection", value: `${sym}${todayTotal.toLocaleString()}`, color: '#0F6E56' },
          { label: 'Cash', value: `${sym}${(byMode.cash || 0).toLocaleString()}`, color: '#185FA5' },
          { label: 'UPI / QR', value: `${sym}${(byMode.upi || 0).toLocaleString()}`, color: '#533AB7' },
          { label: 'Card', value: `${sym}${(byMode.card || 0).toLocaleString()}`, color: '#BA7517' },
        ].map(s => (
          <div key={s.label} style={P.statCard}>
            <div style={{ fontSize: 10, color: '#B0A89F', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={P.filters}>
        <input style={P.search} placeholder="🔍  Search by invoice or token..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={P.modeFilters}>
          <button style={{ ...P.fBtn, ...(filterMode === 'all' ? P.fBtnOn : {}) }} onClick={() => setFilterMode('all')}>All</button>
          {PAYMENT_MODES.map(pm => (
            <button key={pm.id} style={{ ...P.fBtn, ...(filterMode === pm.id ? P.fBtnOn : {}) }} onClick={() => setFilterMode(pm.id)}>
              {pm.icon} {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      <div style={P.table}>
        <div style={P.tableHeader}>
          <span style={{ flex: 1 }}>Invoice</span>
          <span style={{ flex: 1 }}>Client</span>
          <span style={{ flex: 2 }}>Services</span>
          <span style={{ flex: 1, textAlign: 'center' }}>Payment</span>
          <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
          <span style={{ flex: 0.5, textAlign: 'center' }}>Status</span>
        </div>
        {filtered.map(inv => (
          <div key={inv.id} style={P.row} onClick={() => setViewInvoice(inv)}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#8B3A52' }}>{inv.id}</span>
            <span style={{ flex: 1, fontSize: 13, color: '#1A1208' }}>{inv.clientToken}</span>
            <span style={{ flex: 2, fontSize: 12, color: '#6B6258' }}>{inv.items.map(i => i.name).join(', ')}</span>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
              {PAYMENT_MODES.find(p => p.id === inv.paymentMode)?.icon} {inv.paymentMode.toUpperCase()}
            </span>
            <span style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#0F6E56' }}>{sym}{inv.total.toLocaleString()}</span>
            <span style={{ flex: 0.5, textAlign: 'center' }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: inv.status === 'paid' ? '#E1F5EE' : '#FAEEDA', color: inv.status === 'paid' ? '#0F6E56' : '#854F0B', fontWeight: 500 }}>
                {inv.status}
              </span>
            </span>
          </div>
        ))}
      </div>

      {showNew && <NewInvoice onClose={() => setShowNew(false)} onSave={inv => setInvoices(i => [inv, ...i])} sym={sym} taxName={taxName} taxRate={taxRate} />}
      {viewInvoice && <InvoiceView invoice={viewInvoice} sym={sym} taxName={taxName} onClose={() => setViewInvoice(null)} />}
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
  newBtn: { padding: '9px 18px', background: ROSE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '12px 16px' },
  filters: { display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  search: { padding: '8px 14px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', width: 240 },
  modeFilters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  fBtn: { padding: '5px 12px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  fBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  table: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '10px 16px', background: MIST, fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.5px' },
  row: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #F8F5F0', cursor: 'pointer' },
}

const Pos = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.6)', display: 'flex', zIndex: 200 },
  modal: { display: 'flex', width: '100%', height: '100vh', background: '#fff' },
  left: { flex: 1.4, display: 'flex', flexDirection: 'column', borderRight: '0.5px solid #E8E0D8', overflow: 'hidden' },
  leftHeader: { padding: '16px 20px', borderBottom: '0.5px solid #E8E0D8' },
  leftTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: INK, marginBottom: 10 },
  barcodeRow: { display: 'flex', alignItems: 'center', gap: 8, background: '#F8F5F0', borderRadius: 8, padding: '6px 12px' },
  barcodeInput: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: INK },
  catRow: { display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '0.5px solid #E8E0D8', flexWrap: 'wrap' },
  catBtn: { padding: '5px 10px', border: '0.5px solid #E8E0D8', borderRadius: 20, fontSize: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
  catBtnOn: { background: ROSE, color: '#fff', border: `0.5px solid ${ROSE}` },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, padding: '14px 20px', overflowY: 'auto', flex: 1 },
  serviceBtn: { position: 'relative', background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' },
  serviceBtnName: { fontSize: 12, color: INK, marginBottom: 4, lineHeight: 1.3 },
  serviceBtnPrice: { fontSize: 13, fontWeight: 600 },
  inCartBadge: { position: 'absolute', top: 6, right: 6, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600 },
  right: { width: 360, display: 'flex', flexDirection: 'column', padding: '16px 20px', overflowY: 'auto', flexShrink: 0 },
  rightHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  rightTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: INK },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: STONE },
  field: { marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 500, color: STONE, textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 12px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#FDFAF8', color: INK },
  cart: { flex: 1, minHeight: 120, marginBottom: 10 },
  emptyCart: { textAlign: 'center', color: '#B0A89F', padding: '20px 0', fontSize: 13 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #F0EAE4' },
  cartName: { fontSize: 12, color: INK, fontWeight: 500 },
  cartPrice: { fontSize: 11, color: STONE },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 22, height: 22, borderRadius: '50%', border: '0.5px solid #E8E0D8', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ROSE, fontFamily: 'inherit' },
  qty: { fontSize: 13, fontWeight: 500, color: INK, minWidth: 16, textAlign: 'center' },
  cartTotal: { fontSize: 13, fontWeight: 500, color: '#0F6E56', minWidth: 60, textAlign: 'right' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#B0A89F', fontSize: 12, padding: '0 2px' },
  loyaltyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', marginBottom: 6 },
  totals: { background: MIST, borderRadius: 8, padding: '10px 12px', marginBottom: 12 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: STONE, padding: '3px 0' },
  grandTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, color: INK, paddingTop: 8, borderTop: '0.5px solid #E8E0D8', marginTop: 4 },
  paymentGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 12 },
  payBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', border: '0.5px solid #E8E0D8', borderRadius: 8, cursor: 'pointer', background: '#fff', fontFamily: 'inherit', color: STONE },
  payBtnOn: { background: '#FDF0F3', border: `1.5px solid ${ROSE}`, color: ROSE },
  saveBtn: { width: '100%', padding: '13px', background: ROSE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
}

const Iv = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 8px 48px rgba(0,0,0,0.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '2px solid #1A1208', paddingBottom: 12 },
  brandName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: '#1A1208' },
  invoiceId: { fontSize: 12, color: '#6B6258', fontFamily: 'monospace' },
  meta: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 },
  metaKey: { color: '#6B6258', display: 'block' },
  metaVal: { fontWeight: 500, color: '#1A1208' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: 14 },
  th: { display: 'flex', fontSize: 10, fontWeight: 500, color: '#6B6258', textTransform: 'uppercase', borderBottom: '0.5px solid #E8E0D8', paddingBottom: 6, marginBottom: 6 },
  tr: { display: 'flex', paddingBottom: 6, borderBottom: '0.5px solid #F8F5F0' },
  totals: { background: '#F8F5F0', borderRadius: 8, padding: '10px 12px', marginBottom: 14 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B6258', padding: '3px 0' },
  grandTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, color: '#1A1208', paddingTop: 8, borderTop: '0.5px solid #E8E0D8', marginTop: 4 },
  footer: { textAlign: 'center', fontSize: 11, color: '#B0A89F', marginBottom: 4 },
  printBtn: { flex: 1, padding: '9px', background: '#1A1208', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  closeBtn: { flex: 1, padding: '9px', background: '#F8F5F0', color: '#6B6258', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
}
