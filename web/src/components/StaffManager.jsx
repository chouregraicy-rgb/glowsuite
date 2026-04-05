import { useState, useEffect } from "react";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  "https://glowsuite-production.up.railway.app";

const MOCK_STAFF = [
  {
    id: "mock-1",
    name: "Priya Sharma",
    role: "Senior Stylist",
    email: "priya@hyfy.in",
    phone: "+91 98000 11111",
    status: "active",
  },
  {
    id: "mock-2",
    name: "Rahul Verma",
    role: "Colorist",
    email: "rahul@hyfy.in",
    phone: "+91 98000 22222",
    status: "active",
  },
  {
    id: "mock-3",
    name: "Sneha Joshi",
    role: "Nail Technician",
    email: "sneha@hyfy.in",
    phone: "+91 98000 33333",
    status: "inactive",
  },
];

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStaff() {
      setLoading(true);
      setError(null);

      try {
        // Root cause 1 fix: SERVER_URL always has a value (fallback above).
        // Log it in dev so you can confirm which URL is actually used.
        if (import.meta.env.DEV) {
          console.log("[StaffManager] Fetching from:", SERVER_URL);
        }

        const token = localStorage.getItem("auth_token") || "";
        const res = await fetch(`${SERVER_URL}/api/staff`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Normalise: Railway might return { staff: [...] } OR just [...]
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.staff)
          ? data.staff
          : [];

        if (cancelled) return;

        // Root cause 3 fix: treat an empty list the same as a failed fetch.
        if (list.length === 0) {
          console.warn(
            "[StaffManager] API returned empty list — using mock data"
          );
          setStaff(MOCK_STAFF);
          setUsingMock(true);
        } else {
          setStaff(list);
          setUsingMock(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[StaffManager] Fetch failed:", err.message);
        setError(err.message);
        // Root cause 2 fix + Root cause 3 fix: always fall back to mock data
        // so the page is never blank.
        setStaff(MOCK_STAFF);
        setUsingMock(true);
      } finally {
        // Root cause 2 fix: loading MUST be cleared in finally so the
        // component never stays stuck in a spinner state.
        if (!cancelled) setLoading(false);
      }
    }

    loadStaff();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 mr-2"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Loading staff…
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Banner shown when falling back to mock / offline data */}
      {usingMock && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <span>⚠</span>
          <span>
            {error
              ? `Could not reach the server (${error}). Showing sample data.`
              : "No staff found on the server. Showing sample data."}
          </span>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Staff — Hyfy Salon</h2>

      {staff.length === 0 ? (
        // This branch should never be reached now, but kept as a safety net.
        <p className="text-gray-400 text-sm">No staff members to display.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <StaffCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffCard({ member }) {
  const isActive = member.status === "active";
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{member.name}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <span className="text-sm text-gray-500">{member.role}</span>
      {member.email && (
        <span className="text-xs text-gray-400 truncate">{member.email}</span>
      )}
      {member.phone && (
        <span className="text-xs text-gray-400">{member.phone}</span>
      )}
    </div>
  );
}
