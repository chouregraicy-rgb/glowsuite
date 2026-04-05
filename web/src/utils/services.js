// ─── GLOWSUITE COMPLETE SERVICE CATALOG ──────────────────────────────────────
// Used across Appointments, Billing, Packages, Reports modules
// Prices are base prices — owner can customize per salon

export const SERVICE_CATEGORIES = [
  { id: 'hair',     label: 'Hair',           icon: '✂️',  color: '#8B3A52', bg: '#FDF0F3' },
  { id: 'skin',     label: 'Skin & Facial',  icon: '✨',  color: '#185FA5', bg: '#E6F1FB' },
  { id: 'spa',      label: 'Spa & Wellness', icon: '🧖',  color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'nails',    label: 'Nails',          icon: '💅',  color: '#BA7517', bg: '#FAEEDA' },
  { id: 'bridal',   label: 'Bridal',         icon: '👑',  color: '#533AB7', bg: '#EEEDFE' },
  { id: 'makeup',   label: 'Makeup',         icon: '💄',  color: '#993C1D', bg: '#FAECE7' },
  { id: 'massage',  label: 'Massage',        icon: '💆',  color: '#3B6D11', bg: '#EAF3DE' },
  { id: 'wellness', label: 'Wellness',       icon: '🌿',  color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'mens',     label: "Men's Grooming", icon: '💈',  color: '#185FA5', bg: '#E6F1FB' },
  { id: 'other',    label: 'Other',          icon: '⭐',  color: '#6B6258', bg: '#F8F5F0' },
]

