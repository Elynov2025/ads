/* inject-ya-rtb-320x100.js — insert Yandex RTB 320x100 after the last paragraph
   Usage: include this file once (Body-end). Works with SPA (Wix) via MutationObserver. */

(function () {
  // === CONFIG ===
  var BLOCK_ID = "R-A-14383531-11";              // ваш Яндекс RTB блок
  var CONTAINER_ID = "yandex_rtb_R-A-14383531-11"; // целевой div (должен совпадать с renderTo)
  var WRAP_ID = "ya-rtb-320x100-after-last-p";     // якорь, чтобы не дублировать
  var AD_W = 320, AD_H = 100;

  function selectContentRoot() {
    // Типовые контейнеры контента (Wix Blog / Rich Content / article)
    var sels = [
      '[data-hook="post-content"]',
      '[data-testid="richContentRenderer"]',
      'article [data-hook*="content"]',
      'article',
      'main article',
      'main'
    ];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return document.body;
  }

  function getLastVisibleParagraph(root) {
    var ps = Array.prototype.slice.call(root.querySelectorAll('p'));
    for (var i = ps.length - 1; i >= 0; i--) {
      var el = ps[i];
      if (!el) continue;
      var visible = !!(el.offsetParent !== null);
      var hasText = (el.textContent || "").trim().length > 0;
      if (visible && hasText) return el;
    }
    return null;
  }

  function loadYandexContext(cb) {
    // Гарантируем окно колбэков
    window.yaContextCb = window.yaContextCb || [];
    // Если уже загружено — выполняем сразу
    if (typeof Ya !== "undefined" && Ya.Context && Ya.Context.AdvManager) {
      try { cb(); } catch (e) {}
      return;
    }
    // Подключаем context.js один раз
    if (!document.querySelector('script[src*="yandex.ru/ads/system/context.js"]')) {
      var s = document.createElement('script');
      s.src = "https://yandex.ru/ads/system/context.js";
      s.async = true;
      document.head.appendChild(s);
    }
    // Яндекс вызовет колбэк, когда будет готов
    window.yaContextCb.push(cb);
  }

  function renderAd() {
    try {
      Ya.Context.AdvManager.render({
        blockId: BLOCK_ID,
        renderTo: CONTAINER_ID
      });
    } catch (e) {}
  }

  function injectAdOnce() {
    if (document.getElementById(WRAP_ID)) return true; // уже вставлено

    var root = selectContentRoot();
    if (!root) return false;

    var lastP = getLastVisibleParagraph(root);
    if (!lastP) return false;

    // Обёртка-якорь
    var anchor = document.createElement('div');
    anchor.id = WRAP_ID;
    anchor.style.cssText = "width:100%;display:block;margin:16px 0 0;";

    // Бокс под фиксированный размер 320x100 (центрируем)
    var box = document.createElement('div');
    box.style.cssText = [
      "width:" + AD_W + "px",
      "height:" + AD_H + "px",
      "max-width:100%",
      "margin:12px auto 0",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "box-sizing:border-box"
    ].join(";");

    // Контейнер под RTB
    var cont = document.createElement('div');
    cont.id = CONTAINER_ID;

    box.appendChild(cont);
    anchor.appendChild(box);

    // Вставляем сразу после последнего <p>
    lastP.insertAdjacentElement('afterend', anchor);

    // Загружаем контекст и рендерим
    loadYandexContext(renderAd);
    return true;
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // Первая попытка и несколько ретраев
    injectAdOnce();
    setTimeout(injectAdOnce, 600);
    setTimeout(injectAdOnce, 1500);

    // SPA-обновления (Wix/Next и т.п.)
    var mo = new MutationObserver(function () {
      injectAdOnce();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });
})();
