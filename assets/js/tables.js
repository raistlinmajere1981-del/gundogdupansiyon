/* Table detail uses the shared public hub and established table media lifecycle. */
(() => {
  const { text: t } = window.GundogduLanguage;

  const labels = {indoor:'İç mekân',outdoor:'Açık alan',terrace:'Teras / veranda',window_side:'Cam kenarı',sea_view:'Deniz manzarası',garden_view:'Bahçe manzarası',quiet_area:'Sakin bölüm',wheelchair_friendly:'Tekerlekli sandalye erişimine uygun',unspecified:'Belirtilmedi',non_smoking:'Sigara içilmez',smoking_allowed:'Sigara içilebilir',outdoor_only:'Yalnız açık alanda sigara içilebilir'};
  const label = value => t(labels[value] || String(value));
  const normalizeMediaUrl = value => window.GundogduPublicData.mediaUrl(value);

  const mediaByKind = (table, kind) => (Array.isArray(table.media) ? table.media : [])
    .filter((media) => media && media.kind === kind && normalizeMediaUrl(media.url))
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  const coverFor = (table) => {
    const cover = mediaByKind(table, "cover")[0] || mediaByKind(table, "photo")[0];
    return cover ? normalizeMediaUrl(cover.url) : "";
  };


  const renderFeatureGrid = table => {
    const root = document.querySelector('[data-table-feature-list]');
    root.replaceChildren();
    for (const feature of Array.isArray(table.features) ? table.features : []) {
      const item = document.createElement('div'); item.className = 'amenity-item';
      item.textContent = label(feature); root.append(item);
    }
    root.hidden = !root.childNodes.length;
  };

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = String(value || "");
    });
  };

  const configurePanoramaCard = (kind, media, cover) => {
    const card = document.querySelector(`[data-table-media-card="${kind}"]`);
    if (!(card instanceof HTMLElement)) return;
    if (!media) {
      card.hidden = true;
      return;
    }
    const url = normalizeMediaUrl(media.url);
    if (!url) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    card.dataset.panoramaSrc = url;
    card.dataset.panoramaTitle = media.title || (kind === "panorama_360" ? t("360° masa görünümü") : t("180° görünüm"));
    card.dataset.panoramaHfov = kind === "panorama_180" ? "85" : "105";
    card.dataset.panoramaYaw = "0";
    card.dataset.panoramaPitch = "0";
    card.dataset.panoramaMinYaw = kind === "panorama_180" ? "-90" : "-180";
    card.dataset.panoramaMaxYaw = kind === "panorama_180" ? "90" : "180";
    const preview = card.querySelector("[data-table-media-preview]");
    if (preview instanceof HTMLImageElement) {
      if (cover) preview.src = cover; else preview.removeAttribute("src");
      preview.alt = "";
    }
  };

  const configureVideoCard = (media, cover) => {
    const card = document.querySelector('[data-table-media-card="video"]');
    const video = document.querySelector("[data-room-video]");
    const source = video?.querySelector("[data-room-video-source]");
    if (!(card instanceof HTMLElement) || !(video instanceof HTMLVideoElement) || !(source instanceof HTMLSourceElement)) return;
    if (!media) {
      card.hidden = true;
      return;
    }
    const url = normalizeMediaUrl(media.url);
    if (!url) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const preview = card.querySelector("[data-table-media-preview]");
    if (preview instanceof HTMLImageElement) {
      if (cover) preview.src = cover; else preview.removeAttribute("src");
      preview.alt = "";
    }
    source.src = url;
    source.type = String(media.mime_type || "video/mp4");
    video.poster = cover || "";
    video.load();
    const title = document.querySelector("[data-room-video-title]");
    if (title) title.textContent = media.title || t("Masa videosu");
  };

  const renderGallery = (table) => {
    const root = document.querySelector("[data-table-photo-gallery]");
    if (!root) return 0;
    root.replaceChildren();
    const candidates = [...mediaByKind(table, "cover"), ...mediaByKind(table, "photo")];
    const seen = new Set();
    let count = 0;
    for (const media of candidates) {
      const url = normalizeMediaUrl(media.url);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      count += 1;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-item";
      button.setAttribute("aria-label", t("{0} fotoğrafı {1} büyüt", {0:table.name || t("Masa"),1:count}));
      const image = document.createElement("img");
      image.src = url;
      image.alt = t("{0} fotoğrafı {1}", {0:table.name || t("Masa"),1:count});
      image.loading = "lazy";
      image.addEventListener('error', () => button.remove(), {once:true});
      button.append(image);
      button.addEventListener("click", () => {
        const dialog = document.querySelector("[data-gallery-dialog]");
        const target = dialog?.querySelector("[data-gallery-image]");
        if (!(dialog instanceof HTMLDialogElement) || !(target instanceof HTMLImageElement)) return;
        target.src = url;
        target.alt = image.alt;
        dialog.showModal();
      });
      root.append(button);
    }
    root.hidden = count === 0;
    return count;
  };

  const renderDetail = (tables) => {
    const root = document.querySelector("[data-table-detail]");
    if (!root) return;

    const tableId = new URLSearchParams(window.location.search).get("id") || "";
    const table = tables.find((candidate) => String(candidate.id || "") === tableId);
    const loading = root.querySelector("[data-table-detail-loading]");
    const content = root.querySelector("[data-table-detail-content]");

    if (!table) {
      document.querySelector('.detail-heading h1').textContent = t('Masa detayları');
      document.querySelector('[data-table-contact-fallback]').hidden = false;
      document.querySelector('meta[name=description]')?.setAttribute('content', t('Masa detayları ve masa bilgileri.'));
      document.title = t('Masa detayları') + ' | Gündoğdu Pansiyon & Restoran';
      document.querySelectorAll('[data-table-cover], [data-table-media-preview]').forEach(node => node.removeAttribute('src'));
      if (loading) {
        loading.className = "room-detail-error";
        loading.textContent = tableId
          ? t("Bu masa artık yayında değil veya bulunamadı.")
          : t("Gösterilecek masa seçilmedi.");
      }
      if (content instanceof HTMLElement) content.hidden = true;
      return;
    }

    if (loading instanceof HTMLElement) loading.hidden = true;
    if (content instanceof HTMLElement) content.hidden = false;

    document.querySelector('[data-table-contact-fallback]').hidden = true;
    document.querySelector('.detail-heading h1').textContent = table.name || t('Masa');
    document.title = `${table.name || t("Masa")} | Gündoğdu Pansiyon & Restoran`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", String(table.description || t("Gündoğdu Pansiyon & Restoran masa detayları.")));

    const heroTitle = document.querySelector(".scenic-page-hero h1");
    if (heroTitle) heroTitle.textContent = table.name || t("Masa");
    const heroDescription = document.querySelector(".scenic-page-hero-content > p:not(.eyebrow)");
    if (heroDescription) heroDescription.textContent = table.description || t("Masa detayları ve masa bilgileri.");

    setText("[data-table-name]", table.name || t("Masa"));
    const descriptionNode = document.querySelector("[data-table-description]");
    if (descriptionNode instanceof HTMLElement) {
      const description = String(table.description || "").trim();
      descriptionNode.textContent = description;
      descriptionNode.hidden = !description;
    }
    setText("[data-table-capacity]", Number(table.capacity) > 0 ? t("{0} kişi", {0:Math.trunc(Number(table.capacity))}) : "");
    setText('[data-table-area]', table.area || '');
    setText('[data-table-smoking]', table.smoking_policy ? t('Sigara politikası') + ': ' + label(table.smoking_policy) : '');
    setText('[data-table-id]', t('Masa kimliği') + ': ' + String(table.id));

    renderFeatureGrid(table);

    const cover = coverFor(table);
    const coverImage = document.querySelector("[data-table-cover]");
    const coverPlaceholder = document.querySelector("[data-table-cover-placeholder]");
    if (coverImage instanceof HTMLImageElement && cover) {
      coverImage.src = cover;
      coverImage.alt = t("{0} fotoğrafı", {0:table.name || t("Masa")});
      coverImage.hidden = false;
      if (coverPlaceholder instanceof HTMLElement) coverPlaceholder.hidden = true;
    } else {
      if (coverImage instanceof HTMLImageElement) coverImage.hidden = true;
      if (coverPlaceholder instanceof HTMLElement) coverPlaceholder.hidden = false;
    }

    const reserve = document.querySelector("[data-table-reserve]");
    if (reserve instanceof HTMLElement) {
      reserve.hidden = document.body.dataset.tableEnabled !== "true";
      reserve.dataset.yaResourceType = "table";
      reserve.dataset.yaResourceId = String(table.id || "");
      reserve.dataset.yaResourceName = String(table.name || "");
      if (cover) reserve.dataset.yaImageUrl = cover;
      else delete reserve.dataset.yaImageUrl;
    }

    const panorama360 = mediaByKind(table, "panorama_360")[0];
    const panorama180 = mediaByKind(table, "panorama_180")[0];
    const video = mediaByKind(table, "video")[0];
    configurePanoramaCard("panorama_360", panorama360, cover);
    configurePanoramaCard("panorama_180", panorama180, cover);
    configureVideoCard(video, cover);
    const galleryCount = renderGallery(table);

    const mediaSection = document.querySelector("[data-table-media-section]");
    if (mediaSection instanceof HTMLElement) {
      mediaSection.hidden = !(panorama360 || panorama180 || video || galleryCount);
    }
  };

  document.querySelectorAll('[data-table-cover], [data-table-media-preview], [data-gallery-image]').forEach(image => {
    image.addEventListener('error', () => {
      image.hidden = true; image.removeAttribute('src');
      if (image.matches('[data-table-cover]')) document.querySelector('[data-table-cover-placeholder]').hidden = false;
      if (image.matches('[data-gallery-image]')) image.closest('dialog').close();
    });
    image.addEventListener('load', () => { image.hidden = false; });
  });
  document.addEventListener('gundogdu:public-data', event => {
    document.querySelectorAll('[data-table-media-section], [data-table-photo-gallery], [data-table-media-card]').forEach(node => { node.hidden = true; });
    const loading = document.querySelector('[data-table-detail-loading]');
    if (loading) loading.hidden = false;
    document.querySelectorAll('[data-table-name], [data-table-description], [data-table-area], [data-table-capacity], [data-table-smoking], [data-table-id]').forEach(node => { node.textContent = ''; });
    const reserve = document.querySelector('[data-table-reserve]');
    reserve.hidden = true;
    ['yaResourceId','yaResourceName','yaImageUrl'].forEach(key => delete reserve.dataset[key]);
    document.querySelector('[data-table-photo-gallery]').replaceChildren();
    document.querySelector('[data-table-feature-list]').replaceChildren();
    document.querySelectorAll('[data-table-cover], [data-table-media-preview], [data-gallery-image]').forEach(node => { node.removeAttribute('src'); node.alt = ''; });
    document.querySelectorAll('[data-table-media-card]').forEach(node => { delete node.dataset.panoramaSrc; });
    const source = document.querySelector('[data-room-video-source]'); source.removeAttribute('src');
    const video = document.querySelector('[data-room-video]'); video.removeAttribute('poster'); video.load();
    renderDetail(event.detail.tables);
  });
})();
