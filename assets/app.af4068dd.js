/* Suqya Institute landing page behaviour. Loaded with `defer`.
   Everything here is progressive: without script the page still reads in
   full, the pricing shows its one-learner monthly figures and the portal
   demo shows its first screen of each role. */

/* Amiri's Arabic subsets load from a separate stylesheet linked with
   media="print", so none of their ~108 KB is fetched until this switches it
   on: at the visitor's first move (touch, pointer, wheel, key, scroll) or
   when the first Arabic text comes within 1,000 px, whichever is first.
   Browsers without IntersectionObserver switch it on at once, preferring
   correct Arabic over the saving. */
(function () {
  var links = document.querySelectorAll('link[data-late-css]');
  if (!links.length) return;
  var target = document.querySelector('.ar');
  var observer = null;
  var applied = false;
  var MOVE_EVENTS = ['touchstart', 'pointerdown', 'wheel', 'keydown', 'scroll'];
  function applyArabicFaces() {
    if (applied) return;
    applied = true;
    for (var i = 0; i < MOVE_EVENTS.length; i++) window.removeEventListener(MOVE_EVENTS[i], applyArabicFaces);
    if (observer) observer.disconnect();
    for (var j = 0; j < links.length; j++) links[j].media = 'all';
  }
  if (!target || typeof IntersectionObserver !== 'function') { applyArabicFaces(); return; }
  observer = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) if (entries[i].isIntersecting) { applyArabicFaces(); return; }
  }, { rootMargin: '1000px 0px' });
  observer.observe(target);
  for (var e = 0; e < MOVE_EVENTS.length; e++) window.addEventListener(MOVE_EVENTS[e], applyArabicFaces, { passive: true });
})();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('year').textContent = new Date().getFullYear();

/* WhatsApp trial-booking links */
const waNumber = '201004751455';
const waMessage = "Assalamu alaikum, I'm interested in booking a free trial lesson with Suqya Institute.";
const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
document.querySelectorAll('.wa-link').forEach(el => el.setAttribute('href', waLink));

/* GA4 funnel events. The deferred analytics bootstrap defines window.gtag
   before a visitor can interact; this helper no-ops if analytics is
   unavailable, so tracking can never break page behaviour. */
const trackEvent = (name, parameters = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, parameters);
  }
};

const analyticsLocation = el => {
  if (el.id === 'waFloat' || el.closest('#waFloat')) return 'floating_whatsapp';
  if (el.closest('.nav')) return 'navigation';
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
    // Anonymous operational signal. Contact opens even if recording fails.
    if (event.isTrusted) {
      try {
        void fetch('/api/website-contact', {
          method: 'POST', mode: 'no-cors', credentials: 'omit', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: 'website-whatsapp'
        }).catch(() => {});
      } catch { /* Never block the WhatsApp link. */ }
    }
  }

  if (link.getAttribute('href') === '/apply') {
    trackEvent('apply_click', { cta_location: ctaLocation, link_text: linkText.slice(0, 100) });
  }

  if (link.matches('a[href="/login"]')) {
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

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
const setMenu = open => {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  document.getElementById('nav').classList.toggle('scrolled', open || window.scrollY > 40);
};
menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
});

/* The bar turns solid once the page leaves the hero; the floating
   WhatsApp button appears after a short scroll. */
const nav = document.getElementById('nav');
nav.classList.add('live');
const waFloat = document.getElementById('waFloat');
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40 || navLinks.classList.contains('open'));
  waFloat.classList.toggle('show', y > 320);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* Everything below waits for the first paint, so none of it can hold back
   the hero text (the LCP element). The static HTML is already complete:
   pricing shows its default figures and the demo its first screens. */
