/**
 * Pré-join : logo McBuleli + titre session (évite écran noir sans repère visuel).
 */
(function () {
  var LOGO = "/images/mcbuleli-meet-logo.png";
  var APP = "McBuleli Meet";

  function subjectFromHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (!h) return null;
    var parts = h.split("&");
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var eq = p.indexOf("=");
      if (eq < 0) continue;
      if (decodeURIComponent(p.slice(0, eq)) === "config.subject") {
        return decodeURIComponent(p.slice(eq + 1).replace(/\+/g, " "));
      }
    }
    return null;
  }

  function ensureBanner() {
    if (document.getElementById("mcbuleli-prejoin-banner")) return;
    var subject = subjectFromHash();
    var wrap = document.createElement("div");
    wrap.id = "mcbuleli-prejoin-banner";
    wrap.setAttribute(
      "style",
      "position:fixed;z-index:9999;top:0;left:0;right:0;display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(90deg,#1a4a22,#305f33);color:#fff;font-family:system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;",
    );
    var img = document.createElement("img");
    img.src = LOGO;
    img.alt = APP;
    img.width = 40;
    img.height = 40;
    img.setAttribute("style", "width:40px;height:40px;object-fit:contain;border-radius:50%;background:transparent;");
    var text = document.createElement("div");
    var title = document.createElement("div");
    title.textContent = subject || APP;
    title.setAttribute("style", "font-size:14px;font-weight:800;line-height:1.2;");
    var sub = document.createElement("div");
    sub.textContent = APP;
    sub.setAttribute("style", "font-size:10px;opacity:.85;");
    text.appendChild(title);
    text.appendChild(sub);
    wrap.appendChild(img);
    wrap.appendChild(text);
    document.body.appendChild(wrap);
  }

  function tick() {
    ensureBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tick);
  } else {
    tick();
  }
  window.addEventListener("hashchange", function () {
    var el = document.getElementById("mcbuleli-prejoin-banner");
    if (el) el.remove();
    ensureBanner();
  });
  setInterval(tick, 2000);
})();
