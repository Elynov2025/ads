/* injector-iframe.js — вставляет iframe с RTB после 6-го абзаца */
(function () {
  "use strict";

  var IFRAME_SRC = "https://elynov2025.github.io/rtb-injector/ad.html"; // ваша страница с рекламой
  var TARGET_IDX = 5; // после 6-го абзаца (индексация с нуля)
  var SELECTORS = [
    '[itemprop="articleBody"]',
    'article',
    '.post-content', '.entry-content', '.article-content',
    '.rich-content', '.blog-post-content', '.cms-content',
    'main .content', 'main'
  ];
  var ONE_PER_CONTAINER = true;

  function getContainers(root){
    var out = [];
    SELECTORS.forEach(function (sel) {
      root.querySelectorAll(sel).forEach(function (el) {
        var s = (el.id + " " + el.className).toLowerCase();
        if (/header|footer|aside|nav|menu|share|social|related|comments?|promo|banner/.test(s)) return;
        if (el.querySelector("p")) out.push(el);
      });
    });
    return Array.from(new Set(out));
  }

  function inject(container){
    if (ONE_PER_CONTAINER && container.hasAttribute("data-rtb-iframe")) return false;

    var ps = Array.from(container.querySelectorAll("p")).filter(function(p){
      return (p.textContent||"").trim().length>0 && p.offsetParent !== null;
    });
    if (!ps.length) return false;

    var idx = Math.min(TARGET_IDX, ps.length - 1);
    var anchor = ps[idx];

    var iframe = document.createElement("iframe");
    iframe.src = IFRAME_SRC;
    iframe.allow = "fullscreen";
    iframe.loading = "lazy";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.minHeight = "250px"; // стартовая высота до onRender

    anchor.insertAdjacentElement("afterend", iframe);
    container.setAttribute("data-rtb-iframe", "true");

    return true;
  }

  function run(root){ getContainers(root||document).forEach(inject); }

  // авто-ресайз по сообщению из iframe
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d && d.rtbFrame && typeof d.height === "number") {
      document.querySelectorAll('iframe[src*="/rtb-injector/ad.html"]').forEach(function(f){
        f.style.height = Math.max(250, d.height) + "px";
      });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function(){ run(document); });
  } else { run(document); }

  // Поддержка SPA/динамической подгрузки
  if ("MutationObserver" in window) {
    var mo = new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes && m.addedNodes.forEach(function(node){
          if (node.nodeType === 1) run(node);
        });
      });
    });
    mo.observe(document.documentElement, {childList:true, subtree:true});
  }
})();
