import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ─── Constants ─────────────────────────────────────────────────
const SALON_ID = "d4426e94-4dcb-41e4-90bb-71543533cbed";

const APPT_STATUS_COLOR = {
  scheduled:  { bg: "#dbeafe", color: "#1d4ed8", label: "Scheduled" },
  confirmed:  { bg: "#d1fae5", color: "#065f46", label: "Confirmed" },
  completed:  { bg: "#f3f4f6", color: "#374151", label: "Completed" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  "no-show":  { bg: "#fef3c7", color: "#92400e", label: "No Show"  },
};

// ─── Phone masking (Client Shield) ─────────────────────────────
function maskPhone(phone) {
  if (!phone) return "••••••••••";
  const p = phone.replace(/\D/g, "");
  if (p.length >= 10) return p.slice(0, 2) + "••••••" + p.slice(-2);
  return "••••••••••";
}

// ─── Greeting ──────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function timeNow() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [staffProfile, setStaffProfile] = useState(null);

  // ── Data ──
  const [todayAppts, setTodayAppts]   = useState([]);
  const [allAppts, setAllAppts]       = useState([]);
  const [myClients, setMyClients]     = useState([]);
  const [attendance, setAttendance]   = useState([]);
  const [todayAtt, setTodayAtt]       = useState(null);
  const [myInvoices, setMyInvoices]   = useState([]);

  // ── UI ──
  const [tab, setTab]                 = useState("home"); // home | schedule | clients | performance
  const [checkingIn, setCheckingIn]   = useState(false);
  const [currentTime, setCurrentTime] = useState(timeNow());

  // ── Clock tick ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(timeNow()), 30000);
    return () => clearInterval(t);
  }, []);

  // ─── Fetch everything ────────────────────────────────────────
  useEffect(() => {
    if (user?.id) fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    try {
      // Find staff profile by user id
      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("salon_id", SALON_ID)
        .eq("user_id", user.id)
        .maybeSingle();

      // Fallback: match by email if user_id column doesn't exist
      let staff = staffData;
      if (!staff) {
        const { data: byEmail } = await supabase
          .from("staff")
          .select("*")
          .eq("salon_id", SALON_ID)
          .eq("email", user.email)
          .maybeSingle();
        staff = byEmail;
      }

      setStaffProfile(staff);
      if (!staff) { setLoading(false); return; }

      const staffId = staff.id;
      const today   = todayStr();

      // Parallel fetch
      const [apptRes, clientRes, attRes, invRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("salon_id", SALON_ID).eq("staff_id", staffId).order("scheduled_at"),
        supabase.from("clients").select("id, name, phone_encrypted, tags, hair_type, skin_type, created_at").eq("salon_id", SALON_ID).eq("assigned_staff_id", staffId).order("name"),
        supabase.from("attendance").select("*").eq("salon_id", SALON_ID).eq("staff_id", staffId).order("date", { ascending: false }).limit(30),
        supabase.from("invoices").select("*").eq("salon_id", SALON_ID).eq("staff_id", staffId).order("created_at", { ascending: false }),
      ]);

      const appts = apptRes.data || [];
      setAllAppts(appts);
      setTodayAppts(appts.filter(a => (a.scheduled_at || a.created_at || "").slice(0, 10) === today));
      setMyClients(clientRes.data || []);

      const attList = attRes.data || [];
      setAttendance(attList);
      setTodayAtt(attList.find(a => a.date === today) || null);
      setMyInvoices(invRes.data || []);
    } catch (e) {
      console.error("Employee dashboard error:", e);
    }
    setLoading(false);
  }

  // ─── Check In / Out ──────────────────────────────────────────
  async function handleAttendance() {
    if (!staffProfile) return;
    setCheckingIn(true);
    const today = todayStr();
    const now   = timeNow();

    try {
      if (!todayAtt) {
        // Check in
        const { data } = await supabase.from("attendance").insert({
          salon_id: SALON_ID,
          staff_id: staffProfile.id,
          staff_name: staffProfile.name,
          date: today,
          check_in: now,
          status: "present",
        }).select().single();
        setTodayAtt(data);
        setAttendance(prev => [data, ...prev]);
      } else if (!todayAtt.check_out) {
        // Check out
        const { data } = await supabase.from("attendance")
          .update({ check_out: now, updated_at: new Date().toISOString() })
          .eq("id", todayAtt.id)
          .select().single();
        setTodayAtt(data);
        setAttendance(prev => prev.map(a => a.id === data.id ? data : a));
      }
    } catch(e) { alert("Attendance error: " + e.message); }
    setCheckingIn(false);
  }

  // ─── Update appointment status ───────────────────────────────
  async function updateApptStatus(apptId, status) {
    await supabase.from("appointments").update({ status }).eq("id", apptId);
    setTodayAppts(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
    setAllAppts(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
  }

  // ─── Performance metrics ─────────────────────────────────────
  const thisMonth = myInvoices.filter(i => {
    const d = new Date(i.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status === "paid";
  });
  const monthRevenue = thisMonth.reduce((s, i) => s + Number(i.total), 0);
  const monthInvoices = thisMonth.length;
  const totalClients = myClients.length;
  const presentDays = attendance.filter(a => a.status === "present").length;

  // ─── Attendance streak ────────────────────────────────────────
  let streak = 0;
  for (const a of attendance) {
    if (a.status === "present") streak++;
    else break;
  }

  // ─── Upcoming appointments (next 7 days) ─────────────────────
  const upcomingAppts = allAppts.filter(a => {
    const d = new Date(a.scheduled_at || a.created_at);
    const now = new Date();
    const diff = (d - now) / 86400000;
    return diff >= 0 && diff <= 7 && a.status !== "cancelled";
  }).slice(0, 10);

  // ─── Monthly attendance calendar (last 30 days) ───────────────
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().slice(0, 10);
    const rec = attendance.find(a => a.date === ds);
    return { date: ds, day: d.getDate(), status: rec?.status || "absent", checkIn: rec?.check_in, checkOut: rec?.check_out };
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={E.loadingPage}>
        <div style={E.spinner}/>
        <div style={{ color:"#9ca3af", marginTop:16 }}>Loading your dashboard…</div>
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div style={E.loadingPage}>
        <div style={{ fontSize:48 }}>🔍</div>
        <div style={{ fontWeight:700, fontSize:18, marginTop:12 }}>Staff profile not found</div>
        <div style={{ color:"#9ca3af", marginTop:6, maxWidth:340, textAlign:"center" }}>
          Your account isn't linked to a staff profile yet. Ask the salon owner to set this up.
        </div>
      </div>
    );
  }

  return (
    <div style={E.page}>

      {/* ── Hero Header ── */}
      <div style={E.hero}>
        <div style={E.heroLeft}>
          <div style={E.avatar}>{staffProfile.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <div style={E.greetText}>{greeting()},</div>
            <div style={E.nameText}>{staffProfile.name} ✨</div>
            <div style={E.roleText}>{staffProfile.role || "Beauty Artist"} · Hyfy Salon</div>
          </div>
        </div>

        {/* Attendance button */}
        <div style={E.heroRight}>
          <div style={E.clockBox}>
            <div style={E.clockTime}>{currentTime}</div>
            <div style={E.clockDate}>{new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long" })}</div>
          </div>
          {!todayAtt ? (
            <button style={E.checkInBtn} disabled={checkingIn} onClick={handleAttendance}>
              {checkingIn ? "…" : "🟢 Check In"}
            </button>
          ) : !todayAtt.check_out ? (
            <div style={{ textAlign:"center" }}>
              <div style={E.checkedInBadge}>✅ Checked in at {todayAtt.check_in}</div>
              <button style={E.checkOutBtn} disabled={checkingIn} onClick={handleAttendance}>
                {checkingIn ? "…" : "🔴 Check Out"}
              </button>
            </div>
          ) : (
            <div style={E.checkedOutBadge}>
              ✅ {todayAtt.check_in} → {todayAtt.check_out}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={E.tabRow}>
        {[
          ["home",        "🏠 Home"],
          ["schedule",    `📅 Schedule${todayAppts.length ? ` (${todayAppts.length})` : ""}`],
          ["clients",     `👥 My Clients (${totalClients})`],
          ["performance", "📊 Performance"],
        ].map(([k, l]) => (
          <button key={k} style={{ ...E.tab, ...(tab === k ? E.tabActive : {}) }} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          HOME TAB
      ══════════════════════════════════════════════════ */}
      {tab === "home" && (
        <div>
          {/* KPI row */}
          <div style={E.kpiGrid}>
            {[
              { icon:"💰", label:"Revenue This Month", value:fmt(monthRevenue),   color:"#10b981" },
              { icon:"🧾", label:"Invoices This Month", value:monthInvoices,       color:"#6366f1" },
              { icon:"👥", label:"My Clients",          value:totalClients,         color:"#be185d" },
              { icon:"📅", label:"Attendance Streak",   value:`${streak} days`,     color:"#f59e0b" },
            ].map((k, i) => (
              <div key={i} style={E.kpiCard}>
                <div style={{ fontSize:26, marginBottom:8 }}>{k.icon}</div>
                <div style={{ ...E.kpiVal, color:k.color }}>{k.value}</div>
                <div style={E.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Today's Schedule preview */}
          <div style={E.card}>
            <div style={E.cardTitle}>📅 Today's Appointments</div>
            {todayAppts.length === 0 ? (
              <div style={E.empty}>No appointments scheduled for today — enjoy your day! 🌸</div>
            ) : (
              <div>
                {todayAppts.map(appt => {
                  const sc = APPT_STATUS_COLOR[appt.status] || APPT_STATUS_COLOR.scheduled;
                  return (
                    <div key={appt.id} style={E.apptRow}>
                      <div style={{ ...E.apptTime }}>
                        {appt.scheduled_at
                          ? new Date(appt.scheduled_at).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true })
                          : "—"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={E.apptClient}>{appt.client_name || "Client"}</div>
                        <div style={E.apptService}>{appt.service_name || appt.notes || "Appointment"}</div>
                      </div>
                      <span style={{ ...E.badge, background:sc.bg, color:sc.color }}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attendance mini calendar */}
          <div style={E.card}>
            <div style={E.cardTitle}>📆 This Month's Attendance</div>
            <div style={E.attGrid}>
              {last30.map((day, i) => (
                <div key={i} title={`${day.date}${day.checkIn ? ` · In: ${day.checkIn}` : ""}${day.checkOut ? ` Out: ${day.checkOut}` : ""}`}
                  style={{ ...E.attDot, background:
                    day.status === "present" ? "#10b981" :
                    day.date === todayStr() ? "#fde68a" : "#f3f4f6",
                    color: day.status==="present" ? "#fff" : day.date===todayStr() ? "#92400e" : "#9ca3af"
                  }}>
                  {day.day}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:16, marginTop:12, fontSize:12, color:"#9ca3af" }}>
              <span><span style={{ ...E.legend, background:"#10b981" }}/> Present ({presentDays})</span>
              <span><span style={{ ...E.legend, background:"#fde68a" }}/> Today</span>
              <span><span style={{ ...E.legend, background:"#f3f4f6" }}/> Absent</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SCHEDULE TAB
      ══════════════════════════════════════════════════ */}
      {tab === "schedule" && (
        <div>
          {/* Today */}
          <div style={E.card}>
            <div style={E.cardTitle}>📅 Today — {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long" })}</div>
            {todayAppts.length === 0 ? (
              <div style={E.empty}>No appointments today.</div>
            ) : (
              todayAppts.map(appt => {
                const sc = APPT_STATUS_COLOR[appt.status] || APPT_STATUS_COLOR.scheduled;
                return (
                  <div key={appt.id} style={E.scheduleCard}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={E.scheduleTime}>
                          {appt.scheduled_at
                            ? new Date(appt.scheduled_at).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true })
                            : "Time not set"}
                        </div>
                        <div style={E.scheduleClient}>{appt.client_name || "Client"}</div>
                        <div style={E.scheduleService}>{appt.service_name || appt.notes || "Appointment"}</div>
                        {appt.duration_min && <div style={E.scheduleDuration}>⏱ {appt.duration_min} min</div>}
                      </div>
                      <span style={{ ...E.badge, background:sc.bg, color:sc.color }}>{sc.label}</span>
                    </div>
                    {/* Status actions */}
                    {appt.status !== "completed" && appt.status !== "cancelled" && (
                      <div style={{ display:"flex", gap:6, marginTop:12 }}>
                        <button style={{ ...E.tinyBtn, background:"#d1fae5", color:"#065f46" }} onClick={() => updateApptStatus(appt.id, "completed")}>
                          ✅ Mark Done
                        </button>
                        <button style={{ ...E.tinyBtn, background:"#dbeafe", color:"#1d4ed8" }} onClick={() => updateApptStatus(appt.id, "confirmed")}>
                          Confirm
                        </button>
                        <button style={{ ...E.tinyBtn, background:"#fee2e2", color:"#991b1b" }} onClick={() => updateApptStatus(appt.id, "no-show")}>
                          No Show
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Upcoming (next 7 days) */}
          <div style={E.card}>
            <div style={E.cardTitle}>🗓️ Upcoming — Next 7 Days</div>
            {upcomingAppts.length === 0 ? (
              <div style={E.empty}>No upcoming appointments in the next 7 days.</div>
            ) : (
              <div>
                <div style={E.tableHead}>
                  <div style={{ flex:1.5 }}>Date & Time</div>
                  <div style={{ flex:2 }}>Client</div>
                  <div style={{ flex:2 }}>Service</div>
                  <div style={{ flex:1, textAlign:"center" }}>Status</div>
                </div>
                {upcomingAppts.map(appt => {
                  const sc = APPT_STATUS_COLOR[appt.status] || APPT_STATUS_COLOR.scheduled;
                  const d = new Date(appt.scheduled_at || appt.created_at);
                  return (
                    <div key={appt.id} style={E.tableRow}>
                      <div style={{ flex:1.5 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div>
                        <div style={{ fontSize:12, color:"#9ca3af" }}>{d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</div>
                      </div>
                      <div style={{ flex:2, fontWeight:600 }}>{appt.client_name || "Client"}</div>
                      <div style={{ flex:2, color:"#6b7280", fontSize:13 }}>{appt.service_name || appt.notes || "—"}</div>
                      <div style={{ flex:1, textAlign:"center" }}>
                        <span style={{ ...E.badge, background:sc.bg, color:sc.color }}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CLIENTS TAB
      ══════════════════════════════════════════════════ */}
      {tab === "clients" && (
        <div style={E.card}>
          <div style={E.cardTitle}>
            👥 My Assigned Clients
            <span style={{ fontSize:12, fontWeight:400, color:"#9ca3af", marginLeft:8 }}>
              🔒 Phone numbers are protected by Client Shield
            </span>
          </div>

          {myClients.length === 0 ? (
            <div style={E.empty}>No clients assigned to you yet. Ask the owner to assign clients.</div>
          ) : (
            <>
              <div style={E.tableHead}>
                <div style={{ flex:2 }}>Name</div>
                <div style={{ flex:1.5 }}>Phone</div>
                <div style={{ flex:1.5 }}>Hair Type</div>
                <div style={{ flex:1.5 }}>Skin Type</div>
                <div style={{ flex:2 }}>Tags</div>
                <div style={{ flex:1.5 }}>Since</div>
              </div>
              {myClients.map(client => (
                <div key={client.id} style={E.tableRow}>
                  <div style={{ flex:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={E.clientAvatar}>{client.name?.charAt(0)?.toUpperCase()}</div>
                      <span style={{ fontWeight:600 }}>{client.name}</span>
                    </div>
                  </div>
                  <div style={{ flex:1.5 }}>
                    <span style={E.maskedPhone}>🔒 {maskPhone(client.phone_encrypted)}</span>
                  </div>
                  <div style={{ flex:1.5, fontSize:13, color:"#6b7280" }}>{client.hair_type || "—"}</div>
                  <div style={{ flex:1.5, fontSize:13, color:"#6b7280" }}>{client.skin_type || "—"}</div>
                  <div style={{ flex:2 }}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {(client.tags || []).slice(0,3).map((tag, i) => (
                        <span key={i} style={E.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex:1.5, fontSize:12, color:"#9ca3af" }}>
                    {new Date(client.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                  </div>
                </div>
              ))}

              {/* Anti-poaching notice */}
              <div style={E.shieldNotice}>
                🛡️ <strong>Client Shield Active</strong> — Phone numbers are masked to protect client privacy.
                You can serve clients fully without accessing their contact details.
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PERFORMANCE TAB
      ══════════════════════════════════════════════════ */}
      {tab === "performance" && (
        <div>
          {/* This month stats */}
          <div style={E.perfGrid}>
            {[
              { icon:"💰", label:"Revenue — This Month", value:fmt(monthRevenue),   color:"#10b981", sub:`${monthInvoices} paid invoices` },
              { icon:"👥", label:"Total Clients",         value:totalClients,         color:"#be185d", sub:"assigned to you" },
              { icon:"✅", label:"Attendance — This Month",value:`${presentDays} days`,color:"#6366f1", sub:`${streak} day streak 🔥` },
              { icon:"📅", label:"Total Appointments",    value:allAppts.filter(a=>a.status==="completed").length, color:"#f59e0b", sub:"completed lifetime" },
            ].map((k, i) => (
              <div key={i} style={E.perfCard}>
                <div style={{ fontSize:32 }}>{k.icon}</div>
                <div style={{ ...E.kpiVal, color:k.color, fontSize:28 }}>{k.value}</div>
                <div style={{ fontWeight:600, fontSize:14 }}>{k.label}</div>
                <div style={{ color:"#9ca3af", fontSize:12, marginTop:2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Revenue by month (last 6) */}
          <div style={E.card}>
            <div style={E.cardTitle}>📈 My Revenue — Last 6 Months</div>
            {(() => {
              const months = Array.from({ length:6 }, (_, i) => {
                const d = new Date(); d.setMonth(d.getMonth() - (5-i));
                const m=d.getMonth(), y=d.getFullYear();
                const val = myInvoices.filter(inv => {
                  const id = new Date(inv.created_at);
                  return id.getMonth()===m && id.getFullYear()===y && inv.status==="paid";
                }).reduce((s,inv)=>s+Number(inv.total),0);
                return { label:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m], value:val };
              });
              const max = Math.max(...months.map(m=>m.value), 1);
              return (
                <div style={{ display:"flex", alignItems:"flex-end", gap:12, height:140, paddingTop:16 }}>
                  {months.map((m,i) => (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{m.value > 0 ? (m.value>=1000?`₹${(m.value/1000).toFixed(1)}K`:`₹${m.value}`) : ""}</div>
                      <div style={{ width:"100%", background:"#f3f4f6", borderRadius:"4px 4px 0 0", height: Math.max(4,(m.value/max)*100), position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#10b981,#6ee7b7)", borderRadius:"4px 4px 0 0" }}/>
                      </div>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Recent invoices */}
          <div style={E.card}>
            <div style={E.cardTitle}>🧾 My Recent Invoices</div>
            {myInvoices.length === 0 ? (
              <div style={E.empty}>No invoices assigned to you yet.</div>
            ) : (
              <>
                <div style={E.tableHead}>
                  <div style={{ flex:1.5 }}>Invoice #</div>
                  <div style={{ flex:2 }}>Client</div>
                  <div style={{ flex:1.5, textAlign:"right" }}>Amount</div>
                  <div style={{ flex:1, textAlign:"center" }}>Status</div>
                  <div style={{ flex:1.5 }}>Date</div>
                </div>
                {myInvoices.slice(0, 15).map(inv => {
                  const statusStyle = {
                    paid:    { bg:"#d1fae5", color:"#065f46" },
                    partial: { bg:"#fef3c7", color:"#92400e" },
                    unpaid:  { bg:"#fee2e2", color:"#991b1b" },
                    advance: { bg:"#ede9fe", color:"#5b21b6" },
                  }[inv.status] || { bg:"#f3f4f6", color:"#6b7280" };
                  return (
                    <div key={inv.id} style={E.tableRow}>
                      <div style={{ flex:1.5, fontWeight:600, color:"#6366f1", fontSize:13 }}>{inv.invoice_number}</div>
                      <div style={{ flex:2, fontWeight:600 }}>{inv.client_name || "Walk-in"}</div>
                      <div style={{ flex:1.5, textAlign:"right", fontWeight:700, color:"#10b981" }}>{fmt(inv.total)}</div>
                      <div style={{ flex:1, textAlign:"center" }}>
                        <span style={{ ...E.badge, background:statusStyle.bg, color:statusStyle.color, textTransform:"capitalize" }}>{inv.status}</span>
                      </div>
                      <div style={{ flex:1.5, fontSize:12, color:"#9ca3af" }}>
                        {new Date(inv.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Attendance log */}
          <div style={E.card}>
            <div style={E.cardTitle}>📆 Attendance Log — Last 30 Days</div>
            <div style={E.tableHead}>
              <div style={{ flex:1.5 }}>Date</div>
              <div style={{ flex:1, textAlign:"center" }}>Status</div>
              <div style={{ flex:1 }}>Check In</div>
              <div style={{ flex:1 }}>Check Out</div>
              <div style={{ flex:1.5 }}>Hours</div>
            </div>
            {last30.slice().reverse().filter(d => d.status !== "absent" || d.date === todayStr()).map((day, i) => {
              let hours = "—";
              if (day.checkIn && day.checkOut) {
                const [ih, im] = day.checkIn.replace(/\s?(AM|PM)/i,"").split(":").map(Number);
                const [oh, om] = day.checkOut.replace(/\s?(AM|PM)/i,"").split(":").map(Number);
                const diff = (oh*60+om) - (ih*60+im);
                if (diff > 0) hours = `${Math.floor(diff/60)}h ${diff%60}m`;
              }
              return (
                <div key={i} style={E.tableRow}>
                  <div style={{ flex:1.5, fontSize:13 }}>
                    {new Date(day.date).toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"})}
                  </div>
                  <div style={{ flex:1, textAlign:"center" }}>
                    <span style={{ ...E.badge,
                      background: day.status==="present"?"#d1fae5":"#f3f4f6",
                      color: day.status==="present"?"#065f46":"#9ca3af",
                      textTransform:"capitalize" }}>
                      {day.status==="present"?"✅ Present":"—"}
                    </span>
                  </div>
                  <div style={{ flex:1, fontSize:13, color:"#374151" }}>{day.checkIn || "—"}</div>
                  <div style={{ flex:1, fontSize:13, color:"#374151" }}>{day.checkOut || "—"}</div>
                  <div style={{ flex:1.5, fontSize:13, fontWeight:600, color:"#6366f1" }}>{hours}</div>
                </div>
              );
            })}
            {attendance.length === 0 && <div style={E.empty}>No attendance records found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const E = {
  page:         { padding:"24px", maxWidth:1300, margin:"0 auto", fontFamily:"'Segoe UI',sans-serif", color:"#1a1a1a" },
  loadingPage:  { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:8 },
  spinner:      { width:40, height:40, borderRadius:"50%", border:"3px solid #f3f4f6", borderTopColor:"#be185d" },
  hero:         { background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", borderRadius:20, padding:"28px 32px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20, color:"#fff" },
  heroLeft:     { display:"flex", alignItems:"center", gap:18 },
  avatar:       { width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#be185d,#f9a8d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"#fff", border:"3px solid rgba(255,255,255,0.2)" },
  greetText:    { fontSize:14, color:"rgba(255,255,255,0.6)" },
  nameText:     { fontSize:24, fontWeight:800, letterSpacing:"-0.5px" },
  roleText:     { fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:2 },
  heroRight:    { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 },
  clockBox:     { textAlign:"right" },
  clockTime:    { fontSize:28, fontWeight:800, letterSpacing:"-1px" },
  clockDate:    { fontSize:12, color:"rgba(255,255,255,0.5)" },
  checkInBtn:   { padding:"10px 24px", borderRadius:10, border:"none", background:"#10b981", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" },
  checkOutBtn:  { padding:"8px 20px", borderRadius:10, border:"none", background:"rgba(239,68,68,0.8)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", marginTop:6 },
  checkedInBadge:{ fontSize:12, color:"#6ee7b7", marginBottom:4 },
  checkedOutBadge:{ background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:10, padding:"8px 16px", fontSize:13, color:"#6ee7b7", fontWeight:600 },
  tabRow:       { display:"flex", gap:4, marginBottom:20, background:"#f3f4f6", padding:4, borderRadius:10, flexWrap:"wrap" },
  tab:          { padding:"8px 16px", borderRadius:7, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:"#6b7280", fontWeight:500 },
  tabActive:    { background:"#fff", color:"#be185d", fontWeight:700, boxShadow:"0 1px 4px rgba(0,0,0,0.1)" },
  kpiGrid:      { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 },
  kpiCard:      { background:"#fff", borderRadius:14, padding:"20px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", textAlign:"center" },
  kpiVal:       { fontSize:24, fontWeight:800, marginBottom:4 },
  kpiLabel:     { fontSize:12, color:"#9ca3af" },
  card:         { background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", padding:"20px 24px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  cardTitle:    { fontSize:15, fontWeight:700, marginBottom:16 },
  apptRow:      { display:"flex", alignItems:"center", gap:14, padding:"10px 0", borderBottom:"1px solid #f9fafb" },
  apptTime:     { fontSize:13, fontWeight:700, color:"#6366f1", minWidth:70 },
  apptClient:   { fontWeight:600, fontSize:14 },
  apptService:  { fontSize:12, color:"#9ca3af" },
  scheduleCard: { background:"#f9fafb", borderRadius:12, padding:"16px 18px", marginBottom:10, border:"1px solid #f3f4f6" },
  scheduleTime: { fontSize:22, fontWeight:800, color:"#6366f1" },
  scheduleClient:{ fontSize:16, fontWeight:700, marginTop:4 },
  scheduleService:{ fontSize:13, color:"#6b7280", marginTop:2 },
  scheduleDuration:{ fontSize:12, color:"#9ca3af", marginTop:4 },
  attGrid:      { display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:6, marginTop:8 },
  attDot:       { borderRadius:8, padding:"6px 4px", textAlign:"center", fontSize:11, fontWeight:700 },
  legend:       { display:"inline-block", width:10, height:10, borderRadius:"50%", marginRight:4 },
  tableHead:    { display:"flex", padding:"10px 16px", background:"#f9fafb", borderRadius:"8px 8px 0 0", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px" },
  tableRow:     { display:"flex", padding:"12px 16px", borderBottom:"1px solid #f9fafb", fontSize:13, alignItems:"center" },
  badge:        { display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 },
  tinyBtn:      { padding:"5px 12px", borderRadius:6, border:"none", fontSize:12, cursor:"pointer", fontWeight:600 },
  clientAvatar: { width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#fce7f3,#fbcfe8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#be185d", flexShrink:0 },
  maskedPhone:  { fontFamily:"monospace", fontSize:13, color:"#6b7280", background:"#f3f4f6", padding:"2px 8px", borderRadius:6 },
  tag:          { fontSize:11, background:"#f3f4f6", padding:"2px 8px", borderRadius:12, color:"#374151" },
  shieldNotice: { marginTop:16, background:"#ede9fe", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#5b21b6", display:"flex", alignItems:"center", gap:8 },
  empty:        { textAlign:"center", padding:"32px", color:"#9ca3af", fontSize:14 },
  perfGrid:     { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 },
  perfCard:     { background:"#fff", borderRadius:14, padding:"24px 20px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", textAlign:"center", display:"flex", flexDirection:"column", gap:6, alignItems:"center" },
};
