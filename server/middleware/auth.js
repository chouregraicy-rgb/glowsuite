import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ error: "Missing token" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.log("[auth] getUser error:", error.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = data.user;
    console.log("[auth] user verified:", user.email);

    // 1. Check users table first (owners)
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("role, salon_id")
      .eq("id", user.id)
      .single();

    if (userProfile?.salon_id) {
      req.user = {
        id: user.id,
        email: user.email,
        role: userProfile.role || "owner",
        salon_id: userProfile.salon_id,
      };
      console.log("[auth] req.user (owner):", req.user);
      return next();
    }

    // 2. Fallback: check staff table (employees)
    const { data: staffProfile, error: staffErr } = await supabaseAdmin
      .from("staff")
      .select("role, salon_id")
      .eq("auth_user_id", user.id)
      .single();

    if (staffErr) {
      console.log("[auth] staff lookup error:", staffErr.message);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: staffProfile?.role || "employee",
      salon_id: staffProfile?.salon_id || null,
    };

    console.log("[auth] req.user (staff):", req.user);
    next();
  } catch (err) {
    console.log("[auth] catch error:", err.message);
    next(err);
  }
}

export function requireOwner(req, res, next) {
  if (req.user?.role !== "owner")
    return res.status(403).json({ error: "Owner access required" });
  next();
}

export { supabaseAdmin };
