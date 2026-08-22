/* Google Analytics 4 bootstrap.
 *
 * Wave 1B loaded this file synchronously in <head>, which made it block the
 * first paint for ~490 ms in the field, and loaded gtag.js alongside it. Both
 * are now off the render-critical path:
 *
 *   - this file is `defer`red, so it is fetched in parallel with parsing and
 *     runs once the document is parsed, before DOMContentLoaded;
 *   - gtag.js is injected afterwards from an idle callback, so ~143 KiB of
 *     third-party JavaScript no longer competes with the hero image and the
 *     stylesheet for bandwidth during the initial load.
 *
 * Ordering is still reliable because gtag() only appends to dataLayer. The
 * queue below is built first and gtag.js drains it when it arrives, which is
 * exactly the contract Google's own snippet relies on. Nothing here runs
 * inline, so the page needs neither 'unsafe-inline' nor an inline handler.
 */
(function () {
  var MEASUREMENT_ID = 'G-667Q0LLEH2';
  var TAG_ELEMENT_ID = 'ga4-tag';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Queued now, sent by gtag.js when it loads. Exactly one config call, so
     exactly one page_view -- this file is the only place GA4 is configured. */
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);

  function loadTag() {
    /* Guard against a second injection if this ever runs twice. */
    if (document.getElementById(TAG_ELEMENT_ID)) return;
    var tag = document.createElement('script');
    tag.id = TAG_ELEMENT_ID;
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(tag);
  }

  /* requestIdleCallback's timeout guarantees the tag still loads on a page
     that never goes idle, so the page_view is not lost on a short visit.
     The load event is the fallback for browsers without requestIdleCallback. */
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(loadTag, { timeout: 2500 });
  } else if (document.readyState === 'complete') {
    loadTag();
  } else {
    window.addEventListener('load', loadTag, { once: true });
  }
})();
