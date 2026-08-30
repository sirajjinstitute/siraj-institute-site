/* The Amiri faces only below-the-fold content needs load from a separate
   stylesheet that index.html links with media="print", so the browser fetches
   none of them until this switches it on. That keeps 128 KB -- the Arabic
   subsets plus Amiri 400 Latin, which nothing above the fold asks for -- off
   the wire while the hero logo, the LCP element, is still being fetched and
   painted.

   The trigger is the visitor moving toward the Arabic, never a timer. The
   load event is not a safe boundary: it fires around 2.0 s here while
   Production LCP is 4.5 s, so loading on load could still land inside the LCP
   window. A visitor who never scrolls never fetches the face at all.

   Two triggers, whichever comes first, because they cover different gestures:

     * the first sign of the visitor moving: touchstart/pointerdown/wheel/
       keydown, which land at the start of the gesture, before the page has
       moved at all, plus scroll for anything programmatic. This gives the
       download the whole distance to the Arabic as runway. #about sits
       1,544-2,617 px below the fold across 320-1280 px.
     * an IntersectionObserver on #about with a 1,000 px root margin, as a
       backstop for arriving already scrolled or jumping straight to #about.
       1,000 px is below the smallest of those gaps, so it cannot fire on
       arrival at any width.

   Browsers without IntersectionObserver switch the stylesheet on immediately,
   preferring correct Arabic over the saving. index.html also carries a
   <noscript> copy of the link for a visitor without JavaScript. */
(function () {
  var links = document.querySelectorAll('link[data-late-css]');
  if (!links.length) return;

  var target = document.getElementById('about');
  var observer = null;
  var applied = false;

  var MOVE_EVENTS = ['touchstart', 'pointerdown', 'wheel', 'keydown', 'scroll'];

  function applyArabicFaces() {
    if (applied) return;
    applied = true;
    for (var i = 0; i < MOVE_EVENTS.length; i++) {
      window.removeEventListener(MOVE_EVENTS[i], applyArabicFaces);
    }
    if (observer) observer.disconnect();
    for (var j = 0; j < links.length; j++) links[j].media = 'all';
  }

  if (!target || typeof IntersectionObserver !== 'function') {
    applyArabicFaces();
    return;
  }

  observer = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) { applyArabicFaces(); return; }
    }
  }, { rootMargin: '1000px 0px' });
  observer.observe(target);

  for (var e = 0; e < MOVE_EVENTS.length; e++) {
    window.addEventListener(MOVE_EVENTS[e], applyArabicFaces, { passive: true });
  }
})();

/* Siraj Institute — page behaviour.
   Moved out of index.html in Wave 1B. Loaded with `defer`, so it still runs
   against a fully-parsed DOM exactly as the end-of-body inline block did.
   Wave 1B moved it verbatim; the accessibility wave since rewrote the program
   tabs and the pricing selectors (see the comments on each). Pricing amounts,
   discounts and calculations are untouched. */

document.getElementById('year').textContent = new Date().getFullYear();

/* WhatsApp trial-booking links */
const waNumber = '201004751455';
const waMessage = "Assalamu alaikum, I'm interested in booking a free trial lesson with Siraj Institute.";
const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
document.querySelectorAll('.wa-link').forEach(el => el.setAttribute('href', waLink));

/* GA4 funnel events. The existing deferred analytics bootstrap defines
   window.gtag before a visitor can interact; this helper deliberately no-ops
   if analytics is unavailable so tracking can never break page behaviour. */
const trackEvent = (name, parameters = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, parameters);
  }
};

const analyticsLocation = el => {
  if (el.id === 'waFloat' || el.closest('#waFloat')) return 'floating_whatsapp';
  if (el.closest('.site-nav')) return 'navigation';
  if (el.closest('.hero')) return 'hero';
  if (el.closest('footer')) return 'footer';
  const section = el.closest('section[id]');
  return section ? section.id : 'page';
};

