import { Router } from "express";
import crypto from "crypto";
import { requireAuth, requireOwner, supabaseAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/add", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const { name, email, phone, designation } = req.body;
    const salon_id = req.user.salon_id;

    if (!name || !email)
      return res.status(400).json({ error: "name and email are required" });

    const tempPassword = generateTempPassword();

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: name, role: "employee", salon_id },
    });

    if (authErr) {
      if (authErr.message?.includes("already registered"))
        return res.status(409).json({ error: "Email already exists." });
      throw authErr;
    }

    const { data: staffRow, error: dbErr } = await supabaseAdmin
      .from("staff")
      .insert([{
        auth_user_id: authData.user.id,
        salon_id,
        name,
        email,
        phone: phone || null,
        role: "employee",
        designation: designation || null,
        must_change_password: true,
        created_by: req.user.id,
      }])
      .select()
      .single();

    if (dbErr) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbErr;
    }

    // Also insert into users table so AuthContext works on frontend
    await supabaseAdmin.from("users").upsert({
      id: authData.user.id,
      name,
      role: "employee",
      salon_id,
      phone: phone || null,
    }, { onConflict: "id" });

    return res.status(201).json({
      message: "Staff added successfully",
      staff: { id: staffRow.id, name, email, designation: staffRow.designation },
      credentials: { email, tempPassword },
    });
  } catch (err) { next(err); }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { role, salon_id, id } = req.user;

    if (role === "owner") {
      const { data, error } = await supabaseAdmin
        .from("staff")
        .select("id, name, email, phone, role, designation, created_at")
        .eq("salon_id", salon_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({ staff: data });
    }

    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("id, name, email, phone, role, designation")
      .eq("auth_user_id", id)
      .single();
    if (error) throw error;
    return res.json({ staff: [data] });
  } catch (err) { next(err); }
});

router.get("/clients", requireAuth, async (req, res, next) => {
  try {
    const { salon_id, role } = req.user;
    const isOwner = role === "owner";

    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, email, phone, created_at, total_visits, last_visit")
      .eq("salon_id", salon_id)
      .order("name");
    if (error) throw error;

    const result = data.map(c => ({
      ...c,
      email: isOwner ? c.email : maskEmail(c.email),
      phone: isOwner ? c.phone : maskPhone(c.phone),
    }));
    return res.json({ clients: result });
  } catch (err) { next(err); }
});

router.delete("/:id", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const { data: row, error } = await supabaseAdmin
      .from("staff")
      .select("auth_user_id")
      .eq("id", req.params.id)
      .eq("salon_id", req.user.salon_id)
      .single();

    if (error || !row) return res.status(404).json({ error: "Not found" });

    await supabaseAdmin.from("staff").delete().eq("id", req.params.id);
    await supabaseAdmin.auth.admin.deleteUser(row.auth_user_id);
    return res.json({ message: "Staff removed" });
  } catch (err) { next(err); }
});

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pw = "";
  for (let i = 0; i < 12; i++)
    pw += chars[crypto.randomInt(0, chars.length)];
  return pw;
}

function maskEmail(e) {
  if (!e) return "—";
  const [l, d] = e.split("@");
  return `${l.slice(0, 2)}***@${d}`;
}

function maskPhone(p) {
  if (!p) return "—";
  const s = p.replace(/\D/g, "");
  return `${s.slice(0, 2)}****${s.slice(-2)}`;
}

export default router;