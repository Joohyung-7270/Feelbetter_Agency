/*
  <feelbetter-request>
  --------------------
  Wraps the request form rendered by snippets/feelbetter-request-form.liquid.

  - Validates the prompt, optional product link and email.
  - POSTs JSON to `${data-api}/api/request`.
  - On success swaps the form for the "received" panel with a live countdown.

  Every user-visible string comes from data-* attributes rendered by Liquid
  translations, so nothing here is hard-coded English.
*/

(() => {
  if (customElements.get('feelbetter-request')) return;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const SUPPORTED_LOCALES = ['en', 'ko', 'ja', 'es'];
  const ERROR_MAP = {
    prompt_required: 'prompt',
    prompt_too_short: 'prompt',
    email_invalid: 'email',
    email_required: 'email',
    link_invalid: 'link',
    rate_limited: 'rateLimited',
  };

  const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

  const fill = (template, values) =>
    String(template || '').replace(/\[(\w+)\]/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
    );

  class FeelbetterRequest extends HTMLElement {
    constructor() {
      super();
      this.onSubmit = this.onSubmit.bind(this);
      this.onToggleLink = this.onToggleLink.bind(this);
      this.onReset = this.onReset.bind(this);
      this.tick = this.tick.bind(this);
      this.timer = null;
    }

    connectedCallback() {
      this.form = this.querySelector('form');
      this.received = this.querySelector('[data-received]');
      if (!this.form) return;

      this.fields = {
        prompt: this.form.querySelector('[name="prompt"]'),
        link: this.form.querySelector('[name="productUrl"]'),
        email: this.form.querySelector('[name="email"]'),
        country: this.form.querySelector('[data-ship-value]'),
      };
      this.setupCountry();
      this.linkWrap = this.form.querySelector('[data-link-wrap]');
      this.linkToggle = this.form.querySelector('[data-link-toggle]');
      this.error = this.form.querySelector('[data-error]');
      this.errorText = this.form.querySelector('[data-error-text]') || this.error;
      this.submitButton = this.form.querySelector('[type="submit"]');
      this.submitLabel = this.form.querySelector('[data-submit-label]');
      this.resetButton = this.querySelector('[data-reset]');

      this.form.addEventListener('submit', this.onSubmit);
      if (this.linkToggle) this.linkToggle.addEventListener('click', this.onToggleLink);
      if (this.resetButton) this.resetButton.addEventListener('click', this.onReset);

      Object.values(this.fields).forEach((field) => {
        if (!field) return;
        field.addEventListener('input', () => {
          field.removeAttribute('aria-invalid');
          this.hideError();
        });
      });
    }

    disconnectedCallback() {
      this.stopCountdown();
      if (this.form) this.form.removeEventListener('submit', this.onSubmit);
      if (this.linkToggle) this.linkToggle.removeEventListener('click', this.onToggleLink);
      if (this.resetButton) this.resetButton.removeEventListener('click', this.onReset);
    }

    /* ---------- config ---------- */

    get apiUrl() {
      return (this.dataset.api || '').trim().replace(/\/+$/, '');
    }

    get promiseMinutes() {
      const minutes = parseInt(this.dataset.minutes, 10);
      return Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
    }

    get locale() {
      const lang = (document.documentElement.lang || 'en').trim().slice(0, 2).toLowerCase();
      return SUPPORTED_LOCALES.includes(lang) ? lang : 'en';
    }

    get linkOpen() {
      return !!this.linkWrap && !this.linkWrap.hidden;
    }

    /* ---------- link toggle ---------- */

    onToggleLink() {
      if (!this.linkWrap) return;
      const open = !this.linkOpen;
      this.linkWrap.hidden = !open;
      this.linkToggle.setAttribute('aria-expanded', String(open));
      if (open && this.fields.link) {
        this.fields.link.focus();
      } else if (!open && this.fields.link) {
        this.fields.link.value = '';
        this.fields.link.removeAttribute('aria-invalid');
      }
    }

    /* ---------- validation ---------- */

    validate() {
      const prompt = (this.fields.prompt?.value || '').trim();
      const link = this.linkOpen ? (this.fields.link?.value || '').trim() : '';
      const email = (this.fields.email?.value || '').trim();

      if (link && !/^https?:\/\//i.test(link)) {
        return { field: this.fields.link, key: 'link' };
      }
      if (prompt.length < 3 && !link) {
        return { field: this.fields.prompt, key: 'prompt' };
      }
      if (!EMAIL_RE.test(email)) {
        return { field: this.fields.email, key: 'email' };
      }
      return null;
    }

    showError(key, field) {
      const message = this.dataset[`error${key.charAt(0).toUpperCase()}${key.slice(1)}`] || this.dataset.errorGeneric || '';
      if (this.errorText) this.errorText.textContent = message;
      if (this.error) this.error.hidden = false;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
      }
    }

    hideError() {
      if (this.error) this.error.hidden = true;
    }

    /* ---------- submit ---------- */

    setBusy(busy) {
      if (!this.submitButton) return;
      this.submitButton.disabled = busy;
      this.submitButton.setAttribute('aria-busy', String(busy));
      if (this.submitLabel) {
        if (busy) {
          this.submitLabel.dataset.idle = this.submitLabel.textContent;
          this.submitLabel.textContent = this.dataset.submitting || this.submitLabel.textContent;
        } else if (this.submitLabel.dataset.idle) {
          this.submitLabel.textContent = this.submitLabel.dataset.idle;
        }
      }
    }

    async onSubmit(event) {
      event.preventDefault();
      this.hideError();

      const invalid = this.validate();
      if (invalid) {
        this.showError(invalid.key, invalid.field);
        return;
      }

      const payload = {
        prompt: (this.fields.prompt?.value || '').trim(),
        email: (this.fields.email?.value || '').trim(),
        shipCountry: this.fields.country?.value || '',
        locale: this.locale,
        productUrl: this.linkOpen ? (this.fields.link?.value || '').trim() : '',
        source: 'shopify',
      };

      this.setBusy(true);

      let response;
      let data = null;
      try {
        response = await fetch(`${this.apiUrl}/api/request`, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        try {
          data = await response.json();
        } catch (parseError) {
          data = null;
        }
      } catch (networkError) {
        this.setBusy(false);
        this.showError('generic');
        return;
      }

      this.setBusy(false);

      if (!response.ok || !data || data.ok !== true) {
        const code = data && typeof data.error === 'string' ? data.error : '';
        const key = ERROR_MAP[code] || (response.status === 429 ? 'rateLimited' : 'generic');
        const field =
          key === 'prompt' ? this.fields.prompt : key === 'email' ? this.fields.email : key === 'link' ? this.fields.link : null;
        if (key === 'link' && this.linkWrap && !this.linkOpen) this.onToggleLink();
        this.showError(key, field);
        return;
      }

      this.publishAnalytics(data.ref, payload);
      this.showReceived(data.ref || '', payload.email);
    }

    publishAnalytics(ref, payload) {
      try {
        window.Shopify?.analytics?.publish?.('feelbetter_request', {
          ref: ref || null,
          locale: payload.locale,
          hasLink: !!payload.productUrl,
          source: 'shopify',
        });
      } catch (error) {
        /* analytics are optional */
      }
    }

    /* ---------- received panel ---------- */

    /**
     * "Ship to" pill: a searchable dropdown (combobox). The panel is appended to <body> with fixed coordinates so no
     * neighbouring panel or overflow-hidden card can cover or clip it; it opens upward when there is no room below.
     */
    setupCountry() {
      const root = this.form.querySelector('[data-ship]');
      if (!root) return;
      const hidden = root.querySelector('[data-ship-value]');
      const btn = root.querySelector('[data-ship-btn]');
      const current = root.querySelector('[data-ship-current]');
      const lang = document.documentElement.lang || this.locale || 'en';
      let names = null;
      let namesEn = null;
      try { names = new Intl.DisplayNames([lang], { type: 'region' }); namesEn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (_) { /* codes only */ }
      const other = root.dataset.other || 'Other';
      const options = (root.dataset.codes || '').split(',').filter(Boolean).map((code) => ({ code, name: names?.of(code) || code, en: namesEn?.of(code) || code }));
      options.push({ code: 'ZZ', name: other, en: 'Other' });

      const show = (code) => {
        const o = options.find((x) => x.code === code) || options[0];
        hidden.value = o.code;
        current.textContent = o.code === 'ZZ' ? other.split(' (')[0].split('（')[0] : o.name;
      };
      // first guess: browser region, then browser/page language
      const codes = options.map((o) => o.code);
      const byLang = { ko: 'KR', ja: 'JP', zh: 'CN', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', nl: 'NL', pt: 'BR' };
      const tags = [...(navigator.languages || [navigator.language || '']), lang];
      let guess = null;
      for (const t of tags) { const r = (t.split('-')[1] || '').toUpperCase(); if (codes.includes(r)) { guess = r; break; } }
      if (!guess) for (const t of tags) { const l = byLang[(t.split('-')[0] || '').toLowerCase()]; if (l) { guess = l; break; } }
      show(guess || 'KR');

      let panel = null;
      let active = 0;
      let list = [];
      const close = () => {
        if (!panel) return;
        panel.remove();
        panel = null;
        btn.setAttribute('aria-expanded', 'false');
        window.removeEventListener('resize', place);
        window.removeEventListener('scroll', place, true);
        document.removeEventListener('mousedown', outside, true);
      };
      const outside = (e) => { if (panel && !panel.contains(e.target) && !root.contains(e.target)) close(); };
      const place = () => {
        if (!panel) return;
        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(288, vw - 24);
        const left = Math.max(12, Math.min(r.right - width, vw - width - 12));
        const below = vh - r.bottom - 16;
        const above = r.top - 16;
        const want = 340;
        let top; let h;
        if (below >= Math.min(want, 240) || below >= above) { h = Math.min(want, below); top = r.bottom + 8; } else { h = Math.min(want, above); top = r.top - 8 - h; }
        Object.assign(panel.style, { top: `${top}px`, left: `${left}px`, width: `${width}px` });
        panel.querySelector('ul').style.maxHeight = `${Math.max(120, h - 60)}px`;
      };
      const render = (q) => {
        const query = (q || '').trim().toLowerCase();
        list = query ? options.filter((o) => o.name.toLowerCase().includes(query) || o.en.toLowerCase().includes(query) || o.code.toLowerCase() === query) : options;
        active = Math.max(0, list.findIndex((o) => o.code === hidden.value));
        if (query) active = 0;
        const ul = panel.querySelector('ul');
        ul.innerHTML = '';
        if (!list.length) {
          const li = document.createElement('li');
          li.className = 'fb-ship__empty';
          li.textContent = root.dataset.noMatch || '';
          ul.appendChild(li);
          return;
        }
        list.forEach((o, i) => {
          const li = document.createElement('li');
          li.setAttribute('role', 'option');
          li.id = `fb-ship-${o.code}`;
          li.dataset.i = String(i);
          li.setAttribute('aria-selected', String(o.code === hidden.value));
          li.className = `fb-ship__opt${i === active ? ' is-active' : ''}`;
          const name = document.createElement('span');
          name.textContent = o.name;
          const tag = document.createElement('span');
          tag.className = 'fb-ship__code';
          tag.textContent = o.code === hidden.value ? '✓' : o.code === 'ZZ' ? '' : o.code;
          li.append(name, tag);
          li.addEventListener('mouseenter', () => setActive(i));
          li.addEventListener('mousedown', (e) => { e.preventDefault(); show(o.code); close(); btn.focus(); });
          ul.appendChild(li);
        });
        setActive(active);
      };
      const setActive = (i) => {
        active = i;
        panel.querySelectorAll('.fb-ship__opt').forEach((li, j) => li.classList.toggle('is-active', j === i));
        const el = panel.querySelector(`[data-i="${i}"]`);
        if (el) { el.scrollIntoView({ block: 'nearest' }); panel.querySelector('input').setAttribute('aria-activedescendant', el.id); }
      };
      const open = () => {
        panel = document.createElement('div');
        panel.className = 'fb-ship__panel';
        panel.innerHTML = '<div class="fb-ship__search"><input type="text" role="combobox" aria-expanded="true" aria-controls="fb-ship-list" autocomplete="off" spellcheck="false"></div><ul id="fb-ship-list" role="listbox"></ul>';
        const input = panel.querySelector('input');
        input.placeholder = root.dataset.search || '';
        panel.querySelector('ul').setAttribute('aria-label', root.dataset.label || '');
        document.body.appendChild(panel);
        btn.setAttribute('aria-expanded', 'true');
        render('');
        place();
        input.addEventListener('input', () => render(input.value));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(list.length - 1, active + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); if (list[active]) { show(list[active].code); close(); btn.focus(); } }
          else if (e.key === 'Escape') { e.preventDefault(); close(); btn.focus(); }
          else if (e.key === 'Tab') close();
        });
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        document.addEventListener('mousedown', outside, true);
        requestAnimationFrame(() => input.focus());
      };
      btn.addEventListener('click', () => (panel ? close() : open()));
    }

    showReceived(ref, email) {
      if (!this.received) return;

      const minutes = this.promiseMinutes;
      this.startedAt = Date.now();
      this.deadline = this.startedAt + minutes * 60 * 1000;

      const timeLabel = this.formatTime(new Date(this.deadline));
      const values = { email, time: timeLabel, ref, minutes: String(minutes) };

      const body = this.received.querySelector('[data-received-body]');
      if (body) body.textContent = fill(this.dataset.receivedBody, values);

      const refNode = this.received.querySelector('[data-received-ref]');
      if (refNode) {
        refNode.textContent = ref ? fill(this.dataset.receivedRef, values) : '';
        refNode.hidden = !ref;
      }

      const arrives = this.received.querySelector('[data-arrives]');
      if (arrives) {
        arrives.textContent = fill(this.dataset.arrivesBy, values);
        const timeEl = arrives.querySelector('time');
        if (timeEl) timeEl.setAttribute('datetime', new Date(this.deadline).toISOString());
      }

      this.clock = this.received.querySelector('[data-countdown]');
      this.progress = this.received.querySelector('[role="progressbar"]');
      this.progressBar = this.received.querySelector('[data-progress-bar]');
      this.status = this.received.querySelector('[data-status]');
      if (this.status) this.status.textContent = this.dataset.statusSearching || '';

      this.form.hidden = true;
      this.received.hidden = false;
      this.tick();
      this.startCountdown();

      const focusTarget = this.received.querySelector('[data-received-heading]') || this.received;
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus({ preventScroll: false });
      }
    }

    formatTime(date) {
      try {
        return new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      } catch (error) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
    }

    startCountdown() {
      this.stopCountdown();
      this.timer = window.setInterval(this.tick, 1000);
    }

    stopCountdown() {
      if (this.timer) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    }

    tick() {
      if (!this.deadline) return;
      const now = Date.now();
      const total = this.deadline - this.startedAt;
      const remaining = Math.max(0, this.deadline - now);
      const elapsedPct = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 100;

      if (this.clock) {
        const totalSeconds = Math.ceil(remaining / 1000);
        this.clock.textContent = `${pad(totalSeconds / 60)}:${pad(totalSeconds % 60)}`;
      }
      if (this.progress) this.progress.setAttribute('aria-valuenow', String(elapsedPct));
      if (this.progressBar) this.progressBar.style.width = `${elapsedPct}%`;

      if (remaining <= 0) {
        this.stopCountdown();
        if (this.status && this.dataset.statusDue) this.status.textContent = this.dataset.statusDue;
      }
    }

    /* ---------- reset ---------- */

    onReset() {
      this.stopCountdown();
      this.deadline = null;
      if (this.received) this.received.hidden = true;
      if (this.form) {
        this.form.reset();
        this.form.hidden = false;
        Object.values(this.fields).forEach((field) => field && field.removeAttribute('aria-invalid'));
        if (this.linkWrap && this.linkOpen) this.onToggleLink();
        this.hideError();
        if (this.fields.prompt) this.fields.prompt.focus();
      }
    }
  }

  customElements.define('feelbetter-request', FeelbetterRequest);
})();
