/* Sanjay Shah — portfolio behaviour. Vanilla JS, no dependencies, no network. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  var toggle = document.getElementById("theme-toggle");
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    var dark = t === "dark";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0b0d10" : "#f4f1e8");
    try { localStorage.setItem("theme", t); } catch (e) { /* ignore */ }
    if (field) field.recolor();
  }
  function flipTheme() { applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"); }
  toggle.addEventListener("click", flipTheme);

  /* ---------- Year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    root.classList.add("no-io");
  }

  /* ---------- Current section in nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) {
            if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---------- Generative field: drifting nodes + faint links ---------- */
  var field = (function () {
    var canvas = document.getElementById("field");
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var pts = [], w = 0, h = 0, dpr = 1, raf = 0, color = "#c6f256", linkColor = "#8fd3ff";
    var COUNT = 70, LINK = 150;
    function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
    function recolor() { color = css("--accent") || color; linkColor = css("--accent-2") || linkColor; if (reduceMotion) draw(); }
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(COUNT * Math.min(1, w / 1200));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18, r: 1 + Math.random() * 1.4 });
    }
    function step() {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h); ctx.lineWidth = 1;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < LINK * LINK) { ctx.strokeStyle = linkColor; ctx.globalAlpha = (1 - Math.sqrt(d) / LINK) * 0.22; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      ctx.fillStyle = color;
      for (var k = 0; k < pts.length; k++) { ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(pts[k].x, pts[k].y, pts[k].r, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    function loop() { step(); draw(); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduceMotion && !document.hidden) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    size(); recolor(); draw();
    if (!reduceMotion) start();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(); }, 120); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    return { recolor: recolor };
  })();

  /* ---------- Carousels: arrow keys scroll by one card ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".carousel"), function (c) {
    c.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var card = c.firstElementChild; if (!card) return;
      var w = card.getBoundingClientRect().width + 12;
      c.scrollBy({ left: e.key === "ArrowRight" ? w : -w, behavior: reduceMotion ? "auto" : "smooth" });
      e.preventDefault();
    });
  });

  /* ---------- Command palette ---------- */
  (function () {
    var dlg = document.getElementById("palette");
    var openBtn = document.getElementById("palette-open");
    if (!dlg || !openBtn || typeof dlg.showModal !== "function") { if (openBtn) openBtn.hidden = true; return; }
    var input = document.getElementById("palette-input");
    var list = document.getElementById("palette-list");
    var items = Array.prototype.slice.call(list.querySelectorAll("li"));
    var sel = 0;
    function visible() { return items.filter(function (li) { return !li.hidden; }); }
    function select(i) {
      var v = visible(); if (!v.length) return;
      sel = (i + v.length) % v.length;
      items.forEach(function (li) { li.removeAttribute("aria-selected"); li.id = ""; });
      v[sel].setAttribute("aria-selected", "true"); v[sel].id = "palette-active";
      input.setAttribute("aria-activedescendant", "palette-active");
      v[sel].scrollIntoView({ block: "nearest" });
    }
    function filter() {
      var q = input.value.trim().toLowerCase();
      items.forEach(function (li) {
        var hay = (li.textContent + " " + (li.getAttribute("data-keys") || "")).toLowerCase();
        li.hidden = q && hay.indexOf(q) === -1;
      });
      select(0);
    }
    function run(li) {
      var action = li.getAttribute("data-action"), target = li.getAttribute("data-target");
      dlg.close();
      if (action === "go") {
        var el = document.querySelector(target);
        if (el) { el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); history.replaceState(null, "", target); }
      } else if (action === "href") {
        if (/^https?:/.test(target)) window.open(target, "_blank", "noopener"); else location.href = target;
      } else if (action === "theme") { flipTheme(); }
    }
    function open() { input.value = ""; filter(); dlg.showModal(); input.focus(); }
    openBtn.addEventListener("click", open);
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : open(); }
      else if (e.key === "/" && !dlg.open && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
    input.addEventListener("input", filter);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); select(sel + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); select(sel - 1); }
      else if (e.key === "Enter") { e.preventDefault(); var v = visible(); if (v[sel]) run(v[sel]); }
    });
    items.forEach(function (li) {
      li.addEventListener("click", function () { run(li); });
      li.addEventListener("mousemove", function () { var v = visible(); var i = v.indexOf(li); if (i > -1 && i !== sel) select(i); });
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  })();
})();
