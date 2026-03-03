// Keizer Mobile Detailing — Site UI
// Restores: mobile nav, service "Learn More" modal, Call/Text modal,
// before/after reveal slider, work carousel, reviews rail arrows, footer year.
// Reels: click-to-play with visible PLAY overlay via CSS (overlay fades when playing).

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Footer year
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  const navToggle = $("[data-nav-toggle]");
  const nav = $("[data-nav]");

  if (navToggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("isOpen", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    navToggle.addEventListener("click", () => setOpen(!nav.classList.contains("isOpen")));
    $$("a[href^='#']", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Generic modal helpers
  const openModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.add("isOpen");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.remove("isOpen");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const closeOnOverlay = (modalEl, overlaySelector) => {
    if (!modalEl) return;
    modalEl.addEventListener("click", (e) => {
      const overlay = e.target && e.target.matches && e.target.matches(overlaySelector);
      if (overlay) closeModal(modalEl);
    });
  };

  // Service details modal (Learn More buttons)
  const serviceModal = $("[data-modal]");
  const serviceTitle = $("[data-modal-title]");
  const serviceContent = $("[data-modal-content]");

  const serviceCopy = {
    interior: {
      title: "Interior Detail",
      html: `
        <p>Choose a tier based on condition. We focus on what you notice every day: seats, carpets, plastics, crevices, and odor.</p>
        <div class="tiers">
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Tier 1 — Refresh</div><div class="tier__tag">Light</div></div>
            <ul>
              <li>Thorough vacuum</li>
              <li>Wipe down of surfaces</li>
              <li>Glass cleaned</li>
            </ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Tier 2 — Reset</div><div class="tier__tag">Normal</div></div>
            <ul>
              <li>Deep vacuum (seams/edges)</li>
              <li>Dash/console/doors detailed</li>
              <li>Cupholders + cracks cleaned</li>
            </ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Tier 3 — Deep Clean</div><div class="tier__tag">Heavy</div></div>
            <ul>
              <li>Stains / pet hair focus</li>
              <li>Deep agitation + extraction (as needed)</li>
              <li>Most dramatic transformations</li>
            </ul>
          </div>
        </div>
      `
    },
    exterior: {
      title: "Exterior Detail",
      html: `
        <p>Safe wash methods and details that make the paint look clean and glossy.</p>
        <div class="tiers">
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Level 1 — Safe Wash</div><div class="tier__tag">Light</div></div>
            <ul>
              <li>Foam + hand wash</li>
              <li>Wheels + tires cleaned</li>
              <li>Dry + finish wipe</li>
            </ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Level 2 — Decon Wash</div><div class="tier__tag">Normal</div></div>
            <ul>
              <li>Road film removal</li>
              <li>Extra wheel attention</li>
              <li>Improved gloss & clarity</li>
            </ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Level 3 — Premium</div><div class="tier__tag">Heavy</div></div>
            <ul>
              <li>Neglected cleanup</li>
              <li>More detail work</li>
              <li>Best “new look” finish</li>
            </ul>
          </div>
        </div>
      `
    },
    maintenance: {
      title: "Upkeep Plan",
      html: `
        <p>For returning clients who want their car staying clean all the time.</p>
        <ul>
          <li>Maintenance interior touch-up</li>
          <li>Exterior wash + quick protection (as needed)</li>
          <li>Recommended every 2–4 weeks</li>
        </ul>
      `
    },
    ceramic: {
      title: "Ceramic Coating",
      html: `
        <p>Longer-lasting gloss and easier washes. Great for protection and a consistent shine.</p>
        <ul>
          <li>Wash + decontamination</li>
          <li>Prep work before coating</li>
          <li>Coating applied + cure guidance</li>
        </ul>
      `
    },
    paint: {
      title: "Paint Correction",
      html: `
        <p>Swirl removal and clarity improvement for deeper, cleaner reflections.</p>
        <ul>
          <li>Wash + decontamination</li>
          <li>Machine polishing (as needed)</li>
          <li>Finish refinement for gloss</li>
        </ul>
      `
    }
  };

  $$("[data-modal-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-modal-open");
      const data = key ? serviceCopy[key] : null;
      if (!serviceModal || !data) return;

      if (serviceTitle) serviceTitle.textContent = data.title;
      if (serviceContent) serviceContent.innerHTML = data.html;

      openModal(serviceModal);
    });
  });

  $$("[data-modal-close]").forEach((btn) => btn.addEventListener("click", () => closeModal(serviceModal)));
  closeOnOverlay(serviceModal, "[data-modal-close]");

  // Call/Text modal
  const callModal = $("[data-call-modal]");
  $$("[data-call-open]").forEach((btn) => btn.addEventListener("click", () => openModal(callModal)));
  $$("[data-call-close]").forEach((btn) => btn.addEventListener("click", () => closeModal(callModal)));
  closeOnOverlay(callModal, "[data-call-close]");

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (serviceModal?.classList.contains("isOpen")) closeModal(serviceModal);
    if (callModal?.classList.contains("isOpen")) closeModal(callModal);
  });

  // Before/After compare slider
  $$("[data-compare]").forEach((wrap) => {
    const range = $("[data-compare-range]", wrap);
    if (!range) return;

    const setPos = (val) => wrap.style.setProperty("--pos", `${val}%`);
    setPos(range.value || 12);

    range.addEventListener("input", (e) => setPos(e.target.value));
  });

  // Work carousel (arrows + dots)
  $$("[data-carousel]").forEach((carousel) => {
    const track = $("[data-carousel-track]", carousel);
    const dotsWrap = $("[data-carousel-dots]", carousel);
    const prev = $("[data-carousel-prev]", carousel);
    const next = $("[data-carousel-next]", carousel);
    const slides = track ? $$(":scope .carousel__slide", track) : [];

    if (!track || slides.length === 0) return;

    let idx = 0;

    const renderDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const d = document.createElement("button");
        d.type = "button";
        d.className = "dot" + (i === idx ? " isActive" : "");
        d.addEventListener("click", () => go(i));
        dotsWrap.appendChild(d);
      });
    };

    const go = (i) => {
      idx = Math.max(0, Math.min(i, slides.length - 1));
      track.style.transform = `translateX(${-idx * 100}%)`;
      renderDots();

      const show = slides.length > 1;
      if (prev) prev.style.visibility = show ? "visible" : "hidden";
      if (next) next.style.visibility = show ? "visible" : "hidden";
    };

    prev?.addEventListener("click", () => go(idx - 1));
    next?.addEventListener("click", () => go(idx + 1));
    go(0);
  });

  // Reviews rail arrows (scroll)
  const rail = $("[data-rail]");
  if (rail) {
    const track = $("[data-rail-track]", rail);
    const prev = $("[data-rail-prev]", rail);
    const next = $("[data-rail-next]", rail);

    const scrollByAmount = (dir) => {
      if (!track) return;
      const firstCard = track.querySelector(".rCard");
      const w = firstCard ? firstCard.getBoundingClientRect().width : 320;
      track.scrollBy({ left: dir * (w + 14), behavior: "smooth" });
    };

    prev?.addEventListener("click", () => scrollByAmount(-1));
    next?.addEventListener("click", () => scrollByAmount(1));
  }

  // Reels: click-to-play (pauses others) + toggles .isPlaying for overlay fade
  const reelsRoot = $("[data-reels]");
  if (reelsRoot) {
    const reels = $$("[data-reel]", reelsRoot)
      .map((card) => ({ card, video: $("video", card) }))
      .filter((x) => x.video);

    const pauseAll = () => {
      reels.forEach(({ card, video }) => {
        video.pause();
        card.classList.remove("isPlaying");
      });
    };

    const markState = () => {
      reels.forEach(({ card, video }) => {
        card.classList.toggle("isPlaying", !video.paused);
      });
    };

    const playVideo = async (video) => {
      try { await video.play(); } catch (_) {}
      markState();
    };

    reels.forEach(({ card, video }) => {
      video.addEventListener("play", () => { card.classList.add("isPlaying"); });
      video.addEventListener("pause", () => { card.classList.remove("isPlaying"); });

      video.addEventListener("click", () => {
        if (video.paused) {
          pauseAll();
          playVideo(video);
        } else {
          video.pause();
        }
      });
    });
  }
})();
