import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ─── Constants ─────────────────────────────────────────────────
const SALON_ID = "d4426e94-4dcb-41e4-90bb-71543533cbed";

const PACKAGES = ["Basic", "Premium", "Custom"];
const SKIN_TYPES = ["Normal","Oily","Dry","Combination","Sensitive"];
const HAIR_TYPES = ["Straight","Wavy","Curly","Coily"];

const SESSION_TYPES = [
  { key:"skin_prep",     label:"Skin Prep Session",   icon:"🧴", color:"#10b981", daysBeforeWedding: 90 },
  { key:"hair_trial",    label:"Hair Trial",           icon:"💇", color:"#6366f1", daysBeforeWedding: 60 },
  { key:"makeup_trial",  label:"Makeup Trial",         icon:"💄", color:"#be185d", daysBeforeWedding: 45 },
  { key:"pre_bridal",    label:"Pre-Bridal Package",   icon:"✨", color:"#f59e0b", daysBeforeWedding: 30 },
  { key:"mehndi",        label:"Mehndi Day Look",      icon:"🪷", color:"#dc2626", daysBeforeWedding: 1 },
  { key:"wedding_day",   label:"Wedding Day",          icon:"👰", color:"#7c3aed", daysBeforeWedding: 0 },
  { key:"reception",     label:"Reception Look",       icon:"🥂", color:"#0891b2", daysBeforeWedding: -1 },
  { key:"custom",        label:"Custom Session",       icon:"📅", color:"#374151", daysBeforeWedding: null },
];

const DEFAULT_CHECKLIST = [
  { label:"Complete skin analysis",           category:"Skin",   daysBeforeWedding: 120 },
  { label:"Start skin prep routine",          category:"Skin",   daysBeforeWedding: 90  },
  { label:"Book all sessions",               category:"Admin",  daysBeforeWedding: 90  },
  { label:"Hair trial done",                 category:"Hair",   daysBeforeWedding: 60  },
  { label:"Makeup trial done",               category:"Makeup", daysBeforeWedding: 45  },
  { label:"Confirm package & payment",       category:"Admin",  daysBeforeWedding: 30  },
  { label:"Pre-bridal facial complete",      category:"Skin",   daysBeforeWedding: 14  },
  { label:"Threading & waxing done",        category:"Skin",   daysBeforeWedding: 7   },
  { label:"Nail appointment confirmed",      category:"Makeup", daysBeforeWedding: 5   },
  { label:"Final skin glow treatment",       category:"Skin",   daysBeforeWedding: 3   },
  { label:"All products packed & ready",     category:"Admin",  daysBeforeWedding: 1   },
  { label:"Wedding day kit checklist done",  category:"Admin",  daysBeforeWedding: 1   },
];

const CHECKLIST_CATEGORIES = ["All","Skin","Hair","Makeup","Admin","Other"];
const CAT_COLORS = { Skin:"#10b981", Hair:"#6366f1", Makeup:"#be185d", Admin:"#f59e0b", Other:"#9ca3af", General:"#374151" };

const fmt = (n) => `₹${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:0})}`;

