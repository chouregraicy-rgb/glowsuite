import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── Constants ────────────────────────────────────────────────
const SALON_ID = "d4426e94-4dcb-41e4-90bb-71543533cbed";

const CATEGORY_META = {
  Hair:     { icon: "💇", color: "#6366f1", bg: "#ede9fe" },
  Skin:     { icon: "✨", color: "#10b981", bg: "#d1fae5" },
  Waxing:   { icon: "🪶", color: "#f59e0b", bg: "#fef3c7" },
  Threading:{ icon: "🧵", color: "#8b5cf6", bg: "#ede9fe" },
  Nails:    { icon: "💅", color: "#ec4899", bg: "#fce7f3" },
  Makeup:   { icon: "💄", color: "#be185d", bg: "#fdf2f8" },
  Body:     { icon: "🧘", color: "#0891b2", bg: "#e0f2fe" },
  Bleach:   { icon: "🌿", color: "#16a34a", bg: "#dcfce7" },
  Packages: { icon: "🎁", color: "#dc2626", bg: "#fee2e2" },
  Lashes:   { icon: "👁️", color: "#7c3aed", bg: "#ede9fe" },
  General:  { icon: "🏷️", color: "#6b7280", bg: "#f3f4f6" },
};

const getCatMeta = (cat) => CATEGORY_META[cat] || CATEGORY_META["General"];
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ServiceCatalog() {
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState({});

  // ── UI ──
  const [search, setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode]     = useState("grid");   // grid | list
  const [showInactive, setShowInactive] = useState(false);

  // ── Add/Edit modal ──
  const [modal, setModal]           = useState(false);
  const [editService, setEditService] = useState(null);
  const [form, setForm]             = useState(defaultForm());
  const [modalSaving, setModalSaving] = useState(false);

  // ── Inline price edit ──
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceVal, setPriceVal]     = useState("");
  const priceRef = useRef(null);

  function defaultForm() {
    return { name: "", category: "Hair", price: "", duration_min: 30, gst_applicable: true, is_active: true };
  }

  // ─── Fetch ────────────────────────────────────────────────────
  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("salon_id", SALON_ID)
      .order("category")
      .order("name");
    setServices(data || []);
    setLoading(false);
  }

  // ─── Categories list ──────────────────────────────────────────
  const categories = ["All", ...new Set(services.map(s => s.category))];

  // ─── Filtered ─────────────────────────────────────────────────
  const filtered = services.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    const matchActive = showInactive ? true : s.is_active;
    return matchSearch && matchCat && matchActive;
  });

  // ─── Grouped by category ──────────────────────────────────────
  const grouped = {};
  filtered.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  // ─── Stats ────────────────────────────────────────────────────
  const activeCount = services.filter(s => s.is_active).length;
  const catCount    = new Set(services.map(s => s.category)).size;
  const avgPrice    = activeCount ? services.filter(s=>s.is_active).reduce((sum, s) => sum + Number(s.price), 0) / activeCount : 0;
  const highestPrice = Math.max(...services.map(s => Number(s.price)), 0);

  // ─── Inline price save ────────────────────────────────────────
  async function savePriceInline(serviceId) {
    const val = Number(priceVal);
    if (isNaN(val) || val < 0) { setEditingPrice(null); return; }
    setSaving(prev => ({ ...prev, [serviceId]: true }));
    await supabase.from("services").update({ price: val }).eq("id", serviceId);
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, price: val } : s));
    setSaving(prev => ({ ...prev, [serviceId]: false }));
    setEditingPrice(null);
  }

  function startPriceEdit(service) {
    setEditingPrice(service.id);
    setPriceVal(service.price);
    setTimeout(() => priceRef.current?.focus(), 50);
  }

  // ─── Toggle active ────────────────────────────────────────────
  async function toggleActive(service) {
    setSaving(prev => ({ ...prev, [service.id]: true }));
    await supabase.from("services").update({ is_active: !service.is_active }).eq("id", service.id);
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: !s.is_active } : s));
    setSaving(prev => ({ ...prev, [service.id]: false }));
  }

  // ─── Toggle GST ──────────────────────────────────────────────
  async function toggleGst(service) {
    await supabase.from("services").update({ gst_applicable: !service.gst_applicable }).eq("id", service.id);
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, gst_applicable: !s.gst_applicable } : s));
  }

  // ─── Save service (add/edit) ──────────────────────────────────
  async function saveService() {
    if (!form.name.trim()) return alert("Service name required.");
    if (!form.price || Number(form.price) <= 0) return alert("Enter a valid price.");
    setModalSaving(true);
    try {
      const payload = {
        salon_id: SALON_ID,
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        duration_min: Number(form.duration_min) || 30,
        gst_applicable: form.gst_applicable,
        is_active: form.is_active,
      };
      if (editService) {
        await supabase.from("services").update(payload).eq("id", editService.id);
      } else {
        await supabase.from("services").insert(payload);
      }
      await fetchServices();
      setModal(false);
      setEditService(null);
      setForm(defaultForm());
    } catch (e) { alert("Error: " + e.message); }
    setModalSaving(false);
  }

  // ─── Delete ───────────────────────────────────────────────────
  async function deleteService(id) {
    if (!window.confirm("Delete this service permanently?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  }

  // ─── Bulk price update by category % ─────────────────────────
  const [bulkModal, setBulkModal]     = useState(false);
  const [bulkCat, setBulkCat]         = useState("All");
  const [bulkType, setBulkType]       = useState("percent"); // percent | flat
  const [bulkVal, setBulkVal]         = useState("");
  const [bulkDir, setBulkDir]         = useState("increase");
  const [bulkSaving, setBulkSaving]   = useState(false);

  async function applyBulkUpdate() {
    if (!bulkVal || Number(bulkVal) <= 0) return alert("Enter a valid value.");
    setBulkSaving(true);
    const targets = services.filter(s => bulkCat === "All" || s.category === bulkCat);
    const updates = targets.map(s => {
      let newPrice;
      const val = Number(bulkVal);
      if (bulkType === "percent") {
        newPrice = bulkDir === "increase" ? s.price * (1 + val/100) : s.price * (1 - val/100);
      } else {
        newPrice = bulkDir === "increase" ? Number(s.price) + val : Number(s.price) - val;
      }
      newPrice = Math.max(0, Math.round(newPrice));
      return { id: s.id, price: newPrice };
    });

    for (const u of updates) {
      await supabase.from("services").update({ price: u.price }).eq("id", u.id);
    }
    await fetchServices();
    setBulkModal(false);
    setBulkVal("");
    setBulkSaving(false);
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={T.page}>

      {/* ── Header ── */}
      <div style={T.header}>
        <div>
          <div style={T.title}>🏷️ Service Catalog</div>
          <div style={T.subtitle}>{activeCount} active services across {catCount} categories</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={T.btnGhost} onClick={() => setBulkModal(true)}>⚡ Bulk Price Update</button>
          <button style={T.btnPrimary} onClick={() => { setEditService(null); setForm(defaultForm()); setModal(true); }}>+ Add Service</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={T.statsRow}>
        {[
          { icon: "🏷️", label: "Total Services",  value: services.length,   color: "#6366f1" },
          { icon: "✅", label: "Active",           value: activeCount,        color: "#10b981" },
          { icon: "📂", label: "Categories",       value: catCount,           color: "#f59e0b" },
          { icon: "💰", label: "Avg Price",        value: fmt(avgPrice),      color: "#be185d" },
          { icon: "🔝", label: "Highest Service",  value: fmt(highestPrice),  color: "#7c3aed" },
        ].map((s, i) => (
          <div key={i} style={T.statCard}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ ...T.statVal, color: s.color }}>{s.value}</div>
              <div style={T.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={T.toolbar}>
        <input
          style={T.searchInput}
          placeholder="🔍 Search services…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={T.toggleRow}>
          <label style={T.toggleLabel}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ marginRight:6 }}/>
            Show inactive
          </label>
        </div>
        <div style={T.viewToggle}>
          <button style={{ ...T.viewBtn, ...(viewMode==="grid" ? T.viewBtnActive : {}) }} onClick={() => setViewMode("grid")}>⊞ Grid</button>
          <button style={{ ...T.viewBtn, ...(viewMode==="list" ? T.viewBtnActive : {}) }} onClick={() => setViewMode("list")}>☰ List</button>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div style={T.catTabs}>
        {categories.map(cat => {
          const meta = getCatMeta(cat);
          const count = cat === "All" ? filtered.length : filtered.filter(s => s.category === cat).length;
          return (
            <button
              key={cat}
              style={{ ...T.catTab, ...(activeCategory === cat ? { ...T.catTabActive, background: cat === "All" ? "#1a1a1a" : meta.bg, color: cat === "All" ? "#fff" : meta.color, borderColor: meta.color } : {}) }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat !== "All" && <span style={{ marginRight:4 }}>{meta.icon}</span>}
              {cat}
              <span style={{ ...T.catCount, background: activeCategory === cat ? "rgba(255,255,255,0.3)" : "#f3f4f6" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={T.loading}>Loading service catalog…</div>
      ) : filtered.length === 0 ? (
        <div style={T.empty}>No services found. Try a different search or add new services!</div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              GRID VIEW
          ══════════════════════════════════════════════════ */}
          {viewMode === "grid" && (
            <div>
              {Object.entries(grouped).map(([cat, svcs]) => {
                const meta = getCatMeta(cat);
                return (
                  <div key={cat} style={{ marginBottom: 32 }}>
                    {/* Category header */}
                    <div style={T.catHeader}>
                      <div style={{ ...T.catDot, background: meta.bg, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{cat}</span>
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>{svcs.length} services</span>
                      <div style={T.catLine}/>
                    </div>

                    <div style={T.svcGrid}>
                      {svcs.map(svc => (
                        <div key={svc.id} style={{ ...T.svcCard, opacity: svc.is_active ? 1 : 0.55 }}>
                          {/* Top strip */}
                          <div style={{ ...T.svcStrip, background: meta.bg }}/>

                          <div style={T.svcBody}>
                            <div style={T.svcName}>{svc.name}</div>
                            <div style={T.svcMeta}>
                              {svc.duration_min}min
                              {svc.gst_applicable && <span style={T.gstPill}>GST</span>}
                              {!svc.is_active && <span style={T.inactivePill}>Inactive</span>}
                            </div>

                            {/* Inline price edit */}
                            <div style={T.priceRow}>
                              {editingPrice === svc.id ? (
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={T.rupee}>₹</span>
                                  <input
                                    ref={priceRef}
                                    style={T.priceInput}
                                    type="number"
                                    value={priceVal}
                                    onChange={e => setPriceVal(e.target.value)}
                                    onKeyDown={e => { if (e.key==="Enter") savePriceInline(svc.id); if (e.key==="Escape") setEditingPrice(null); }}
                                    onBlur={() => savePriceInline(svc.id)}
                                  />
                                  {saving[svc.id] && <span style={{ color:"#9ca3af", fontSize:12 }}>…</span>}
                                </div>
                              ) : (
                                <div style={T.priceDisplay} onClick={() => startPriceEdit(svc)}>
                                  <span style={{ ...T.priceNum, color: meta.color }}>{fmt(svc.price)}</span>
                                  <span style={T.priceEdit}>✏️</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={T.svcActions}>
                              <button
                                style={{ ...T.actionChip, background: svc.gst_applicable ? "#fef3c7" : "#f3f4f6", color: svc.gst_applicable ? "#92400e" : "#9ca3af" }}
                                onClick={() => toggleGst(svc)}
                                title={svc.gst_applicable ? "Click to remove GST" : "Click to add GST"}
                              >
                                {svc.gst_applicable ? "🏷️ GST On" : "GST Off"}
                              </button>
                              <button
                                style={{ ...T.actionChip, background: svc.is_active ? "#fee2e2" : "#d1fae5", color: svc.is_active ? "#dc2626" : "#065f46" }}
                                onClick={() => toggleActive(svc)}
                              >
                                {svc.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                style={{ ...T.actionChip, background: "#f3f4f6", color: "#374151" }}
                                onClick={() => { setEditService(svc); setForm({ name:svc.name, category:svc.category, price:svc.price, duration_min:svc.duration_min, gst_applicable:svc.gst_applicable, is_active:svc.is_active }); setModal(true); }}
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add to this category CTA */}
                      <div
                        style={T.addCard}
                        onClick={() => { setEditService(null); setForm({ ...defaultForm(), category: cat }); setModal(true); }}
                      >
                        <div style={{ ...T.addIcon, background: meta.bg, color: meta.color }}>+</div>
                        <div style={T.addLabel}>Add to {cat}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              LIST VIEW
          ══════════════════════════════════════════════════ */}
          {viewMode === "list" && (
            <div style={T.tableWrap}>
              <div style={T.tableHead}>
                <div style={{ flex: 3 }}>Service Name</div>
                <div style={{ flex: 1.5 }}>Category</div>
                <div style={{ flex: 1, textAlign:"center" }}>Duration</div>
                <div style={{ flex: 1, textAlign:"center" }}>GST</div>
                <div style={{ flex: 1.5, textAlign:"right" }}>Price</div>
                <div style={{ flex: 1, textAlign:"center" }}>Status</div>
                <div style={{ flex: 1.5, textAlign:"center" }}>Actions</div>
              </div>
              {filtered.map(svc => {
                const meta = getCatMeta(svc.category);
                return (
                  <div key={svc.id} style={{ ...T.tableRow, opacity: svc.is_active ? 1 : 0.55 }}>
                    <div style={{ flex: 3, fontWeight: 600 }}>{svc.name}</div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ background: meta.bg, color: meta.color, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>
                        {meta.icon} {svc.category}
                      </span>
                    </div>
                    <div style={{ flex: 1, textAlign:"center", color:"#6b7280", fontSize:13 }}>{svc.duration_min}min</div>
                    <div style={{ flex: 1, textAlign:"center" }}>
                      <button
                        style={{ fontSize:12, padding:"2px 8px", borderRadius:12, border:"none", cursor:"pointer",
                          background: svc.gst_applicable ? "#fef3c7" : "#f3f4f6",
                          color: svc.gst_applicable ? "#92400e" : "#9ca3af" }}
                        onClick={() => toggleGst(svc)}
                      >
                        {svc.gst_applicable ? "Yes" : "No"}
                      </button>
                    </div>
                    <div style={{ flex: 1.5, textAlign:"right" }}>
                      {editingPrice === svc.id ? (
                        <input
                          ref={priceRef}
                          style={{ ...T.priceInput, textAlign:"right", width:80 }}
                          type="number"
                          value={priceVal}
                          onChange={e => setPriceVal(e.target.value)}
                          onKeyDown={e => { if(e.key==="Enter") savePriceInline(svc.id); if(e.key==="Escape") setEditingPrice(null); }}
                          onBlur={() => savePriceInline(svc.id)}
                        />
                      ) : (
                        <span style={{ fontWeight:700, color:meta.color, cursor:"pointer" }} onClick={() => startPriceEdit(svc)}>
                          {fmt(svc.price)} <span style={{ fontSize:11, color:"#9ca3af" }}>✏️</span>
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign:"center" }}>
                      <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:12,
                        background: svc.is_active?"#d1fae5":"#f3f4f6",
                        color: svc.is_active?"#065f46":"#9ca3af" }}>
                        {svc.is_active?"Active":"Off"}
                      </span>
                    </div>
                    <div style={{ flex: 1.5, display:"flex", gap:4, justifyContent:"center" }}>
                      <button style={T.tinyBtn} onClick={() => toggleActive(svc)}>
                        {svc.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button style={{ ...T.tinyBtn, background:"#fdf2f8", color:"#be185d" }}
                        onClick={() => { setEditService(svc); setForm({ name:svc.name, category:svc.category, price:svc.price, duration_min:svc.duration_min, gst_applicable:svc.gst_applicable, is_active:svc.is_active }); setModal(true); }}>
                        ✏️
                      </button>
                      <button style={{ ...T.tinyBtn, background:"#fee2e2", color:"#dc2626" }} onClick={() => deleteService(svc.id)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════ */}
      {modal && (
        <div style={T.overlay} onClick={() => setModal(false)}>
          <div style={T.modal} onClick={e => e.stopPropagation()}>
            <div style={T.modalHeader}>
              <div style={T.modalTitle}>{editService ? "✏️ Edit Service" : "➕ Add Service"}</div>
              <button style={T.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>

            <div style={T.formGrid}>
              <div style={{ ...T.formGroup, gridColumn:"1/-1" }}>
                <label style={T.label}>Service Name *</label>
                <input style={T.input} placeholder="e.g. Deep Conditioning Treatment" value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}/>
              </div>
              <div style={T.formGroup}>
                <label style={T.label}>Category</label>
                <select style={T.select} value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))}>
                  {Object.keys(CATEGORY_META).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={T.formGroup}>
                <label style={T.label}>Price (₹) *</label>
                <input style={T.input} type="number" placeholder="e.g. 500" value={form.price} onChange={e => setForm(f => ({ ...f, price:e.target.value }))}/>
              </div>
              <div style={T.formGroup}>
                <label style={T.label}>Duration (minutes)</label>
                <input style={T.input} type="number" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min:e.target.value }))}/>
              </div>
              <div style={T.formGroup}>
                <label style={T.label}>Status</label>
                <select style={T.select} value={form.is_active ? "active" : "inactive"} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === "active" }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ ...T.formGroup, gridColumn:"1/-1" }}>
                <label style={{ ...T.label, display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.gst_applicable} onChange={e => setForm(f => ({ ...f, gst_applicable:e.target.checked }))}/>
                  Apply GST (18%) on this service
                </label>
              </div>
            </div>

            {/* Preview */}
            {form.price > 0 && (
              <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px 16px", marginTop:8, fontSize:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"#6b7280" }}>Price</span>
                  <span style={{ fontWeight:600 }}>{fmt(form.price)}</span>
                </div>
                {form.gst_applicable && (
                  <div style={{ display:"flex", justifyContent:"space-between", color:"#6b7280" }}>
                    <span>GST (18%)</span>
                    <span>{fmt(form.price * 0.18)}</span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, color:"#be185d", marginTop:6, borderTop:"1px solid #e5e7eb", paddingTop:6 }}>
                  <span>Total for client</span>
                  <span>{fmt(Number(form.price) * (form.gst_applicable ? 1.18 : 1))}</span>
                </div>
              </div>
            )}

            <button style={{ ...T.btnPrimary, width:"100%", justifyContent:"center", marginTop:16 }} disabled={modalSaving} onClick={saveService}>
              {modalSaving ? "Saving…" : editService ? "✅ Update Service" : "✅ Add Service"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          BULK PRICE UPDATE MODAL
      ══════════════════════════════════════════════════ */}
      {bulkModal && (
        <div style={T.overlay} onClick={() => setBulkModal(false)}>
          <div style={{ ...T.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={T.modalHeader}>
              <div style={T.modalTitle}>⚡ Bulk Price Update</div>
              <button style={T.closeBtn} onClick={() => setBulkModal(false)}>✕</button>
            </div>

            <div style={{ background:"#fef3c7", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#92400e" }}>
              ⚠️ This will update prices for all selected services at once.
            </div>

            <div style={T.formGroup}>
              <label style={T.label}>Category</label>
              <select style={T.select} value={bulkCat} onChange={e => setBulkCat(e.target.value)}>
                <option value="All">All Categories</option>
                {[...new Set(services.map(s => s.category))].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display:"flex", gap:10, margin:"12px 0" }}>
              {["increase","decrease"].map(dir => (
                <button key={dir} style={{ flex:1, padding:"10px", borderRadius:8, border:`2px solid ${bulkDir===dir?"#be185d":"#e5e7eb"}`,
                  background: bulkDir===dir?"#fdf2f8":"#fff", color:bulkDir===dir?"#be185d":"#374151", fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}
                  onClick={() => setBulkDir(dir)}>
                  {dir === "increase" ? "▲ Increase" : "▼ Decrease"}
                </button>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              {["percent","flat"].map(type => (
                <button key={type} style={{ flex:1, padding:"8px", borderRadius:8, border:`2px solid ${bulkType===type?"#6366f1":"#e5e7eb"}`,
                  background: bulkType===type?"#ede9fe":"#fff", color:bulkType===type?"#4f46e5":"#374151", fontWeight:600, cursor:"pointer" }}
                  onClick={() => setBulkType(type)}>
                  {type === "percent" ? "% Percent" : "₹ Flat Amount"}
                </button>
              ))}
            </div>

            <div style={{ ...T.formGroup, marginTop:14 }}>
              <label style={T.label}>{bulkType === "percent" ? "Percentage (%)" : "Amount (₹)"}</label>
              <input style={T.input} type="number" placeholder={bulkType==="percent"?"e.g. 10":"e.g. 50"}
                value={bulkVal} onChange={e => setBulkVal(e.target.value)}/>
            </div>

            {bulkVal > 0 && (
              <div style={{ background:"#f0fdf4", borderRadius:8, padding:"10px 14px", marginTop:8, fontSize:13, color:"#065f46" }}>
                Will {bulkDir} prices for <strong>{bulkCat === "All" ? `all ${services.length}` : services.filter(s=>s.category===bulkCat).length} services</strong> by {bulkType==="percent"?`${bulkVal}%`:`₹${bulkVal}`}
              </div>
            )}

            <button style={{ ...T.btnPrimary, width:"100%", justifyContent:"center", marginTop:16, background:"#6366f1" }} disabled={bulkSaving} onClick={applyBulkUpdate}>
              {bulkSaving ? "Applying…" : "⚡ Apply Bulk Update"}
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
const T = {
  page:        { padding:"24px", maxWidth:1400, margin:"0 auto", fontFamily:"'Segoe UI',sans-serif", color:"#1a1a1a" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 },
  title:       { fontSize:26, fontWeight:800, letterSpacing:"-0.5px" },
  subtitle:    { color:"#9ca3af", fontSize:14, marginTop:2 },
  statsRow:    { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 },
  statCard:    { background:"#fff", borderRadius:12, padding:"14px 18px", border:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
  statVal:     { fontSize:20, fontWeight:800 },
  statLabel:   { fontSize:11, color:"#9ca3af", marginTop:1 },
  toolbar:     { display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" },
  searchInput: { flex:1, minWidth:200, padding:"10px 14px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:14, outline:"none" },
  toggleRow:   { display:"flex", alignItems:"center", fontSize:13, color:"#6b7280", cursor:"pointer" },
  toggleLabel: { display:"flex", alignItems:"center", gap:4, cursor:"pointer" },
  viewToggle:  { display:"flex", background:"#f3f4f6", padding:3, borderRadius:8, gap:2 },
  viewBtn:     { padding:"6px 14px", borderRadius:6, border:"none", background:"transparent", cursor:"pointer", fontSize:13, color:"#6b7280" },
  viewBtnActive:{ background:"#fff", color:"#1a1a1a", fontWeight:700, boxShadow:"0 1px 4px rgba(0,0,0,0.1)" },
  catTabs:     { display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 },
  catTab:      { padding:"7px 14px", borderRadius:20, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:13, color:"#6b7280", fontWeight:500, display:"flex", alignItems:"center", gap:4 },
  catTabActive:{ fontWeight:700, border:"2px solid" },
  catCount:    { display:"inline-block", padding:"1px 6px", borderRadius:10, fontSize:11, fontWeight:700, marginLeft:4 },
  catHeader:   { display:"flex", alignItems:"center", gap:10, marginBottom:14 },
  catDot:      { width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700 },
  catLine:     { flex:1, height:1, background:"#f3f4f6" },
  svcGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 },
  svcCard:     { background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", transition:"box-shadow 0.2s" },
  svcStrip:    { height:4 },
  svcBody:     { padding:"14px 16px" },
  svcName:     { fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.3 },
  svcMeta:     { display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#9ca3af", marginBottom:10 },
  gstPill:     { background:"#fef3c7", color:"#92400e", padding:"1px 6px", borderRadius:8, fontSize:10, fontWeight:700 },
  inactivePill:{ background:"#f3f4f6", color:"#9ca3af", padding:"1px 6px", borderRadius:8, fontSize:10, fontWeight:700 },
  priceRow:    { marginBottom:10 },
  priceDisplay:{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" },
  priceNum:    { fontSize:20, fontWeight:900 },
  priceEdit:   { fontSize:12, opacity:0.4 },
  rupee:       { fontWeight:700, color:"#9ca3af" },
  priceInput:  { width:80, padding:"4px 8px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:16, fontWeight:700, outline:"none" },
  svcActions:  { display:"flex", gap:4, flexWrap:"wrap" },
  actionChip:  { padding:"4px 8px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600 },
  addCard:     { background:"#fafafa", borderRadius:14, border:"2px dashed #e5e7eb", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, padding:"28px 16px", cursor:"pointer", minHeight:140 },
  addIcon:     { width:40, height:40, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700 },
  addLabel:    { fontSize:13, color:"#9ca3af", fontWeight:600 },
  tableWrap:   { background:"#fff", borderRadius:12, border:"1px solid #f3f4f6", overflow:"hidden" },
  tableHead:   { display:"flex", padding:"12px 20px", background:"#f9fafb", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px" },
  tableRow:    { display:"flex", padding:"14px 20px", borderBottom:"1px solid #f9fafb", fontSize:14, alignItems:"center" },
  tinyBtn:     { padding:"5px 10px", borderRadius:6, border:"none", background:"#f3f4f6", color:"#374151", fontSize:11, cursor:"pointer", fontWeight:600 },
  loading:     { textAlign:"center", padding:60, color:"#9ca3af" },
  empty:       { textAlign:"center", padding:60, color:"#9ca3af", background:"#fff", borderRadius:12, border:"1px solid #f3f4f6" },
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(2px)" },
  modal:       { background:"#fff", borderRadius:16, padding:"28px 32px", width:560, maxWidth:"92vw", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  modalTitle:  { fontWeight:700, fontSize:18 },
  closeBtn:    { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af" },
  formGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
  formGroup:   { display:"flex", flexDirection:"column" },
  label:       { fontSize:12, color:"#6b7280", marginBottom:4, fontWeight:500 },
  input:       { padding:"9px 12px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" },
  select:      { padding:"9px 12px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:14, outline:"none", background:"#fff", width:"100%", boxSizing:"border-box" },
  btnPrimary:  { display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:8, border:"none", background:"#be185d", color:"#fff", fontWeight:600, fontSize:14, cursor:"pointer" },
  btnGhost:    { display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontWeight:600, fontSize:14, cursor:"pointer" },
};
