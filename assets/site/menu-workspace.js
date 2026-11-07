/* Gündoğdu-only menu UI. Filtering is local; the canonical table-order
   JavaScript remains the sole owner of guest requests and idempotency. */
(() => {
  'use strict';
  const workspace = document.querySelector('[data-gd-menu-workspace]');
  if (!workspace) return;

  // Use the real header height rather than assuming an exact desktop/mobile
  // breakpoint height; the sticky order panel must never sit underneath it.
  const header = document.querySelector('.site-header');
  if (header) {
    const updateHeaderHeight = () => document.body.style.setProperty(
      '--gd-menu-header-height', Math.ceil(header.getBoundingClientRect().height) + 'px'
    );
    updateHeaderHeight();
    if (typeof ResizeObserver === 'function') new ResizeObserver(updateHeaderHeight).observe(header);
  }

  const form = workspace.querySelector('[data-gd-menu-filter]');
  const filter = workspace.querySelector('[data-menu-category]');
  const categories = [...workspace.querySelectorAll('[data-gd-category-id]')];
  const count = workspace.querySelector('[data-gd-visible-count]');
  if (!form || !filter) return;

  const updateCategory = (value, updateAddress = true) => {
    const known = categories.some(section => section.dataset.gdCategoryId === value);
    const selected = value === '' || known ? value : '';
    filter.value = selected;
    let visible = 0;
    for (const category of categories) {
      const show = !selected || category.dataset.gdCategoryId === selected;
      category.hidden = !show;
      if (show) visible += category.querySelectorAll('[data-menu-entry-id]').length;
    }
    if (count) count.textContent = visible + ' ürün';
    if (updateAddress) {
      // Do not discard the table's QR context or language in this URL.
      const url = new URL(window.location.href);
      if (selected) url.searchParams.set('category', selected);
      else url.searchParams.delete('category');
      history.replaceState(history.state, '', url);
    }
  };

  // Open in 'All categories' by default. Explicit category links and later
  // client-side selection remain respected without a page reload.
  const requestedCategory = new URL(window.location.href).searchParams.get('category');
  const fallback = filter.dataset.initialCategory ?? '';
  updateCategory(requestedCategory === null ? fallback : requestedCategory, false);

  form.addEventListener('submit', event => {
    event.preventDefault();
    updateCategory(filter.value);
  });
  // The shared site module has a legacy change -> form.requestSubmit()
  // listener. Capture and stop it here, without changing any common files.
  filter.addEventListener('change', event => {
    event.stopImmediatePropagation();
    updateCategory(filter.value);
  }, {capture:true});
  window.addEventListener('popstate', () => {
    const requested = new URL(window.location.href).searchParams.get('category');
    updateCategory(requested === null ? fallback : requested, false);
  });

  // Responsive order cart: a fixed launcher on mobile, a sticky independent
  // rail on desktop. All actual item manipulation stays in core/table-orders.js.
  const toggle = workspace.querySelector('[data-gd-cart-toggle]');
  const scrim = workspace.querySelector('[data-gd-cart-scrim]');
  const cart = workspace.querySelector('[data-table-order-cart]');
  const itemCount = workspace.querySelector('[data-gd-cart-count]');
  const mobileTotal = workspace.querySelector('[data-gd-cart-total]');
  const canonicalTotal = workspace.querySelector('[data-table-order-total]');
  if (!toggle || !scrim || !cart) return;
  const dismiss = () => {
    workspace.classList.remove('is-cart-open');
    toggle.setAttribute('aria-expanded', 'false');
    scrim.hidden = true;
    const panel = workspace.querySelector('[data-table-order]');
    panel?.removeAttribute('role');
    panel?.removeAttribute('aria-modal');
  };
  const reveal = () => {
    workspace.classList.add('is-cart-open');
    toggle.setAttribute('aria-expanded', 'true');
    scrim.hidden = false;
    // Focus the panel itself: focusing its note field would open the mobile
    // keyboard before the guest chooses to write a note.
    const panel = workspace.querySelector('[data-table-order]');
    panel?.setAttribute('tabindex', '-1');
    panel?.setAttribute('role', 'dialog');
    panel?.setAttribute('aria-modal', 'true');
    panel?.focus({preventScroll:true});
  };
  toggle.addEventListener('click', () => {
    if (workspace.classList.contains('is-cart-open')) dismiss();
    else reveal();
  });
  scrim.addEventListener('click', dismiss);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && workspace.classList.contains('is-cart-open')) {
      dismiss();
      toggle.focus();
    }
  });
  // A desktop resize must not leave an invisible modal overlay capturing taps.
  const desktop = window.matchMedia('(min-width: 821px)');
  desktop.addEventListener('change', event => { if (event.matches) dismiss(); });

  const updateCartIndicator = () => {
    let totalQuantity = 0;
    for (const row of cart.querySelectorAll('.table-order-cart-row')) {
      const quantity = Number(row.querySelector('.table-order-cart-actions > span')?.textContent || 0);
      if (Number.isSafeInteger(quantity) && quantity > 0) totalQuantity += quantity;
    }
    if (itemCount) itemCount.textContent = String(totalQuantity);
    if (mobileTotal) mobileTotal.textContent = canonicalTotal?.textContent || '';
  };
  const observer = new MutationObserver(updateCartIndicator);
  observer.observe(cart, {childList:true,subtree:true,characterData:true});
  if (canonicalTotal) observer.observe(canonicalTotal,{childList:true,subtree:true,characterData:true});
  updateCartIndicator();
})();
