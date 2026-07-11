// Keizer Mobile Detailing — accessible site interactions
// Keyboard navigation, focus-managed dialogs, accessible carousels, form validation,
// reduced-motion support, and click/keyboard video controls.
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- Mobile navigation ---------------- */
  const navToggle = $("[data-nav-toggle]");
  const nav = $("[data-nav]");

  if (navToggle && nav) {
    const setNavOpen = (open, returnFocus = false) => {
      nav.classList.toggle("isOpen", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (!open && returnFocus) navToggle.focus();
    };

    navToggle.addEventListener("click", () => {
      setNavOpen(!nav.classList.contains("isOpen"));
    });

    $$("a", nav).forEach((link) => {
      link.addEventListener("click", () => setNavOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("isOpen")) {
        setNavOpen(false, true);
      }
    });
  }

  /* ---------------- Accessible dialog manager ---------------- */
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  let activeDialog = null;
  const dialogState = new WeakMap();

  const dialogPanel = (modal) => modal?.querySelector("[role='dialog']");

  function getFocusable(modal) {
    return $$(focusableSelector, modal).filter((element) => {
      return !element.hasAttribute("hidden") && element.getClientRects().length > 0;
    });
  }

  function showDialog(modal, returnFocusTarget, options = {}) {
    if (!modal) return;

    if (activeDialog && activeDialog !== modal) {
      hideDialog(activeDialog, { restoreFocus: false });
    }

    const usesHidden = options.usesHidden ?? modal.hasAttribute("hidden");
    dialogState.set(modal, {
      returnFocus: returnFocusTarget || document.activeElement,
      usesHidden,
      onClose: options.onClose || null
    });

    if (usesHidden) modal.hidden = false;
    modal.classList.add("isOpen");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("hasOpenDialog");
    activeDialog = modal;

    window.setTimeout(() => {
      const preferred = options.focusTarget?.() || options.focusTarget;
      const first = preferred || getFocusable(modal)[0] || dialogPanel(modal);
      first?.focus();
    }, 0);
  }

  function hideDialog(modal, options = {}) {
    if (!modal) return;
    const state = dialogState.get(modal) || {};

    modal.classList.remove("isOpen");
    modal.setAttribute("aria-hidden", "true");
    if (state.usesHidden || modal.matches("[data-availability-modal], [data-review-image-modal]")) {
      modal.hidden = true;
    }

    if (activeDialog === modal) activeDialog = null;
    if (!activeDialog) document.body.classList.remove("hasOpenDialog");

    if (typeof state.onClose === "function") state.onClose();

    if (options.restoreFocus !== false) {
      const target = state.returnFocus;
      if (target && typeof target.focus === "function" && document.contains(target)) {
        window.setTimeout(() => target.focus(), 0);
      }
    }
  }

  document.addEventListener("keydown", (event) => {
    if (!activeDialog) return;

    if (event.key === "Escape") {
      event.preventDefault();
      hideDialog(activeDialog);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusable(activeDialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialogPanel(activeDialog)?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------------- Service details dialog ---------------- */
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
        </div>`
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
            <ul><li>Road film removal</li><li>Extra wheel attention</li><li>Improved gloss &amp; clarity</li></ul>
          </div>
          <div class="tier">
            <div class="tier__top"><div class="tier__name">Level 3 — Premium</div><div class="tier__tag">Heavy</div></div>
            <ul><li>Neglected cleanup</li><li>More detail work</li><li>Best “new look” finish</li></ul>
          </div>
        </div>`
    },
    maintenance: {
      title: "Upkeep Plan",
      html: `<p>For returning clients who want their car staying clean all the time.</p><ul><li>Maintenance interior touch-up</li><li>Exterior wash + quick protection (as needed)</li><li>Recommended every 2–4 weeks</li></ul>`
    },
    ceramic: {
      title: "Ceramic Coating",
      html: `<p>Longer-lasting gloss and easier washes. Great for protection and a consistent shine.</p><ul><li>Wash + decontamination</li><li>Prep work before coating</li><li>Coating applied + cure guidance</li></ul>`
    },
    paint: {
      title: "Paint Correction",
      html: `<p>Swirl removal and clarity improvement for deeper, cleaner reflections.</p><ul><li>Wash + decontamination</li><li>Machine polishing (as needed)</li><li>Finish refinement for gloss</li></ul>`
    }
  };

  $$("[data-modal-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const data = serviceCopy[button.getAttribute("data-modal-open")];
      if (!serviceModal || !data) return;
      if (serviceTitle) serviceTitle.textContent = data.title;
      if (serviceContent) serviceContent.innerHTML = data.html;
      showDialog(serviceModal, button);
    });
  });

  $$("[data-modal-close]:not([data-call-open])").forEach((button) => {
    button.addEventListener("click", () => hideDialog(serviceModal));
  });

  /* ---------------- Call / text dialog ---------------- */
  const callModal = $("[data-call-modal]");
  $$("[data-call-open]").forEach((button) => {
    button.addEventListener("click", () => {
      let returnTarget = button;
      const parentModal = button.closest(".modal.isOpen");
      if (parentModal) {
        returnTarget = dialogState.get(parentModal)?.returnFocus || button;
        hideDialog(parentModal, { restoreFocus: false });
      }
      showDialog(callModal, returnTarget);
    });
  });
  $$("[data-call-close]").forEach((button) => {
    button.addEventListener("click", () => hideDialog(callModal));
  });

  /* ---------------- Review image dialog ---------------- */
  const reviewImageModal = $("[data-review-image-modal]");
  const reviewImage = $("[data-review-image-img]");
  $$("[data-review-image-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const source = button.getAttribute("data-review-image-open");
      if (reviewImage && source) reviewImage.src = source;
      showDialog(reviewImageModal, button, { usesHidden: true });
    });
  });
  $$("[data-review-image-close]").forEach((button) => {
    button.addEventListener("click", () => hideDialog(reviewImageModal));
  });

  /* ---------------- Backdrop closing ---------------- */
  document.addEventListener("click", (event) => {
    if (!activeDialog) return;
    const closeSelector = "[data-modal-close], [data-call-close], [data-contact-close], [data-review-image-close], [data-availability-close]";
    const isModalOverlay = event.target.matches(closeSelector) && event.target.classList.contains("modal__overlay");
    const isHiddenDialogOverlay = event.target.matches(".reviewImageModal__overlay, .availabilityModal__overlay");
    if (isModalOverlay || isHiddenDialogOverlay) {
      hideDialog(activeDialog);
    }
  });

  /* ---------------- Before / after controls ---------------- */
  $$("[data-compare]").forEach((wrap) => {
    const range = $("[data-compare-range]", wrap);
    if (!range) return;

    const setPosition = (value) => {
      const numericValue = Math.max(0, Math.min(100, Number(value)));
      wrap.style.setProperty("--pos", `${numericValue}%`);
      range.setAttribute("aria-valuetext", `${numericValue}% of the before image is visible`);
    };

    setPosition(range.value || 12);
    range.addEventListener("input", (event) => setPosition(event.target.value));
  });

  /* ---------------- Work carousel ---------------- */
  $$("[data-carousel]").forEach((carousel) => {
    const track = $("[data-carousel-track]", carousel);
    const dotsWrap = $("[data-carousel-dots]", carousel);
    const previous = $("[data-carousel-prev]", carousel);
    const next = $("[data-carousel-next]", carousel);
    const slides = track ? $$(":scope > .carousel__slide", track) : [];
    if (!track || slides.length === 0) return;

    let index = 0;
    const status = document.createElement("p");
    status.className = "srOnly";
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    carousel.appendChild(status);

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-label", `${slideIndex + 1} of ${slides.length}`);
    });

    const renderDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      slides.forEach((_, slideIndex) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = `dot${slideIndex === index ? " isActive" : ""}`;
        dot.setAttribute("aria-label", `Show transformation ${slideIndex + 1} of ${slides.length}`);
        if (slideIndex === index) dot.setAttribute("aria-current", "true");
        dot.addEventListener("click", () => goTo(slideIndex));
        dotsWrap.appendChild(dot);
      });
    };

    const goTo = (newIndex, announce = true) => {
      index = Math.max(0, Math.min(newIndex, slides.length - 1));
      track.style.transform = `translateX(${-index * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const inactive = slideIndex !== index;
        slide.setAttribute("aria-hidden", String(inactive));
        slide.toggleAttribute("inert", inactive);
      });

      const hasMultiple = slides.length > 1;
      if (previous) {
        previous.hidden = !hasMultiple;
        previous.disabled = index === 0;
      }
      if (next) {
        next.hidden = !hasMultiple;
        next.disabled = index === slides.length - 1;
      }

      renderDots();
      if (announce) status.textContent = `Showing transformation ${index + 1} of ${slides.length}.`;
    };

    previous?.addEventListener("click", () => goTo(index - 1));
    next?.addEventListener("click", () => goTo(index + 1));
    carousel.addEventListener("keydown", (event) => {
      if (event.target.matches("input, select, textarea")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
    });

    goTo(0, false);
  });

  /* ---------------- Reviews rail ---------------- */
  const reviewsRail = $("[data-rail]");
  if (reviewsRail) {
    const track = $("[data-rail-track]", reviewsRail);
    const previous = $("[data-rail-prev]", reviewsRail);
    const next = $("[data-rail-next]", reviewsRail);

    const scrollReviews = (direction) => {
      if (!track) return;
      const firstCard = track.querySelector(".rCard");
      const width = firstCard ? firstCard.getBoundingClientRect().width : 320;
      track.scrollBy({
        left: direction * (width + 14),
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    };

    previous?.addEventListener("click", () => scrollReviews(-1));
    next?.addEventListener("click", () => scrollReviews(1));
    track?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollReviews(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollReviews(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        track.scrollTo({ left: 0, behavior: "auto" });
      } else if (event.key === "End") {
        event.preventDefault();
        track.scrollTo({ left: track.scrollWidth, behavior: "auto" });
      }
    });
  }

  /* ---------------- User-controlled video cards ---------------- */
  const reelsRoot = $("[data-reels]");
  if (reelsRoot) {
    const reels = $$("[data-reel]", reelsRoot)
      .map((card) => ({ card, video: $("video", card), title: $(".reel__title", card)?.textContent.trim() || "Detailing" }))
      .filter(({ video }) => Boolean(video));

    const setCardState = ({ card, video, title }, playing) => {
      card.classList.toggle("isPlaying", playing);
      card.setAttribute("aria-pressed", String(playing));
      card.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${title} video`);
      const text = $(".reel__playText", card);
      if (text) text.textContent = playing ? "PAUSE VIDEO" : "PLAY VIDEO";
      if (!playing && !video.paused) video.pause();
    };

    const pauseAll = (except = null) => {
      reels.forEach((item) => {
        if (item === except) return;
        item.video.pause();
        setCardState(item, false);
      });
    };

    const toggleVideo = async (item) => {
      if (item.video.paused) {
        pauseAll(item);
        try {
          item.video.muted = true;
          item.video.playsInline = true;
          await item.video.play();
        } catch (_) {
          setCardState(item, false);
        }
      } else {
        item.video.pause();
      }
    };

    reels.forEach((item) => {
      item.video.addEventListener("play", () => setCardState(item, true));
      item.video.addEventListener("pause", () => setCardState(item, false));
      item.video.addEventListener("ended", () => setCardState(item, false));
      item.card.addEventListener("click", () => toggleVideo(item));
      item.card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleVideo(item);
        }
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pauseAll();
    });
    reducedMotion.addEventListener?.("change", () => pauseAll());
  }

  /* ---------------- Contact dialog and form ---------------- */
  const contactModal = $("[data-contact-modal]");
  const contactForm = $("[data-contact-form]");
  const contactStatus = $("[data-contact-status]");
  const submitButton = $("[data-contact-submit]");
  const endpoint = window.CONTACT_ENDPOINT || "";
  const spamKeywords = ["seo", "backlink", "guest post", "website traffic", "crypto", "forex", "viagra", "casino", "loan approval", "telegram"];

  function resetContactState() {
    if (!contactForm) return;
    $$("[aria-invalid='true']", contactForm).forEach((field) => field.removeAttribute("aria-invalid"));
    contactForm.removeAttribute("aria-busy");
    if (contactStatus) {
      contactStatus.textContent = "";
      contactStatus.className = "contactStatus";
      contactStatus.setAttribute("role", "status");
      contactStatus.setAttribute("aria-live", "polite");
    }
    if (submitButton) submitButton.disabled = false;
  }

  function setContactStatus(message, type = "", focus = false) {
    if (!contactStatus) return;
    contactStatus.textContent = message;
    contactStatus.className = `contactStatus${type ? ` is${type}` : ""}`;
    contactStatus.setAttribute("role", type === "Err" ? "alert" : "status");
    contactStatus.setAttribute("aria-live", type === "Err" ? "assertive" : "polite");
    if (focus) contactStatus.focus();
  }

  function markInvalid(field) {
    field?.setAttribute("aria-invalid", "true");
  }

  $$("[data-contact-open]").forEach((button) => {
    button.addEventListener("click", () => {
      resetContactState();
      showDialog(contactModal, button, {
        focusTarget: () => contactForm?.querySelector("input[name='name']")
      });
    });
  });

  $$("[data-contact-close]").forEach((button) => {
    button.addEventListener("click", () => {
      hideDialog(contactModal);
      contactForm?.reset();
      resetContactState();
    });
  });

  contactForm?.addEventListener("input", (event) => {
    event.target.removeAttribute?.("aria-invalid");
  });

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetContactState();

    const nameField = contactForm.elements.namedItem("name");
    const phoneField = contactForm.elements.namedItem("phone");
    const emailField = contactForm.elements.namedItem("email");
    const methodField = contactForm.elements.namedItem("preferredContact");
    const messageField = contactForm.elements.namedItem("message");
    const honeypotField = contactForm.elements.namedItem("website");

    const name = String(nameField?.value || "").trim();
    const phone = String(phoneField?.value || "").trim();
    const email = String(emailField?.value || "").trim();
    const preferredContact = String(methodField?.value || "phone").trim();
    const message = String(messageField?.value || "").trim();
    const honeypot = String(honeypotField?.value || "").trim();

    const combined = `${honeypot} ${message} ${email}`.toLowerCase();
    const looksLikeSpam = honeypot || spamKeywords.some((keyword) => combined.includes(keyword));
    if (looksLikeSpam) {
      setContactStatus("Message blocked. Please remove promotional or spam-like wording and try again.", "Err", true);
      return;
    }

    const errors = [];
    if (!name) {
      markInvalid(nameField);
      errors.push({ field: nameField, message: "Enter your name." });
    }
    if (!message) {
      markInvalid(messageField);
      errors.push({ field: messageField, message: "Enter a message." });
    }
    if (email && emailField && !emailField.validity.valid) {
      markInvalid(emailField);
      errors.push({ field: emailField, message: "Enter a valid email address." });
    }
    if (preferredContact === "phone" && !phone) {
      markInvalid(phoneField);
      errors.push({ field: phoneField, message: "Enter your phone number because phone is selected as your preferred contact method." });
    }
    if (preferredContact === "email" && !email) {
      markInvalid(emailField);
      errors.push({ field: emailField, message: "Enter your email address because email is selected as your preferred contact method." });
    }

    if (errors.length) {
      setContactStatus(errors.map((error) => error.message).join(" "), "Err");
      errors[0].field?.focus();
      return;
    }

    if (!endpoint) {
      setContactStatus("The contact form is temporarily unavailable. Please call or text (971) 286-5503.", "Err", true);
      return;
    }

    contactForm.setAttribute("aria-busy", "true");
    if (submitButton) submitButton.disabled = true;
    setContactStatus("Sending your message…");

    const payload = {
      name,
      phone,
      email,
      preferredContact,
      message,
      page: location.href,
      userAgent: navigator.userAgent,
      submittedAt: new Date().toISOString()
    };

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      contactForm.removeAttribute("aria-busy");
      contactForm.reset();
      setContactStatus("Sent. We’ll reach out shortly.", "Ok", true);
      if (typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", {
          event_category: "engagement",
          event_label: "contact_form_success"
        });
      }
    } catch (error) {
      console.error(error);
      contactForm.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
      setContactStatus("Something went wrong. Please call or text (971) 286-5503.", "Err", true);
    }
  });

  /* ---------------- Availability notice ---------------- */
  const availabilityModal = $("[data-availability-modal]");
  const availabilityStorageKey = "kmdAvailabilityNoticeClosed_v1";

  const shouldShowAvailability = () => {
    try {
      return sessionStorage.getItem(availabilityStorageKey) !== "true";
    } catch (_) {
      return true;
    }
  };

  const markAvailabilityClosed = () => {
    try {
      sessionStorage.setItem(availabilityStorageKey, "true");
    } catch (_) {}
  };

  $$("[data-availability-close]").forEach((button) => {
    button.addEventListener("click", () => hideDialog(availabilityModal));
  });

  if (availabilityModal && shouldShowAvailability()) {
    window.setTimeout(() => {
      showDialog(availabilityModal, document.activeElement, {
        usesHidden: true,
        onClose: markAvailabilityClosed
      });
    }, reducedMotion.matches ? 0 : 650);
  }
})();
