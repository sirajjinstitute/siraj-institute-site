/* Suqya landing: "Get the app" installs the portal app directly.
   The portal is served on this same host, so this page uses the portal's
   own manifest and the install creates the same app as installing from the
   portal. Android/desktop Chrome: the browser's install prompt.
   iPhone/iPad: Apple offers no prompt, so a short dialog shows the
   Add to Home Screen steps. Anything else falls back to the link
   (/login#install-app), where the portal offers the same button. */
(function () {
  'use strict';
  var nav = window.navigator;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  // Opened from the home screen icon (iPhone keeps the page it was added
  // from): go straight into the app.
  if (standalone) { window.location.replace('/student'); return; }

  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferred = event;
  });
  window.addEventListener('appinstalled', function () { deferred = null; });

  var ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  var dialog = document.getElementById('installAppDialog');

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[data-install-app]');
    if (!link) return;
    if (deferred) {
      event.preventDefault();
      var prompt = deferred;
      deferred = null;
      prompt.prompt();
      return;
    }
    if (ios && dialog && typeof dialog.showModal === 'function') {
      event.preventDefault();
      dialog.showModal();
    }
  });
})();