export const ALL_SERVICES = [
  // ── HAIR ──────────────────────────────────────────────────────────────────
  { id: 'h1',  category: 'hair',    name: 'Haircut + Style',           duration: 45,  price: 800,   popular: true },
  { id: 'h2',  category: 'hair',    name: 'Hair Color (Global)',        duration: 90,  price: 3500,  popular: true },
  { id: 'h3',  category: 'hair',    name: 'Balayage / Highlights',     duration: 150, price: 6500,  popular: true },
  { id: 'h4',  category: 'hair',    name: 'Keratin Treatment',         duration: 180, price: 7000,  popular: true },
  { id: 'h5',  category: 'hair',    name: 'Hair Spa',                  duration: 60,  price: 2000,  popular: false },
  { id: 'h6',  category: 'hair',    name: 'Smoothening Treatment',     duration: 180, price: 8000,  popular: false },
  { id: 'h7',  category: 'hair',    name: 'Scalp Treatment',           duration: 60,  price: 2500,  popular: false },
  { id: 'h8',  category: 'hair',    name: 'Hair Extensions',           duration: 120, price: 12000, popular: false },
  { id: 'h9',  category: 'hair',    name: 'Blowout + Styling',         duration: 45,  price: 1200,  popular: true },
  { id: 'h10', category: 'hair',    name: 'Olaplex Treatment',         duration: 90,  price: 4500,  popular: false },
  { id: 'h11', category: 'hair',    name: 'Hair Botox',                duration: 120, price: 6000,  popular: false },
  { id: 'h12', category: 'hair',    name: 'Dandruff Treatment',        duration: 60,  price: 1800,  popular: false },

  // ── SKIN & FACIAL ─────────────────────────────────────────────────────────
  { id: 's1',  category: 'skin',    name: 'Basic Facial + Cleanup',    duration: 60,  price: 1500,  popular: true },
  { id: 's2',  category: 'skin',    name: 'Deep Cleansing Facial',     duration: 75,  price: 2500,  popular: true },
  { id: 's3',  category: 'skin',    name: 'Anti-Ageing Facial',        duration: 90,  price: 4500,  popular: false },
  { id: 's4',  category: 'skin',    name: 'Brightening Facial',        duration: 75,  price: 3500,  popular: true },
  { id: 's5',  category: 'skin',    name: 'Gold / Pearl Facial',       duration: 90,  price: 4000,  popular: false },
  { id: 's6',  category: 'skin',    name: 'Microdermabrasion',         duration: 60,  price: 5000,  popular: false },
  { id: 's7',  category: 'skin',    name: 'Chemical Peel',             duration: 45,  price: 4000,  popular: false },
  { id: 's8',  category: 'skin',    name: 'Detan + Bleach',            duration: 60,  price: 1800,  popular: true },
  { id: 's9',  category: 'skin',    name: 'Hydra Facial',              duration: 60,  price: 6000,  popular: true },
  { id: 's10', category: 'skin',    name: 'Acne Treatment',            duration: 75,  price: 3000,  popular: false },
  { id: 's11', category: 'skin',    name: 'Threading (Eyebrow)',       duration: 15,  price: 100,   popular: true },
  { id: 's12', category: 'skin',    name: 'Full Face Waxing',          duration: 30,  price: 600,   popular: true },

  // ── SPA & BODY ────────────────────────────────────────────────────────────
  { id: 'sp1', category: 'spa',     name: 'Full Body Polishing',       duration: 90,  price: 4500,  popular: true },
  { id: 'sp2', category: 'spa',     name: 'Body Wrap Treatment',       duration: 90,  price: 5000,  popular: false },
  { id: 'sp3', category: 'spa',     name: 'De-Tan Body Treatment',     duration: 60,  price: 3000,  popular: true },
  { id: 'sp4', category: 'spa',     name: 'Signature Spa Package',     duration: 180, price: 9000,  popular: true },
  { id: 'sp5', category: 'spa',     name: 'Foot Reflexology',          duration: 45,  price: 2000,  popular: true },
  { id: 'sp6', category: 'spa',     name: 'Back Treatment',            duration: 60,  price: 2500,  popular: false },
  { id: 'sp7', category: 'spa',     name: 'Couple Spa Package',        duration: 180, price: 18000, popular: true },
  { id: 'sp8', category: 'spa',     name: 'Exfoliation Scrub',         duration: 60,  price: 3500,  popular: false },
  { id: 'sp9', category: 'spa',     name: 'Pre-Wedding Glow Package',  duration: 240, price: 15000, popular: true },
  { id: 'sp10',category: 'spa',     name: 'Detox Spa',                 duration: 120, price: 6000,  popular: false },

  // ── MASSAGE ───────────────────────────────────────────────────────────────
  { id: 'm1',  category: 'massage', name: 'Swedish Massage',           duration: 60,  price: 3000,  popular: true },
  { id: 'm2',  category: 'massage', name: 'Deep Tissue Massage',       duration: 60,  price: 3500,  popular: true },
  { id: 'm3',  category: 'massage', name: 'Hot Stone Massage',         duration: 90,  price: 5000,  popular: true },
  { id: 'm4',  category: 'massage', name: 'Aromatherapy Massage',      duration: 75,  price: 4000,  popular: false },
  { id: 'm5',  category: 'massage', name: 'Head & Scalp Massage',      duration: 30,  price: 1500,  popular: true },
  { id: 'm6',  category: 'massage', name: 'Pregnancy Massage',         duration: 60,  price: 3500,  popular: false },
  { id: 'm7',  category: 'massage', name: 'Thai Massage',              duration: 90,  price: 4500,  popular: false },
  { id: 'm8',  category: 'massage', name: 'Balinese Massage',          duration: 90,  price: 5000,  popular: false },
  { id: 'm9',  category: 'massage', name: 'Foot + Leg Massage',        duration: 45,  price: 2000,  popular: true },
  { id: 'm10', category: 'massage', name: 'Back + Shoulder Massage',   duration: 45,  price: 2500,  popular: true },

  // ── NAILS ─────────────────────────────────────────────────────────────────
  { id: 'n1',  category: 'nails',   name: 'Manicure (Basic)',          duration: 30,  price: 600,   popular: true },
  { id: 'n2',  category: 'nails',   name: 'Pedicure (Basic)',          duration: 45,  price: 800,   popular: true },
  { id: 'n3',  category: 'nails',   name: 'Gel Manicure',              duration: 60,  price: 1800,  popular: true },
  { id: 'n4',  category: 'nails',   name: 'Gel Pedicure',              duration: 75,  price: 2000,  popular: true },
  { id: 'n5',  category: 'nails',   name: 'Nail Art (per nail)',       duration: 30,  price: 100,   popular: true },
  { id: 'n6',  category: 'nails',   name: 'Acrylic / Gel Extensions',  duration: 90,  price: 3500,  popular: true },
  { id: 'n7',  category: 'nails',   name: 'Nail Repair',               duration: 20,  price: 200,   popular: false },
  { id: 'n8',  category: 'nails',   name: 'Chrome / Mirror Nails',     duration: 60,  price: 2500,  popular: false },
  { id: 'n9',  category: 'nails',   name: 'Spa Manicure + Pedicure',   duration: 90,  price: 3000,  popular: true },
  { id: 'n10', category: 'nails',   name: 'Russian Manicure',          duration: 75,  price: 2800,  popular: false },

  // ── MAKEUP ────────────────────────────────────────────────────────────────
  { id: 'mk1', category: 'makeup',  name: 'Party Makeup',              duration: 60,  price: 3000,  popular: true },
  { id: 'mk2', category: 'makeup',  name: 'Bridal Makeup (Trial)',     duration: 90,  price: 5000,  popular: true },
  { id: 'mk3', category: 'makeup',  name: 'Bridal Makeup (D-Day)',     duration: 120, price: 15000, popular: true },
  { id: 'mk4', category: 'makeup',  name: 'Airbrush Makeup',           duration: 75,  price: 6000,  popular: true },
  { id: 'mk5', category: 'makeup',  name: 'HD Makeup',                 duration: 90,  price: 8000,  popular: false },
  { id: 'mk6', category: 'makeup',  name: 'Natural / No-Makeup Look',  duration: 45,  price: 2500,  popular: false },
  { id: 'mk7', category: 'makeup',  name: 'Saree Draping + Makeup',    duration: 90,  price: 4000,  popular: true },

  // ── BRIDAL ────────────────────────────────────────────────────────────────
  { id: 'br1', category: 'bridal',  name: 'Complete Bridal Package',   duration: 360, price: 45000, popular: true },
  { id: 'br2', category: 'bridal',  name: 'Pre-Bridal Package (3 sessions)', duration: 240, price: 18000, popular: true },
  { id: 'br3', category: 'bridal',  name: 'Bridal Hair + Makeup',      duration: 180, price: 18000, popular: true },
  { id: 'br4', category: 'bridal',  name: 'Mehendi (Full Hands)',       duration: 120, price: 3500,  popular: true },
  { id: 'br5', category: 'bridal',  name: 'Groom Package',             duration: 120, price: 8000,  popular: true },
  { id: 'br6', category: 'bridal',  name: 'Bridesmaids Package (5 pax)',duration: 300, price: 25000, popular: false },

  // ── WELLNESS ──────────────────────────────────────────────────────────────
  { id: 'w1',  category: 'wellness',name: 'Stress Relief Session',     duration: 90,  price: 4000,  popular: false },
  { id: 'w2',  category: 'wellness',name: 'Detox Wrap + Massage',      duration: 120, price: 6000,  popular: false },
  { id: 'w3',  category: 'wellness',name: 'Vitamin C Infusion Facial', duration: 60,  price: 5500,  popular: false },
  { id: 'w4',  category: 'wellness',name: 'Lymphatic Drainage',        duration: 60,  price: 4500,  popular: false },

  // ── MEN'S GROOMING ────────────────────────────────────────────────────────
  { id: 'mg1', category: 'mens',    name: "Men's Haircut",             duration: 30,  price: 500,   popular: true },
  { id: 'mg2', category: 'mens',    name: 'Beard Trim + Shape',        duration: 20,  price: 300,   popular: true },
  { id: 'mg3', category: 'mens',    name: "Men's Facial",              duration: 45,  price: 1500,  popular: true },
  { id: 'mg4', category: 'mens',    name: 'Head Massage',              duration: 30,  price: 800,   popular: true },
  { id: 'mg5', category: 'mens',    name: 'Shave + Cleanup',           duration: 30,  price: 600,   popular: true },
  { id: 'mg6', category: 'mens',    name: "Men's Pedicure",            duration: 40,  price: 900,   popular: false },
  { id: 'mg7', category: 'mens',    name: 'Groom Full Package',        duration: 120, price: 5000,  popular: true },

  // ── OTHER ─────────────────────────────────────────────────────────────────
  { id: 'o1',  category: 'other',   name: 'Consultation',              duration: 30,  price: 500,   popular: false },
  { id: 'o2',  category: 'other',   name: 'Product Purchase',          duration: 10,  price: 0,     popular: false },
]

// Helper — get services by category
export function getServicesByCategory(categoryId) {
  if (categoryId === 'all') return ALL_SERVICES
  return ALL_SERVICES.filter(s => s.category === categoryId)
}

// Helper — get popular services
export function getPopularServices() {
  return ALL_SERVICES.filter(s => s.popular)
}

// Helper — search services
export function searchServices(query) {
  const q = query.toLowerCase()
  return ALL_SERVICES.filter(s => s.name.toLowerCase().includes(q))
}

// Helper — get category info
export function getCategoryInfo(categoryId) {
  return SERVICE_CATEGORIES.find(c => c.id === categoryId) || SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1]
}
