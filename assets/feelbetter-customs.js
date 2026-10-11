/*
 * 개인통관고유부호 on the cart (drawer and page). Works with Dawn's re-rendered cart sections through event delegation:
 * - normalises and saves the code to the cart (attributes.customs_code) as the buyer types, so re-renders keep it
 * - "shipping outside Korea" hides the field and skips the check
 * - blocks the checkout buttons until the code looks valid (P + 12 digits)
 */
(() => {
  const PATTERN = /^P\d{12}$/;
  let saveTimer;

  const root = (el) => el.closest('[data-fb-customs]');
  const save = (attributes) =>
    fetch(`${window.Shopify?.routes?.root || '/'}cart/update.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ attributes }),
    }).catch(() => {});

  const showError = (box, message) => {
    const err = box.querySelector('[data-fb-customs-error]');
    if (!err) return;
    err.textContent = message || '';
    err.hidden = !message;
    box.classList.toggle('is-invalid', !!message);
  };

  document.addEventListener('input', (e) => {
    const input = e.target.closest?.('[data-fb-customs-input]');
    if (!input) return;
    const clean = input.value.toUpperCase().replace(/[^P0-9]/g, '').slice(0, 13);
    if (clean !== input.value) input.value = clean;
    const box = root(input);
    if (box && PATTERN.test(clean)) showError(box, '');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save({ customs_code: clean }), 500);
  });

  document.addEventListener('change', (e) => {
    const abroad = e.target.closest?.('[data-fb-customs-abroad]');
    if (!abroad) return;
    const box = root(abroad);
    const body = box?.querySelector('[data-fb-customs-body]');
    if (body) body.hidden = abroad.checked;
    if (box) showError(box, '');
    save({ ship_outside_korea: abroad.checked ? 'yes' : '' });
  });

  // Capture phase: runs before Dawn's own handlers and before the form submits to /cart → checkout.
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest?.('button[name="checkout"], input[name="checkout"]');
      if (!btn) return;
      const formId = btn.getAttribute('form') || btn.closest('form')?.id;
      const boxes = [...document.querySelectorAll('[data-fb-customs]')].filter((b) => b.querySelector(`[form="${formId}"]`));
      const box = boxes[0];
      if (!box) return;
      const abroad = box.querySelector('[data-fb-customs-abroad]');
      if (abroad?.checked) return;
      const input = box.querySelector('[data-fb-customs-input]');
      const value = (input?.value || '').toUpperCase();
      if (PATTERN.test(value)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showError(box, value ? box.dataset.errorFormat : box.dataset.errorRequired);
      input?.focus();
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    true
  );
})();
