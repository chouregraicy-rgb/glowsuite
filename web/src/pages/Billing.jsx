import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────
const SALON_ID = "d4426e94-4dcb-41e4-90bb-71543533cbed";
const GST_RATE = 18;
const PAYMENT_METHODS = [
  { key: "cash",    label: "Cash",     icon: "💵" },
  { key: "upi",     label: "UPI / QR", icon: "📱" },
  { key: "card",    label: "Card",     icon: "💳" },
  { key: "partial", label: "Split",    icon: "⚡" },
];
const STATUS_COLOR = {
  paid:     { bg: "#d1fae5", color: "#065f46", label: "Paid" },
  partial:  { bg: "#fef3c7", color: "#92400e", label: "Partial" },
  unpaid:   { bg: "#fee2e2", color: "#991b1b", label: "Unpaid" },
  advance:  { bg: "#ede9fe", color: "#5b21b6", label: "Advance" },
};

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const today = () => new Date().toLocaleDateString("en-IN");

function calcTotals(items, discountType, discountValue, gstRate) {
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const discountAmount =
    discountType === "percent"
      ? (subtotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);
  const taxable = subtotal - discountAmount;
  const gstableSubtotal = items
    .filter((i) => i.gst_applicable)
    .reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const gstableAfterDiscount =
    discountType === "percent"
      ? gstableSubtotal * (1 - Number(discountValue || 0) / 100)
      : gstableSubtotal - Math.min(discountAmount, gstableSubtotal);
  const gstAmount = (gstableAfterDiscount * gstRate) / 100;
  const total = taxable + gstAmount;
  return { subtotal, discountAmount, gstAmount, total };
}