function initPage() {
  document.documentElement.classList.add('js');

  /* Gold motes rising through the hero, like light on water. Decorative,
     so none under reduced motion. */
  const motes = document.getElementById('motes');
  if (motes && !reduceMotion) {
    const count = window.innerWidth < 700 ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const m = document.createElement('span');
      const size = 3 + Math.random() * 7;
      m.className = 'mote';
      m.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;`
        + `animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 14}s;`
        + `--dx:${Math.round(Math.random() * 80 - 40)}px`;
      motes.appendChild(m);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Entrances: each section's parts rise in turn as the section enters. */
  /* Anything already on screen when this runs is shown at once, so      */
  /* nothing that was painted visible ever disappears.                   */
  /* ------------------------------------------------------------------ */
  const onEnter = (el, fn, options) => {
    if (typeof IntersectionObserver !== 'function') { fn(el); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { io.unobserve(entry.target); fn(entry.target); }
      });
    }, options || { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    io.observe(el);
  };

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const groups = new Map();
  reveals.forEach(el => {
    const group = el.closest('section') || document.body;
    if (!groups.has(group)) groups.set(group, []);
    const list = groups.get(group);
    el.style.setProperty('--d', `${Math.min(list.length, 5) * 80}ms`);
    list.push(el);
  });
  reveals.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('is-in');
    else onEnter(el, target => target.classList.add('is-in'));
  });

  /* Progress rings fill once they are seen. */
  const fillRings = scope => scope.querySelectorAll('.ring').forEach(ring => ring.classList.add('on'));

  /* A figure counts up the first time it is seen. */
  const countUp = el => {
    const to = Number(el.dataset.count);
    const fmt = n => n.toLocaleString('en-US');
    if (reduceMotion || !to) { el.textContent = fmt(to); return; }
    const start = performance.now();
    const dur = 1400;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  document.querySelectorAll('[data-count]').forEach(el => onEnter(el, countUp));

  /* The recitation waveform in the mosaic: drawn once, moves while visible. */
  const wave = document.querySelector('.wave');
  if (wave) {
    const ns = 'http://www.w3.org/2000/svg';
    const bars = 64;
    for (let i = 0; i < bars; i++) {
      const h = 8 + Math.round(40 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.17)));
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', String(i * 5));
      r.setAttribute('y', String((56 - h) / 2));
      r.setAttribute('width', '3');
      r.setAttribute('height', String(h));
      r.setAttribute('rx', '1.5');
      if (i > 38 && i < 50) r.setAttribute('class', 'hot');
      r.style.animationDelay = `${-(i % 9) * 0.18}s`;
      wave.appendChild(r);
    }
    onEnter(wave, el => el.classList.add('is-in'));
  }

  /* Which programme card led to the trial form. */
  document.querySelectorAll('.prog-link').forEach(a => a.addEventListener('click', () => {
    trackEvent('select_program', { program_name: a.closest('.prog-card').querySelector('h3').textContent.trim(), interaction: 'click' });
  }));

  /* Water and growth: animations run only while their drawing is on screen,
     so nothing loops out of sight. The first check runs now, so a drawing
     already in view keeps playing without a pause. */
  document.querySelectorAll('.anim').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in-view');
    if (typeof IntersectionObserver !== 'function') { el.classList.add('in-view'); return; }
    new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    }), { rootMargin: '80px 0px' }).observe(el);
  });

  /* ------------------------------------------------------------------ */
  /* Tabs: the WAI-ARIA tabs pattern, shared by both portal             */
  /* navigations. Automatic activation; arrow keys move in    */
  /* the list's orientation, Home/End jump to the ends.                   */
  /* ------------------------------------------------------------------ */
  const tabHandlers = {};
  document.querySelectorAll('[role="tablist"][data-tabs]').forEach(list => {
    const name = list.dataset.tabs;
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    const vertical = list.getAttribute('aria-orientation') === 'vertical';
    const select = (tab, moveFocus, interaction) => {
      const changed = tab.getAttribute('aria-selected') !== 'true';
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !on;
          if (on && changed) { panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter'); }
        }
      });
      if (moveFocus) tab.focus();
      if (changed && interaction) {
        if (tabHandlers[name]) tabHandlers[name](tab);
        trackEvent('demo_view', { demo_role: name, demo_screen: tab.textContent.trim(), interaction });
      }
    };
    list.addEventListener('click', e => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab, false, 'click');
    });
    list.addEventListener('keydown', e => {
      const current = tabs.indexOf(document.activeElement);
      if (current === -1) return;
      const prev = vertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft'];
      const next = vertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight'];
      let to;
      if (prev.includes(e.key)) to = (current - 1 + tabs.length) % tabs.length;
      else if (next.includes(e.key)) to = (current + 1) % tabs.length;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = tabs.length - 1;
      else return;
      e.preventDefault();
      select(tabs[to], true, 'keyboard');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Pricing. $14.99 per teaching hour. Each package is its monthly       */
  /* teaching hours at that rate. A family discount (by number of         */
  /* learners) and a billing-period discount are never stacked: the      */
  /* bigger one applies. Amounts are rounded to cents once, per month,    */
  /* and the billed total is that monthly figure times the months, so     */
  /* the two numbers shown always agree.                                  */
  /* ------------------------------------------------------------------ */
  /* pricing:begin */
  const HOURLY_RATE = 14.99;
  const packageInfo = [
    { classesPerWeek: 2, monthlyHours: 4 },
    { classesPerWeek: 3, monthlyHours: 6 },
    { classesPerWeek: 4, monthlyHours: 8 },
    { classesPerWeek: 5, monthlyHours: 10 },
  ];
  const familyDiscounts = { 1: 0, 2: 0.10, 3: 0.15, 4: 0.20 };
  const durations = {
    monthly:    { months: 1,  label: 'Monthly',     adverb: 'monthly',       pct: 0 },
    quarterly:  { months: 3,  label: 'Quarterly',   adverb: 'quarterly',     pct: 0.05 },
    semiannual: { months: 6,  label: 'Semi-annual', adverb: 'semi-annually', pct: 0.10 },
    annual:     { months: 12, label: 'Annual',      adverb: 'annually',      pct: 0.15 },
  };
  const toCents = amount => Math.round((amount + Number.EPSILON) * 100) / 100;
  const money = amount => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function quote(students, durationKey, pkg) {
    const dur = durations[durationKey];
    const family = familyDiscounts[students];
    const pct = Math.max(family, dur.pct);           // biggest discount wins, never stacked
    const source = pct === 0 ? 'none' : (family >= dur.pct ? 'family' : 'billing');
    const base = toCents(HOURLY_RATE * pkg.monthlyHours);
    const monthly = toCents(base * (1 - pct));
    const total = toCents(monthly * dur.months);
    const perHour = toCents(monthly / pkg.monthlyHours);
    return { pct, source, base, monthly, total, perHour, months: dur.months, hours: pkg.monthlyHours * dur.months };
  }
  /* pricing:end */

  const priceGrid = document.getElementById('priceGrid');
  const pricingLive = document.getElementById('pricingLive');
  let currentStudents = 1;
  let currentDuration = 'monthly';

  function renderPricing() {
    let summary;
    packageInfo.forEach(pkg => {
      const q = quote(currentStudents, currentDuration, pkg);
      const plan = priceGrid.querySelector(`.plan[data-hours="${pkg.monthlyHours}"]`);
      const pctLabel = Math.round(q.pct * 100);
      plan.querySelector('[data-price]').textContent = money(q.monthly);
      plan.querySelector('[data-per]').textContent = currentStudents > 1 ? '/month per learner' : '/month';
      plan.querySelector('[data-rate]').textContent = q.pct > 0 ? `${money(q.perHour)} (${pctLabel}% off ${money(HOURLY_RATE)})` : money(q.perHour);
      plan.querySelector('[data-billed]').textContent = q.months === 1
        ? 'Billed monthly'
        : `${money(q.total)} every ${q.months} months, ${q.hours} hours`;
      summary = q;
    });
    const learners = `${currentStudents} ${currentStudents === 1 ? 'learner' : 'learners'}`;
    const billed = durations[currentDuration].adverb;
    let reason = '';
    if (summary.source === 'family') reason = ` Family discount applied: ${Math.round(summary.pct * 100)}% off.`;
    if (summary.source === 'billing') reason = ` ${durations[currentDuration].label} discount applied: ${Math.round(summary.pct * 100)}% off.`;
    pricingLive.textContent = `Prices for ${learners}, billed ${billed}.${reason}`;
  }

  const onChoice = (selector, apply) => {
    document.querySelectorAll(selector).forEach(input => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        apply(input.value);
        renderPricing();
        trackEvent('select_pricing', { learners: currentStudents, billing: currentDuration });
      });
    });
  };
  onChoice('.student-choice .choice-input', value => { currentStudents = Number(value); });
  onChoice('.duration-choice .choice-input', value => { currentDuration = value; });
  const checkedStudents = document.querySelector('.student-choice .choice-input:checked');
  const checkedDuration = document.querySelector('.duration-choice .choice-input:checked');
  if (checkedStudents) currentStudents = Number(checkedStudents.value);
  if (checkedDuration) currentDuration = checkedDuration.value;
  renderPricing();

  /* ------------------------------------------------------------------ */
  /* The portal demo. Sample data only: nothing is stored or sent, no     */
  /* microphone is opened, and the "recordings" play silence.             */
  /* ------------------------------------------------------------------ */
  const app = document.getElementById('app');
  if (app) {
    const toastEl = document.getElementById('toast');
    let toastTimer;
    const toast = text => {
      toastEl.textContent = text;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
    };

    /* Dates are written relative to today, so the sample week is always this week. */
    const DAY = 86400000;
    const today = new Date();
    const formatters = new Map();
    const fmt = (d, opts) => {
      const key = JSON.stringify(opts);
      if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat('en-GB', opts));
      return formatters.get(key).format(d);
    };
    document.querySelectorAll('[data-rel-day]').forEach(el => {
      const n = Number(el.dataset.relDay);
      const d = new Date(today.getTime() + n * DAY);
      const kind = el.dataset.fmt || 'short';
      if (kind === 'week') {
        const back = (today.getDay() - 5 + 7) % 7;               // a week runs Friday to Thursday
        const friday = new Date(today.getTime() - back * DAY);
        el.textContent = `Week of ${fmt(friday, { weekday: 'short', day: 'numeric', month: 'short' })}`;
      } else if (n === 0 && kind === 'short') {
        el.textContent = 'Today';
      } else if (kind === 'long') {
        el.textContent = fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
      } else {
        el.textContent = fmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
      }
    });

    /* Role switch */
    const appStudent = document.getElementById('appStudent');
    const appParent = document.getElementById('appParent');
    document.querySelectorAll('input[name="role"]').forEach(input => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        const parent = input.value === 'parent';
        appStudent.hidden = parent;
        appParent.hidden = !parent;
        const shown = parent ? appParent : appStudent;
        shown.classList.remove('enter'); void shown.offsetWidth; shown.classList.add('enter');
        if (parent) fillRings(appParent);
        trackEvent('demo_role', { demo_role: input.value });
      });
    });
    appStudent.classList.add('pnl');
    appParent.classList.add('pnl');

    /* "Open homework" on the Today screen moves to that tab, as in the portal. */
    app.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => {
      const tab = document.getElementById(btn.dataset.goto);
      if (tab) { tab.click(); tab.focus(); }
    }));

    tabHandlers.parent = tab => {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) fillRings(panel);
    };

    /* Player: a silent stand-in that runs at four times speed. */
    let activePlayer = null;
    const stopPlayer = () => {
      if (!activePlayer) return;
      const { el, raf } = activePlayer;
      cancelAnimationFrame(raf);
      el.querySelector('.pbtn use').setAttribute('href', '#i-play');
      activePlayer = null;
    };
    const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    app.querySelectorAll('.player').forEach(el => {
      const total = Number(el.dataset.seconds) || 30;
      const btn = el.querySelector('.pbtn');
      const fill = el.querySelector('.pfill');
      const time = el.querySelector('.ptime');
      let pos = 0;
      btn.addEventListener('click', () => {
        if (activePlayer && activePlayer.el === el) { stopPlayer(); return; }
        stopPlayer();
        if (pos >= total) pos = 0;
        btn.querySelector('use').setAttribute('href', '#i-pause');
        let last = performance.now();
        const tick = now => {
          pos = Math.min(total, pos + ((now - last) / 1000) * 4);
          last = now;
          fill.style.setProperty('--pp', String(pos / total));
          time.textContent = clock(total - pos);
          if (pos >= total) { stopPlayer(); time.textContent = clock(total); return; }
          activePlayer.raf = requestAnimationFrame(tick);
        };
        activePlayer = { el, raf: requestAnimationFrame(tick) };
        trackEvent('demo_action', { demo_action: 'play' });
      });
    });

    /* Recorder: simulated. Bars move while "recording"; nothing is captured. */
    const rec = document.getElementById('recorder');
    const recClock = document.getElementById('recClock');
    const hwStatus = document.getElementById('hwStatus');
    const review = document.getElementById('review');
    const viz = rec.querySelector('.rec-viz');
    while (viz.children.length < 40) viz.appendChild(document.createElement('span'));
    const bars = Array.from(viz.children);
    const recBtn = key => rec.querySelector(`[data-rec="${key}"]`);
    let recTimer = null, recSecs = 0, levels = bars.map(() => 6);
    const showRecButtons = keys => ['start', 'stop', 'again', 'save'].forEach(k => { recBtn(k).hidden = !keys.includes(k); });
    const setState = s => { rec.dataset.state = s; };
    const startRec = () => {
      stopPlayer();
      setState('recording'); showRecButtons(['stop']);
      recSecs = 0; recClock.textContent = '0:00';
      const t0 = performance.now();
      recTimer = setInterval(() => {
        recSecs = (performance.now() - t0) / 1000;
        recClock.textContent = clock(recSecs);
        levels = levels.slice(1).concat(10 + Math.random() * 38);
        bars.forEach((b, i) => { b.style.height = `${levels[i]}px`; });
      }, 120);
      recBtn('stop').focus();
    };
    const stopRec = () => {
      clearInterval(recTimer); recTimer = null;
      setState('recorded'); showRecButtons(['again', 'save']);
      recBtn('save').focus();
    };
    rec.addEventListener('click', e => {
      const key = e.target.closest('[data-rec]') && e.target.closest('[data-rec]').dataset.rec;
      if (!key) return;
      if (key === 'start' || key === 'again') { review.hidden = true; startRec(); }
      if (key === 'stop') stopRec();
      if (key === 'save') {
        setState('saved'); showRecButtons([]);
        hwStatus.textContent = 'Awaiting review'; hwStatus.className = 'pill pill-wait';
        toast('Saved. Your teacher will listen and review it.');
        trackEvent('demo_action', { demo_action: 'save_recording' });
        setTimeout(() => {
          review.hidden = false;
          hwStatus.textContent = 'Reviewed'; hwStatus.className = 'pill pill-ok';
          showRecButtons(['again']);
          recBtn('again').textContent = 'Try it again';
        }, 2200);
      }
    });

    /* Period switch on the Quran journey. */
    const periods = {
      '30':  { new: 18,  rev: 64,  cor: 5,  les: 12 },
      '90':  { new: 52,  rev: 160, cor: 12, les: 26 },
      'all': { new: 155, rev: 412, cor: 31, les: 64 },
    };
    app.querySelectorAll('[data-period-group]').forEach(group => {
      group.addEventListener('click', e => {
        const btn = e.target.closest('[data-period]');
        if (!btn) return;
        group.querySelectorAll('[data-period]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        const values = periods[btn.dataset.period];
        app.querySelectorAll('#s-progress [data-stat]').forEach(dd => { dd.textContent = String(values[dd.dataset.stat]); });
      });
    });

    /* Sheet: the share card and the monthly report. */
    const sheet = document.getElementById('sheet');
    const sheetBody = document.getElementById('sheetBody');
    const sheetCard = sheet.querySelector('.sheet-card');
    let sheetReturn = null;
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const openSheet = (html, from) => {
      sheetBody.innerHTML = html;
      sheet.hidden = false;
      sheetReturn = from;
      sheetCard.focus();
    };
    const closeSheet = () => {
      sheet.hidden = true;
      if (sheetReturn) sheetReturn.focus();
    };
    sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
    sheet.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); closeSheet(); }
      if (e.key === 'Tab') {
        const items = Array.from(sheet.querySelectorAll('button'));
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === sheetCard)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    const longDate = fmt(today, { day: 'numeric', month: 'long', year: 'numeric' });
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const monthName = fmt(lastMonth, { month: 'long', year: 'numeric' });

    app.addEventListener('click', e => {
      const el = e.target.closest('[data-demo], [data-share]');
      if (!el) return;
      if (el.dataset.share) {
        openSheet(`
          <p class="report-h" id="sheetTitle">Share this achievement</p>
          <p class="report-k">A card drawn on your device. No public page or link is created.</p>
          <div class="share">
            <svg class="lattice" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="url(#lattice)"/></svg>
            <span class="medal" aria-hidden="true"><svg viewBox="0 0 44 44"><use href="#i-star"/></svg></span>
            <p class="share-k">MashaAllah</p>
            <p class="share-name">Yusuf Ahmed</p>
            <p class="share-what">${esc(el.dataset.share)}</p>
            <p class="share-foot">Suqya Institute &middot; ${esc(longDate)}</p>
          </div>
          <div class="sheet-acts"><button type="button" class="abtn abtn-jade" data-demo="share-now"><svg aria-hidden="true"><use href="#i-share"/></svg>Share</button></div>`, el);
        trackEvent('demo_action', { demo_action: 'share_card' });
        return;
      }
      switch (el.dataset.demo) {
        case 'join':
          toast('In the portal, this opens your teacher’s Zoom room and notes the time you joined.');
          trackEvent('demo_action', { demo_action: 'join' });
          break;
        case 'excuse': {
          const pill = document.createElement('span');
          pill.className = 'pill pill-ok';
          pill.textContent = 'Excuse sent';
          el.replaceWith(pill);
          toast('Excuse sent more than 24 hours ahead, so the lesson’s time stays in the balance.');
          trackEvent('demo_action', { demo_action: 'excuse' });
          break;
        }
        case 'pause':
          toast('Your freeze request has been sent to admin for approval.');
          trackEvent('demo_action', { demo_action: 'pause' });
          break;
        case 'renew':
          toast('In the portal, this opens WhatsApp with a ready message to the institute.');
          trackEvent('demo_action', { demo_action: 'renew' });
          break;
        case 'report':
          openSheet(`
            <p class="report-k">Monthly learning report</p>
            <p class="report-h" id="sheetTitle">Yusuf Ahmed, ${esc(monthName)}</p>
            <dl class="report-grid">
              <div><dt>Lessons attended</dt><dd>12 of 12</dd></div>
              <div><dt>Homework handed in</dt><dd>11 of 12</dd></div>
              <div><dt>New ayahs memorized</dt><dd>38</dd></div>
              <div><dt>Surahs completed</dt><dd>2</dd></div>
            </dl>
            <p class="report-k">Stories of the month</p>
            <p class="report-story">Yusuf finished Surah Al-‘Alaq this week and recited it twice without a mistake.</p>
            <p class="report-story">He corrected his own madd in At-Tin before I could, a lovely sign of listening.</p>`, el);
          trackEvent('demo_action', { demo_action: 'monthly_report' });
          break;
        case 'share-now':
          toast('On a phone, this opens your share sheet with the card.');
          break;
        case 'close':
          closeSheet();
          break;
        default:
          break;
      }
    });
  }
}

const afterFirstPaint = fn => requestAnimationFrame(() => setTimeout(fn, 0));
afterFirstPaint(initPage);
