/**
 * Onglet navigateur : « Lancement | McBuleli Meet » depuis config.subject (hash URL).
 */
(function () {
  var APP = "McBuleli Meet";

  function subjectFromHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (!h) return null;
    var parts = h.split("&");
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var eq = p.indexOf("=");
      if (eq < 0) continue;
      var key = decodeURIComponent(p.slice(0, eq));
      if (key === "config.subject") {
        return decodeURIComponent(p.slice(eq + 1).replace(/\+/g, " "));
      }
    }
    return null;
  }

  function applyTitle() {
    var subject = subjectFromHash();
    if (subject) {
      document.title = subject.indexOf(APP) >= 0 ? subject : subject + " | " + APP;
      return;
    }
    var room = (location.pathname || "").replace(/^\//, "").split("/")[0];
    if (room) {
      var label = room.replace(/-/g, " ").replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
      document.title = label + " | " + APP;
      return;
    }
    document.title = APP;
  }

  applyTitle();
  window.addEventListener("hashchange", applyTitle);
})();
