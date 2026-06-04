/** Supprime le toast « Thank you for using Jitsi Meet » si la config JS ne suffit pas. */
(function () {
  var re = /thank you for using|merci d'avoir utilisé/i;
  function strip() {
    document.querySelectorAll(".notification, [role='alert']").forEach(function (el) {
      if (re.test(el.textContent || "")) {
        el.remove();
      }
    });
  }
  strip();
  setInterval(strip, 800);
})();
