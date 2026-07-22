/**
 * Filet de secours : injecte le logo McBuleli si .leftwatermark est absent / vide.
 * Le logo natif Jitsi utilise background-image sur .leftwatermark (ne pas le casser en CSS).
 */
(function () {
  var LOGO = "/images/mcbuleli-meet-logo.png";
  var ID = "mcbuleli-wm-overlay";

  function hasNativeWatermark() {
    var el = document.querySelector(".leftwatermark");
    if (!el) return false;
    var bg = window.getComputedStyle(el).backgroundImage || "";
    return bg !== "none" && bg.indexOf("url(") !== -1;
  }

  function ensureOverlay() {
    if (hasNativeWatermark()) {
      var existing = document.getElementById(ID);
      if (existing) existing.remove();
      return;
    }
    if (document.getElementById(ID)) return;
    var img = document.createElement("img");
    img.id = ID;
    img.src = LOGO;
    img.alt = "McBuleli";
    img.width = 72;
    img.height = 72;
    img.style.cssText =
      "position:fixed;top:16px;left:16px;width:72px;height:72px;z-index:600;" +
      "pointer-events:none;object-fit:contain;" +
      "filter:drop-shadow(0 2px 6px rgba(0,0,0,.55));";
    document.body.appendChild(img);
  }

  function tick() {
    try {
      ensureOverlay();
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tick);
  } else {
    tick();
  }
  setInterval(tick, 2500);
})();
