import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: 'Oct', revenue: 182000, expenses: 45000, clients: 48 },
  { month: 'Nov', revenue: 210000, expenses: 52000, clients: 56 },
  { month: 'Dec', revenue: 285000, expenses: 58000, clients: 72 },
  { month: 'Jan', revenue: 195000, expenses: 48000, clients: 51 },
  { month: 'Feb', revenue: 228000, expenses: 55000, clients: 61 },
  { month: 'Mar', revenue: 312000, expenses: 62000, clients: 84 },
  { month: 'Apr', revenue: 145000, expenses: 38000, clients: 38 },
]

const STAFF_PERFORMANCE = [
  { name: 'Kavitha R.', role: 'Senior Stylist', revenue: 142000, services: 48, rating: 4.9, color: '#8B3A52' },
  { name: 'Sneha M.', role: 'Makeup Artist', revenue: 98000, services: 35, rating: 4.8, color: '#0F6E56' },
  { name: 'Latha D.', role: 'Hair Specialist', revenue: 88000, services: 42, rating: 4.7, color: '#185FA5' },
  { name: 'Preethi K.', role: 'Skin Therapist', revenue: 74000, services: 31, rating: 4.6, color: '#533AB7' },
  { name: 'Bindhu P.', role: 'Nail Tech', revenue: 52000, services: 28, rating: 4.5, color: '#BA7517' },
]

const SERVICE_REVENUE = [
  { name: 'Bridal Package', revenue: 245000, count: 8, color: '#8B3A52' },
  { name: 'Hair Color', revenue: 182000, count: 28, color: '#185FA5' },
  { name: 'Spa & Massage', revenue: 156000, count: 34, color: '#0F6E56' },
  { name: 'Makeup', revenue: 134000, count: 22, color: '#533AB7' },
  { name: 'Skin & Facial', revenue: 98000, count: 35, color: '#BA7517' },
  { name: 'Nails', revenue: 72000, count: 45, color: '#3B6D11' },
  { name: 'Hair Services', revenue: 65000, count: 52, color: '#993C1D' },
]

const LEAD_SOURCES = [
  { source: 'Instagram', leads: 42, converted: 28, color: '#8B3A52' },
  { source: 'WhatsApp', leads: 38, converted: 31, color: '#0F6E56' },
  { source: 'Referral', leads: 29, converted: 26, color: '#185FA5' },
  { source: 'Google', leads: 24, converted: 15, color: '#533AB7' },
  { source: 'Walk-in', leads: 18, converted: 18, color: '#BA7517' },
  { source: 'Facebook', leads: 12, converted: 7, color: '#3B6D11' },
]

