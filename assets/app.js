/* Siraj Institute — page behaviour.
   Moved verbatim out of index.html (Wave 1B). Loaded with `defer`, so it
   still runs against a fully-parsed DOM exactly as the end-of-body inline
   block did. No logic was changed. */

document.getElementById('year').textContent = new Date().getFullYear();

/* WhatsApp trial-booking links */
const waNumber = '201004751455';
const waMessage = "Assalamu alaikum, I'm interested in booking a free trial lesson with Siraj Institute.";
const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
document.querySelectorAll('.wa-link').forEach(el => el.setAttribute('href', waLink));

/* show floating WhatsApp button after a short scroll */
const waFloat = document.getElementById('waFloat');
const revealWa = () => {
  if (window.scrollY > 260) waFloat.classList.add('show');
  else waFloat.classList.remove('show');
};
revealWa();
window.addEventListener('scroll', revealWa, { passive: true });

/* mobile menu */
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', false);
}));

/* hero light motes */
const motesEl = document.getElementById('motes');
const moteCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 22;
for (let i = 0; i < moteCount; i++) {
  const m = document.createElement('span');
  m.className = 'mote';
  const size = 2 + Math.random() * 4;
  m.style.width = size + 'px';
  m.style.height = size + 'px';
  m.style.left = (10 + Math.random() * 80) + '%';
  m.style.bottom = (Math.random() * 40) + '%';
  m.style.animationDuration = (6 + Math.random() * 8) + 's';
  m.style.animationDelay = (Math.random() * 8) + 's';
  motesEl.appendChild(m);
}

/* program tabs */
const tabButtons = document.querySelectorAll('.tabbar button');
const roadmaps = document.querySelectorAll('.roadmap');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    roadmaps.forEach(r => r.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* pricing */
const plans = {
  1: { label: '1', prices: [35.90, 53.90, 71.90, 89.90], note: '' },
  2: { label: '2', prices: [31.90, 47.90, 63.90, 79.90], note: '10% off' },
  3: { label: '3', prices: [30.90, 45.90, 60.90, 76.90], note: '15% off' },
  4: { label: '4', prices: [28.90, 42.90, 57.90, 71.90], note: '20% off' },
};
const packageInfo = [
  { classes: '2 Classes / Week', hours: '4 Hours / Month', monthlyHours: 4, note: 'Ideal for light review' },
  { classes: '3 Classes / Week', hours: '6 Hours / Month', monthlyHours: 6, note: 'Most popular & recommended ⭐', popular: true },
  { classes: '4 Classes / Week', hours: '8 Hours / Month', monthlyHours: 8, note: 'For fast, intensive progress' },
  { classes: '5 Classes / Week', hours: '10 Hours / Month', monthlyHours: 10, note: 'For a highly intensive Quranic track' },
];
const durations = {
  monthly:     { months: 1,  label: 'Monthly',     pct: 0 },
  quarterly:   { months: 3,  label: 'Quarterly',   pct: 0.05 },
  semiannual:  { months: 6,  label: 'Semi-Annual', pct: 0.10 },
  annual:      { months: 12, label: 'Annual',      pct: 0.15 },
};
const priceGrid = document.getElementById('priceGrid');
let currentStudents = 1;
let currentDuration = 'monthly';

function renderPricing(students, durationKey) {
  const basePrices = plans[1].prices;      // 1-student, no-discount reference rate
  const qtyPlan = plans[students];
  const dur = durations[durationKey];

  priceGrid.innerHTML = packageInfo.map((pkg, i) => {
    const basePrice = basePrices[i];
    const qtyPrice = qtyPlan.prices[i];
    const qtyDiscountPct = 1 - (qtyPrice / basePrice);
    const durDiscountPct = dur.pct;

    // Biggest discount wins — never stacked.
    const effectiveDiscountPct = Math.max(qtyDiscountPct, durDiscountPct);
    const monthlyPrice = basePrice * (1 - effectiveDiscountPct);
    const totalBilled = monthlyPrice * dur.months;

    const usingQtyDiscount = qtyDiscountPct >= durDiscountPct;
    const discountPctLabel = Math.round(effectiveDiscountPct * 100);
    const totalHours = pkg.monthlyHours * dur.months;
    let billedLine;
    if (dur.months === 1) {
      billedLine = discountPctLabel > 0
        ? `Family discount applied (${discountPctLabel}% off)`
        : '';
    } else {
      const discountSource = usingQtyDiscount ? 'Family' : dur.label;
      billedLine = `Billed $${totalBilled.toFixed(2)} every ${dur.months} months (${totalHours} teaching hours) · ${discountSource} discount applied (Save ${discountPctLabel}%)`;
    }

    return `
    <div class="price-card ${pkg.popular ? 'popular' : ''}">
      ${pkg.popular ? '<span class="badge">Most Popular</span>' : ''}
      <div class="freq">${pkg.classes}</div>
      <div class="hrs">${pkg.hours}</div>
      <div class="amount">$${monthlyPrice.toFixed(2)}<span>/month</span></div>
      <div class="note">${pkg.note}</div>
      ${billedLine ? `<div class="billed">${billedLine}</div>` : ''}
    </div>`;
  }).join('');
}

renderPricing(currentStudents, currentDuration);

document.querySelectorAll('.student-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.student-tabs button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    currentStudents = btn.dataset.students;
    renderPricing(currentStudents, currentDuration);
  });
});

document.querySelectorAll('.duration-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-tabs button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    currentDuration = btn.dataset.duration;
    renderPricing(currentStudents, currentDuration);
  });
});
