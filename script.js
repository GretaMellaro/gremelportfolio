document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => nav.classList.remove("open"));
    });
  }

  // Hero click-to-reveal lines — click anywhere in the hero, or reveal on scroll
  const hero = document.querySelector(".hero");
  const heroCopy = document.getElementById("heroCopy");
  if (hero && heroCopy) {
    let step = 0;
    const lines = heroCopy.querySelectorAll(".line");
    const pulseDot = document.getElementById("pulseDot");

    function smoothScrollTo(target, duration) {
      const startY = window.scrollY;
      const targetY = target.getBoundingClientRect().top + window.scrollY;
      const distance = targetY - startY;
      const startTime = performance.now();

      function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function step_() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step_);
      }
      requestAnimationFrame(step_);
    }

    function revealNext() {
      if (step < 3) {
        step++;
        lines[step].classList.add("visible");
        if (step >= 3 && pulseDot) {
          pulseDot.style.display = "none";
        }
      } else {
        const projects = document.getElementById("projects");
        if (projects) smoothScrollTo(projects, 550);
      }
    }

    function revealAll() {
      const interval = setInterval(() => {
        if (step < 3) {
          step++;
          lines[step].classList.add("visible");
        } else {
          clearInterval(interval);
          if (pulseDot) pulseDot.style.display = "none";
        }
      }, 250);
    }

    hero.addEventListener("click", revealNext);
    window.addEventListener("scroll", revealAll, { once: true, passive: true });
  }

  // Project photo lightbox — click a photo to enlarge, navigate with arrows, close with the × or Esc
  const galleryImages = document.querySelectorAll(".col-images .img-block img");
  if (galleryImages.length) {
    const imgList = Array.from(galleryImages);
    let currentIndex = 0;

    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.innerHTML =
      '<button class="lightbox-nav lightbox-prev" aria-label="Previous photo">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>' +
      '<div class="lightbox-stage">' +
      '<button class="lightbox-close" aria-label="Close">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<img class="lightbox-img" src="" alt="">' +
      '</div>' +
      '<button class="lightbox-nav lightbox-next" aria-label="Next photo">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M5 12h14M12 5l7 7-7 7"/></svg></button>';
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector(".lightbox-close");
    const prevBtn = overlay.querySelector(".lightbox-prev");
    const nextBtn = overlay.querySelector(".lightbox-next");
    const lightboxImg = overlay.querySelector(".lightbox-img");
    const hasMultiple = imgList.length > 1;
    prevBtn.style.display = hasMultiple ? "" : "none";
    nextBtn.style.display = hasMultiple ? "" : "none";

    function showImage(index) {
      currentIndex = (index + imgList.length) % imgList.length;
      const img = imgList[currentIndex];
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      resetZoom(false);
    }
    function openLightbox(index) {
      showImage(index);
      overlay.classList.add("open");
      document.body.classList.add("lightbox-locked");
    }
    function closeLightbox() {
      overlay.classList.remove("open");
      document.body.classList.remove("lightbox-locked");
      resetZoom(false);
    }

    // Pinch-to-zoom, drag-to-pan and double-tap-to-zoom on touch devices
    const stage = overlay.querySelector(".lightbox-stage");
    let scale = 1, translateX = 0, translateY = 0;
    let startDistance = 0, startScale = 1;
    let isPanning = false, panStartX = 0, panStartY = 0, startTranslateX = 0, startTranslateY = 0;
    let lastTapTime = 0, lastTapX = 0, lastTapY = 0;

    function applyTransform(animated) {
      lightboxImg.style.transition = animated ? "transform 0.2s ease" : "none";
      lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    function resetZoom(animated) {
      scale = 1; translateX = 0; translateY = 0;
      applyTransform(animated);
    }
    function clampTranslate() {
      const maxX = (lightboxImg.offsetWidth * scale - lightboxImg.offsetWidth) / 2 + 40;
      const maxY = (lightboxImg.offsetHeight * scale - lightboxImg.offsetHeight) / 2 + 40;
      translateX = Math.max(-maxX, Math.min(maxX, translateX));
      translateY = Math.max(-maxY, Math.min(maxY, translateY));
    }
    function touchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    stage.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        startDistance = touchDistance(e.touches);
        startScale = scale;
        isPanning = false;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const now = Date.now();
        const isDoubleTap =
          now - lastTapTime < 300 &&
          Math.abs(touch.clientX - lastTapX) < 30 &&
          Math.abs(touch.clientY - lastTapY) < 30;
        if (isDoubleTap) {
          if (scale > 1) {
            resetZoom(true);
          } else {
            scale = 2.5;
            applyTransform(true);
          }
          lastTapTime = 0;
        } else {
          lastTapTime = now;
          lastTapX = touch.clientX;
          lastTapY = touch.clientY;
        }
        if (scale > 1) {
          isPanning = true;
          panStartX = touch.clientX;
          panStartY = touch.clientY;
          startTranslateX = translateX;
          startTranslateY = translateY;
        }
      }
    }, { passive: true });

    stage.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = touchDistance(e.touches);
        scale = Math.min(4, Math.max(1, startScale * (dist / startDistance)));
        clampTranslate();
        applyTransform(false);
      } else if (e.touches.length === 1 && isPanning && scale > 1) {
        e.preventDefault();
        const touch = e.touches[0];
        translateX = startTranslateX + (touch.clientX - panStartX);
        translateY = startTranslateY + (touch.clientY - panStartY);
        clampTranslate();
        applyTransform(false);
      }
    }, { passive: false });

    stage.addEventListener("touchend", (e) => {
      if (e.touches.length === 0) {
        isPanning = false;
        if (scale < 1.02) resetZoom(true);
      }
    });

    imgList.forEach((img, index) => {
      img.addEventListener("click", () => openLightbox(index));
    });
    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", () => showImage(currentIndex - 1));
    nextBtn.addEventListener("click", () => showImage(currentIndex + 1));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft" && hasMultiple) showImage(currentIndex - 1);
      if (e.key === "ArrowRight" && hasMultiple) showImage(currentIndex + 1);
    });
  }
});

function sendLazyMail(e) {
  e.preventDefault();
  const name = document.getElementById("p-name").value;
  const email = document.getElementById("p-email").value;
  const subject = encodeURIComponent("Portfolio contact from " + name);
  const body = encodeURIComponent(
    "Hi Greta, I'd like to get in touch.\n\n— " + name + " (" + email + ")"
  );
  window.location.href = `mailto:gretamellaro@yahoo.com?subject=${subject}&body=${body}`;
  return false;
}