// ─── Countdown Component ────────────────────────────────────────
function Countdown({ weddingDate }) {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    function calc() {
      const now = new Date();
      const wed = new Date(weddingDate);
      wed.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      const ms = wed - now;
      if (ms < 0) return setDiff({ past: true, days: Math.abs(Math.floor(ms/86400000)) });
      const days = Math.floor(ms/86400000);
      setDiff({ days, weeks: Math.floor(days/7), months: Math.floor(days/30) });
    }
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [weddingDate]);

  if (!diff) return null;
  if (diff.past) return (
    <div style={CS.countdownPast}>✨ Wedding was {diff.days} day{diff.days!==1?"s":""} ago — Congratulations!</div>
  );
  return (
    <div style={CS.countdownRow}>
      {[
        { val: diff.months, label: "Months" },
        { val: diff.weeks % 4, label: "Weeks" },
        { val: diff.days % 7, label: "Days" },
      ].map((u,i) => (
        <div key={i} style={CS.countdownUnit}>
          <div style={CS.countdownNum}>{u.val}</div>
          <div style={CS.countdownLabel}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function BridalTimeline() {
  const { user } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [bookings, setBookings]       = useState([]);
  const [staff, setStaff]             = useState([]);

  // ── View state ──
  const [view, setView]               = useState("list");  // list | detail | create
  const [selectedBooking, setSelected] = useState(null);
  const [sessions, setSessions]       = useState([]);
  const [checklist, setChecklist]     = useState([]);
  const [activeTab, setActiveTab]     = useState("timeline"); // timeline | checklist | payment

  // ── Booking form ──
  const [bookingForm, setBookingForm] = useState(defaultBookingForm());
  const [bookingSaving, setBookingSaving] = useState(false);

  // ── Session modal ──
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionForm, setSessionForm]   = useState(defaultSessionForm());
  const [sessionSaving, setSessionSaving] = useState(false);
  const [editSession, setEditSession]   = useState(null);

  // ── Checklist ──
  const [checklistFilter, setChecklistFilter] = useState("All");
  const [newCheckItem, setNewCheckItem]       = useState("");
  const [newCheckCat, setNewCheckCat]         = useState("Skin");

  function defaultBookingForm() {
    return { bride_name:"", phone:"", email:"", wedding_date:"", venue:"", assigned_staff_id:"", assigned_staff_name:"", package:"Premium", package_amount:25000, advance_paid:0, skin_type:"Normal", hair_type:"Straight", notes:"" };
  }
  function defaultSessionForm() {
    return { session_type:"makeup_trial", session_label:"", scheduled_date:"", scheduled_time:"10:00", duration_min:120, staff_id:"", staff_name:"", services:"", notes:"" };
  }

  // ─── Fetch ──────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [bRes, stRes] = await Promise.all([
      supabase.from("bridal_bookings").select("*").eq("salon_id", SALON_ID).order("wedding_date"),
      supabase.from("staff").select("id, name").eq("salon_id", SALON_ID),
    ]);
    setBookings(bRes.data || []);
    setStaff(stRes.data || []);
    setLoading(false);
  }

  async function openDetail(booking) {
    setSelected(booking);
    const [sRes, cRes] = await Promise.all([
      supabase.from("bridal_sessions").select("*").eq("booking_id", booking.id).order("scheduled_date"),
      supabase.from("bridal_checklist_items").select("*").eq("booking_id", booking.id).order("due_date"),
    ]);
    setSessions(sRes.data || []);
    setChecklist(cRes.data || []);
    setView("detail");
    setActiveTab("timeline");
  }

  // ─── Save Booking ───────────────────────────────────────────
  async function saveBooking() {
    if (!bookingForm.bride_name.trim()) return alert("Bride name is required.");
    if (!bookingForm.wedding_date) return alert("Wedding date is required.");
    setBookingSaving(true);
    try {
      const selectedStaff = staff.find(s => s.id === bookingForm.assigned_staff_id);
      const balance = Number(bookingForm.package_amount) - Number(bookingForm.advance_paid);
      const payload = {
        ...bookingForm,
        salon_id: SALON_ID,
        assigned_staff_name: selectedStaff?.name || "",
        balance_due: balance,
        updated_at: new Date().toISOString(),
      };
      const { data: newB, error } = await supabase.from("bridal_bookings").insert(payload).select().single();
      if (error) throw error;

      // Auto-create default sessions based on wedding date
      const wDate = new Date(bookingForm.wedding_date);
      const sessionInserts = SESSION_TYPES.filter(st => st.daysBeforeWedding !== null).map(st => {
        const sessionDate = new Date(wDate);
        sessionDate.setDate(sessionDate.getDate() - st.daysBeforeWedding);
        return {
          booking_id: newB.id, salon_id: SALON_ID,
          session_type: st.key, session_label: st.label,
          scheduled_date: sessionDate.toISOString().slice(0,10),
          scheduled_time: "10:00", duration_min: 120,
          staff_id: bookingForm.assigned_staff_id || null,
          staff_name: selectedStaff?.name || null,
          status: "upcoming",
        };
      });
      await supabase.from("bridal_sessions").insert(sessionInserts);

      // Auto-create default checklist
      const checkInserts = DEFAULT_CHECKLIST.map(item => {
        const dueDate = new Date(wDate);
        dueDate.setDate(dueDate.getDate() - item.daysBeforeWedding);
        return {
          booking_id: newB.id, salon_id: SALON_ID,
          label: item.label, category: item.category,
          due_date: dueDate.toISOString().slice(0,10),
          is_done: false,
        };
      });
      await supabase.from("bridal_checklist_items").insert(checkInserts);

      await fetchAll();
      setBookingForm(defaultBookingForm());
      await openDetail(newB);
    } catch(e) { alert("Error: " + e.message); }
    setBookingSaving(false);
  }

  // ─── Save Session ───────────────────────────────────────────
  async function saveSession() {
    if (!sessionForm.session_label.trim()) return alert("Session name required.");
    setSessionSaving(true);
    try {
      const selectedStaff = staff.find(s => s.id === sessionForm.staff_id);
      const payload = {
        booking_id: selectedBooking.id, salon_id: SALON_ID,
        session_type: sessionForm.session_type,
        session_label: sessionForm.session_label,
        scheduled_date: sessionForm.scheduled_date || null,
        scheduled_time: sessionForm.scheduled_time || null,
        duration_min: Number(sessionForm.duration_min),
        staff_id: sessionForm.staff_id || null,
        staff_name: selectedStaff?.name || sessionForm.staff_name || null,
        services: sessionForm.services ? sessionForm.services.split(",").map(s=>s.trim()).filter(Boolean) : [],
        notes: sessionForm.notes || null,
        status: "upcoming",
      };
      if (editSession) {
        await supabase.from("bridal_sessions").update(payload).eq("id", editSession.id);
      } else {
        await supabase.from("bridal_sessions").insert(payload);
      }
      const { data } = await supabase.from("bridal_sessions").select("*").eq("booking_id", selectedBooking.id).order("scheduled_date");
      setSessions(data || []);
      setSessionModal(false);
      setEditSession(null);
      setSessionForm(defaultSessionForm());
    } catch(e) { alert("Error: " + e.message); }
    setSessionSaving(false);
  }

  // ─── Toggle Session Status ──────────────────────────────────
  async function toggleSessionStatus(session) {
    const next = session.status === "upcoming" ? "completed" : "upcoming";
    await supabase.from("bridal_sessions").update({ status: next }).eq("id", session.id);
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: next } : s));
  }

  // ─── Toggle Checklist ───────────────────────────────────────
  async function toggleCheck(item) {
    await supabase.from("bridal_checklist_items").update({ is_done: !item.is_done }).eq("id", item.id);
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, is_done: !c.is_done } : c));
  }

  // ─── Add Checklist Item ─────────────────────────────────────
  async function addCheckItem() {
    if (!newCheckItem.trim()) return;
    const { data } = await supabase.from("bridal_checklist_items").insert({
      booking_id: selectedBooking.id, salon_id: SALON_ID,
      label: newCheckItem, category: newCheckCat, is_done: false,
    }).select().single();
    setChecklist(prev => [...prev, data]);
    setNewCheckItem("");
  }

  // ─── Days until wedding helper ──────────────────────────────
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.ceil((d - now) / 86400000);
  }

  function statusColor(status) {
    return { upcoming:"#6366f1", completed:"#10b981", rescheduled:"#f59e0b", cancelled:"#ef4444" }[status] || "#9ca3af";
  }

  // ─── Stats ──────────────────────────────────────────────────
  const activeBookings = bookings.filter(b => b.status === "active");
  const upcomingWeddings = bookings.filter(b => daysUntil(b.wedding_date) >= 0 && b.status === "active");
  const totalRevenue = bookings.reduce((s,b) => s + Number(b.package_amount||0), 0);
  const totalAdvance = bookings.reduce((s,b) => s + Number(b.advance_paid||0), 0);

  // ─── Checklist progress ─────────────────────────────────────
  const checkDone = checklist.filter(c=>c.is_done).length;
  const checkTotal = checklist.length;
  const checkPct = checkTotal ? Math.round((checkDone/checkTotal)*100) : 0;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={CS.page}>

      {/* ── Decorative top accent ── */}
      <div style={CS.topAccent}/>

      {/* ── Header ── */}
      <div style={CS.header}>
        <div>
          <div style={CS.title}>👰 Bridal Timeline</div>
          <div style={CS.subtitle}>Countdown · Sessions · Checklist · Packages</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {view !== "list" && (
            <button style={CS.btnOutline} onClick={() => { setView("list"); setSelected(null); }}>← Back</button>
          )}
          {view === "list" && (
            <button style={CS.btnPrimary} onClick={() => setView("create")}>+ New Bridal Booking</button>
          )}
        </div>
      </div>

      {/* ── Stats (list view) ── */}
      {view === "list" && (
        <div style={CS.statsRow}>
          {[
            { icon:"👰", label:"Active Bookings",    value: activeBookings.length, color:"#be185d" },
            { icon:"💍", label:"Upcoming Weddings",  value: upcomingWeddings.length, color:"#7c3aed" },
            { icon:"💰", label:"Total Package Value", value: fmt(totalRevenue), color:"#10b981" },
            { icon:"✅", label:"Advance Collected",  value: fmt(totalAdvance), color:"#f59e0b" },
          ].map((s,i) => (
            <div key={i} style={CS.statCard}>
              <div style={{ fontSize:28 }}>{s.icon}</div>
              <div>
                <div style={{ ...CS.statValue, color:s.color }}>{s.value}</div>
                <div style={CS.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={CS.loading}>Loading bridal bookings…</div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              LIST VIEW
          ══════════════════════════════════════════════════ */}
          {view === "list" && (
            <div>
              {bookings.length === 0 ? (
                <div style={CS.emptyState}>
                  <div style={{ fontSize:60, marginBottom:16 }}>👰</div>
                  <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No Bridal Bookings Yet</div>
                  <div style={{ color:"#9ca3af", marginBottom:20 }}>Create your first bridal package to get started</div>
                  <button style={CS.btnPrimary} onClick={() => setView("create")}>+ Add First Booking</button>
                </div>
              ) : (
                <div style={CS.bookingGrid}>
                  {bookings.map(b => {
                    const days = daysUntil(b.wedding_date);
                    const progress = b.package_amount > 0 ? Math.round((b.advance_paid / b.package_amount)*100) : 0;
                    return (
                      <div key={b.id} style={CS.bookingCard} onClick={() => openDetail(b)}>
                        {/* Top ribbon */}
                        <div style={{ ...CS.ribbon, background: days === null ? "#9ca3af" : days < 0 ? "#10b981" : days <= 7 ? "#ef4444" : days <= 30 ? "#f59e0b" : "#be185d" }}>
                          {days === null ? "—" : days < 0 ? "Completed ✓" : days === 0 ? "TODAY! 👰" : days <= 7 ? `${days}d away ⚡` : `${days} days`}
                        </div>

                        <div style={CS.brideRow}>
                          <div style={CS.brideAvatar}>{b.bride_name?.charAt(0)?.toUpperCase()}</div>
                          <div>
                            <div style={CS.brideName}>{b.bride_name}</div>
                            <div style={CS.bridePhone}>{b.phone || "No phone"}</div>
                          </div>
                        </div>

                        <div style={CS.weddingDate}>
                          💍 {new Date(b.wedding_date).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}
                        </div>

                        {b.venue && <div style={CS.venue}>📍 {b.venue}</div>}

                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:12 }}>
                          <span style={{ background:"#fdf2f8", color:"#be185d", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
                            {b.package}
                          </span>
                          {b.assigned_staff_name && (
                            <span style={{ color:"#9ca3af" }}>👩‍🎨 {b.assigned_staff_name}</span>
                          )}
                        </div>

                        {/* Payment progress */}
                        <div style={{ marginTop:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:4 }}>
                            <span>Payment: {fmt(b.advance_paid)} / {fmt(b.package_amount)}</span>
                            <span style={{ color: progress===100?"#10b981":"#f59e0b" }}>{progress}%</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:"#f3f4f6" }}>
                            <div style={{ height:"100%", borderRadius:3, background: progress===100?"#10b981":"#f59e0b", width:`${progress}%`, transition:"width 0.5s" }}/>
                          </div>
                        </div>

                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:11, color:"#9ca3af" }}>
                          <span style={{ color: b.status==="active"?"#10b981":"#9ca3af", fontWeight:600, textTransform:"capitalize" }}>● {b.status}</span>
                          <span>Click to open →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              CREATE VIEW
          ══════════════════════════════════════════════════ */}
          {view === "create" && (
            <div style={CS.createWrap}>
              <div style={CS.card}>
                <div style={CS.cardTitle}>👰 New Bridal Booking</div>
                <div style={CS.formNote}>Sessions & checklist will be auto-generated based on the wedding date!</div>

                <div style={CS.formGrid}>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Bride Name *</label>
                    <input style={CS.input} placeholder="e.g. Priya Sharma" value={bookingForm.bride_name} onChange={e=>setBookingForm(f=>({...f,bride_name:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Wedding Date *</label>
                    <input style={CS.input} type="date" value={bookingForm.wedding_date} onChange={e=>setBookingForm(f=>({...f,wedding_date:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Phone</label>
                    <input style={CS.input} placeholder="9876543210" value={bookingForm.phone} onChange={e=>setBookingForm(f=>({...f,phone:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Email</label>
                    <input style={CS.input} placeholder="bride@email.com" value={bookingForm.email} onChange={e=>setBookingForm(f=>({...f,email:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Venue</label>
                    <input style={CS.input} placeholder="e.g. The Grand Palace, Mumbai" value={bookingForm.venue} onChange={e=>setBookingForm(f=>({...f,venue:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Assigned Artist</label>
                    <select style={CS.select} value={bookingForm.assigned_staff_id} onChange={e=>setBookingForm(f=>({...f,assigned_staff_id:e.target.value}))}>
                      <option value="">Select staff</option>
                      {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Package</label>
                    <select style={CS.select} value={bookingForm.package} onChange={e=>setBookingForm(f=>({...f,package:e.target.value}))}>
                      {PACKAGES.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Package Amount (₹)</label>
                    <input style={CS.input} type="number" value={bookingForm.package_amount} onChange={e=>setBookingForm(f=>({...f,package_amount:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Advance Paid (₹)</label>
                    <input style={CS.input} type="number" value={bookingForm.advance_paid} onChange={e=>setBookingForm(f=>({...f,advance_paid:e.target.value}))}/>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Skin Type</label>
                    <select style={CS.select} value={bookingForm.skin_type} onChange={e=>setBookingForm(f=>({...f,skin_type:e.target.value}))}>
                      {SKIN_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={CS.formGroup}>
                    <label style={CS.label}>Hair Type</label>
                    <select style={CS.select} value={bookingForm.hair_type} onChange={e=>setBookingForm(f=>({...f,hair_type:e.target.value}))}>
                      {HAIR_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ ...CS.formGroup, gridColumn:"1/-1" }}>
                    <label style={CS.label}>Notes</label>
                    <textarea style={{ ...CS.input, height:70, resize:"vertical" }} placeholder="Special requirements, allergies, references…" value={bookingForm.notes} onChange={e=>setBookingForm(f=>({...f,notes:e.target.value}))}/>
                  </div>
                </div>

                <div style={{ display:"flex", gap:10, marginTop:20 }}>
                  <button style={{ ...CS.btnOutline, flex:1, justifyContent:"center" }} onClick={()=>setView("list")}>Cancel</button>
                  <button style={{ ...CS.btnPrimary, flex:2, justifyContent:"center" }} disabled={bookingSaving} onClick={saveBooking}>
                    {bookingSaving ? "Creating…" : "✨ Create Bridal Booking"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              DETAIL VIEW
          ══════════════════════════════════════════════════ */}
          {view === "detail" && selectedBooking && (
            <div>
              {/* Bride hero section */}
              <div style={CS.bridalHero}>
                <div style={{ flex:1 }}>
                  <div style={CS.heroName}>{selectedBooking.bride_name}</div>
                  <div style={CS.heroDate}>
                    💍 {new Date(selectedBooking.wedding_date).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric",weekday:"long"})}
                  </div>
                  {selectedBooking.venue && <div style={CS.heroVenue}>📍 {selectedBooking.venue}</div>}
                  <div style={{ display:"flex", gap:10, marginTop:10, flexWrap:"wrap" }}>
                    <span style={CS.heroBadge}>{selectedBooking.package} Package</span>
                    {selectedBooking.assigned_staff_name && <span style={CS.heroBadge}>👩‍🎨 {selectedBooking.assigned_staff_name}</span>}
                    <span style={CS.heroBadge}>🧴 {selectedBooking.skin_type} Skin</span>
                    <span style={CS.heroBadge}>💇 {selectedBooking.hair_type} Hair</span>
                  </div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={CS.countdownTitle}>Wedding Countdown</div>
                  <Countdown weddingDate={selectedBooking.wedding_date}/>
                </div>
              </div>

              {/* Sub tabs */}
              <div style={CS.subTabRow}>
                {[["timeline","📅 Timeline"],["checklist","✅ Checklist"],["payment","💰 Payment"]].map(([k,l])=>(
                  <button key={k} style={{...CS.subTab,...(activeTab===k?CS.subTabActive:{})}} onClick={()=>setActiveTab(k)}>{l}</button>
                ))}
              </div>

              {/* ── TIMELINE TAB ── */}
              {activeTab === "timeline" && (
                <div>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                    <button style={CS.btnPrimary} onClick={()=>{ setEditSession(null); setSessionForm(defaultSessionForm()); setSessionModal(true); }}>
                      + Add Session
                    </button>
                  </div>

                  {sessions.length === 0 ? (
                    <div style={CS.emptyState}>No sessions yet. Add sessions or create a new booking to auto-generate them.</div>
                  ) : (
                    <div style={CS.timeline}>
                      {sessions.map((session, i) => {
                        const st = SESSION_TYPES.find(t=>t.key===session.session_type) || SESSION_TYPES[SESSION_TYPES.length-1];
                        const days = daysUntil(session.scheduled_date);
                        const isPast = days !== null && days < 0;
                        return (
                          <div key={session.id} style={{ display:"flex", gap:0, marginBottom:0 }}>
                            {/* Connector line */}
                            <div style={CS.timelineLeft}>
                              <div style={{ ...CS.timelineDot, background: session.status==="completed"?"#10b981":st.color, boxShadow:`0 0 0 4px ${(session.status==="completed"?"#10b981":st.color)}22` }}>
                                {session.status==="completed"?"✓":st.icon}
                              </div>
                              {i < sessions.length-1 && <div style={CS.timelineLine}/>}
                            </div>

                            {/* Session card */}
                            <div style={{ ...CS.sessionCard, opacity: session.status==="cancelled"?0.5:1, borderLeft:`3px solid ${session.status==="completed"?"#10b981":st.color}` }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <div>
                                  <div style={CS.sessionName}>{session.session_label}</div>
                                  <div style={CS.sessionDate}>
                                    {session.scheduled_date
                                      ? new Date(session.scheduled_date).toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})
                                      : "Date not set"}
                                    {session.scheduled_time && ` at ${session.scheduled_time}`}
                                    {session.duration_min && ` · ${session.duration_min}min`}
                                  </div>
                                  {session.staff_name && <div style={CS.sessionStaff}>👩‍🎨 {session.staff_name}</div>}
                                  {session.services?.length > 0 && (
                                    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
                                      {session.services.map((svc,j)=>(
                                        <span key={j} style={{ fontSize:11, background:"#f3f4f6", padding:"2px 8px", borderRadius:12, color:"#374151" }}>{svc}</span>
                                      ))}
                                    </div>
                                  )}
                                  {session.notes && <div style={CS.sessionNotes}>📝 {session.notes}</div>}
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                                  <span style={{ fontSize:11, fontWeight:700, color:statusColor(session.status), background:statusColor(session.status)+"20", padding:"3px 10px", borderRadius:20, textTransform:"capitalize" }}>
                                    {session.status}
                                  </span>
                                  {days !== null && days >= 0 && (
                                    <span style={{ fontSize:10, color:"#9ca3af" }}>{days===0?"Today!": `${days}d away`}</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display:"flex", gap:6, marginTop:10 }}>
                                <button style={{ ...CS.tinyBtn, background:session.status==="completed"?"#fef3c7":"#d1fae5", color:session.status==="completed"?"#92400e":"#065f46" }}
                                  onClick={()=>toggleSessionStatus(session)}>
                                  {session.status==="completed"?"↩ Undo":"✓ Done"}
                                </button>
                                <button style={CS.tinyBtn} onClick={()=>{ setEditSession(session); setSessionForm({ session_type:session.session_type, session_label:session.session_label, scheduled_date:session.scheduled_date||"", scheduled_time:session.scheduled_time||"10:00", duration_min:session.duration_min, staff_id:session.staff_id||"", staff_name:session.staff_name||"", services:(session.services||[]).join(", "), notes:session.notes||"" }); setSessionModal(true); }}>
                                  ✏️ Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── CHECKLIST TAB ── */}
              {activeTab === "checklist" && (
                <div>
                  {/* Progress bar */}
                  <div style={CS.card}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontWeight:700, fontSize:15 }}>Progress</div>
                      <div style={{ fontWeight:800, color:checkPct===100?"#10b981":"#be185d", fontSize:18 }}>{checkPct}%</div>
                    </div>
                    <div style={{ height:10, borderRadius:5, background:"#f3f4f6" }}>
                      <div style={{ height:"100%", borderRadius:5, background: checkPct===100?"#10b981":"linear-gradient(to right,#be185d,#f9a8d4)", width:`${checkPct}%`, transition:"width 0.6s" }}/>
                    </div>
                    <div style={{ marginTop:8, fontSize:12, color:"#9ca3af" }}>{checkDone} of {checkTotal} tasks completed</div>
                  </div>

                  {/* Category filter */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                    {CHECKLIST_CATEGORIES.map(cat=>(
                      <button key={cat} style={{ ...CS.filterChip, ...(checklistFilter===cat?CS.filterChipActive:{}) }} onClick={()=>setChecklistFilter(cat)}>{cat}</button>
                    ))}
                  </div>

                  {/* Items */}
                  <div style={CS.card}>
                    {checklist.filter(c=>checklistFilter==="All"||c.category===checklistFilter).map(item=>(
                      <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f9fafb" }}>
                        <div style={{ ...CS.checkbox, background:item.is_done?"#be185d":"#fff", border:item.is_done?"2px solid #be185d":"2px solid #d1d5db", cursor:"pointer" }}
                          onClick={()=>toggleCheck(item)}>
                          {item.is_done && <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:item.is_done?400:600, textDecoration:item.is_done?"line-through":"none", color:item.is_done?"#9ca3af":"#1a1a1a" }}>
                            {item.label}
                          </div>
                          {item.due_date && (
                            <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
                              Due: {new Date(item.due_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
                              {daysUntil(item.due_date) !== null && !item.is_done && (
                                <span style={{ color: daysUntil(item.due_date)<0?"#ef4444":daysUntil(item.due_date)<=7?"#f59e0b":"#9ca3af", marginLeft:6 }}>
                                  ({daysUntil(item.due_date)<0?`${Math.abs(daysUntil(item.due_date))}d overdue`:daysUntil(item.due_date)===0?"Today":daysUntil(item.due_date)+"d left"})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:12, background: CAT_COLORS[item.category]+"20", color:CAT_COLORS[item.category]||"#374151" }}>
                          {item.category}
                        </span>
                      </div>
                    ))}

                    {/* Add new item */}
                    <div style={{ display:"flex", gap:8, marginTop:14, paddingTop:14, borderTop:"1px solid #f3f4f6" }}>
                      <input style={{ ...CS.input, flex:3 }} placeholder="Add a checklist item…" value={newCheckItem} onChange={e=>setNewCheckItem(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&addCheckItem()}/>
                      <select style={{ ...CS.select, flex:1 }} value={newCheckCat} onChange={e=>setNewCheckCat(e.target.value)}>
                        {["Skin","Hair","Makeup","Admin","Other"].map(c=><option key={c}>{c}</option>)}
                      </select>
                      <button style={CS.btnPrimary} onClick={addCheckItem}>+ Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAYMENT TAB ── */}
              {activeTab === "payment" && (
                <div style={CS.card}>
                  <div style={CS.cardTitle}>💰 Payment Summary</div>
                  <div style={{ marginTop:16 }}>
                    {[
                      { label:"Package", value:selectedBooking.package, isText:true },
                      { label:"Package Amount", value:fmt(selectedBooking.package_amount), color:"#1a1a1a" },
                      { label:"Advance Paid", value:fmt(selectedBooking.advance_paid), color:"#10b981" },
                      { label:"Balance Due", value:fmt(selectedBooking.balance_due), color: Number(selectedBooking.balance_due)>0?"#ef4444":"#10b981" },
                    ].map((row,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #f9fafb" }}>
                        <span style={{ color:"#6b7280", fontSize:14 }}>{row.label}</span>
                        <span style={{ fontWeight:700, fontSize:16, color:row.color||"#1a1a1a" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div style={{ marginTop:20 }}>
                    {(() => {
                      const pct = selectedBooking.package_amount > 0 ? Math.round((selectedBooking.advance_paid/selectedBooking.package_amount)*100) : 0;
                      return (
                        <>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#9ca3af", marginBottom:6 }}>
                            <span>Payment Progress</span>
                            <span style={{ color: pct===100?"#10b981":"#f59e0b", fontWeight:700 }}>{pct}%</span>
                          </div>
                          <div style={{ height:12, borderRadius:6, background:"#f3f4f6" }}>
                            <div style={{ height:"100%", borderRadius:6, background: pct===100?"#10b981":"linear-gradient(to right,#f59e0b,#fbbf24)", width:`${pct}%`, transition:"width 0.5s" }}/>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {selectedBooking.notes && (
                    <div style={{ marginTop:20, background:"#fdf2f8", borderRadius:10, padding:"14px 16px", fontSize:13, color:"#6b7280", fontStyle:"italic" }}>
                      📝 {selectedBooking.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          SESSION MODAL
      ══════════════════════════════════════════════════ */}
      {sessionModal && (
        <div style={CS.overlay} onClick={()=>setSessionModal(false)}>
          <div style={CS.modal} onClick={e=>e.stopPropagation()}>
            <div style={CS.modalHeader}>
              <div style={CS.modalTitle}>{editSession?"✏️ Edit Session":"📅 Add Session"}</div>
              <button style={CS.closeBtn} onClick={()=>setSessionModal(false)}>✕</button>
            </div>
            <div style={CS.formGrid}>
              <div style={CS.formGroup}>
                <label style={CS.label}>Session Type</label>
                <select style={CS.select} value={sessionForm.session_type} onChange={e=>{
                  const st = SESSION_TYPES.find(t=>t.key===e.target.value);
                  setSessionForm(f=>({...f, session_type:e.target.value, session_label:st?.label||f.session_label}));
                }}>
                  {SESSION_TYPES.map(t=><option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div style={CS.formGroup}>
                <label style={CS.label}>Session Label</label>
                <input style={CS.input} value={sessionForm.session_label} onChange={e=>setSessionForm(f=>({...f,session_label:e.target.value}))}/>
              </div>
              <div style={CS.formGroup}>
                <label style={CS.label}>Date</label>
                <input style={CS.input} type="date" value={sessionForm.scheduled_date} onChange={e=>setSessionForm(f=>({...f,scheduled_date:e.target.value}))}/>
              </div>
              <div style={CS.formGroup}>
                <label style={CS.label}>Time</label>
                <input style={CS.input} type="time" value={sessionForm.scheduled_time} onChange={e=>setSessionForm(f=>({...f,scheduled_time:e.target.value}))}/>
              </div>
              <div style={CS.formGroup}>
                <label style={CS.label}>Duration (min)</label>
                <input style={CS.input} type="number" value={sessionForm.duration_min} onChange={e=>setSessionForm(f=>({...f,duration_min:e.target.value}))}/>
              </div>
              <div style={CS.formGroup}>
                <label style={CS.label}>Artist</label>
                <select style={CS.select} value={sessionForm.staff_id} onChange={e=>setSessionForm(f=>({...f,staff_id:e.target.value}))}>
                  <option value="">Select staff</option>
                  {staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{...CS.formGroup, gridColumn:"1/-1"}}>
                <label style={CS.label}>Services (comma-separated)</label>
                <input style={CS.input} placeholder="e.g. HD Makeup, Hair Styling, Saree Draping" value={sessionForm.services} onChange={e=>setSessionForm(f=>({...f,services:e.target.value}))}/>
              </div>
              <div style={{...CS.formGroup, gridColumn:"1/-1"}}>
                <label style={CS.label}>Notes</label>
                <input style={CS.input} placeholder="Any special instructions…" value={sessionForm.notes} onChange={e=>setSessionForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </div>
            <button style={{...CS.btnPrimary, width:"100%", justifyContent:"center", marginTop:20}} disabled={sessionSaving} onClick={saveSession}>
              {sessionSaving?"Saving…":editSession?"✅ Update Session":"✅ Add Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const CS = {
  page:        { padding:"24px", maxWidth:1400, margin:"0 auto", fontFamily:"'Georgia', serif", color:"#1a1a1a", position:"relative" },
  topAccent:   { position:"fixed", top:0, left:0, right:0, height:3, background:"linear-gradient(to right,#be185d,#f9a8d4,#be185d)", zIndex:100 },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 },
  title:       { fontSize:28, fontWeight:800, letterSpacing:"-0.5px", color:"#be185d" },
  subtitle:    { color:"#9ca3af", fontSize:14, marginTop:2, fontFamily:"'Segoe UI',sans-serif" },
  statsRow:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 },
  statCard:    { background:"#fff", borderRadius:14, padding:"18px 20px", border:"1px solid #fce7f3", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 8px rgba(190,24,93,0.06)" },
  statValue:   { fontSize:22, fontWeight:800 },
  statLabel:   { fontSize:11, color:"#9ca3af", marginTop:2, fontFamily:"'Segoe UI',sans-serif" },
  bookingGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 },
  bookingCard: { background:"#fff", borderRadius:16, border:"1px solid #fce7f3", padding:"20px", boxShadow:"0 4px 16px rgba(190,24,93,0.08)", cursor:"pointer", transition:"transform 0.2s,box-shadow 0.2s", position:"relative", overflow:"hidden" },
  ribbon:      { position:"absolute", top:0, right:0, padding:"4px 14px", borderRadius:"0 16px 0 12px", fontSize:11, fontWeight:700, color:"#fff" },
  brideRow:    { display:"flex", alignItems:"center", gap:12, marginBottom:10, marginTop:16 },
  brideAvatar: { width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#fce7f3,#fbcfe8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#be185d", border:"2px solid #fce7f3" },
  brideName:   { fontWeight:800, fontSize:17, color:"#1a1a1a" },
  bridePhone:  { fontSize:12, color:"#9ca3af" },
  weddingDate: { fontSize:14, fontWeight:600, color:"#be185d", marginBottom:4 },
  venue:       { fontSize:12, color:"#6b7280" },
  createWrap:  { maxWidth:720, margin:"0 auto" },
  bridalHero:  { background:"linear-gradient(135deg,#fdf2f8,#fce7f3)", borderRadius:16, padding:"28px 32px", marginBottom:20, border:"1px solid #fce7f3", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:20 },
  heroName:    { fontSize:30, fontWeight:800, color:"#be185d", letterSpacing:"-0.5px" },
  heroDate:    { fontSize:16, fontWeight:600, color:"#374151", marginTop:4 },
  heroVenue:   { fontSize:13, color:"#9ca3af", marginTop:2 },
  heroBadge:   { display:"inline-block", background:"#fff", border:"1px solid #fce7f3", color:"#be185d", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600 },
  countdownTitle: { fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8, fontFamily:"'Segoe UI',sans-serif" },
  countdownRow:{ display:"flex", gap:12 },
  countdownUnit: { background:"#fff", borderRadius:12, padding:"12px 16px", textAlign:"center", minWidth:60, border:"1px solid #fce7f3", boxShadow:"0 2px 8px rgba(190,24,93,0.08)" },
  countdownNum:{ fontSize:28, fontWeight:900, color:"#be185d", lineHeight:1 },
  countdownLabel: { fontSize:10, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.5px", marginTop:4, fontFamily:"'Segoe UI',sans-serif" },
  countdownPast: { background:"#d1fae5", color:"#065f46", padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:14, textAlign:"center" },
  subTabRow:   { display:"flex", gap:4, marginBottom:20, background:"#fdf2f8", padding:4, borderRadius:10, width:"fit-content" },
  subTab:      { padding:"8px 18px", borderRadius:7, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:"#be185d", fontWeight:500, fontFamily:"'Segoe UI',sans-serif" },
  subTabActive:{ background:"#be185d", color:"#fff", fontWeight:700 },
  timeline:    { paddingLeft:0 },
  timelineLeft:{ display:"flex", flexDirection:"column", alignItems:"center", width:48, flexShrink:0 },
  timelineDot: { width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#fff", fontWeight:700, flexShrink:0, zIndex:1 },
  timelineLine:{ width:2, flex:1, background:"linear-gradient(to bottom,#fce7f3,#f3f4f6)", minHeight:20 },
  sessionCard: { flex:1, background:"#fff", borderRadius:12, padding:"16px 18px", marginBottom:16, border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", marginLeft:12 },
  sessionName: { fontWeight:700, fontSize:15, color:"#1a1a1a" },
  sessionDate: { fontSize:12, color:"#6b7280", marginTop:2, fontFamily:"'Segoe UI',sans-serif" },
  sessionStaff:{ fontSize:12, color:"#9ca3af", marginTop:2 },
  sessionNotes:{ fontSize:12, color:"#9ca3af", marginTop:6, fontStyle:"italic" },
  checkbox:    { width:22, height:22, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" },
  filterChip:  { padding:"5px 14px", borderRadius:20, border:"1px solid #fce7f3", background:"#fff", cursor:"pointer", fontSize:12, color:"#be185d", fontWeight:500, fontFamily:"'Segoe UI',sans-serif" },
  filterChipActive: { background:"#be185d", color:"#fff", border:"1px solid #be185d", fontWeight:700 },
  card:        { background:"#fff", borderRadius:14, border:"1px solid #fce7f3", padding:"20px 24px", marginBottom:16, boxShadow:"0 2px 8px rgba(190,24,93,0.04)" },
  cardTitle:   { fontSize:16, fontWeight:700, color:"#be185d", marginBottom:14 },
  formNote:    { background:"#fdf2f8", border:"1px solid #fce7f3", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#be185d", marginBottom:18, fontFamily:"'Segoe UI',sans-serif" },
  formGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
  formGroup:   { display:"flex", flexDirection:"column" },
  label:       { fontSize:12, color:"#6b7280", marginBottom:4, fontWeight:500, fontFamily:"'Segoe UI',sans-serif" },
  input:       { padding:"9px 12px", borderRadius:8, border:"1px solid #fce7f3", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"'Segoe UI',sans-serif", color:"#1a1a1a" },
  select:      { padding:"9px 12px", borderRadius:8, border:"1px solid #fce7f3", fontSize:14, outline:"none", background:"#fff", width:"100%", boxSizing:"border-box", fontFamily:"'Segoe UI',sans-serif" },
  btnPrimary:  { display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:8, border:"none", background:"#be185d", color:"#fff", fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"'Segoe UI',sans-serif" },
  btnOutline:  { display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:8, border:"1px solid #fce7f3", background:"#fff", color:"#be185d", fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"'Segoe UI',sans-serif" },
  tinyBtn:     { padding:"5px 12px", borderRadius:6, border:"none", background:"#f3f4f6", color:"#374151", fontSize:12, cursor:"pointer", fontWeight:600, fontFamily:"'Segoe UI',sans-serif" },
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(2px)" },
  modal:       { background:"#fff", borderRadius:16, padding:"28px 32px", width:600, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  modalTitle:  { fontWeight:700, fontSize:18 },
  closeBtn:    { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af" },
  emptyState:  { textAlign:"center", padding:"60px 20px", color:"#9ca3af", background:"#fff", borderRadius:16, border:"1px solid #fce7f3" },
  loading:     { textAlign:"center", padding:60, color:"#9ca3af" },
  tableHead:   { display:"flex", padding:"10px 16px", background:"#fdf2f8", borderRadius:"8px 8px 0 0", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px" },
  tableRow:    { display:"flex", padding:"12px 16px", borderBottom:"1px solid #f9fafb", fontSize:13, alignItems:"center" },
};
