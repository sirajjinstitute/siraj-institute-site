/* Google Analytics 4 bootstrap.
 *
 * This stays off the render-critical path: the bootstrap is deferred and the
 * Google tag is injected only after the page load event, so it cannot compete
 * with the hero image. The page view is emitted explicitly once gtag.js has
 * loaded instead of relying on the config command's implicit page view.
 */
(function () {
  var MEASUREMENT_ID = 'G-667Q0LLEH2';
  var TAG_ELEMENT_ID = 'ga4-tag';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Keep the destination configured before any interaction events can queue,
     but send the single page view only after the external tag is ready. */
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: false });

  function sendPageView() {
    gtag('event', 'page_view', {
      page_location: window.location.href,
      page_title: document.title
    });
  }

  function loadTag() {
    /* Guard against a second injection if this ever runs twice. */
    if (document.getElementById(TAG_ELEMENT_ID)) return;
    var tag = document.createElement('script');
    tag.id = TAG_ELEMENT_ID;
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    tag.addEventListener('load', sendPageView, { once: true });
    document.head.appendChild(tag);
  }

  /* Wait for the load event first, so the tag can never share bandwidth with
     the hero image, then yield once more to an idle gap. The timeout bounds
     that second wait, so the tag still loads on a page that never goes idle.
     Browsers without requestIdleCallback go straight to loadTag once loaded. */
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
