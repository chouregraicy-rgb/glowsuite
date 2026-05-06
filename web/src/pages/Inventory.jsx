import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────
const SALON_ID = "d4426e94-4dcb-41e4-90bb-71543533cbed";
const CATEGORIES = ["All", "Hair", "Skin", "Wax", "Nail", "Makeup", "Tools", "General"];
const UNITS = ["pcs", "ml", "g", "bottle", "box", "pack", "roll"];
const MOVEMENT_TYPES = [
  { key: "restock",    label: "Restock",    icon: "📦", color: "#10b981" },
  { key: "usage",      label: "Usage",      icon: "✂️",  color: "#6366f1" },
  { key: "adjustment", label: "Adjust",     icon: "⚖️",  color: "#f59e0b" },
  { key: "waste",      label: "Waste/Loss", icon: "🗑️", color: "#ef4444" },
];

const fmt  = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtN = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 });

function stockStatus(item) {
  const s = Number(item.current_stock);
  const min = Number(item.min_stock);
  if (s === 0) return { label: "Out of Stock", color: "#ef4444", bg: "#fee2e2", bar: 0 };
  if (s <= min) return { label: "Low Stock",   color: "#f59e0b", bg: "#fef3c7", bar: Math.min(100, (s / min) * 50) };
  return          { label: "In Stock",      color: "#10b981", bg: "#d1fae5", bar: Math.min(100, (s / Number(item.max_stock || 100)) * 100) };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Inventory() {
  const { user } = useAuth();

  // ── Data ──
  const [items, setItems]           = useState([]);
  const [movements, setMovements]   = useState([]);
  const [restocks, setRestocks]     = useState([]);
  const [loading, setLoading]       = useState(true);

  // ── UI ──
  const [tab, setTab]               = useState("stock");   // stock | movements | restock
  const [category, setCategory]     = useState("All");
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | low | out

  // ── Add Item Modal ──
  const [addModal, setAddModal]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [itemForm, setItemForm]     = useState(defaultItemForm());
  const [itemSaving, setItemSaving] = useState(false);

  // ── Stock Update Modal ──
  const [moveModal, setMoveModal]   = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveForm, setMoveForm]     = useState({ type: "restock", quantity: "", reason: "" });
  const [moveSaving, setMoveSaving] = useState(false);

  // ── Restock Request Modal ──
  const [restockModal, setRestockModal] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockForm, setRestockForm]   = useState({ requested_qty: "", supplier: "", notes: "" });
  const [restockSaving, setRestockSaving] = useState(false);

  function defaultItemForm() {
    return { name: "", category: "Hair", brand: "", unit: "pcs", current_stock: 0, min_stock: 5, max_stock: 100, purchase_price: 0, selling_price: 0, supplier: "", notes: "" };
  }

  // ─── Fetch ───────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [itemsRes, movRes, restockRes] = await Promise.all([
      supabase.from("inventory").select("*").eq("salon_id", SALON_ID).eq("is_active", true).order("category").order("name"),
      supabase.from("stock_movements").select("*").eq("salon_id", SALON_ID).order("created_at", { ascending: false }).limit(100),
      supabase.from("restock_requests").select("*").eq("salon_id", SALON_ID).order("created_at", { ascending: false }),
    ]);
    setItems(itemsRes.data || []);
    setMovements(movRes.data || []);
    setRestocks(restockRes.data || []);
    setLoading(false);
  }

  // ─── Filtered items ──────────────────────────────────────────
  const filtered = items.filter((it) => {
    const matchCat = category === "All" || it.category === category;
    const matchSearch = !search || it.name.toLowerCase().includes(search.toLowerCase()) || (it.brand || "").toLowerCase().includes(search.toLowerCase());
    const st = stockStatus(it);
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "low" ? st.label === "Low Stock" :
      filterStatus === "out" ? st.label === "Out of Stock" : true;
    return matchCat && matchSearch && matchStatus;
  });

  // ─── Stats ───────────────────────────────────────────────────
  const lowCount  = items.filter((i) => { const s = stockStatus(i); return s.label === "Low Stock"; }).length;
  const outCount  = items.filter((i) => { const s = stockStatus(i); return s.label === "Out of Stock"; }).length;
  const totalValue = items.reduce((s, i) => s + Number(i.current_stock) * Number(i.purchase_price), 0);
  const pendingRestocks = restocks.filter((r) => r.status === "pending").length;

  // ─── Save Item ───────────────────────────────────────────────
  async function saveItem() {
    if (!itemForm.name.trim()) return alert("Item name is required.");
    setItemSaving(true);
    try {
      const payload = { ...itemForm, salon_id: SALON_ID, updated_at: new Date().toISOString() };
      if (editItem) {
        await supabase.from("inventory").update(payload).eq("id", editItem.id);
      } else {
        const { data: newItem } = await supabase.from("inventory").insert(payload).select().single();
        // Log initial stock movement if stock > 0
        if (Number(itemForm.current_stock) > 0) {
          await supabase.from("stock_movements").insert({
            salon_id: SALON_ID,
            item_id: newItem.id,
            item_name: newItem.name,
            type: "restock",
            quantity: Number(itemForm.current_stock),
            stock_before: 0,
            stock_after: Number(itemForm.current_stock),
            reason: "Initial stock entry",
            performed_by: user?.id,
          });
        }
      }
      await fetchAll();
      setAddModal(false);
      setEditItem(null);
      setItemForm(defaultItemForm());
    } catch (e) { alert("Error: " + e.message); }
    setItemSaving(false);
  }

  // ─── Record Stock Movement ───────────────────────────────────
  async function recordMovement() {
    const qty = Number(moveForm.quantity);
    if (!qty || qty <= 0) return alert("Enter a valid quantity.");
    setMoveSaving(true);
    try {
      const item = moveTarget;
      const stockBefore = Number(item.current_stock);
      const isOut = moveForm.type === "usage" || moveForm.type === "waste";
      const delta = isOut ? -qty : qty;
      const stockAfter = Math.max(0, stockBefore + delta);

      await supabase.from("stock_movements").insert({
        salon_id: SALON_ID,
        item_id: item.id,
        item_name: item.name,
        type: moveForm.type,
        quantity: delta,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason: moveForm.reason || null,
        performed_by: user?.id,
      });

      await supabase.from("inventory").update({
        current_stock: stockAfter,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);

      await fetchAll();
      setMoveModal(false);
      setMoveForm({ type: "restock", quantity: "", reason: "" });
    } catch (e) { alert("Error: " + e.message); }
    setMoveSaving(false);
  }

  // ─── Submit Restock Request ──────────────────────────────────
  async function submitRestockRequest() {
    const qty = Number(restockForm.requested_qty);
    if (!qty || qty <= 0) return alert("Enter a valid quantity.");
    setRestockSaving(true);
    try {
      await supabase.from("restock_requests").insert({
        salon_id: SALON_ID,
        item_id: restockTarget.id,
        item_name: restockTarget.name,
        requested_qty: qty,
        current_stock: restockTarget.current_stock,
        status: "pending",
        supplier: restockForm.supplier || restockTarget.supplier || null,
        notes: restockForm.notes || null,
        requested_by: user?.id,
      });
      await fetchAll();
      setRestockModal(false);
      setRestockForm({ requested_qty: "", supplier: "", notes: "" });
    } catch (e) { alert("Error: " + e.message); }
    setRestockSaving(false);
  }

  // ─── Update Restock Status ───────────────────────────────────
  async function updateRestockStatus(id, status, itemId, qty) {
    await supabase.from("restock_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    // If marked received, update stock
    if (status === "received") {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const stockBefore = Number(item.current_stock);
        const stockAfter = stockBefore + Number(qty);
        await supabase.from("inventory").update({ current_stock: stockAfter, updated_at: new Date().toISOString() }).eq("id", itemId);
        await supabase.from("stock_movements").insert({
          salon_id: SALON_ID, item_id: itemId, item_name: item.name,
          type: "restock", quantity: Number(qty), stock_before: stockBefore, stock_after: stockAfter,
          reason: "Restock request fulfilled", performed_by: user?.id,
        });
      }
    }
    await fetchAll();
  }

  // ─── Delete item ─────────────────────────────────────────────
  async function deleteItem(id) {
    if (!window.confirm("Deactivate this item?")) return;
    await supabase.from("inventory").update({ is_active: false }).eq("id", id);
    await fetchAll();
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.title}>📦 Inventory</div>
          <div style={S.subtitle}>Stock · Movements · Restock Requests</div>
        </div>
        <button style={S.btnPrimary} onClick={() => { setEditItem(null); setItemForm(defaultItemForm()); setAddModal(true); }}>
          + Add Item
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={S.statsGrid}>
        {[
          { icon: "📦", label: "Total Items",     value: items.length,    color: "#6366f1" },
          { icon: "⚠️",  label: "Low Stock",       value: lowCount,        color: "#f59e0b", alert: lowCount > 0 },
          { icon: "🚫", label: "Out of Stock",    value: outCount,        color: "#ef4444", alert: outCount > 0 },
          { icon: "🔄", label: "Pending Restocks",value: pendingRestocks, color: "#be185d", alert: pendingRestocks > 0 },
          { icon: "💰", label: "Stock Value",     value: fmt(totalValue), color: "#10b981" },
        ].map((s) => (
          <div key={s.label} style={{ ...S.statCard, ...(s.alert ? S.statCardAlert : {}) }}>
            <div style={S.statIcon}>{s.icon}</div>
            <div>
              <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabRow}>
        {[
          { key: "stock",     label: "📋 Stock List" },
          { key: "movements", label: "📈 Movements" },
          { key: "restock",   label: `🔄 Restock Requests ${pendingRestocks > 0 ? `(${pendingRestocks})` : ""}` },
        ].map((t) => (
          <button key={t.key} style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={S.loading}>Loading inventory…</div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              STOCK LIST TAB
          ══════════════════════════════════════════════════ */}
          {tab === "stock" && (
            <div>
              {/* Filters */}
              <div style={S.filterBar}>
                <input style={S.searchInput} placeholder="Search item or brand…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div style={S.filterChips}>
                  {["all", "low", "out"].map((f) => (
                    <button key={f} style={{ ...S.chip, ...(filterStatus === f ? S.chipActive : {}) }} onClick={() => setFilterStatus(f)}>
                      {f === "all" ? "All" : f === "low" ? "⚠️ Low" : "🚫 Out"}
                    </button>
                  ))}
                </div>
                <div style={S.catScroll}>
                  {CATEGORIES.map((c) => (
                    <button key={c} style={{ ...S.chip, ...(category === c ? S.chipActive : {}) }} onClick={() => setCategory(c)}>{c}</button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div style={S.empty}>No items found. Add your first inventory item!</div>
              ) : (
                <div style={S.grid}>
                  {filtered.map((item) => {
                    const st = stockStatus(item);
                    return (
                      <div key={item.id} style={S.itemCard}>
                        {/* Stock bar */}
                        <div style={S.barTrack}>
                          <div style={{ ...S.barFill, width: `${st.bar}%`, background: st.color }} />
                        </div>

                        <div style={S.itemTop}>
                          <div style={{ flex: 1 }}>
                            <div style={S.itemName}>{item.name}</div>
                            <div style={S.itemMeta}>{item.brand || "—"} · {item.category}</div>
                          </div>
                          <span style={{ ...S.badge, background: st.bg, color: st.color }}>{st.label}</span>
                        </div>

                        <div style={S.stockDisplay}>
                          <div style={S.stockMain}>
                            <span style={{ ...S.stockNum, color: st.color }}>{fmtN(item.current_stock)}</span>
                            <span style={S.stockUnit}>{item.unit}</span>
                          </div>
                          <div style={S.stockThresholds}>
                            <span style={{ color: "#f59e0b" }}>min {fmtN(item.min_stock)}</span>
                            <span style={{ color: "#9ca3af", margin: "0 4px" }}>·</span>
                            <span style={{ color: "#9ca3af" }}>max {fmtN(item.max_stock)}</span>
                          </div>
                        </div>

                        {item.purchase_price > 0 && (
                          <div style={S.itemPriceRow}>
                            <span style={S.priceTag}>Buy: {fmt(item.purchase_price)}/{item.unit}</span>
                            <span style={S.priceTag}>Value: {fmt(Number(item.current_stock) * Number(item.purchase_price))}</span>
                          </div>
                        )}

                        {item.supplier && (
                          <div style={S.supplierRow}>🏪 {item.supplier}</div>
                        )}

                        {/* Actions */}
                        <div style={S.itemActions}>
                          <button style={S.actionBtn} onClick={() => { setMoveTarget(item); setMoveForm({ type: "restock", quantity: "", reason: "" }); setMoveModal(true); }}>
                            📦 Stock In/Out
                          </button>
                          <button style={{ ...S.actionBtn, background: "#fef3c7", color: "#92400e" }}
                            onClick={() => { setRestockTarget(item); setRestockForm({ requested_qty: Math.max(0, Number(item.max_stock) - Number(item.current_stock)), supplier: item.supplier || "", notes: "" }); setRestockModal(true); }}>
                            🔄 Request
                          </button>
                          <button style={{ ...S.actionBtn, background: "#f3f4f6", color: "#374151" }}
                            onClick={() => { setEditItem(item); setItemForm({ name: item.name, category: item.category, brand: item.brand || "", unit: item.unit, current_stock: item.current_stock, min_stock: item.min_stock, max_stock: item.max_stock, purchase_price: item.purchase_price, selling_price: item.selling_price, supplier: item.supplier || "", notes: item.notes || "" }); setAddModal(true); }}>
                            ✏️
                          </button>
                          <button style={{ ...S.actionBtn, background: "#fee2e2", color: "#dc2626" }} onClick={() => deleteItem(item.id)}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              MOVEMENTS TAB
          ══════════════════════════════════════════════════ */}
          {tab === "movements" && (
            <div style={S.card}>
              <div style={S.cardTitle}>📈 Stock Movement History</div>
              {movements.length === 0 ? (
                <div style={S.empty}>No movements recorded yet.</div>
              ) : (
                <div>
                  <div style={S.tableHead}>
                    <div style={{ flex: 2 }}>Item</div>
                    <div style={{ flex: 1 }}>Type</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Change</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Before</div>
                    <div style={{ flex: 1, textAlign: "right" }}>After</div>
                    <div style={{ flex: 2 }}>Reason</div>
                    <div style={{ flex: 1.5 }}>When</div>
                  </div>
                  {movements.map((m) => {
                    const mt = MOVEMENT_TYPES.find((t) => t.key === m.type) || MOVEMENT_TYPES[0];
                    return (
                      <div key={m.id} style={S.tableRow}>
                        <div style={{ flex: 2, fontWeight: 600 }}>{m.item_name}</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ ...S.badge, background: mt.color + "20", color: mt.color }}>
                            {mt.icon} {mt.label}
                          </span>
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 700, color: Number(m.quantity) > 0 ? "#10b981" : "#ef4444" }}>
                          {Number(m.quantity) > 0 ? "+" : ""}{fmtN(m.quantity)}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", color: "#9ca3af" }}>{fmtN(m.stock_before)}</div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 600 }}>{fmtN(m.stock_after)}</div>
                        <div style={{ flex: 2, color: "#6b7280", fontSize: 13 }}>{m.reason || "—"}</div>
                        <div style={{ flex: 1.5, color: "#9ca3af", fontSize: 12 }}>
                          {new Date(m.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              RESTOCK REQUESTS TAB
          ══════════════════════════════════════════════════ */}
          {tab === "restock" && (
            <div style={S.card}>
              <div style={S.cardTitle}>🔄 Restock Requests</div>
              {restocks.length === 0 ? (
                <div style={S.empty}>No restock requests yet. Click "Request" on any low stock item.</div>
              ) : (
                <div>
                  <div style={S.tableHead}>
                    <div style={{ flex: 2 }}>Item</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Current</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Requested</div>
                    <div style={{ flex: 1.5 }}>Supplier</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Status</div>
                    <div style={{ flex: 2 }}>Actions</div>
                    <div style={{ flex: 1.5 }}>Date</div>
                  </div>
                  {restocks.map((r) => {
                    const statusStyles = {
                      pending:   { bg: "#fef3c7", color: "#92400e" },
                      ordered:   { bg: "#dbeafe", color: "#1e40af" },
                      received:  { bg: "#d1fae5", color: "#065f46" },
                      cancelled: { bg: "#f3f4f6", color: "#6b7280" },
                    };
                    const sc = statusStyles[r.status] || statusStyles.pending;
                    return (
                      <div key={r.id} style={S.tableRow}>
                        <div style={{ flex: 2, fontWeight: 600 }}>{r.item_name}</div>
                        <div style={{ flex: 1, textAlign: "right", color: "#ef4444" }}>{fmtN(r.current_stock)}</div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 700, color: "#10b981" }}>{fmtN(r.requested_qty)}</div>
                        <div style={{ flex: 1.5, color: "#6b7280", fontSize: 13 }}>{r.supplier || "—"}</div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <span style={{ ...S.badge, background: sc.bg, color: sc.color, textTransform: "capitalize" }}>{r.status}</span>
                        </div>
                        <div style={{ flex: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {r.status === "pending" && (
                            <>
                              <button style={S.tinyBtn} onClick={() => updateRestockStatus(r.id, "ordered", r.item_id, r.requested_qty)}>Mark Ordered</button>
                              <button style={{ ...S.tinyBtn, background: "#fee2e2", color: "#dc2626" }} onClick={() => updateRestockStatus(r.id, "cancelled", r.item_id, r.requested_qty)}>Cancel</button>
                            </>
                          )}
                          {r.status === "ordered" && (
                            <button style={{ ...S.tinyBtn, background: "#d1fae5", color: "#065f46" }} onClick={() => updateRestockStatus(r.id, "received", r.item_id, r.requested_qty)}>✅ Mark Received</button>
                          )}
                          {(r.status === "received" || r.status === "cancelled") && (
                            <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                          )}
                        </div>
                        <div style={{ flex: 1.5, color: "#9ca3af", fontSize: 12 }}>
                          {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          ADD / EDIT ITEM MODAL
      ══════════════════════════════════════════════════ */}
      {addModal && (
        <div style={S.overlay} onClick={() => setAddModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>{editItem ? "✏️ Edit Item" : "➕ Add Inventory Item"}</div>
              <button style={S.closeBtn} onClick={() => setAddModal(false)}>✕</button>
            </div>

            <div style={S.formGrid}>
              <div style={S.formGroup}>
                <label style={S.label}>Item Name *</label>
                <input style={S.input} placeholder="e.g. Keratin Treatment" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Brand</label>
                <input style={S.input} placeholder="e.g. Schwarzkopf" value={itemForm.brand} onChange={(e) => setItemForm((f) => ({ ...f, brand: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Category</label>
                <select style={S.select} value={itemForm.category} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Unit</label>
                <select style={S.select} value={itemForm.unit} onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Current Stock</label>
                <input style={S.input} type="number" value={itemForm.current_stock} onChange={(e) => setItemForm((f) => ({ ...f, current_stock: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Min Stock (Low Alert)</label>
                <input style={S.input} type="number" value={itemForm.min_stock} onChange={(e) => setItemForm((f) => ({ ...f, min_stock: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Max Stock</label>
                <input style={S.input} type="number" value={itemForm.max_stock} onChange={(e) => setItemForm((f) => ({ ...f, max_stock: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Purchase Price (₹)</label>
                <input style={S.input} type="number" value={itemForm.purchase_price} onChange={(e) => setItemForm((f) => ({ ...f, purchase_price: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Supplier</label>
                <input style={S.input} placeholder="e.g. Beauty Wholesale" value={itemForm.supplier} onChange={(e) => setItemForm((f) => ({ ...f, supplier: e.target.value }))} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Notes</label>
                <input style={S.input} placeholder="Any notes…" value={itemForm.notes} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <button style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", marginTop: 20 }} disabled={itemSaving} onClick={saveItem}>
              {itemSaving ? "Saving…" : editItem ? "✅ Update Item" : "✅ Add to Inventory"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STOCK IN / OUT MODAL
      ══════════════════════════════════════════════════ */}
      {moveModal && moveTarget && (
        <div style={S.overlay} onClick={() => setMoveModal(false)}>
          <div style={{ ...S.modal, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>📦 Update Stock</div>
              <button style={S.closeBtn} onClick={() => setMoveModal(false)}>✕</button>
            </div>

            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>{moveTarget.name}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Current: <strong>{fmtN(moveTarget.current_stock)} {moveTarget.unit}</strong></div>
            </div>

            <div style={S.label}>Movement Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {MOVEMENT_TYPES.map((mt) => (
                <button key={mt.key}
                  style={{ padding: "10px", borderRadius: 8, border: `2px solid ${moveForm.type === mt.key ? mt.color : "#e5e7eb"}`, background: moveForm.type === mt.key ? mt.color + "15" : "#fff", cursor: "pointer", fontWeight: moveForm.type === mt.key ? 700 : 500, color: moveForm.type === mt.key ? mt.color : "#374151", fontSize: 13 }}
                  onClick={() => setMoveForm((f) => ({ ...f, type: mt.key }))}>
                  {mt.icon} {mt.label}
                </button>
              ))}
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Quantity ({moveTarget.unit})</label>
              <input style={S.input} type="number" placeholder="e.g. 100" value={moveForm.quantity} onChange={(e) => setMoveForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>

            {moveForm.quantity > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", background: "#f9fafb", borderRadius: 8, padding: "10px 14px", margin: "10px 0", fontSize: 14 }}>
                <span>New Stock:</span>
                <strong style={{ color: "#10b981" }}>
                  {fmtN(Math.max(0, Number(moveTarget.current_stock) + (["usage", "waste"].includes(moveForm.type) ? -Number(moveForm.quantity) : Number(moveForm.quantity))))} {moveTarget.unit}
                </strong>
              </div>
            )}

            <div style={S.formGroup}>
              <label style={S.label}>Reason (optional)</label>
              <input style={S.input} placeholder="e.g. Used for 3 clients today" value={moveForm.reason} onChange={(e) => setMoveForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>

            <button style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", marginTop: 12 }} disabled={moveSaving} onClick={recordMovement}>
              {moveSaving ? "Saving…" : "✅ Confirm Update"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          RESTOCK REQUEST MODAL
      ══════════════════════════════════════════════════ */}
      {restockModal && restockTarget && (
        <div style={S.overlay} onClick={() => setRestockModal(false)}>
          <div style={{ ...S.modal, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>🔄 Request Restock</div>
              <button style={S.closeBtn} onClick={() => setRestockModal(false)}>✕</button>
            </div>

            <div style={{ background: "#fef3c7", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>{restockTarget.name}</div>
              <div style={{ fontSize: 13, color: "#92400e" }}>
                Current: <strong>{fmtN(restockTarget.current_stock)} {restockTarget.unit}</strong> · Min: {fmtN(restockTarget.min_stock)}
              </div>
            </div>

            <div style={S.formGroup}>
              <label style={S.label}>Quantity to Order ({restockTarget.unit})</label>
              <input style={S.input} type="number" value={restockForm.requested_qty} onChange={(e) => setRestockForm((f) => ({ ...f, requested_qty: e.target.value }))} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Supplier</label>
              <input style={S.input} placeholder="e.g. Beauty Wholesale" value={restockForm.supplier} onChange={(e) => setRestockForm((f) => ({ ...f, supplier: e.target.value }))} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Notes</label>
              <input style={S.input} placeholder="e.g. Urgent — needed by Friday" value={restockForm.notes} onChange={(e) => setRestockForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>

            <button style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", marginTop: 16 }} disabled={restockSaving} onClick={submitRestockRequest}>
              {restockSaving ? "Submitting…" : "📋 Submit Request"}
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
const S = {
  page:        { padding: "24px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif", color: "#1a1a1a" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title:       { fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" },
  subtitle:    { color: "#9ca3af", fontSize: 14, marginTop: 2 },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 },
  statCard:    { background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  statCardAlert:{ border: "1px solid #fcd34d", background: "#fffbeb" },
  statIcon:    { fontSize: 24 },
  statValue:   { fontSize: 20, fontWeight: 800 },
  statLabel:   { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  tabRow:      { display: "flex", gap: 4, marginBottom: 20, background: "#f3f4f6", padding: 4, borderRadius: 10, width: "fit-content" },
  tab:         { padding: "8px 18px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#6b7280", fontWeight: 500 },
  tabActive:   { background: "#fff", color: "#be185d", fontWeight: 700, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  filterBar:   { display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none" },
  filterChips: { display: "flex", gap: 6 },
  catScroll:   { display: "flex", gap: 6, flexWrap: "wrap" },
  chip:        { padding: "6px 14px", borderRadius: 20, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#6b7280" },
  chipActive:  { background: "#be185d", color: "#fff", border: "1px solid #be185d", fontWeight: 700 },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  itemCard:    { background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", position: "relative" },
  barTrack:    { position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#f3f4f6" },
  barFill:     { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },
  itemTop:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6, marginBottom: 10 },
  itemName:    { fontWeight: 700, fontSize: 15, color: "#1a1a1a" },
  itemMeta:    { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  stockDisplay:{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 },
  stockMain:   { display: "flex", alignItems: "baseline", gap: 4 },
  stockNum:    { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  stockUnit:   { fontSize: 13, color: "#9ca3af" },
  stockThresholds: { fontSize: 12, textAlign: "right" },
  itemPriceRow:{ display: "flex", gap: 8, marginBottom: 6 },
  priceTag:    { fontSize: 11, color: "#6b7280", background: "#f9fafb", padding: "2px 8px", borderRadius: 4 },
  supplierRow: { fontSize: 12, color: "#9ca3af", marginBottom: 10 },
  itemActions: { display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" },
  actionBtn:   { flex: 1, padding: "7px 6px", borderRadius: 7, border: "none", background: "#fdf2f8", color: "#be185d", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  badge:       { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  loading:     { textAlign: "center", padding: 60, color: "#9ca3af" },
  empty:       { textAlign: "center", padding: 60, color: "#9ca3af", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6" },
  card:        { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardTitle:   { fontSize: 15, fontWeight: 700, marginBottom: 16 },
  tableHead:   { display: "flex", padding: "10px 16px", background: "#fdf2f8", borderRadius: "8px 8px 0 0", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  tableRow:    { display: "flex", padding: "12px 16px", borderBottom: "1px solid #f9fafb", fontSize: 13, alignItems: "center", gap: 4 },
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" },
  modal:       { background: "#fff", borderRadius: 16, padding: "28px 32px", width: 600, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle:  { fontWeight: 700, fontSize: 18 },
  closeBtn:    { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" },
  formGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  formGroup:   { display: "flex", flexDirection: "column" },
  label:       { fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 },
  input:       { padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  select:      { padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" },
  btnPrimary:  { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: "#be185d", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  tinyBtn:     { padding: "5px 10px", borderRadius: 6, border: "none", background: "#dbeafe", color: "#1e40af", fontSize: 11, cursor: "pointer", fontWeight: 600 },
};
