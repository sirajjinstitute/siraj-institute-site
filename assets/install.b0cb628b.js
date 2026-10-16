/* Suqya landing: "Get the app" installs the portal app directly.
   The portal is served on this same host, so this page uses the portal's
   own manifest and the install creates the same app as installing from the
   portal. When the browser offers its install prompt (Chrome/Edge/Samsung),
   the button opens it. Otherwise (iPhone, in-app browsers such as WhatsApp
   or Facebook, an already installed app, or a browser that has not offered
   the prompt yet) a short dialog shows the steps for this device; the page
   never leaves for the login page. The /login#install-app link remains only
   for browsers without JavaScript or <dialog>. */
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
  if (dialog) {
    var steps = dialog.querySelectorAll('[data-install-steps]');
    for (var i = 0; i < steps.length; i++) {
      steps[i].hidden = steps[i].getAttribute('data-install-steps') !== (ios ? 'ios' : 'other');
    }
  }

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
    if (dialog && typeof dialog.showModal === 'function') {
      event.preventDefault();
      dialog.showModal();
    }
  });
})();
