import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── Constants ─────────────────────────────────────────────────
const SALON_ID = "d4426e94-4dcb-41e4-90bb-71543533cbed";
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt      = (n) => `₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:0})}`;
const fmtShort = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`;

// ─── Mini Bar Chart ─────────────────────────────────────────────
function BarChart({ data, color = "#be185d", height = 120 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height, paddingTop:8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:9, color:"#9ca3af", fontWeight:600 }}>
            {d.value > 0 ? fmtShort(d.value) : ""}
          </div>
          <div
            style={{
              width:"100%", background: color + "22", borderRadius:"4px 4px 0 0",
              height: Math.max(4, (d.value / max) * (height - 28)),
              position:"relative", overflow:"hidden", transition:"height 0.6s ease",
            }}
          >
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              background: `linear-gradient(to top, ${color}, ${color}88)`,
              height:"100%", borderRadius:"4px 4px 0 0",
            }}/>
          </div>
          <div style={{ fontSize:9, color:"#9ca3af", whiteSpace:"nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ width:size, height:size, borderRadius:"50%", background:"#f3f4f6" }}/>;
  let cumulative = 0;
  const radius = 45, cx = 60, cy = 60, circumference = 2 * Math.PI * radius;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap  = circumference - dash;
        const offset = circumference - cumulative * circumference;
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius}
            fill="none" stroke={seg.color} strokeWidth={18}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset}
            style={{ transition:"stroke-dasharray 0.8s ease", transform:"rotate(-90deg)", transformOrigin:"60px 60px" }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={35} fill="white"/>
    </svg>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={S.statCard}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ ...S.statIcon, background: color+"15", color }}>{icon}</div>
        {trend !== undefined && (
          <span style={{ fontSize:11, fontWeight:700, color: trend >= 0 ? "#10b981" : "#ef4444",
            background: trend >= 0 ? "#d1fae5" : "#fee2e2", padding:"2px 8px", borderRadius:20 }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Reports() {
  const [loading, setLoading]       = useState(true);
  const [period, setPeriod]         = useState("month"); // today | week | month | year
  const [tab, setTab]               = useState("overview"); // overview | revenue | staff | clients | services

  // ── Raw data ──
  const [invoices, setInvoices]     = useState([]);
  const [payments, setPayments]     = useState([]);
  const [clients, setClients]       = useState([]);
  const [staff, setStaff]           = useState([]);
  const [appointments, setAppts]    = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [invR, payR, cliR, stfR, aptR, attR] = await Promise.all([
      supabase.from("invoices").select("*").eq("salon_id", SALON_ID),
      supabase.from("payments").select("*").eq("salon_id", SALON_ID),
      supabase.from("clients").select("id, name, created_at, assigned_staff_id, source").eq("salon_id", SALON_ID),
      supabase.from("staff").select("id, name, role").eq("salon_id", SALON_ID),
      supabase.from("appointments").select("*").eq("salon_id", SALON_ID),
      supabase.from("attendance").select("*").eq("salon_id", SALON_ID),
    ]);
    setInvoices(invR.data || []);
    setPayments(payR.data || []);
    setClients(cliR.data || []);
    setStaff(stfR.data || []);
    setAppts(aptR.data || []);
    setAttendance(attR.data || []);
    setLoading(false);
  }

  // ─── Period filter ────────────────────────────────────────────
  function inPeriod(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    if (period === "today") {
      return d.toDateString() === now.toDateString();
    } else if (period === "week") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    } else if (period === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else { // year
      return d.getFullYear() === now.getFullYear();
    }
  }

  // ─── Computed metrics ─────────────────────────────────────────
  const filteredInv   = invoices.filter(i => inPeriod(i.created_at));
  const paidInv       = filteredInv.filter(i => i.status === "paid");
  const totalRevenue  = paidInv.reduce((s, i) => s + Number(i.total), 0);
  const totalGst      = paidInv.reduce((s, i) => s + Number(i.gst_amount), 0);
  const avgBillValue  = paidInv.length ? totalRevenue / paidInv.length : 0;
  const pendingDue    = filteredInv.reduce((s, i) => s + Number(i.balance_due || 0), 0);
  const newClients    = clients.filter(c => inPeriod(c.created_at)).length;
  const totalAppts    = appointments.filter(a => inPeriod(a.scheduled_at || a.created_at)).length;
  const completedAppts = appointments.filter(a => inPeriod(a.scheduled_at || a.created_at) && a.status === "completed").length;

  // ─── Monthly revenue (last 6 months) ─────────────────────────
  const monthlyRevenue = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(), y = d.getFullYear();
    const val = invoices
      .filter(inv => { const id = new Date(inv.created_at); return id.getMonth()===m && id.getFullYear()===y && inv.status==="paid"; })
      .reduce((s, inv) => s + Number(inv.total), 0);
    return { label: MONTHS[m], value: val };
  });

  // ─── Payment method breakdown ────────────────────────────────
  const payMethods = {};
  payments.filter(p => inPeriod(p.paid_at)).forEach(p => {
    payMethods[p.method] = (payMethods[p.method] || 0) + Number(p.amount);
  });
  const payMethodColors = { cash:"#10b981", upi:"#6366f1", card:"#f59e0b", partial:"#be185d", advance:"#7c3aed" };
  const paySegments = Object.entries(payMethods).map(([k, v]) => ({ label:k, value:v, color: payMethodColors[k]||"#9ca3af" }));

  // ─── Staff performance ────────────────────────────────────────
  const staffPerf = staff.map(s => {
    const theirInv = filteredInv.filter(i => i.staff_id === s.id && i.status === "paid");
    const revenue  = theirInv.reduce((sum, i) => sum + Number(i.total), 0);
    const clients  = new Set(theirInv.map(i => i.client_id).filter(Boolean)).size;
    const appts    = appointments.filter(a => a.staff_id === s.id && inPeriod(a.scheduled_at || a.created_at)).length;
    const attDays  = attendance.filter(a => a.staff_id === s.id && inPeriod(a.date || a.created_at)).length;
    return { ...s, revenue, clients, appts, attDays, invoices: theirInv.length };
  }).sort((a, b) => b.revenue - a.revenue);

  // ─── Top services ──────────────────────────────────────────────
  const [invoiceItems, setInvoiceItems] = useState([]);
  useEffect(() => {
    supabase.from("invoice_items").select("service_name, line_total, quantity")
      .in("invoice_id", invoices.filter(i => inPeriod(i.created_at) && i.status==="paid").map(i => i.id))
      .then(({ data }) => setInvoiceItems(data || []));
  }, [invoices, period]);

  const svcMap = {};
  invoiceItems.forEach(it => {
    if (!svcMap[it.service_name]) svcMap[it.service_name] = { revenue:0, count:0 };
    svcMap[it.service_name].revenue += Number(it.line_total);
    svcMap[it.service_name].count   += Number(it.quantity);
  });
  const topServices = Object.entries(svcMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ─── Client source breakdown ──────────────────────────────────
  const srcMap = {};
  clients.forEach(c => { const s = c.source || "Walk-in"; srcMap[s] = (srcMap[s]||0)+1; });
  const srcColors = ["#be185d","#6366f1","#10b981","#f59e0b","#ef4444","#7c3aed"];
  const srcSegments = Object.entries(srcMap).map(([k,v],i) => ({ label:k, value:v, color:srcColors[i%srcColors.length] }));

  // ─── Daily revenue (this month) ──────────────────────────────
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  const dailyRevenue = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => {
    const day = i + 1;
    const val = invoices
      .filter(inv => {
        const d = new Date(inv.created_at);
        return d.getDate()===day && d.getMonth()===new Date().getMonth() && d.getFullYear()===new Date().getFullYear() && inv.status==="paid";
      })
      .reduce((s, inv) => s + Number(inv.total), 0);
    return { label: day % 5 === 1 ? `${day}` : "", value: val };
  });

  const maxStaffRev = Math.max(...staffPerf.map(s => s.revenue), 1);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.title}>📊 Reports & Analytics</div>
          <div style={S.subtitle}>Business Intelligence · Hyfy Salon</div>
        </div>
        {/* Period selector */}
        <div style={S.periodRow}>
          {[["today","Today"],["week","This Week"],["month","This Month"],["year","This Year"]].map(([k,l]) => (
            <button key={k} style={{ ...S.periodBtn, ...(period===k ? S.periodBtnActive : {}) }} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={S.loading}>
          <div style={S.loadingSpinner}/>
          <div>Crunching your numbers…</div>
        </div>
      ) : (
        <>
          {/* ── KPI Row ── */}
          <div style={S.kpiGrid}>
            <StatCard icon="💰" label="Total Revenue" value={fmt(totalRevenue)} sub={`${paidInv.length} paid invoices`} color="#10b981"/>
            <StatCard icon="📋" label="Avg Bill Value" value={fmt(avgBillValue)} sub="per paid invoice" color="#6366f1"/>
            <StatCard icon="⏳" label="Pending Dues" value={fmt(pendingDue)} sub={`${filteredInv.filter(i=>i.balance_due>0).length} invoices`} color="#f59e0b"/>
            <StatCard icon="🧾" label="GST Collected" value={fmt(totalGst)} sub="18% on taxable services" color="#be185d"/>
            <StatCard icon="👥" label="New Clients" value={newClients} sub="joined this period" color="#7c3aed"/>
            <StatCard icon="📅" label="Appointments" value={totalAppts} sub={`${completedAppts} completed`} color="#0891b2"/>
          </div>

          {/* ── Tabs ── */}
          <div style={S.tabRow}>
            {[["overview","📈 Overview"],["revenue","💰 Revenue"],["staff","👩‍💼 Staff"],["clients","👥 Clients"],["services","💆 Services"]].map(([k,l]) => (
              <button key={k} style={{ ...S.tab, ...(tab===k ? S.tabActive : {}) }} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              OVERVIEW TAB
          ══════════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div style={S.twoCol}>
              {/* Monthly Revenue Bar Chart */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Revenue — Last 6 Months</div>
                <div style={S.chartSubtitle}>Paid invoices only</div>
                <BarChart data={monthlyRevenue} color="#be185d" height={160}/>
              </div>

              {/* Payment Methods Donut */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>Payment Methods</div>
                <div style={S.chartSubtitle}>This {period}</div>
                {paySegments.length === 0 ? (
                  <div style={S.noData}>No payment data for this period</div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:24, marginTop:16 }}>
                    <DonutChart segments={paySegments} size={130}/>
                    <div style={{ flex:1 }}>
                      {paySegments.map((seg, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:13 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:"50%", background:seg.color }}/>
                            <span style={{ textTransform:"capitalize" }}>{seg.label}</span>
                          </div>
                          <strong style={{ color:seg.color }}>{fmt(seg.value)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Revenue (this month) */}
              <div style={{ ...S.chartCard, gridColumn:"1/-1" }}>
                <div style={S.chartTitle}>Daily Revenue — {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</div>
                <div style={S.chartSubtitle}>Each bar = one day</div>
                <BarChart data={dailyRevenue} color="#6366f1" height={140}/>
              </div>

              {/* Quick summary boxes */}
              <div style={{ ...S.chartCard }}>
                <div style={S.chartTitle}>📋 Invoice Summary</div>
                {[
                  { label:"Total Invoices",  value: filteredInv.length,                           color:"#6366f1" },
                  { label:"Paid",            value: filteredInv.filter(i=>i.status==="paid").length,   color:"#10b981" },
                  { label:"Partial",         value: filteredInv.filter(i=>i.status==="partial").length, color:"#f59e0b" },
                  { label:"Unpaid",          value: filteredInv.filter(i=>i.status==="unpaid").length,  color:"#ef4444" },
                  { label:"Advances",        value: filteredInv.filter(i=>i.status==="advance").length, color:"#7c3aed" },
                ].map((row,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f9fafb", fontSize:14 }}>
                    <span style={{ color:"#6b7280" }}>{row.label}</span>
                    <strong style={{ color:row.color }}>{row.value}</strong>
                  </div>
                ))}
              </div>

              <div style={S.chartCard}>
                <div style={S.chartTitle}>👥 Client Acquisition</div>
                {srcSegments.length === 0 ? (
                  <div style={S.noData}>No client source data</div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:8 }}>
                    <DonutChart segments={srcSegments} size={110}/>
                    <div style={{ flex:1 }}>
                      {srcSegments.map((seg, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:seg.color }}/>
                            <span>{seg.label}</span>
                          </div>
                          <strong style={{ color:seg.color }}>{seg.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              REVENUE TAB
          ══════════════════════════════════════════════════ */}
          {tab === "revenue" && (
            <div>
              <div style={S.twoCol}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Monthly Revenue Trend</div>
                  <BarChart data={monthlyRevenue} color="#be185d" height={180}/>
                </div>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>Revenue Breakdown</div>
                  <div style={{ marginTop:16 }}>
                    {[
                      { label:"Gross Revenue",    value: fmt(totalRevenue),          color:"#10b981" },
                      { label:"GST Portion (18%)",value: fmt(totalGst),              color:"#be185d" },
                      { label:"Net Revenue",       value: fmt(totalRevenue-totalGst), color:"#6366f1" },
                      { label:"Advance Collected", value: fmt(filteredInv.reduce((s,i)=>s+Number(i.advance_amount||0),0)), color:"#7c3aed" },
                      { label:"Pending Dues",      value: fmt(pendingDue),            color:"#f59e0b" },
                    ].map((row, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #f9fafb" }}>
                        <span style={{ color:"#6b7280", fontSize:14 }}>{row.label}</span>
                        <span style={{ fontWeight:800, fontSize:16, color:row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily Revenue Table */}
              <div style={S.card}>
                <div style={S.chartTitle}>Revenue by Day — {MONTHS[new Date().getMonth()]}</div>
                <div style={S.tableHead}>
                  <div style={{ flex:1 }}>Day</div>
                  <div style={{ flex:2 }}>Date</div>
                  <div style={{ flex:1, textAlign:"right" }}>Invoices</div>
                  <div style={{ flex:1, textAlign:"right" }}>Revenue</div>
                  <div style={{ flex:2 }}>Bar</div>
                </div>
                {dailyRevenue.filter(d => d.value > 0).map((d, i) => {
                  const maxVal = Math.max(...dailyRevenue.map(x=>x.value), 1);
                  const dayNum = i + (dailyRevenue.findIndex(x=>x===d));
                  return (
                    <div key={i} style={S.tableRow}>
                      <div style={{ flex:1, fontWeight:700, color:"#be185d" }}>{dayNum+1}</div>
                      <div style={{ flex:2, color:"#6b7280", fontSize:13 }}>
                        {new Date(new Date().getFullYear(), new Date().getMonth(), dayNum+1).toLocaleDateString("en-IN",{day:"2-digit",month:"short",weekday:"short"})}
                      </div>
                      <div style={{ flex:1, textAlign:"right", fontWeight:600 }}>
                        {invoices.filter(inv => { const dt=new Date(inv.created_at); return dt.getDate()===dayNum+1 && dt.getMonth()===new Date().getMonth() && inv.status==="paid"; }).length}
                      </div>
                      <div style={{ flex:1, textAlign:"right", fontWeight:700, color:"#10b981" }}>{fmt(d.value)}</div>
                      <div style={{ flex:2, display:"flex", alignItems:"center" }}>
                        <div style={{ height:8, borderRadius:4, background:"#be185d22", flex:1 }}>
                          <div style={{ height:"100%", borderRadius:4, background:"#be185d", width:`${(d.value/maxVal)*100}%`, transition:"width 0.5s" }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {dailyRevenue.every(d=>d.value===0) && <div style={S.noData}>No revenue recorded this month yet.</div>}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              STAFF TAB
          ══════════════════════════════════════════════════ */}
          {tab === "staff" && (
            <div>
              {staffPerf.length === 0 ? (
                <div style={S.noData}>No staff data found.</div>
              ) : (
                <>
                  {/* Staff leaderboard */}
                  <div style={S.twoCol}>
                    {staffPerf.map((s, i) => (
                      <div key={s.id} style={{ ...S.chartCard, position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", top:12, right:16, fontSize:28, opacity:0.08, fontWeight:900 }}>#{i+1}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                          <div style={{ width:44, height:44, borderRadius:"50%", background:`hsl(${i*60},70%,92%)`,
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:`hsl(${i*60},60%,40%)` }}>
                            {s.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:15 }}>{s.name}</div>
                            <div style={{ fontSize:12, color:"#9ca3af", textTransform:"capitalize" }}>{s.role || "Staff"}</div>
                          </div>
                          {i === 0 && <span style={{ marginLeft:"auto", fontSize:20 }}>🏆</span>}
                        </div>

                        {/* Revenue bar */}
                        <div style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#9ca3af", marginBottom:4 }}>
                            <span>Revenue</span><span style={{ fontWeight:700, color:"#10b981" }}>{fmt(s.revenue)}</span>
                          </div>
                          <div style={{ height:8, borderRadius:4, background:"#f3f4f6" }}>
                            <div style={{ height:"100%", borderRadius:4, background:`linear-gradient(to right, #10b981, #6ee7b7)`,
                              width:`${(s.revenue/maxStaffRev)*100}%`, transition:"width 0.6s" }}/>
                          </div>
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                          {[
                            { label:"Invoices",    value:s.invoices, icon:"🧾" },
                            { label:"Clients",     value:s.clients,  icon:"👤" },
                            { label:"Attendance",  value:`${s.attDays}d`, icon:"✅" },
                          ].map((m,j) => (
                            <div key={j} style={{ background:"#f9fafb", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                              <div style={{ fontSize:16 }}>{m.icon}</div>
                              <div style={{ fontWeight:700, fontSize:14 }}>{m.value}</div>
                              <div style={{ fontSize:10, color:"#9ca3af" }}>{m.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Staff comparison table */}
                  <div style={S.card}>
                    <div style={S.chartTitle}>Staff Performance Summary</div>
                    <div style={S.tableHead}>
                      <div style={{ flex:0.4 }}>#</div>
                      <div style={{ flex:2 }}>Name</div>
                      <div style={{ flex:1, textAlign:"right" }}>Revenue</div>
                      <div style={{ flex:1, textAlign:"right" }}>Invoices</div>
                      <div style={{ flex:1, textAlign:"right" }}>Clients</div>
                      <div style={{ flex:1, textAlign:"right" }}>Attendance</div>
                      <div style={{ flex:2 }}>Revenue Share</div>
                    </div>
                    {staffPerf.map((s, i) => (
                      <div key={s.id} style={S.tableRow}>
                        <div style={{ flex:0.4, fontWeight:700, color:"#be185d" }}>#{i+1}</div>
                        <div style={{ flex:2, fontWeight:600 }}>{s.name}</div>
                        <div style={{ flex:1, textAlign:"right", fontWeight:700, color:"#10b981" }}>{fmt(s.revenue)}</div>
                        <div style={{ flex:1, textAlign:"right" }}>{s.invoices}</div>
                        <div style={{ flex:1, textAlign:"right" }}>{s.clients}</div>
                        <div style={{ flex:1, textAlign:"right" }}>{s.attDays} days</div>
                        <div style={{ flex:2, display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1, height:6, borderRadius:3, background:"#f3f4f6" }}>
                            <div style={{ height:"100%", borderRadius:3, background:"#be185d", width:`${(s.revenue/maxStaffRev)*100}%` }}/>
                          </div>
                          <span style={{ fontSize:11, color:"#9ca3af", minWidth:32 }}>
                            {totalRevenue > 0 ? Math.round((s.revenue/totalRevenue)*100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              CLIENTS TAB
          ══════════════════════════════════════════════════ */}
          {tab === "clients" && (
            <div style={S.twoCol}>
              <div style={S.chartCard}>
                <div style={S.chartTitle}>New Clients by Month</div>
                <BarChart
                  data={Array.from({length:6},(_,i) => {
                    const d = new Date(); d.setMonth(d.getMonth()-(5-i));
                    const m=d.getMonth(), y=d.getFullYear();
                    return { label:MONTHS[m], value: clients.filter(c => { const cd=new Date(c.created_at); return cd.getMonth()===m && cd.getFullYear()===y; }).length };
                  })}
                  color="#7c3aed" height={160}
                />
              </div>

              <div style={S.chartCard}>
                <div style={S.chartTitle}>Client Source Breakdown</div>
                {srcSegments.length === 0 ? <div style={S.noData}>No data</div> : (
                  <div style={{ display:"flex", alignItems:"center", gap:20, marginTop:12 }}>
                    <DonutChart segments={srcSegments} size={130}/>
                    <div style={{ flex:1 }}>
                      {srcSegments.map((seg,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f9fafb", fontSize:13 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:"50%", background:seg.color }}/>
                            <span>{seg.label}</span>
                          </div>
                          <div style={{ display:"flex", gap:10 }}>
                            <span style={{ fontWeight:700, color:seg.color }}>{seg.value}</span>
                            <span style={{ color:"#9ca3af" }}>{Math.round((seg.value/clients.length)*100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ ...S.chartCard, gridColumn:"1/-1" }}>
                <div style={S.chartTitle}>Client Stats</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginTop:8 }}>
                  {[
                    { label:"Total Clients",    value: clients.length,                                                  color:"#6366f1", icon:"👥" },
                    { label:"New This Period",   value: newClients,                                                      color:"#10b981", icon:"🌟" },
                    { label:"With Appointments", value: new Set(appointments.map(a=>a.client_id).filter(Boolean)).size,  color:"#be185d", icon:"📅" },
                    { label:"Avg Revenue/Client",value: clients.length ? fmt(totalRevenue/Math.max(newClients,1)) : "₹0",color:"#f59e0b", icon:"💰" },
                  ].map((s,i) => (
                    <div key={i} style={{ background:"#f9fafb", borderRadius:12, padding:"16px", textAlign:"center" }}>
                      <div style={{ fontSize:24 }}>{s.icon}</div>
                      <div style={{ fontWeight:800, fontSize:20, color:s.color, marginTop:6 }}>{s.value}</div>
                      <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SERVICES TAB
          ══════════════════════════════════════════════════ */}
          {tab === "services" && (
            <div>
              {topServices.length === 0 ? (
                <div style={{ ...S.card, ...S.noData }}>
                  No service data for this period. Create some paid invoices first!
                </div>
              ) : (
                <>
                  <div style={S.twoCol}>
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>Top 6 Services by Revenue</div>
                      <BarChart
                        data={topServices.slice(0,6).map(s => ({ label:s.name.split(" ").slice(0,2).join(" "), value:s.revenue }))}
                        color="#be185d" height={160}
                      />
                    </div>
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>Top 6 by Count</div>
                      <BarChart
                        data={topServices.slice(0,6).map(s => ({ label:s.name.split(" ").slice(0,2).join(" "), value:s.count }))}
                        color="#6366f1" height={160}
                      />
                    </div>
                  </div>

                  <div style={S.card}>
                    <div style={S.chartTitle}>All Services — This {period}</div>
                    <div style={S.tableHead}>
                      <div style={{ flex:0.4 }}>#</div>
                      <div style={{ flex:3 }}>Service</div>
                      <div style={{ flex:1, textAlign:"right" }}>Count</div>
                      <div style={{ flex:1.5, textAlign:"right" }}>Revenue</div>
                      <div style={{ flex:2 }}>Revenue Share</div>
                    </div>
                    {topServices.map((svc, i) => {
                      const maxR = topServices[0]?.revenue || 1;
                      return (
                        <div key={i} style={S.tableRow}>
                          <div style={{ flex:0.4, fontWeight:700, color:"#9ca3af" }}>{i+1}</div>
                          <div style={{ flex:3, fontWeight:600 }}>{svc.name}</div>
                          <div style={{ flex:1, textAlign:"right", color:"#6366f1", fontWeight:600 }}>{svc.count}×</div>
                          <div style={{ flex:1.5, textAlign:"right", fontWeight:700, color:"#10b981" }}>{fmt(svc.revenue)}</div>
                          <div style={{ flex:2, display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1, height:6, borderRadius:3, background:"#f3f4f6" }}>
                              <div style={{ height:"100%", borderRadius:3, background:"#be185d", width:`${(svc.revenue/maxR)*100}%` }}/>
                            </div>
                            <span style={{ fontSize:11, color:"#9ca3af", minWidth:32 }}>
                              {Math.round((svc.revenue / topServices.reduce((s,x)=>s+x.revenue,0))*100)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const S = {
  page:        { padding:"24px", maxWidth:1400, margin:"0 auto", fontFamily:"'Segoe UI',sans-serif", color:"#1a1a1a" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 },
  title:       { fontSize:26, fontWeight:800, letterSpacing:"-0.5px" },
  subtitle:    { color:"#9ca3af", fontSize:14, marginTop:2 },
  periodRow:   { display:"flex", background:"#f3f4f6", padding:4, borderRadius:10, gap:2 },
  periodBtn:   { padding:"7px 14px", borderRadius:7, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:"#6b7280", fontWeight:500 },
  periodBtnActive: { background:"#be185d", color:"#fff", fontWeight:700 },
  kpiGrid:     { display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:24 },
  statCard:    { background:"#fff", borderRadius:12, padding:"16px 18px", border:"1px solid #f3f4f6", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  statIcon:    { width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:10 },
  statValue:   { fontSize:22, fontWeight:800, marginBottom:2 },
  statLabel:   { fontSize:12, color:"#374151", fontWeight:600 },
  statSub:     { fontSize:11, color:"#9ca3af", marginTop:2 },
  tabRow:      { display:"flex", gap:4, marginBottom:20, background:"#f3f4f6", padding:4, borderRadius:10, width:"fit-content", flexWrap:"wrap" },
  tab:         { padding:"8px 16px", borderRadius:7, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:"#6b7280", fontWeight:500 },
  tabActive:   { background:"#fff", color:"#be185d", fontWeight:700, boxShadow:"0 1px 4px rgba(0,0,0,0.1)" },
  twoCol:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 },
  chartCard:   { background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", padding:"20px 24px", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" },
  chartTitle:  { fontSize:15, fontWeight:700, color:"#1a1a1a" },
  chartSubtitle: { fontSize:12, color:"#9ca3af", marginTop:2, marginBottom:4 },
  card:        { background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", padding:"20px 24px", boxShadow:"0 1px 6px rgba(0,0,0,0.04)", marginBottom:16 },
  tableHead:   { display:"flex", padding:"10px 16px", background:"#fdf2f8", borderRadius:"8px 8px 0 0", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px", marginTop:16 },
  tableRow:    { display:"flex", padding:"12px 16px", borderBottom:"1px solid #f9fafb", fontSize:13, alignItems:"center" },
  noData:      { textAlign:"center", padding:"40px", color:"#9ca3af", fontSize:14 },
  loading:     { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"80px", color:"#9ca3af" },
  loadingSpinner: { width:40, height:40, borderRadius:"50%", border:"3px solid #f3f4f6", borderTopColor:"#be185d", animation:"spin 0.8s linear infinite" },
};