// ─── Print Invoice ─────────────────────────────────────────────
function printInvoice(inv, items, payments) {
  const { subtotal, discountAmount, gstAmount, total } = calcTotals(
    items,
    inv.discount_type,
    inv.discount_value,
    inv.gst_rate
  );
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Invoice ${inv.invoice_number}</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; margin: 0; color: #1a1a1a; }
      .page { max-width: 600px; margin: 20px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
      .logo { font-size: 26px; font-weight: 800; color: #be185d; letter-spacing: -1px; }
      .salon-info { font-size: 12px; color: #6b7280; text-align: right; }
      .divider { border: none; border-top: 2px solid #f3f4f6; margin: 16px 0; }
      .bill-to { background: #fdf2f8; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; }
      .bill-to h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #be185d; }
      .bill-to p { margin: 2px 0; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #fdf2f8; padding: 10px 12px; font-size: 12px; text-align: left; color: #374151; }
      td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
      .totals { margin-top: 16px; }
      .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
      .totals-row.total { font-size: 18px; font-weight: 700; color: #be185d; border-top: 2px solid #f3f4f6; padding-top: 12px; margin-top: 8px; }
      .payments { margin-top: 20px; padding: 14px; background: #f0fdf4; border-radius: 8px; }
      .payments h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #16a34a; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 28px; }
    </style></head><body>
    <div class="page">
      <div class="header">
        <div>
          <div class="logo">✨ GlowSuite</div>
          <div style="font-size:13px;margin-top:4px;color:#374151;font-weight:600">Hyfy Salon</div>
        </div>
        <div class="salon-info">
          <div style="font-weight:700;font-size:16px">${inv.invoice_number}</div>
          <div>Date: ${today()}</div>
          <div>GST Rate: ${inv.gst_rate}%</div>
          <div>
            <span class="status-badge" style="background:${STATUS_COLOR[inv.status].bg};color:${STATUS_COLOR[inv.status].color}">
              ${STATUS_COLOR[inv.status].label}
            </span>
          </div>
        </div>
      </div>
      <div class="bill-to">
        <h4>Bill To</h4>
        <p><strong>${inv.client_name || "Walk-in Client"}</strong></p>
        ${inv.staff_name ? `<p style="color:#6b7280">Served by: ${inv.staff_name}</p>` : ""}
      </div>
      <table>
        <thead><tr>
          <th>Service</th><th style="text-align:center">Qty</th>
          <th style="text-align:right">Price</th><th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>
          ${items.map((it) => `
            <tr>
              <td>${it.service_name}${!it.gst_applicable ? ' <span style="color:#6b7280;font-size:11px">(no GST)</span>' : ""}</td>
              <td style="text-align:center">${it.quantity}</td>
              <td style="text-align:right">${fmt(it.unit_price)}</td>
              <td style="text-align:right">${fmt(it.unit_price * it.quantity)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${discountAmount > 0 ? `<div class="totals-row" style="color:#dc2626"><span>Discount</span><span>-${fmt(discountAmount)}</span></div>` : ""}
        <div class="totals-row"><span>GST (${inv.gst_rate}%)</span><span>${fmt(gstAmount)}</span></div>
        <div class="totals-row total"><span>Total</span><span>${fmt(total)}</span></div>
        ${inv.balance_due > 0 ? `<div class="totals-row" style="color:#dc2626"><span>Balance Due</span><span>${fmt(inv.balance_due)}</span></div>` : ""}
      </div>
      ${payments?.length ? `
      <div class="payments">
        <h4>Payments Received</h4>
        ${payments.map((p) => `
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span style="text-transform:capitalize">${p.method}${p.reference ? ` — ${p.reference}` : ""}</span>
            <strong>${fmt(p.amount)}</strong>
          </div>`).join("")}
      </div>` : ""}
      <div class="footer">
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0 12px">
        Thank you for visiting Hyfy Salon! · Powered by GlowSuite
      </div>
    </div>
    </body></html>`);
  w.document.close();
  w.print();
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Billing() {
  const { user } = useAuth();

  // ── Data state ──
  const [invoices, setInvoices]     = useState([]);
  const [services, setServices]     = useState([]);
  const [clients, setClients]       = useState([]);
  const [staff, setStaff]           = useState([]);
  const [loading, setLoading]       = useState(true);

  // ── UI state ──
  const [view, setView]             = useState("list");   // list | create | detail
  const [selectedInv, setSelectedInv] = useState(null);
  const [invPayments, setInvPayments] = useState([]);
  const [invItems, setInvItems]     = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch]         = useState("");

  // ── Create Invoice state ──
  const [form, setForm] = useState({
    client_id: "", client_name: "", client_phone: "",
    staff_id: "", staff_name: "",
    discount_type: "flat", discount_value: 0,
    notes: "",
  });
  const [lineItems, setLineItems]   = useState([]);
  const [serviceSearch, setSvcSearch] = useState("");
  const [saving, setSaving]         = useState(false);

  // ── Payment modal state ──
  const [payModal, setPayModal]     = useState(false);
  const [payForm, setPayForm]       = useState({ method: "cash", amount: "", reference: "" });
  const [payTarget, setPayTarget]   = useState(null);
  const [paySaving, setPaySaving]   = useState(false);

  // ── Advance payment modal state ──
  const [advModal, setAdvModal]     = useState(false);
  const [advForm, setAdvForm]       = useState({ method: "cash", amount: "", reference: "", client_name: "", client_phone: "", notes: "" });
  const [advSaving, setAdvSaving]   = useState(false);

  // ─── Fetch on mount ──────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [invRes, svcRes, cliRes, staffRes] = await Promise.all([
      supabase.from("invoices").select("*").eq("salon_id", SALON_ID).order("created_at", { ascending: false }),
      supabase.from("services").select("*").eq("salon_id", SALON_ID).eq("is_active", true).order("category"),
      supabase.from("clients").select("id, name, phone_encrypted").eq("salon_id", SALON_ID).order("name"),
      supabase.from("staff").select("id, name").eq("salon_id", SALON_ID),
    ]);
    setInvoices(invRes.data || []);
    setServices(svcRes.data || []);
    setClients(cliRes.data || []);
    setStaff(staffRes.data || []);
    setLoading(false);
  }

  async function openDetail(inv) {
    setSelectedInv(inv);
    const [itemsRes, paysRes] = await Promise.all([
      supabase.from("invoice_items").select("*").eq("invoice_id", inv.id),
      supabase.from("payments").select("*").eq("invoice_id", inv.id).order("paid_at"),
    ]);
    setInvItems(itemsRes.data || []);
    setInvPayments(paysRes.data || []);
    setView("detail");
  }

  // ─── Line Item Helpers ────────────────────────────────────────
  function addService(svc) {
    const exists = lineItems.find((i) => i.service_id === svc.id);
    if (exists) {
      setLineItems((prev) =>
        prev.map((i) => i.service_id === svc.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      setLineItems((prev) => [
        ...prev,
        { service_id: svc.id, service_name: svc.name, unit_price: svc.price, quantity: 1, gst_applicable: svc.gst_applicable },
      ]);
    }
    setSvcSearch("");
  }

  function removeItem(idx) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx, field, val) {
    setLineItems((prev) =>
      prev.map((it, i) => i === idx ? { ...it, [field]: field === "quantity" ? Math.max(1, Number(val)) : Number(val) } : it)
    );
  }

  // ─── Save Standalone Advance Payment (no invoice yet) ─────────
  async function saveAdvancePayment() {
    if (!advForm.amount || Number(advForm.amount) <= 0) return alert("Enter a valid advance amount.");
    if (!advForm.client_name.trim()) return alert("Enter client name.");
    setAdvSaving(true);
    try {
      // Generate a placeholder ADV- invoice number
      const { data: countData } = await supabase
        .from("invoices").select("id").eq("salon_id", SALON_ID);
      const count = countData?.length || 0;
      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const invNumber = `ADV-${ym}-${String(count + 1).padStart(4, "0")}`;
      const advAmt = Number(advForm.amount);

      // Create a placeholder invoice with status "advance"
      const { data: newInv, error } = await supabase.from("invoices").insert({
        salon_id: SALON_ID,
        invoice_number: invNumber,
        client_name: advForm.client_name,
        client_phone: advForm.client_phone || "",
        subtotal: 0,
        discount_type: "flat",
        discount_value: 0,
        discount_amount: 0,
        gst_rate: GST_RATE,
        gst_amount: 0,
        total: 0,
        advance_amount: advAmt,
        amount_paid: advAmt,
        balance_due: 0,
        status: "advance",
        notes: advForm.notes || "Advance payment — invoice to be raised later",
        created_by: user?.id,
      }).select().single();

      if (error) throw error;

      // Insert payment record
      await supabase.from("payments").insert({
        invoice_id: newInv.id,
        salon_id: SALON_ID,
        method: advForm.method,
        amount: advAmt,
        reference: advForm.reference || "Advance payment",
        created_by: user?.id,
      });

      await fetchAll();
      setAdvModal(false);
      setAdvForm({ method: "cash", amount: "", reference: "", client_name: "", client_phone: "", notes: "" });
      alert(`✅ Advance of ${fmt(advAmt)} recorded for ${advForm.client_name}!`);
    } catch (e) {
      alert("Error saving advance: " + e.message);
    }
    setAdvSaving(false);
  }
  const totals = calcTotals(lineItems, form.discount_type, form.discount_value, GST_RATE);

  // ─── Save Invoice ─────────────────────────────────────────────
  async function saveInvoice(status = "unpaid") {
    if (!lineItems.length) return alert("Add at least one service.");
    setSaving(true);
    try {
      // Generate invoice number
      const { data: countData } = await supabase
        .from("invoices")
        .select("id", { count: "exact" })
        .eq("salon_id", SALON_ID);
      const count = countData?.length || 0;
      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const invNumber = `INV-${ym}-${String(count + 1).padStart(4, "0")}`;

      const selectedClient = clients.find((c) => c.id === form.client_id);
      const selectedStaff  = staff.find((s) => s.id === form.staff_id);

      // If saving as paid, amount_paid = total, balance = 0
      const isPaid = status === "paid";
      const advAmt = Number(form.advance_amount || 0);
      const effectiveAmountPaid = isPaid ? totals.total : advAmt;
      const effectiveBalance = Math.max(0, totals.total - effectiveAmountPaid);
      const effectiveStatus = isPaid ? "paid" : advAmt > 0 ? (effectiveBalance <= 0 ? "paid" : "partial") : "unpaid";

      const invPayload = {
        salon_id: SALON_ID,
        invoice_number: invNumber,
        client_id: form.client_id || null,
        client_name: form.client_name || selectedClient?.name || "Walk-in",
        client_phone: form.client_phone || selectedClient?.phone_encrypted || "",
        staff_id: form.staff_id || null,
        staff_name: selectedStaff?.name || form.staff_name || null,
        subtotal: totals.subtotal,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        discount_amount: totals.discountAmount,
        gst_rate: GST_RATE,
        gst_amount: totals.gstAmount,
        total: totals.total,
        advance_amount: advAmt,
        amount_paid: effectiveAmountPaid,
        balance_due: effectiveBalance,
        status: effectiveStatus,
        notes: form.notes,
        created_by: user?.id,
      };

      const { data: newInv, error } = await supabase
        .from("invoices")
        .insert(invPayload)
        .select()
        .single();

      if (error) throw error;

      // Insert line items
      const itemsPayload = lineItems.map((it) => ({
        invoice_id: newInv.id,
        service_id: it.service_id || null,
        service_name: it.service_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        gst_applicable: it.gst_applicable !== false,
        line_total: it.unit_price * it.quantity,
      }));
      await supabase.from("invoice_items").insert(itemsPayload);

      // If paid, also insert a cash payment record
      if (isPaid) {
        await supabase.from("payments").insert({
          invoice_id: newInv.id,
          salon_id: SALON_ID,
          method: "cash",
          amount: totals.total,
          reference: "Paid at counter",
          created_by: user?.id,
        });
      }
      // If advance was given, insert advance payment record
      if (!isPaid && advAmt > 0) {
        await supabase.from("payments").insert({
          invoice_id: newInv.id,
          salon_id: SALON_ID,
          method: "advance",
          amount: advAmt,
          reference: "Advance payment",
          created_by: user?.id,
        });
      }

      await fetchAll();
      resetForm();
      await openDetail(newInv);
    } catch (e) {
      alert("Error saving invoice: " + e.message);
    }
    setSaving(false);
  }

  function resetForm() {
    setForm({ client_id: "", client_name: "", client_phone: "", staff_id: "", staff_name: "", discount_type: "flat", discount_value: 0, advance_amount: 0, notes: "" });
    setLineItems([]);
    setSvcSearch("");
  }

  // ─── Record Payment ───────────────────────────────────────────
  async function recordPayment() {
    if (!payForm.amount || Number(payForm.amount) <= 0) return alert("Enter a valid amount.");
    setPaySaving(true);
    try {
      const inv = payTarget;
      const paid = Number(payForm.amount);
      const newAmountPaid = Number(inv.amount_paid) + paid;
      const newBalance = Number(inv.total) - newAmountPaid;
      const newStatus = newBalance <= 0.01 ? "paid" : "partial";

      await supabase.from("payments").insert({
        invoice_id: inv.id,
        salon_id: SALON_ID,
        method: payForm.method,
        amount: paid,
        reference: payForm.reference || null,
        created_by: user?.id,
      });

      await supabase.from("invoices").update({
        amount_paid: newAmountPaid,
        balance_due: Math.max(0, newBalance),
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", inv.id);

      await fetchAll();
      // Refresh detail
      const { data: updated } = await supabase.from("invoices").select("*").eq("id", inv.id).single();
      const [itemsRes, paysRes] = await Promise.all([
        supabase.from("invoice_items").select("*").eq("invoice_id", inv.id),
        supabase.from("payments").select("*").eq("invoice_id", inv.id).order("paid_at"),
      ]);
      setSelectedInv(updated);
      setInvItems(itemsRes.data || []);
      setInvPayments(paysRes.data || []);

      setPayModal(false);
      setPayForm({ method: "cash", amount: "", reference: "" });
      setPayTarget(null);
    } catch (e) {
      alert("Payment error: " + e.message);
    }
    setPaySaving(false);
  }

  // ─── Filtered invoices ────────────────────────────────────────
  const filtered = invoices.filter((inv) => {
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchSearch = !search ||
      (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_name || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ─── Stats ────────────────────────────────────────────────────
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const pendingAmt   = invoices.reduce((s, i) => s + Number(i.balance_due || 0), 0);
  const advanceAmt   = invoices.reduce((s, i) => s + Number(i.advance_amount || 0), 0);
  const todayInvs    = invoices.filter((i) => i.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10));

  // ─── Service suggestions ──────────────────────────────────────
  const categories = [...new Set(services.map((s) => s.category))];
  const filteredServices = serviceSearch
    ? services.filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    : [];

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>🧾</span>
            Billing & POS
          </div>
          <div style={styles.headerSub}>Invoices · Payments · Point of Sale</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {view !== "list" && (
            <button style={styles.btnOutline} onClick={() => { setView("list"); setSelectedInv(null); resetForm(); }}>
              ← Back
            </button>
          )}
          {view === "list" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.btnAdvance} onClick={() => { setAdvForm({ method: "cash", amount: "", reference: "", client_name: "", client_phone: "", notes: "" }); setAdvModal(true); }}>
                🔮 Advance Payment
              </button>
              <button style={styles.btnPrimary} onClick={() => { resetForm(); setView("create"); }}>
                + New Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats bar (list view) ── */}
      {view === "list" && (
        <div style={styles.statsRow}>
          {[
            { label: "Total Revenue", value: fmt(totalRevenue), icon: "💰", color: "#10b981" },
            { label: "Pending", value: fmt(pendingAmt), icon: "⏳", color: "#f59e0b" },
            { label: "Advances Collected", value: fmt(advanceAmt), icon: "🔮", color: "#7c3aed" },
            { label: "Today's Invoices", value: todayInvs.length, icon: "📋", color: "#be185d" },
          ].map((stat) => (
            <div key={stat.label} style={styles.statCard}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div>
                <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading billing data…</div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              LIST VIEW
          ══════════════════════════════════════════════════ */}
          {view === "list" && (
            <div>
              {/* Filters */}
              <div style={styles.filters}>
                <input
                  style={styles.searchInput}
                  placeholder="Search invoice # or client…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div style={styles.filterTabs}>
                  {["all", "paid", "partial", "unpaid"].map((s) => (
                    <button
                      key={s}
                      style={{ ...styles.filterTab, ...(filterStatus === s ? styles.filterTabActive : {}) }}
                      onClick={() => setFilterStatus(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div style={styles.empty}>No invoices found. Create your first invoice!</div>
              ) : (
                <div style={styles.table}>
                  <div style={styles.tableHead}>
                    <div style={{ flex: 1.5 }}>Invoice #</div>
                    <div style={{ flex: 2 }}>Client</div>
                    <div style={{ flex: 1.5 }}>Staff</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Amount</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Paid</div>
                    <div style={{ flex: 1, textAlign: "right" }}>Balance</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Status</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Action</div>
                  </div>
                  {filtered.map((inv) => {
                    const sc = STATUS_COLOR[inv.status];
                    return (
                      <div key={inv.id} style={styles.tableRow} onClick={() => openDetail(inv)}>
                        <div style={{ flex: 1.5, fontWeight: 600, color: "#be185d" }}>{inv.invoice_number}</div>
                        <div style={{ flex: 2 }}>{inv.client_name || "Walk-in"}</div>
                        <div style={{ flex: 1.5, color: "#6b7280" }}>{inv.staff_name || "—"}</div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 600 }}>{fmt(inv.total)}</div>
                        <div style={{ flex: 1, textAlign: "right", color: "#10b981" }}>{fmt(inv.amount_paid)}</div>
                        <div style={{ flex: 1, textAlign: "right", color: inv.balance_due > 0 ? "#dc2626" : "#10b981" }}>
                          {fmt(inv.balance_due)}
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            style={styles.btnSmall}
                            onClick={(e) => { e.stopPropagation(); openDetail(inv); }}
                          >View</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              CREATE INVOICE VIEW
          ══════════════════════════════════════════════════ */}
          {view === "create" && (
            <div style={styles.createGrid}>
              {/* LEFT: Form */}
              <div style={styles.createLeft}>
                {/* Client & Staff */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>👤 Client & Staff</div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Client</label>
                      <select
                        style={styles.select}
                        value={form.client_id}
                        onChange={(e) => {
                          const c = clients.find((cl) => cl.id === e.target.value);
                          setForm((f) => ({ ...f, client_id: e.target.value, client_name: c?.name || "", client_phone: c?.phone_encrypted || "" }));
                        }}
                      >
                        <option value="">Walk-in / Type manually</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Client Name (override)</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. Walk-in Customer"
                        value={form.client_name}
                        onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Assign Staff</label>
                      <select
                        style={styles.select}
                        value={form.staff_id}
                        onChange={(e) => setForm((f) => ({ ...f, staff_id: e.target.value }))}
                      >
                        <option value="">No staff assigned</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Notes</label>
                      <input
                        style={styles.input}
                        placeholder="Any notes for this invoice…"
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Service Picker */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>💆 Add Services</div>
                  <input
                    style={styles.input}
                    placeholder="Search service (e.g. facial, wax, keratin)…"
                    value={serviceSearch}
                    onChange={(e) => setSvcSearch(e.target.value)}
                  />
                  {serviceSearch && filteredServices.length > 0 && (
                    <div style={styles.svcDropdown}>
                      {filteredServices.slice(0, 8).map((svc) => (
                        <div key={svc.id} style={styles.svcOption} onClick={() => addService(svc)}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{svc.name}</span>
                            <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 8 }}>{svc.category}</span>
                          </div>
                          <span style={{ color: "#be185d", fontWeight: 700 }}>{fmt(svc.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {serviceSearch && filteredServices.length === 0 && (
                    <div style={{ color: "#9ca3af", fontSize: 13, padding: "8px 0" }}>No services found</div>
                  )}

                  {/* Quick category buttons */}
                  {!serviceSearch && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Quick categories:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            style={styles.catChip}
                            onClick={() => setSvcSearch(cat)}
                          >{cat}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                {lineItems.length > 0 && (
                  <div style={styles.card}>
                    <div style={styles.cardTitle}>📋 Services Added</div>
                    {lineItems.map((it, idx) => (
                      <div key={idx} style={styles.lineItem}>
                        <div style={{ flex: 3 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{it.service_name}</div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>
                            {it.gst_applicable ? "GST applied" : "No GST"}
                          </div>
                        </div>
                        <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
                          <button style={styles.qtyBtn} onClick={() => updateItem(idx, "quantity", it.quantity - 1)}>−</button>
                          <span style={{ minWidth: 24, textAlign: "center" }}>{it.quantity}</span>
                          <button style={styles.qtyBtn} onClick={() => updateItem(idx, "quantity", it.quantity + 1)}>+</button>
                        </div>
                        <div style={{ flex: 1.5 }}>
                          <input
                            style={{ ...styles.input, padding: "4px 8px", fontSize: 13 }}
                            type="number"
                            value={it.unit_price}
                            onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 700, color: "#be185d" }}>
                          {fmt(it.unit_price * it.quantity)}
                        </div>
                        <button style={styles.removeBtn} onClick={() => removeItem(idx)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Bill Summary */}
              <div style={styles.createRight}>
                <div style={{ ...styles.card, position: "sticky", top: 80 }}>
                  <div style={styles.cardTitle}>🧮 Bill Summary</div>

                  {/* Discount */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={styles.label}>Discount</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        style={{ ...styles.select, flex: 1 }}
                        value={form.discount_type}
                        onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                      >
                        <option value="flat">Flat (₹)</option>
                        <option value="percent">Percent (%)</option>
                      </select>
                      <input
                        type="number"
                        style={{ ...styles.input, flex: 1 }}
                        placeholder="0"
                        value={form.discount_value}
                        onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Advance received */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={styles.label}>Advance Received (₹)</div>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="0 — enter if client already paid advance"
                      value={form.advance_amount || ""}
                      onChange={(e) => setForm((f) => ({ ...f, advance_amount: e.target.value }))}
                    />
                  </div>

                  {/* Totals */}
                  <div style={styles.totalBox}>
                    <div style={styles.totalRow}>
                      <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div style={{ ...styles.totalRow, color: "#dc2626" }}>
                        <span>Discount</span><span>−{fmt(totals.discountAmount)}</span>
                      </div>
                    )}
                    <div style={styles.totalRow}>
                      <span>GST ({GST_RATE}%)</span><span>{fmt(totals.gstAmount)}</span>
                    </div>
                    <div style={{ ...styles.totalRow, ...styles.totalRowFinal }}>
                      <span>Total</span><span>{fmt(totals.total)}</span>
                    </div>
                    {Number(form.advance_amount) > 0 && (
                      <>
                        <div style={{ ...styles.totalRow, color: "#7c3aed", marginTop: 6 }}>
                          <span>🔮 Advance Paid</span><span>−{fmt(form.advance_amount)}</span>
                        </div>
                        <div style={{ ...styles.totalRow, color: "#dc2626", fontWeight: 700 }}>
                          <span>Balance Due</span>
                          <span>{fmt(Math.max(0, totals.total - Number(form.advance_amount)))}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    <button
                      style={{ ...styles.btnPrimary, width: "100%", justifyContent: "center" }}
                      disabled={saving || !lineItems.length}
                      onClick={() => saveInvoice("unpaid")}
                    >
                      {saving ? "Saving…" : "💾 Save Invoice"}
                    </button>
                    <button
                      style={{ ...styles.btnGreen, width: "100%", justifyContent: "center" }}
                      disabled={saving || !lineItems.length}
                      onClick={() => saveInvoice("paid")}
                    >
                      {saving ? "Saving…" : "✅ Save & Mark Paid"}
                    </button>
                  </div>

                  {lineItems.length === 0 && (
                    <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 12 }}>
                      Add services to calculate bill
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              DETAIL / VIEW INVOICE
          ══════════════════════════════════════════════════ */}
          {view === "detail" && selectedInv && (
            <div style={styles.detailGrid}>
              <div style={styles.detailLeft}>
                {/* Invoice header */}
                <div style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#be185d" }}>{selectedInv.invoice_number}</div>
                      <div style={{ color: "#6b7280", fontSize: 14, marginTop: 2 }}>
                        {new Date(selectedInv.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <span style={{ ...styles.badge, ...(() => { const sc = STATUS_COLOR[selectedInv.status]; return { background: sc.bg, color: sc.color, fontSize: 14, padding: "6px 16px" }; })() }}>
                      {STATUS_COLOR[selectedInv.status].label}
                    </span>
                  </div>
                  <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
                    <div>
                      <div style={styles.label}>Client</div>
                      <div style={{ fontWeight: 600 }}>{selectedInv.client_name || "Walk-in"}</div>
                    </div>
                    {selectedInv.staff_name && (
                      <div>
                        <div style={styles.label}>Served by</div>
                        <div style={{ fontWeight: 600 }}>{selectedInv.staff_name}</div>
                      </div>
                    )}
                  </div>
                  {selectedInv.notes && (
                    <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>
                      📝 {selectedInv.notes}
                    </div>
                  )}
                </div>

                {/* Services table */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Services</div>
                  <div style={styles.tableHead}>
                    <div style={{ flex: 3 }}>Service</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Qty</div>
                    <div style={{ flex: 1.5, textAlign: "right" }}>Price</div>
                    <div style={{ flex: 1.5, textAlign: "right" }}>Total</div>
                  </div>
                  {invItems.map((it) => (
                    <div key={it.id} style={styles.tableRow}>
                      <div style={{ flex: 3 }}>
                        {it.service_name}
                        {!it.gst_applicable && <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 6 }}>(no GST)</span>}
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>{it.quantity}</div>
                      <div style={{ flex: 1.5, textAlign: "right" }}>{fmt(it.unit_price)}</div>
                      <div style={{ flex: 1.5, textAlign: "right", fontWeight: 600 }}>{fmt(it.line_total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.detailRight}>
                {/* Bill total */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>💰 Bill</div>
                  <div style={styles.totalBox}>
                    <div style={styles.totalRow}><span>Subtotal</span><span>{fmt(selectedInv.subtotal)}</span></div>
                    {Number(selectedInv.discount_amount) > 0 && (
                      <div style={{ ...styles.totalRow, color: "#dc2626" }}>
                        <span>Discount ({selectedInv.discount_type === "percent" ? `${selectedInv.discount_value}%` : "flat"})</span>
                        <span>−{fmt(selectedInv.discount_amount)}</span>
                      </div>
                    )}
                    <div style={styles.totalRow}><span>GST ({selectedInv.gst_rate}%)</span><span>{fmt(selectedInv.gst_amount)}</span></div>
                    <div style={{ ...styles.totalRow, ...styles.totalRowFinal }}><span>Total</span><span>{fmt(selectedInv.total)}</span></div>
                    {Number(selectedInv.advance_amount) > 0 && (
                      <div style={{ ...styles.totalRow, color: "#7c3aed", fontWeight: 600 }}>
                        <span>🔮 Advance Paid</span><span>−{fmt(selectedInv.advance_amount)}</span>
                      </div>
                    )}
                    <div style={{ ...styles.totalRow, color: "#10b981" }}><span>Total Paid</span><span>{fmt(selectedInv.amount_paid)}</span></div>
                    {Number(selectedInv.balance_due) > 0 && (
                      <div style={{ ...styles.totalRow, color: "#dc2626", fontWeight: 700 }}>
                        <span>Balance Due</span><span>{fmt(selectedInv.balance_due)}</span>
                      </div>
                    )}
                    {Number(selectedInv.balance_due) === 0 && (
                      <div style={{ ...styles.totalRow, color: "#10b981", fontWeight: 700 }}>
                        <span>✅ Fully Settled</span><span>₹0.00</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payments received */}
                {invPayments.length > 0 && (
                  <div style={styles.card}>
                    <div style={styles.cardTitle}>💳 Payments</div>
                    {invPayments.map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 14 }}>
                        <div>
                          <span style={{
                            textTransform: "capitalize", fontWeight: 600,
                            color: p.method === "advance" ? "#7c3aed" : "#1a1a1a"
                          }}>
                            {p.method === "advance" ? "🔮 Advance" : p.method}
                          </span>
                          {p.reference && <span style={{ color: "#9ca3af", marginLeft: 6 }}>— {p.reference}</span>}
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            {new Date(p.paid_at).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <span style={{ color: p.method === "advance" ? "#7c3aed" : "#10b981", fontWeight: 700 }}>{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>⚡ Actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedInv.status !== "paid" && (
                      <button
                        style={{ ...styles.btnGreen, justifyContent: "center" }}
                        onClick={() => { setPayTarget(selectedInv); setPayForm((f) => ({ ...f, amount: selectedInv.balance_due })); setPayModal(true); }}
                      >
                        💳 Record Payment
                      </button>
                    )}
                    <button
                      style={{ ...styles.btnOutline, justifyContent: "center" }}
                      onClick={() => printInvoice(selectedInv, invItems, invPayments)}
                    >
                      🖨️ Print / Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          PAYMENT MODAL
      ══════════════════════════════════════════════════ */}
      {payModal && payTarget && (
        <div style={styles.modalOverlay} onClick={() => setPayModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Record Payment</div>
              <button style={styles.closeBtn} onClick={() => setPayModal(false)}>✕</button>
            </div>

            <div style={{ background: "#fdf2f8", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14 }}>
              <div style={{ color: "#be185d", fontWeight: 700, marginBottom: 4 }}>{payTarget.invoice_number}</div>
              <div>Balance Due: <strong>{fmt(payTarget.balance_due)}</strong></div>
            </div>

            {/* Payment method */}
            <div style={styles.label}>Payment Method</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  style={{
                    ...styles.methodBtn,
                    ...(payForm.method === m.key ? styles.methodBtnActive : {}),
                  }}
                  onClick={() => setPayForm((f) => ({ ...f, method: m.key }))}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Amount (₹)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              {(payForm.method === "upi" || payForm.method === "card") && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{payForm.method === "upi" ? "UPI Ref #" : "Card Last 4"}</label>
                  <input
                    style={styles.input}
                    placeholder={payForm.method === "upi" ? "e.g. TXN123456" : "e.g. 4242"}
                    value={payForm.reference}
                    onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <button
              style={{ ...styles.btnPrimary, width: "100%", justifyContent: "center", marginTop: 8 }}
              disabled={paySaving}
              onClick={recordPayment}
            >
              {paySaving ? "Processing…" : "✅ Confirm Payment"}
            </button>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════
          ADVANCE PAYMENT MODAL
      ══════════════════════════════════════════════════ */}
      {advModal && (
        <div style={styles.modalOverlay} onClick={() => setAdvModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>🔮 Record Advance Payment</div>
              <button style={styles.closeBtn} onClick={() => setAdvModal(false)}>✕</button>
            </div>

            <div style={{ background: "#ede9fe", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#5b21b6" }}>
              Use this when a client pays in advance <strong>before the service</strong>. An ADV- record will be created and linked when you raise the actual invoice later.
            </div>

            {/* Client info */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Client Name *</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Priya Sharma"
                  value={advForm.client_name}
                  onChange={(e) => setAdvForm((f) => ({ ...f, client_name: e.target.value }))}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone (optional)</label>
                <input
                  style={styles.input}
                  placeholder="e.g. 9876543210"
                  value={advForm.client_phone}
                  onChange={(e) => setAdvForm((f) => ({ ...f, client_phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginTop: 12 }}>
              <div style={styles.label}>Payment Method</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    style={{ ...styles.methodBtn, ...(advForm.method === m.key ? styles.methodBtnActive : {}) }}
                    onClick={() => setAdvForm((f) => ({ ...f, method: m.key }))}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Advance Amount (₹) *</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="e.g. 2000"
                  value={advForm.amount}
                  onChange={(e) => setAdvForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              {(advForm.method === "upi" || advForm.method === "card") && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{advForm.method === "upi" ? "UPI Ref #" : "Card Last 4"}</label>
                  <input
                    style={styles.input}
                    placeholder={advForm.method === "upi" ? "e.g. TXN123456" : "e.g. 4242"}
                    value={advForm.reference}
                    onChange={(e) => setAdvForm((f) => ({ ...f, reference: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={styles.label}>Notes (optional)</label>
              <input
                style={styles.input}
                placeholder="e.g. Bridal booking deposit for 15 June"
                value={advForm.notes}
                onChange={(e) => setAdvForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {advForm.amount > 0 && (
              <div style={{ background: "#ede9fe", borderRadius: 8, padding: "10px 14px", marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#5b21b6" }}>
                <span>Advance Amount</span>
                <span>{fmt(advForm.amount)}</span>
              </div>
            )}

            <button
              style={{ ...styles.btnAdvance, width: "100%", justifyContent: "center", marginTop: 16, padding: "12px" }}
              disabled={advSaving}
              onClick={saveAdvancePayment}
            >
              {advSaving ? "Saving…" : "🔮 Save Advance Payment"}
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
const styles = {
  page: { padding: "24px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif", color: "#1a1a1a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  headerTitle: { fontSize: 26, fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.5px" },
  headerIcon: { fontSize: 28 },
  headerSub: { color: "#9ca3af", fontSize: 14, marginTop: 2 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  statValue: { fontSize: 20, fontWeight: 800 },
  statLabel: { fontSize: 12, color: "#9ca3af" },
  loading: { textAlign: "center", padding: 60, color: "#9ca3af" },
  filters: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center" },
  searchInput: { flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none" },
  filterTabs: { display: "flex", gap: 4, background: "#f3f4f6", padding: 4, borderRadius: 8 },
  filterTab: { padding: "6px 14px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#6b7280" },
  filterTabActive: { background: "#fff", fontWeight: 600, color: "#be185d", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  table: { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" },
  tableHead: { display: "flex", padding: "12px 20px", background: "#fdf2f8", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  tableRow: { display: "flex", padding: "14px 20px", borderBottom: "1px solid #f9fafb", fontSize: 14, alignItems: "center", cursor: "pointer", transition: "background 0.15s", "&:hover": { background: "#fdf9ff" } },
  empty: { textAlign: "center", padding: 60, color: "#9ca3af", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#1a1a1a" },
  createGrid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "flex-start" },
  createLeft: {},
  createRight: {},
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "flex-start" },
  detailLeft: {},
  detailRight: {},
  formRow: { display: "flex", gap: 14 },
  formGroup: { flex: 1, display: "flex", flexDirection: "column" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 500 },
  input: { padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  select: { padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" },
  svcDropdown: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" },
  svcOption: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f9fafb", fontSize: 14 },
  catChip: { padding: "5px 12px", borderRadius: 20, border: "1px solid #e5e7eb", background: "#fdf2f8", color: "#be185d", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  lineItem: { display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f9fafb" },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontWeight: 700, fontSize: 16 },
  removeBtn: { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: "0 4px" },
  totalBox: { background: "#fdf2f8", borderRadius: 10, padding: "14px 18px" },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 },
  totalRowFinal: { fontSize: 18, fontWeight: 800, color: "#be185d", borderTop: "2px solid #f9a8d4", paddingTop: 10, marginTop: 6 },
  btnAdvance: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnPrimary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: "#be185d", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnGreen: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%" },
  btnOutline: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%" },
  btnSmall: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" },
  modal: { background: "#fff", borderRadius: 16, padding: "28px 32px", width: 460, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" },
  methodBtn: { flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  methodBtnActive: { background: "#fdf2f8", border: "2px solid #be185d", color: "#be185d", fontWeight: 700 },
};
