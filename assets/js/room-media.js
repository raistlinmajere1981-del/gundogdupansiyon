/* BlackSea dialog and Pannellum lifecycle adapted to Gündoğdu. */
(() => {
const {text:t} = window.GundogduLanguage;
  const panoramaDialog = document.querySelector("[data-panorama-dialog]");
  const panoramaTitle = panoramaDialog?.querySelector("[data-panorama-title]");
  const videoDialog = document.querySelector("[data-video-dialog]");
  const roomVideo = videoDialog?.querySelector("[data-room-video]");
  const galleryDialog = document.querySelector("[data-gallery-dialog]");
  const galleryImage = galleryDialog?.querySelector("[data-gallery-image]");
  let panorama = null;

  const destroyPanorama = () => {
    panorama?.destroy?.();
    panorama = null;
    const viewer = document.getElementById("panorama-viewer");
    if (viewer) viewer.innerHTML = "";
  };

  const stopVideo = () => {
    if (!roomVideo) return;
    roomVideo.pause();
    roomVideo.currentTime = 0;
  };

  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    let pointerStartedOnBackdrop = false;

    dialog.addEventListener("pointerdown", (event) => {
      pointerStartedOnBackdrop = event.target === dialog;
    });

    dialog.addEventListener("pointerup", (event) => {
      const endedOnBackdrop = event.target === dialog;
      if (pointerStartedOnBackdrop && endedOnBackdrop) {
        dialog.close();
      }
      pointerStartedOnBackdrop = false;
    });

    dialog.addEventListener("pointercancel", () => {
      pointerStartedOnBackdrop = false;
    });
  });

  panoramaDialog?.addEventListener("close", destroyPanorama);
  videoDialog?.addEventListener("close", stopVideo);

  document.addEventListener('gundogdu:public-data', () => {
    [panoramaDialog, videoDialog, galleryDialog].forEach(dialog => { if (dialog?.open) dialog.close(); });
  });
  const readNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  document.querySelectorAll("[data-open-panorama]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!panoramaDialog || typeof window.pannellum === "undefined") return;

      const source = button.dataset.panoramaSrc?.trim();
      if (!source) return;

      destroyPanorama();
      if (panoramaTitle) {
        panoramaTitle.textContent = button.dataset.panoramaTitle || t("Panoramik görünüm");
      }

      panoramaDialog.showModal();
      panorama = window.pannellum.viewer("panorama-viewer", {
        type: "equirectangular",
        panorama: source,
        haov: (button.dataset.roomMediaCard || button.dataset.tableMediaCard) === "panorama_180" ? 180 : 360,
        autoLoad: true,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        compass: false,
        hfov: readNumber(button.dataset.panoramaHfov, 100),
        yaw: readNumber(button.dataset.panoramaYaw, 0),
        pitch: readNumber(button.dataset.panoramaPitch, 0),
        minYaw: readNumber(button.dataset.panoramaMinYaw, -180),
        maxYaw: readNumber(button.dataset.panoramaMaxYaw, 180)
      });
    });
  });

  document.querySelectorAll("[data-open-video]").forEach((button) => {
    button.addEventListener("click", () => videoDialog?.showModal());
  });

})();
