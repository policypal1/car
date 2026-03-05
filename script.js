// Keizer Mobile Detailing — Site UI
// Mobile nav, modals, compare slider, work carousel, reviews rail, footer year.
// Reels: click-to-play anywhere on the card + autoplay when visible (muted, mobile only).
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
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
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

  // Service details modal
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
            <ul><li>Thorough vacuum</li><li>Wipe down of surfaces</li><li>Glass cleaned</li></ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Tier 2 — Reset</div><div class="tier__tag">Normal</div></div>
            <ul><li>Deep vacuum (seams/edges)</li><li>Dash/console/doors detailed</li><li>Cupholders + cracks cleaned</li></ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Tier 3 — Deep Clean</div><div class="tier__tag">Heavy</div></div>
            <ul><li>Stains / pet hair focus</li><li>Deep agitation + extraction (as needed)</li><li>Most dramatic transformations</li></ul>
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
            <ul><li>Foam + hand wash</li><li>Wheels + tires cleaned</li><li>Dry + finish wipe</li></ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Level 2 — Decon Wash</div><div class="tier__tag">Normal</div></div>
            <ul><li>Road film removal</li><li>Extra wheel attention</li><li>Improved gloss & clarity</li></ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Level 3 — Premium</div><div class="tier__tag">Heavy</div></div>
            <ul><li>Neglected cleanup</li><li>More detail work</li><li>Best "new look" finish</li></ul>
          </div>
        </div>
      `
    },
    maintenance: {
      title: "Upkeep Plan",
      html: `
        <p>For returning clients who want their car staying clean all the time.</p>
        <ul><li>Maintenance interior touch-up</li><li>Exterior wash + quick protection (as needed)</li><li>Recommended every 2–4 weeks</li></ul>
      `
    },
    ceramic: {
      title: "Ceramic Coating",
      html: `
        <p>Longer-lasting gloss and easier washes. Great for protection and a consistent shine.</p>
        <ul><li>Wash + decontamination</li><li>Prep work before coating</li><li>Coating applied + cure guidance</li></ul>
      `
    },
    paint: {
      title: "Paint Correction",
      html: `
        <p>Swirl removal and clarity improvement for deeper, cleaner reflections.</p>
        <ul><li>Wash + decontamination</li><li>Machine polishing (as needed)</li><li>Finish refinement for gloss</li></ul>
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

  // Reviews rail arrows
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

  // Reels: click-to-play on desktop; autoplay on mobile when visible (swipe freely)
  const reelsRoot = $("[data-reels]");
  if (reelsRoot) {
    const reels = $$("[data-reel]", reelsRoot)
      .map((card) => ({ card, video: $("video", card) }))
      .filter((x) => x.video);

    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

    const pauseAll = () => {
      reels.forEach(({ card, video }) => {
        video.pause();
        card.classList.remove("isPlaying");
      });
    };

    const safePlay = async (video) => {
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
      } catch (_) {}
    };

    // Ensure a frame is visible (no black thumbnail)
    const warmThumb = (video) => {
      try {
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.load();

        const onLoaded = async () => {
          try { video.currentTime = 0.05; } catch (_) {}
          // Do NOT auto-play — just seek to get a thumbnail frame
          video.removeEventListener("loadeddata", onLoaded);
        };

        video.addEventListener("loadeddata", onLoaded, { once: true });
      } catch (_) {}
    };

    reels.forEach(({ video }) => warmThumb(video));

    // play/pause state class
    reels.forEach(({ card, video }) => {
      video.addEventListener("play", () => card.classList.add("isPlaying"));
      video.addEventListener("pause", () => card.classList.remove("isPlaying"));
    });

    // ── DESKTOP: click card to toggle play/pause (no autoplay) ──
    if (!isMobile()) {
      reels.forEach(({ card, video }) => {
        card.addEventListener("click", () => {
          if (video.paused) {
            pauseAll();
            safePlay(video);
          } else {
            video.pause();
          }
        });
      });
    }

    // ── MOBILE: autoplay the most-visible reel; swiping pauses naturally ──
    if (isMobile()) {
      // Click still toggles on mobile too
      reels.forEach(({ card, video }) => {
        card.addEventListener("click", () => {
          if (video.paused) {
            pauseAll();
            safePlay(video);
          } else {
            video.pause();
          }
        });
      });

      const io = new IntersectionObserver(
        (entries) => {
          // Find the most-visible reel
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

          if (!visible) return;

          reels.forEach(({ video, card }) => {
            if (card === visible.target) {
              if (video.paused) safePlay(video);
            } else {
              video.pause();
            }
          });
        },
        { threshold: [0, 0.35, 0.65, 0.85] }
      );

      reels.forEach(({ card }) => io.observe(card));
    }
  }
})();

/* ==========================
   CONTACT MODAL + SUBMIT
   ========================== */
(function () {
  const modal = document.querySelector("[data-contact-modal]");
  if (!modal) return;

  const openBtns = document.querySelectorAll("[data-contact-open]");
  const closeBtns = document.querySelectorAll("[data-contact-close]");
  const form = document.querySelector("[data-contact-form]");
  const statusEl = document.querySelector("[data-contact-status]");
  const submitBtn = document.querySelector("[data-contact-submit]");

  const endpoint = window.CONTACT_ENDPOINT || "";

  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("isModalOpen");
    // focus first input for faster conversion
    setTimeout(() => {
      const first = form?.querySelector("input[name='name']");
      first?.focus();
    }, 50);
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("isModalOpen");
    if (statusEl) statusEl.textContent = "";
    if (statusEl) statusEl.className = "contactStatus";
    form?.reset();
    submitBtn && (submitBtn.disabled = false);
  }

  openBtns.forEach((b) => b.addEventListener("click", openModal));
  closeBtns.forEach((b) => b.addEventListener("click", closeModal));

  // close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
  });

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "contactStatus" + (type ? ` is${type}` : "");
  }

  function normalizePhone(p) {
    return (p || "").trim();
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = (form.querySelector("input[name='name']")?.value || "").trim();
    const phone = normalizePhone(form.querySelector("input[name='phone']")?.value || "");
    const message = (form.querySelector("textarea[name='message']")?.value || "").trim();
    const honeypot = (form.querySelector("input[name='website']")?.value || "").trim();

    if (honeypot) {
      setStatus("Thanks! We’ll be in touch.", "Ok");
      submitBtn && (submitBtn.disabled = true);
      setTimeout(closeModal, 800);
      return;
    }

    if (!name || !phone || !message) {
      setStatus("Please fill out name, phone, and your message.", "Err");
      return;
    }

    if (!endpoint || endpoint.includes("PASTE_YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE")) {
      setStatus("Form is not connected yet. Add your Google Script URL (CONTACT_ENDPOINT).", "Err");
      return;
    }

    submitBtn && (submitBtn.disabled = true);
    setStatus("Sending…", "");

    try {
      const payload = {
        name,
        phone,
        message,
        page: location.href,
        userAgent: navigator.userAgent,
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok || (data && data.ok === false)) {
        throw new Error((data && data.error) || "Request failed.");
      }

      setStatus("✅ Sent! We’ll reach out shortly.", "Ok");
      setTimeout(closeModal, 1100);
    } catch (err) {
      submitBtn && (submitBtn.disabled = false);
      setStatus("Something went wrong. Please call/text (971) 286-5503.", "Err");
      console.error(err);
    }
  });
})();