document.addEventListener('click', event => {
  const link = event.target.closest && event.target.closest('a');
  if (!link) return;

  const ctaLocation = analyticsLocation(link);
  const linkText = (link.textContent || '').trim().replace(/\s+/g, ' ')
    || link.getAttribute('aria-label')
    || '';

  if (link.classList.contains('wa-link')) {
    const parameters = { cta_location: ctaLocation, link_text: linkText.slice(0, 100) };
    trackEvent('book_trial_click', parameters);
    trackEvent('whatsapp_click', parameters);
  }

  if (link.matches('a[href^="https://siraj-lms.vercel.app/login"]')) {
    trackEvent('login_click', { cta_location: ctaLocation });
  }
});

const pricingSection = document.getElementById('pricing');
if (pricingSection && typeof IntersectionObserver === 'function') {
  const pricingObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      trackEvent('view_pricing');
      pricingObserver.disconnect();
    }
  }, { threshold: 0.25 });
  pricingObserver.observe(pricingSection);
}


/* show floating WhatsApp button after a short scroll */
const waFloat = document.getElementById('waFloat');
const revealWa = () => {
  if (window.scrollY > 260) waFloat.classList.add('show');
  else waFloat.classList.remove('show');
};
revealWa();
window.addEventListener('scroll', revealWa, { passive: true });

/* privacy-friendly YouTube façade: no YouTube request until activation */
const videoFacade = document.querySelector('.video-facade');
if (videoFacade) {
  videoFacade.addEventListener('click', () => {
    const videoId = videoFacade.dataset.videoId;
    trackEvent('video_play', {
      video_id: videoId,
      video_title: 'Siraj Institute — Why families choose us',
    });
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = 'Siraj Institute — Why families choose us';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    videoFacade.replaceWith(iframe);
  }, { once: true });
}

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

/* Program tabs -- WAI-ARIA Authoring Practices tabs pattern (Wave 1 a11y).
   Automatic activation: the roadmaps are already in the DOM and cost nothing
   to reveal, so moving focus selects. Selection state lives in one place
   (selectTab) and drives aria-selected, the roving tabindex, the .active
   classes the stylesheet reads, and the panels' hidden attribute together,
   so the visual state and the accessibility tree can never disagree. */
const tabList = document.querySelector('.tabbar[role="tablist"]');
if (tabList) {
  const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));

  const selectTab = (tab, moveFocus, interaction) => {
    const changed = tab.getAttribute('aria-selected') !== 'true';
    tabs.forEach(t => {
      const selected = t === tab;
      t.classList.toggle('active', selected);
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) {
        panel.classList.toggle('active', selected);
        panel.hidden = !selected;
      }
    });
    if (moveFocus) tab.focus();
    if (changed && interaction) {
      trackEvent('select_program', {
        program_name: tab.textContent.trim(),
        interaction,
      });
    }
  };

  /* Delegated, so mouse and touch keep behaving exactly as before. A click
     already focuses the button, so selectTab must not focus it again. */
  tabList.addEventListener('click', e => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) selectTab(tab, false, 'click');
  });

  tabList.addEventListener('keydown', e => {
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    let next;
    if (e.key === 'ArrowLeft')       next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'Home')       next = 0;
    else if (e.key === 'End')        next = tabs.length - 1;
    else return;
    e.preventDefault();           // stop Home/End from scrolling the page
    selectTab(tabs[next], true, 'keyboard');
  });
}

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

/* The two pricing selectors are native radio groups (Wave 1 a11y), so the
   browser owns exclusivity, the checked state and arrow-key navigation, and
   the stylesheet owns the active pill via :checked. All that is left here is
   reading the chosen value. The values are the same strings the data-*
   attributes carried, and they index plans/durations exactly as before, so
   no price, discount or calculation changes. */
const onChoice = (selector, apply) => {
  document.querySelectorAll(selector).forEach(input => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      apply(input.value);
      renderPricing(currentStudents, currentDuration);
    });
  });
};

onChoice('.student-choice .choice-input', value => { currentStudents = value; });
onChoice('.duration-choice .choice-input', value => { currentDuration = value; });
