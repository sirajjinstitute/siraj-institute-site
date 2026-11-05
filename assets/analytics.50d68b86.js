/* Google Analytics 4, loaded only after the visitor agrees.
 *
 * Owner decision 2026-11-05: on the home page a consent bar appears on the
 * first visit. Nothing from Google is defined, queued or fetched until the
 * visitor presses "Accept". "Reject" means Google Analytics never loads, and
 * the choice is remembered in this browser. The footer "Cookie settings"
 * button reopens the bar so the choice can be changed.
 *
 * Once accepted, the tag still stays off the render-critical path: it is
 * injected after the page load event and an idle gap, so it cannot compete
 * with the hero image. The page view is sent explicitly once gtag.js loads.
 */
(function () {
  /* Primary destination is the suqyainstitute.com property; the original
     property stays configured so it keeps receiving data. */
  var MEASUREMENT_ID = 'G-VJNWTGML5Y';
  var EXTRA_MEASUREMENT_IDS = ['G-667Q0LLEH2'];
  var ALL_IDS = [MEASUREMENT_ID].concat(EXTRA_MEASUREMENT_IDS);
  var TAG_ELEMENT_ID = 'ga4-tag';
  var CHOICE_KEY = 'suqya-analytics-consent';

  /* Browser storage can be blocked (private mode, strict settings). Without
     it the bar simply asks again on the next visit; nothing loads unasked. */
  function readChoice() {
    try { return window.localStorage.getItem(CHOICE_KEY); } catch (e) { return null; }
  }
  function saveChoice(value) {
    try { window.localStorage.setItem(CHOICE_KEY, value); } catch (e) { /* not remembered */ }
  }

  var started = false;
  function startAnalytics() {
    if (started) return;
    started = true;
    ALL_IDS.forEach(function (id) { window['ga-disable-' + id] = false; });

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    /* Keep the destination configured before any interaction events can
       queue, but send the single page view only after the tag is ready. */
    gtag('js', new Date());
    ALL_IDS.forEach(function (id) { gtag('config', id, { send_page_view: false }); });

    function sendPageView() {
      gtag('event', 'page_view', {
        page_location: window.location.href,
        page_title: document.title
      });
    }

    function loadTag() {
      if (document.getElementById(TAG_ELEMENT_ID)) return;
      var tag = document.createElement('script');
      tag.id = TAG_ELEMENT_ID;
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
      tag.addEventListener('load', sendPageView, { once: true });
      document.head.appendChild(tag);
    }

    function scheduleTag() {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(loadTag, { timeout: 2500 });
      } else {
        loadTag();
      }
    }

    if (document.readyState === 'complete') {
      scheduleTag();
    } else {
      window.addEventListener('load', scheduleTag, { once: true });
    }
  }

  /* Turning analytics off after it ran: Google's documented opt-out flag
     stops further hits on this page, and its first-party cookies are cleared
     so nothing is kept. */
  function stopAnalytics() {
    ALL_IDS.forEach(function (id) { window['ga-disable-' + id] = true; });
    var host = window.location.hostname;
    var domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (pair) {
      var name = pair.split('=')[0].trim();
      if (!/^_ga(_|$)|^_gid$|^_gat/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  var bar = document.getElementById('cookieBar');
  var settings = document.getElementById('cookieSettings');

  /* Focus moves into the bar only when the visitor opened it from the
     footer, and back there afterwards; on a first visit it is left alone so
     the page does not jump. */
  var openedFromSettings = false;
  function hideBar() { if (bar) bar.hidden = true; }
  function showBar(fromSettings) {
    if (!bar) return;
    openedFromSettings = fromSettings === true;
    bar.hidden = false;
    var first = bar.querySelector('button');
    if (first && openedFromSettings) first.focus();
  }

  if (bar) {
    bar.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-consent]');
      if (!button) return;
      var accepted = button.getAttribute('data-consent') === 'accept';
      saveChoice(accepted ? 'granted' : 'denied');
      hideBar();
      if (accepted) startAnalytics(); else stopAnalytics();
      if (settings && openedFromSettings) settings.focus();
    });
  }
  if (settings) {
    settings.hidden = false;
    settings.addEventListener('click', function () { showBar(true); });
  }

  var choice = readChoice();
  if (choice === 'granted') startAnalytics();
  else if (choice !== 'denied') showBar();
})();
