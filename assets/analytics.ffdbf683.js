/* Google Analytics 4 bootstrap.
 *
 * Wave 1B loaded this file synchronously in <head>, which made it block the
 * first paint for ~490 ms in the field, and loaded gtag.js alongside it. Both
 * are now off the render-critical path:
 *
 *   - this file is `defer`red, so it is fetched in parallel with parsing and
 *     runs once the document is parsed, before DOMContentLoaded;
 *   - gtag.js is injected only once the page has finished loading, so ~143 KiB
 *     of third-party JavaScript no longer competes with the hero image for
 *     bandwidth during the initial load.
 *
 * Wave 1B.1 scheduled the injection with a bare requestIdleCallback, which did
 * not achieve that. The first idle gap on this page opens as soon as the
 * deferred scripts have run, which is roughly when the hero paints and about
 * 1.25 s before the load event: measured on a throttled mobile profile
 * (412x823, 1.6 Mbps, 150 ms RTT, 4x CPU), gtag.js went on the wire at
 * 765-802 ms against an LCP of 764-808 ms, while load fired at 2029-2074 ms.
 * So the tag was landing inside the LCP window, on the one connection the LCP
 * image needs, which is bandwidth contention rather than main-thread work and
 * therefore invisible in TBT. Anchoring the idle callback to the load event
 * keeps the request off the wire until the page has finished loading; the
 * timeout then bounds how long after that the tag may wait.
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

  /* Wait for the load event first, so the tag can never share bandwidth with
     the hero image, then yield once more to an idle gap. The timeout bounds
     that second wait, so the tag still loads on a page that never goes idle
     and the page_view is not lost. Browsers without requestIdleCallback go
     straight to loadTag once loaded. */
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
})();
