// Product-card hover images (snippets/feelbetter-product-card.liquid) ship inside <template class="fb-pcard__swap">.
// Only hover-capable devices insert them, after the page has loaded, so phones skip roughly half the card image bytes.
(() => {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let pending = false;
  const run = () => {
    pending = false;
    document.querySelectorAll('template.fb-pcard__swap').forEach((t) => {
      const card = t.closest('.fb-pcard');
      t.replaceWith(t.content.cloneNode(true));
      if (card) card.classList.add('fb-pcard--swap');
    });
  };
  const later = () => {
    if (pending) return;
    pending = true;
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 1200);
  };
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
  // grids re-rendered by filters, search and recommendations
  new MutationObserver((records) => {
    if (records.some((r) => [...r.addedNodes].some((n) => n.nodeType === 1 && (n.matches?.('template.fb-pcard__swap') || n.querySelector?.('template.fb-pcard__swap'))))) later();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
