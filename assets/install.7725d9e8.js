/* Suqya landing: "Get the app" installs the portal app directly.
   The portal is served on this same host, so this page uses the portal's
   own manifest and the install creates the same app as installing from the
   portal. When the browser has offered its install prompt (Chrome/Edge/
   Samsung), the button opens it at once. Chrome offers it only after a
   short visit, so a tap that comes earlier opens a dialog that turns into a
   one-tap "Install now" button as soon as the prompt arrives, with the
   manual steps below it (in-app browsers such as WhatsApp never offer it).
   iPhone/iPad: Apple offers no prompt, so the dialog shows the Add to Home
   Screen steps. The page never leaves for the login page; /login#install-app
   remains only for browsers without JavaScript or <dialog>. */
(function () {
  'use strict';
  var nav = window.navigator;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  // Opened from the home screen icon (iPhone keeps the page it was added
  // from): go straight into the app.
  if (standalone) { window.location.replace('/student'); return; }

  var ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  var dialog = document.getElementById('installAppDialog');
  var ready = dialog && dialog.querySelector('[data-install-ready]');
  var wait = dialog && dialog.querySelector('[data-install-wait]');
  var deferred = null;

  function showReady() {
    if (ready) ready.hidden = !deferred;
    if (wait) wait.hidden = !!deferred;
  }

  function install() {
    var prompt = deferred;
    deferred = null;
    showReady();
    if (dialog && dialog.open) dialog.close();
    prompt.prompt();
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferred = event;
    showReady();
  });
  window.addEventListener('appinstalled', function () {
    deferred = null;
    showReady();
  });

  if (dialog) {
    var steps = dialog.querySelectorAll('[data-install-steps]');
    for (var i = 0; i < steps.length; i++) {
      steps[i].hidden = steps[i].getAttribute('data-install-steps') !== (ios ? 'ios' : 'other');
    }
    var now = dialog.querySelector('[data-install-now]');
    if (now) now.addEventListener('click', function () { if (deferred) install(); });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[data-install-app]');
    if (!link) return;
    if (deferred) {
      event.preventDefault();
      install();
      return;
    }
    if (dialog && typeof dialog.showModal === 'function') {
      event.preventDefault();
      showReady();
      dialog.showModal();
    }
  });
})();
