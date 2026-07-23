/**
 * Filet de secours : injecte le logo McBuleli si .leftwatermark est absent / vide.
 * Force aussi opacity ~80% transparente sur le watermark natif (contourne CSS en cache).
 */
(function () {
  var LOGO = "/images/mcbuleli-meet-logo.png";
  var ID = "mcbuleli-wm-overlay";
  var OPACITY = "0.2";

  function softenNativeWatermark() {
    var nodes = document.querySelectorAll(".leftwatermark, .watermark.leftwatermark");
    for (var i = 0; i < nodes.length; i += 1) {
      nodes[i].style.setProperty("opacity", OPACITY, "important");
    }
  }

  function hasNativeWatermark() {
    var el = document.querySelector(".leftwatermark");
    if (!el) return false;
    var bg = window.getComputedStyle(el).backgroundImage || "";
    return bg !== "none" && bg.indexOf("url(") !== -1;
  }

  function ensureOverlay() {
    softenNativeWatermark();
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
      "pointer-events:none;object-fit:contain;opacity:" +
      OPACITY +
      ";" +
      "filter:drop-shadow(0 1px 3px rgba(0,0,0,.2));";
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
