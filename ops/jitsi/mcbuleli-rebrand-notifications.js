/** Remplace « Jitsi Meet » par McBuleli dans les toasts (fin de live, etc.). */
(function () {
  var rules = [
    [/merci d'avoir utilisé\s+jitsi meet/gi, "Merci d'avoir participé via McBuleli"],
    [/merci d'avoir utilisé\s+{{appname}}/gi, "Merci d'avoir participé via McBuleli"],
    [/thank you for using\s+jitsi meet/gi, "Thank you for joining via McBuleli"],
    [/via jitsi meet/gi, "via McBuleli"],
    [/\bjitsi meet\b/gi, "McBuleli"],
    [/\bjitsi\b/gi, "McBuleli"],
  ];

  function rebrandNode(el) {
    if (!el || el.dataset.mcbuleliRebranded === "1") return;
    var text = el.textContent || "";
    if (!/jitsi/i.test(text)) return;
    var next = text;
    for (var i = 0; i < rules.length; i++) {
      next = next.replace(rules[i][0], rules[i][1]);
    }
    if (next !== text) {
      el.textContent = next;
      el.dataset.mcbuleliRebranded = "1";
    }
  }

  function scan() {
    document
      .querySelectorAll(".notification, [role='alert'], [class*='notification']")
      .forEach(rebrandNode);
  }

  scan();
  setInterval(scan, 800);
})();
