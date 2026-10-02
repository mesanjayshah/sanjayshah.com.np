// Runs before first paint so a stored light preference doesn't flash dark.
(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* storage unavailable: stay dark-first */ }
})();
