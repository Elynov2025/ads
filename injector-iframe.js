/* injector-iframe.js — вставляет iframe с RTB (srcdoc) после 6-го абзаца */
(function () {
  "use strict";

  var TARGET_IDX = 5; // после 6-го абзаца (индексация с нуля)
  var SELECTORS = [
    '[itemprop="articleBody"]',
    'article',
    '.post-content', '.entry-content', '.article-content',
    '.rich-content', '.blog-post-content', '.cms-content',
    'main .content', 'main'
  ];
  var ONE_PER_CONTAINER = true;

  // HTML содержимое будущего iframe (то, что было в ad.html)
  var SRC_DOC = [
    '<!doctype html><html lang="ru"><head><meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<style>html,body{margin:0;padding:0;background:transparent}#wrap{display:block;width:100%;}</style>',
    '<script src="https://yandex.ru/ads/system/context.js" async><\/script>',
    '</head><body>',
    '<div id="wrap"><div id="yandex_rtb_R-A-14383531-4"></div></div>',
    '<script>',
      'window.yaContextCb = window.yaContextCb || [];',
      'window.yaContextCb.push(function(){',
        'Ya.Context.AdvManager.render({',
          'blockId:"R-A-14383531-4",',
          'renderTo:"yandex_rtb_R-A-14383531-4",',
          'onRender:function(){',
            'setTimeout(function(){',
              'var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);',
              'parent.postMessage({rtbFrame:true,height:h}, "*");',
            '},150);',
          '}',
        '});',
      '});',
    '<\/script>',
    '</body></html>'
  ].join('');

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
    // ключевая строка: вместо src используем srcdoc
    iframe.srcdoc = SRC_DOC;
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
      // находим все iframes без src (с srcdoc)
      document.querySelectorAll('iframe').forEach(function(f){
        if (!f.hasAttribute('src') && f.srcdoc) {
          f.style.height = Math.max(250, d.height) + "px";
        }
      });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function(){ run(document); });
  } else { run(document); }

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
