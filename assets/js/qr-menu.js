/* BlackSea QR category and menu renderer, driven by the shared Gündoğdu snapshot. */
(() => {
  const { text: t, locale } = window.GundogduLanguage;
  const root = document.querySelector("[data-qr-menu-root]");
  if (!root) return;

  const tabs = root.querySelector("[data-qr-menu-tabs]");
  const list = root.querySelector("[data-qr-menu-list]");
  const status = root.querySelector("[data-qr-menu-status]");
  const updated = root.querySelector("[data-qr-menu-updated]");
  const state = {
    activeCategoryId: "all",
    categories: [],
    items: [],
    updatedAt: ""
  };
  const formatterCache = new Map();

  const normalizeImageUrl = value => window.GundogduPublicData.mediaUrl(value);
  const formatPrice = (price, currency) => {
    if (price === null || price === undefined || price === "" || !Number.isFinite(Number(price)) || Number(price) < 0) return "";
    if (!/^[A-Z]{3}$/.test(String(currency || ""))) return "";
    const code = currency;
    if (!formatterCache.has(code)) {
      formatterCache.set(code, new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 2 }));
    }
    return formatterCache.get(code).format(Number(price));
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  };

  const visibleCategories = () => state.activeCategoryId === "all"
    ? state.categories
    : state.categories.filter((category) => category.id === state.activeCategoryId);

  const renderTabs = () => {
    tabs.replaceChildren();
    const categories = [{ id: "all", name: t("Tüm Ürünler") }, ...state.categories];
    for (const category of categories) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.categoryId = String(category.id);
      button.textContent = category.name || "Kategori";
      const active = state.activeCategoryId === category.id;
      button.className = active ? "is-active" : "";
      button.setAttribute("aria-pressed", String(active));
      button.addEventListener("click", () => {
        state.activeCategoryId = category.id;
        render();
        const selected = [...tabs.querySelectorAll("button")].find(node => node.dataset.categoryId === String(category.id));
        selected?.focus({ preventScroll: true });
        selected?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      tabs.append(button);
    }
  };

  const createMenuItem = (item) => {
    const article = document.createElement("article");
    article.className = "qr-menu-item";

    const imageUrl = normalizeImageUrl(item.image_url);
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = item.name || t("Menü ürünü");
      image.loading = "lazy";
      image.addEventListener("error", () => { image.remove(); article.classList.add("no-image"); });
      article.append(image);
    } else {
      article.classList.add("no-image");
    }

    const body = document.createElement("div");
    body.className = "qr-menu-item-body";

    const titleRow = document.createElement("div");
    titleRow.className = "qr-menu-item-title";
    const title = document.createElement("strong");
    title.textContent = item.name || t("Ürün");
    if (item.is_featured) title.classList.add("is-featured");
    const price = document.createElement("span");
    price.textContent = formatPrice(item.price, item.currency);
    titleRow.append(title, price);
    body.append(titleRow);

    if (item.description) {
      const description = document.createElement("p");
      description.textContent = item.description;
      body.append(description);
    }

    if (Array.isArray(item.tags) && item.tags.length) {
      const tags = document.createElement("div");
      tags.className = "qr-menu-tags";
      for (const tag of item.tags.slice(0, 4)) {
        const chip = document.createElement("span");
        chip.textContent = tag;
        tags.append(chip);
      }
      body.append(tags);
    }

    article.append(body);
    return article;
  };

  const renderMenu = () => {
    list.replaceChildren();

    const sections = visibleCategories()
      .map((category) => ({
        category,
        items: state.items.filter((item) => item.category_id === category.id)
      }))
      .filter((section) => section.items.length);

    if (!sections.length) {
      const empty = document.createElement("div");
      empty.className = "qr-menu-empty";
      empty.textContent = t("Bu kategori için aktif ürün bulunmuyor.");
      list.append(empty);
      return;
    }

    for (const { category, items } of sections) {
      const section = document.createElement("section");
      section.className = "qr-menu-category";
      const heading = document.createElement("div");
      heading.className = "qr-menu-category-heading";

      const title = document.createElement("h2");
      title.textContent = category.name || "Kategori";
      heading.append(title);

      if (category.description) {
        const description = document.createElement("p");
        description.textContent = category.description;
        heading.append(description);
      }

      const grid = document.createElement("div");
      grid.className = "qr-menu-grid";
      for (const item of items) grid.append(createMenuItem(item));

      section.append(heading, grid);
      list.append(section);
    }
  };

  const render = () => {
    renderTabs();
    renderMenu();
    updated.textContent = state.updatedAt
      ? t("Güncelleme: ") + formatDate(state.updatedAt)
      : t("Güncelleme bekleniyor.");
    status.textContent = "";
  };

  document.addEventListener('gundogdu:public-data', event => {
    const m = event.detail;
    state.categories = m.menu.categories;
    state.items = m.menu.items.filter(item => item.is_available !== false);
    state.updatedAt = m.menu.updated_at || '';
    if (!state.categories.some(category => category.id === state.activeCategoryId)) state.activeCategoryId = 'all';
    render();
    if (!m.menuEnabled) status.textContent = t(m.menuUnavailable ? 'Menüye şu anda ulaşılamıyor. Lütfen yeniden deneyin.' : 'Menümüz şu anda yayında değil.');
  });
})();
