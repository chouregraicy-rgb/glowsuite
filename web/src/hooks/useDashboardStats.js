import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * useDashboardStats — fetches all real data for the Owner Dashboard
 * Returns: stats, appointments, leads, staff, loading, error, refresh
 */
export function useDashboardStats() {
  const { salonId, currencySymbol } = useAuth()
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [stats, setStats]           = useState({
    todayRevenue: 0, revenueChange: 0,
    clientsServed: 0, walkIns: 0,
    openLeads: 0, hotLeads: 0,
    staffOnDuty: 0, staffTotal: 0, absentCount: 0
  })
  const [appointments, setAppointments] = useState([])
  const [leads, setLeads]               = useState([])
  const [staff, setStaff]               = useState([])

  useEffect(() => {
    if (!salonId) return
    fetchAll()
  }, [salonId])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchStats(),
        fetchAppointments(),
        fetchLeads(),
        fetchStaff(),
      ])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Today's revenue + clients from invoices ───────────────────
  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Today's invoices
    const { data: todayInvoices } = await supabase
      .from('invoices')
      .select('total, payment_mode')
      .eq('salon_id', salonId)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59')
      .eq('status', 'paid')

    // Yesterday's invoices for comparison
    const { data: yestInvoices } = await supabase
      .from('invoices')
      .select('total')
      .eq('salon_id', salonId)
      .gte('created_at', yesterday + 'T00:00:00')
      .lte('created_at', yesterday + 'T23:59:59')
      .eq('status', 'paid')

    const todayRevenue = (todayInvoices || []).reduce((s, i) => s + (i.total || 0), 0)
    const yestRevenue  = (yestInvoices  || []).reduce((s, i) => s + (i.total || 0), 0)
    const revenueChange = yestRevenue > 0
      ? Math.round(((todayRevenue - yestRevenue) / yestRevenue) * 100)
      : 0

    const walkIns = (todayInvoices || []).filter(i => i.payment_mode === 'cash').length

    // Open leads
    const { count: openLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .in('status', ['new', 'contacted', 'appointment_set'])

    const { count: hotLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .eq('status', 'appointment_set')

    // Staff counts
    const { data: allStaff } = await supabase
      .from('employees')
      .select('id, status')
      .eq('salon_id', salonId)
      .eq('status', 'active')

    // Today's attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('employee_id, status')
      .eq('salon_id', salonId)
      .eq('date', today)

    const presentIds = new Set(
      (attendance || []).filter(a => a.status === 'present' || a.status === 'half').map(a => a.employee_id)
    )
    const absentCount = (allStaff || []).filter(s => !presentIds.has(s.id)).length

    setStats({
      todayRevenue,
      revenueChange,
      clientsServed: (todayInvoices || []).length,
      walkIns,
      openLeads: openLeads || 0,
      hotLeads: hotLeads || 0,
      staffOnDuty: (allStaff || []).length - absentCount,
      staffTotal: (allStaff || []).length,
      absentCount,
    })
  }

  // ── Today's appointments ──────────────────────────────────────
  async function fetchAppointments() {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, start_time, status, service_name, amount,
        client_token,
        employees ( name )
      `)
      .eq('salon_id', salonId)
      .eq('date', today)
      .order('start_time', { ascending: true })
      .limit(8)

    if (error) throw error
    setAppointments(data || [])
  }

  // ── Recent leads ──────────────────────────────────────────────
  async function fetchLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, source, status, created_at, phone')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) throw error

    // Mask phone for display
    const masked = (data || []).map(l => ({
      ...l,
      phone: l.phone
        ? '+' + l.phone.replace(/\D/g,'').slice(0,2) + ' XXXXX' + l.phone.replace(/\D/g,'').slice(-4)
        : null
    }))
    setLeads(masked)
  }

  // ── Staff on duty ─────────────────────────────────────────────
  async function fetchStaff() {
    const today = new Date().toISOString().split('T')[0]

    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, role, specializations, base_salary, incentive_rate')
      .eq('salon_id', salonId)
      .eq('status', 'active')
      .limit(6)

    if (error) throw error

    // Today's revenue per employee from invoices
    const { data: todayInvoices } = await supabase
      .from('invoices')
      .select('employee_id, total')
      .eq('salon_id', salonId)
      .gte('created_at', today + 'T00:00:00')

    const revenueByEmp = {}
    ;(todayInvoices || []).forEach(inv => {
      revenueByEmp[inv.employee_id] = (revenueByEmp[inv.employee_id] || 0) + (inv.total || 0)
    })

    // Attendance status
    const { data: attendance } = await supabase
      .from('attendance')
      .select('employee_id, status, check_in')
      .eq('salon_id', salonId)
      .eq('date', today)

    const attByEmp = {}
    ;(attendance || []).forEach(a => { attByEmp[a.employee_id] = a })

    const enriched = (employees || []).map(emp => ({
      ...emp,
      todayRevenue: revenueByEmp[emp.id] || 0,
      attendance: attByEmp[emp.id]?.status || 'absent',
      checkIn: attByEmp[emp.id]?.check_in || null,
      initials: emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    }))

    setStaff(enriched)
  }

  return { stats, appointments, leads, staff, loading, error, refresh: fetchAll, currencySymbol }
}
