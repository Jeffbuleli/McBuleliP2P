/**
 * Après QUITTER : retour companion McBuleli (pas écran noir / re-login).
 * URL passée par l'app : ?mcbReturn=https://mcbuleli.org/app/academy/…/live/…
 */
(function () {
  var APP_ORIGIN = "https://mcbuleli.org";
  var redirected = false;

  function readReturn() {
    var q = new URLSearchParams(location.search).get("mcbReturn");
    if (q) {
      try {
        sessionStorage.setItem("mcbuleli_live_return", q);
      } catch (e) {}
      return q;
    }
    try {
      return sessionStorage.getItem("mcbuleli_live_return");
    } catch (e) {
      return null;
    }
  }

  function toAbsolute(raw) {
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return APP_ORIGIN + (raw.charAt(0) === "/" ? raw : "/" + raw);
  }

  function goCompanion() {
    if (redirected) return;
    var url = toAbsolute(readReturn());
    if (!url) return;
    redirected = true;
    window.location.replace(url);
  }

  readReturn();

  function hookConference() {
    if (!window.APP || !APP.conference) return false;
    var room = APP.conference._room;
    if (!room || room._mcbuleliHangupHook) return true;
    room._mcbuleliHangupHook = true;
    try {
      room.addEventListener("conference.left", function () {
        setTimeout(goCompanion, 400);
      });
    } catch (e) {}
    return true;
  }

  setInterval(function () {
    hookConference();
  }, 1000);

  /* Toast « Merci… » ou page close → retour app */
  setInterval(function () {
    if (!readReturn()) return;
    var text = document.body ? document.body.innerText || "" : "";
    if (/merci d'avoir participé|thank you for joining/i.test(text)) {
      setTimeout(goCompanion, 900);
    }
    var closePage =
      document.querySelector(
        ".welcome-page, .close-page, [class*='ThankYou'], [class*='thank-you']",
      ) || document.getElementById("welcome_page");
    if (closePage) {
      setTimeout(goCompanion, 600);
    }
  }, 1200);

  document.addEventListener(
    "click",
    function (ev) {
      var t = ev.target;
      if (!t || !readReturn()) return;
      var btn =
        t.closest &&
        t.closest(
          "[aria-label*='Quit'], [aria-label*='quitter'], [aria-label*='Hangup'], [aria-label*='Raccrocher'], .hangup-button",
        );
      if (btn) {
        setTimeout(goCompanion, 1500);
      }
    },
    true,
  );
})();
