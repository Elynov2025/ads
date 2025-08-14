(function(){
  var CFG = {
    BLOCK_ID: 'R-A-14383531-11',
    CONTAINER_ID: 'yandex_rtb_R-A-14383531-11',
    WRAP_ID: 'ya-rtb-320x100-after-last-p',
    WIDTH: 320, HEIGHT: 100,
    DEBUG: false, LAZY_MARGIN: '600px'
  };
  function log(){ if(CFG.DEBUG) console.log.apply(console, arguments); }
  function visible(el){
    if(!el) return false;
    if(!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)) return false;
    var cs = getComputedStyle(el);
    return cs && cs.visibility!=='hidden' && cs.display!=='none';
  }
  function contentRoot(){
    var sels = [
      '[data-hook="post-content"]',
      '[data-testid="richContentRenderer"]',
      'article [data-hook*="content"]',
      'article','main article','main'
    ];
    for(var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el) return el; }
    return document.body;
  }
  function lastTextBlock(root){
    var candidates = [].slice.call(root.querySelectorAll(
      'p, li, blockquote, .wixui-rich-text__text, [data-testid="richTextElement"]'
    ));
    for(var i=candidates.length-1;i>=0;i--){
      var el=candidates[i];
      if(!visible(el)) continue;
      var txt=(el.textContent||'').trim();
      if(txt.length>=20) return el;
    }
    // fallback: любой видимый элемент с текстом
    var all=[].slice.call(root.querySelectorAll('*'));
    for(var j=all.length-1;j>=0;j--){
      var e=all[j];
      if(!visible(e)) continue;
      if((e.textContent||'').trim().length>=20) return e;
    }
    return null;
  }
  function buildAnchor(){
    var wrap=document.getElementById(CFG.WRAP_ID);
    if(wrap) return wrap;
    wrap=document.createElement('div');
    wrap.id=CFG.WRAP_ID;
    wrap.style.cssText='width:100%;display:block;margin:16px 0 0;';
    var box=document.createElement('div');
    box.style.cssText='width:'+CFG.WIDTH+'px;height:'+CFG.HEIGHT+'px;max-width:100%;margin:12px auto 0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;';
    var cont=document.createElement('div'); cont.id=CFG.CONTAINER_ID;
    box.appendChild(cont); wrap.appendChild(box);
    return wrap;
  }
  function placeAnchor(){
    var root=contentRoot();
    var last=lastTextBlock(root);
    if(!last){ log('[ya-rtb] no last text block'); return null; }
    var wrap=buildAnchor();
    if(!wrap.parentNode){ last.insertAdjacentElement('afterend', wrap); }
    return wrap;
  }
  function ensureContext(cb){
    window.yaContextCb = window.yaContextCb || [];
    if(window.Ya && Ya.Context && Ya.Context.AdvManager){ cb(); return; }
    var s=document.querySelector('script[src^="https://yandex.ru/ads/system/context.js"]');
    if(!s){
      s=document.createElement('script');
      s.src='https://yandex.ru/ads/system/context.js';
      s.async=true;
      s.onload=function(){ cb(); };
      s.onerror=function(){ iframeFallback(); };
      document.head.appendChild(s);
    }
    // таймаут на случай блокировок
    setTimeout(function(){
      if(!(window.Ya && Ya.Context && Ya.Context.AdvManager)) iframeFallback();
    }, 3000);
    window.yaContextCb.push(cb);
  }
  function render(){
    try{
      Ya.Context.AdvManager.render({ blockId: CFG.BLOCK_ID, renderTo: CFG.CONTAINER_ID });
      log('[ya-rtb] rendered');
    }catch(e){
      log('[ya-rtb] render error', e);
      iframeFallback();
    }
  }
  function iframeFallback(){
    var wrap=placeAnchor();
    if(!wrap) return;
    if(wrap.getAttribute('data-iframed')==='1') return; // уже делали фоллбэк
    wrap.setAttribute('data-iframed','1');
    var iframe=document.createElement('iframe');
    iframe.width=CFG.WIDTH; iframe.height=CFG.HEIGHT;
    iframe.style.border='0'; iframe.style.display='block'; iframe.loading='lazy';
    var html='<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0}</style></head><body>'
      +'<div id="'+CFG.CONTAINER_ID+'"></div>'
      +'<script src="https://yandex.ru/ads/system/context.js"><\/script>'
      +'<script>window.yaContextCb=window.yaContextCb||[]; yaContextCb.push(function(){ try{ Ya.Context.AdvManager.render({blockId:"'+CFG.BLOCK_ID+'", renderTo:"'+CFG.CONTAINER_ID+'"}) }catch(e){} });<\/script>'
      +'</body></html>';
    if('srcdoc' in iframe){ iframe.srcdoc=html; }
    else { var blob=new Blob([html],{type:'text/html'}); iframe.src=URL.createObjectURL(blob); }
    var box=wrap.firstChild; box.innerHTML=''; box.appendChild(iframe);
    log('[ya-rtb] iframe fallback used');
  }
  function init(){
    var wrap=placeAnchor();
    if(!wrap) return;
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(ent){
          if(ent.isIntersecting){ io.disconnect(); ensureContext(render); }
        });
      },{root:null, rootMargin:CFG.LAZY_MARGIN, threshold:0});
      io.observe(wrap);
    } else {
      ensureContext(render);
    }
  }
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    init(); setTimeout(init,800); setTimeout(init,2000);
    var mo=new MutationObserver(function(){ init(); });
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