const PAYMENT_SPLIT = [
  { mode: 'Card', amount: 312000, pct: 38, color: '#185FA5' },
  { mode: 'UPI / QR', amount: 254000, pct: 31, color: '#0F6E56' },
  { mode: 'Cash', amount: 198000, pct: 24, color: '#BA7517' },
  { mode: 'Credit', amount: 57000, pct: 7, color: '#993C1D' },
]

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color, sym, height = 140 }) {
  const max = Math.max(...data.map(d => d[valueKey]))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: '#B0A89F', fontWeight: 500 }}>
            {sym}{Math.round(d[valueKey] / 1000)}k
          </div>
          <div style={{ width: '100%', background: '#F0EAE4', borderRadius: 4, overflow: 'hidden', height: height - 30, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${(d[valueKey] / max) * 100}%`,
              background: color,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.5s ease',
              opacity: i === data.length - 1 ? 0.6 : 1,
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#B0A89F' }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  )
}

// ─── HORIZONTAL BAR ───────────────────────────────────────────────────────────
function HBar({ label, value, max, color, bg, suffix = '' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#1A1208', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500, color }}>{suffix}{typeof value === 'number' ? value.toLocaleString() : value}</span>
      </div>
      <div style={{ height: 6, background: '#F0EAE4', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

// ─── DONUT CHART (CSS) ────────────────────────────────────────────────────────
function DonutChart({ data, total, sym }) {
  let cumulative = 0
  const segments = data.map(d => {
    const start = cumulative
    cumulative += d.pct
    return { ...d, start }
  })

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
          {segments.map((seg, i) => {
            const circumference = 2 * Math.PI * 15.9
            const dashArray = `${(seg.pct / 100) * circumference} ${circumference}`
            const dashOffset = -((seg.start / 100) * circumference)
            return (
              <circle key={i} cx="18" cy="18" r="15.9"
                fill="none" stroke={seg.color} strokeWidth="3.5"
                strokeDasharray={dashArray} strokeDashoffset={dashOffset} />
            )
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1A1208' }}>{sym}{Math.round(total / 1000)}k</div>
          <div style={{ fontSize: 9, color: '#B0A89F' }}>total</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {data.map(d => (
          <div key={d.mode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B6258' }}>{d.mode}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1208' }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Reports() {
  const { currencySymbol, profile } = useAuth()
  const sym = currencySymbol || profile?.salons?.settings?.currencySymbol || '₹'
  const [period, setPeriod] = useState('month')

  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0)
  const totalClients = MONTHLY_REVENUE.reduce((s, m) => s + m.clients, 0)
  const totalLeads = LEAD_SOURCES.reduce((s, l) => s + l.leads, 0)
  const totalConverted = LEAD_SOURCES.reduce((s, l) => s + l.converted, 0)
  const conversionRate = Math.round((totalConverted / totalLeads) * 100)
  const avgRevPerClient = Math.round(totalRevenue / totalClients)
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(m => m.revenue))

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>Reports & Analytics</div>
          <div style={S.sub}>Last 7 months · Oct 2025 – Apr 2026</div>
        </div>
        <div style={S.periodToggle}>
          {['week', 'month', 'quarter', 'year'].map(p => (
            <button key={p} style={{ ...S.periodBtn, ...(period === p ? S.periodBtnOn : {}) }}
              onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={S.kpiRow}>
        {[
          { label: 'Total Revenue', value: `${sym}${totalRevenue.toLocaleString()}`, change: '+18%', up: true, color: '#0F6E56' },
          { label: 'Total Clients', value: totalClients, change: '+24 new', up: true, color: '#185FA5' },
          { label: 'Lead Conversion', value: `${conversionRate}%`, change: '+5% vs last period', up: true, color: '#8B3A52' },
          { label: 'Avg Revenue / Client', value: `${sym}${avgRevPerClient.toLocaleString()}`, change: '+12%', up: true, color: '#533AB7' },
        ].map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={{ ...S.kpiValue, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: k.up ? '#0F6E56' : '#993C1D', marginTop: 4 }}>↑ {k.change}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Payment Split */}
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Revenue</div>
          <BarChart data={MONTHLY_REVENUE} valueKey="revenue" labelKey="month" color="#8B3A52" sym={sym} height={160} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#6B6258' }}>
              Peak: <strong style={{ color: '#8B3A52' }}>{sym}{Math.max(...MONTHLY_REVENUE.map(m => m.revenue)).toLocaleString()}</strong> (Mar)
            </div>
            <div style={{ fontSize: 12, color: '#6B6258' }}>
              Avg: <strong style={{ color: '#185FA5' }}>{sym}{Math.round(totalRevenue / MONTHLY_REVENUE.length).toLocaleString()}</strong>/month
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Payment Mode Split</div>
          <DonutChart data={PAYMENT_SPLIT} total={PAYMENT_SPLIT.reduce((s, p) => s + p.amount, 0)} sym={sym} />
          <div style={{ marginTop: 14 }}>
            {PAYMENT_SPLIT.map(p => (
              <div key={p.mode} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #F8F5F0', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                  <span style={{ color: '#6B6258' }}>{p.mode}</span>
                </div>
                <span style={{ fontWeight: 500, color: '#1A1208' }}>{sym}{p.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Performance + Service Revenue */}
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Staff Performance — {MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2].month}</div>
          <div style={{ marginTop: 8 }}>
            {STAFF_PERFORMANCE.map((s, i) => (
              <div key={s.name} style={S.staffRow}>
                <div style={{ ...S.staffRank, color: i === 0 ? '#BA7517' : '#B0A89F' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1208' }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: s.color }}>{sym}{s.revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 4, background: '#F0EAE4', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.revenue / STAFF_PERFORMANCE[0].revenue) * 100}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: '#B0A89F' }}>{s.services} services</span>
                    <span style={{ fontSize: 10, color: '#B0A89F' }}>★ {s.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Revenue by Service Category</div>
          <div style={{ marginTop: 8 }}>
            {SERVICE_REVENUE.map(s => (
              <HBar key={s.name} label={s.name}
                value={s.revenue} max={SERVICE_REVENUE[0].revenue}
                color={s.color} suffix={sym} />
            ))}
          </div>
        </div>
      </div>

      {/* Lead Source Analytics */}
      <div style={S.card}>
        <div style={S.cardTitle}>Lead Source Analytics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginTop: 14 }}>
          {LEAD_SOURCES.map(l => (
            <div key={l.source} style={S.leadCard}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1208', marginBottom: 8 }}>{l.source}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: l.color, fontFamily: "'Cormorant Garamond', serif" }}>{l.leads}</div>
              <div style={{ fontSize: 10, color: '#B0A89F', marginBottom: 8 }}>total leads</div>
              <div style={{ height: 4, background: '#F0EAE4', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${(l.converted / l.leads) * 100}%`, background: l.color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: l.color, fontWeight: 500 }}>
                {Math.round((l.converted / l.leads) * 100)}% converted
              </div>
              <div style={{ fontSize: 10, color: '#B0A89F' }}>{l.converted} clients</div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Metrics */}
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Client Growth</div>
          <BarChart data={MONTHLY_REVENUE} valueKey="clients" labelKey="month" color="#185FA5" sym="" height={140} />
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Key Business Metrics</div>
          <div style={{ marginTop: 8 }}>
            {[
              { label: 'Client Retention Rate', value: '78%', color: '#0F6E56', icon: '🔄' },
              { label: 'Avg Visit Frequency', value: '2.4x / month', color: '#185FA5', icon: '📅' },
              { label: 'Bridal Package Conversion', value: '65%', color: '#8B3A52', icon: '👑' },
              { label: 'WhatsApp Response Rate', value: '94%', color: '#533AB7', icon: '💬' },
              { label: 'Review Collection Rate', value: '71%', color: '#3B6D11', icon: '⭐' },
              { label: 'Advance Booking Rate', value: '58%', color: '#BA7517', icon: '📋' },
            ].map(m => (
              <div key={m.label} style={S.metricRow}>
                <span style={{ fontSize: 14 }}>{m.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#6B6258' }}>{m.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export */}
      <div style={S.exportRow}>
        <div style={{ fontSize: 12, color: '#B0A89F' }}>Reports auto-update daily · Connected to Supabase</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.exportBtn}>📊 Export Excel</button>
          <button style={S.exportBtn}>📄 Export PDF</button>
        </div>
      </div>
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
  periodToggle: { display: 'flex', background: MIST, borderRadius: 8, padding: 3 },
  periodBtn: { padding: '6px 14px', border: 'none', background: 'transparent', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: STONE, fontFamily: 'inherit', fontWeight: 500 },
  periodBtnOn: { background: '#fff', color: ROSE },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  kpiCard: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 12, padding: '14px 16px' },
  kpiLabel: { fontSize: 11, color: STONE, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 },
  kpiValue: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  card: { background: '#fff', border: '0.5px solid #E8E0D8', borderRadius: 14, padding: '18px 20px', marginBottom: 14 },
  cardTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: INK },
  staffRow: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '0.5px solid #F8F5F0' },
  staffRank: { fontSize: 16, width: 24, flexShrink: 0, marginTop: 2 },
  leadCard: { background: MIST, borderRadius: 10, padding: '12px' },
  metricRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F8F5F0' },
  exportRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  exportBtn: { padding: '8px 16px', border: '0.5px solid #E8E0D8', borderRadius: 8, fontSize: 12, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: STONE },
}
