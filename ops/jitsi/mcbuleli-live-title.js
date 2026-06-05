/**
 * Onglet : « Soirée de lancement | McBuleli » (config.subject ou nom de salle).
 */
(function () {
  var BRAND = "McBuleli";

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

  function humanizeRoom(room) {
    return room
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function applyTitle() {
    var subject = subjectFromHash();
    if (subject) {
      document.title = subject;
      return;
    }
    var room = (location.pathname || "").replace(/^\//, "").split("/")[0];
    if (room) {
      document.title = humanizeRoom(room) + " | " + BRAND;
      return;
    }
    document.title = BRAND;
  }

  applyTitle();
  window.addEventListener("hashchange", applyTitle);
})();
