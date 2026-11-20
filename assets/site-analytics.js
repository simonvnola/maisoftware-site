// Measurement for the marketing pages only.
//
// Vercel Web Analytics counts page views without cookies and without
// identifying anyone. This file adds two events on top, so a campaign can be
// judged on what people did next rather than on visits:
//
//   "App Store click"  { app, page }     a tap on any App Store link
//   "MaiCation start"  { target, page }  a tap through to the MaiCation app
//
// It is loaded on marketing pages only. Pages that can carry something
// private in their address (the partner portal, the App Clip page, the
// ProBono employer link) do not load it. The apps themselves load nothing.
(function () {
  // The queue Vercel's script drains once it has loaded. Defining it here
  // means a click made before then is still counted.
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  function send(name, data) {
    try {
      window.va('event', { name: name, data: data });
    } catch (err) {
      // Measurement must never get in the way of the link being followed.
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) { return; }
    var href = link.getAttribute('href') || '';
    var page = window.location.pathname;

    var store = href.match(/^https:\/\/apps\.apple\.com\/[a-z]{2}\/app\/([a-z0-9-]+)\/id\d+/);
    if (store) {
      send('App Store click', { app: store[1], page: page });
      return;
    }

    var holiday = href.match(/^https:\/\/holiday\.maisoftware\.app(\/[a-z-]*)?/);
    if (holiday) {
      var path = holiday[1] || '/';
      var target = path === '/signup' ? 'signup' : path === '/pass' ? 'pass' : 'app';
      send('MaiCation start', { target: target, page: page });
    }
  });
})();
