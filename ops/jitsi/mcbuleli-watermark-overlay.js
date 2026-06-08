/** Watermark McBuleli sur la grande vidéo (fallback si config.defaultLogoUrl ignoré). */
(function () {
  var WM = "/images/mcbuleli-meet-watermark.png";
  var STYLE =
    "position:absolute;top:12px;left:12px;width:56px;height:56px;z-index:25;" +
    "pointer-events:none;opacity:0.92;object-fit:contain;";

  function stage() {
    return (
      document.getElementById("largeVideoContainer") ||
      document.getElementById("largeVideoWrapper") ||
      document.querySelector("#videospace [class*='stage']") ||
      document.getElementById("videospace")
    );
  }

  function mount() {
    var root = stage();
    if (!root || document.getElementById("mcbuleli-wm-overlay")) return;
    if (getComputedStyle(root).position === "static") {
      root.style.position = "relative";
    }
    var img = document.createElement("img");
    img.id = "mcbuleli-wm-overlay";
    img.src = WM;
    img.alt = "McBuleli";
    img.style.cssText = STYLE;
    root.appendChild(img);
  }

  mount();
  setInterval(mount, 2500);
})();
