// Keizer Mobile Detailing
// script.js
// Site UI, modals, sliders, reels, review image modal, lead tracking, and contact form handling.

window.CONTACT_ENDPOINT = window.CONTACT_ENDPOINT || "https://script.google.com/macros/s/AKfycbxZQ_Jf4Rp27mL9nyRn_2oAVtwt_RIhXskoB2GjTmyJYGLBdkd7LKgKNNOK457clicn/exec";

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

  // Work carousel
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

  // Reels
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

    const warmThumb = (video) => {
      try {
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.load();

        const onLoaded = async () => {
          try { video.currentTime = 0.05; } catch (_) {}
          video.removeEventListener("loadeddata", onLoaded);
        };

        video.addEventListener("loadeddata", onLoaded, { once: true });
      } catch (_) {}
    };

    reels.forEach(({ video }) => warmThumb(video));

    reels.forEach(({ card, video }) => {
      video.addEventListener("play", () => card.classList.add("isPlaying"));
      video.addEventListener("pause", () => card.classList.remove("isPlaying"));
    });

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

    if (isMobile()) {
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

/* CONTACT MODAL + SUBMIT */
(function () {
  const modal = document.querySelector("[data-contact-modal]");
  if (!modal) return;

  const openBtns = document.querySelectorAll("[data-contact-open]");
  const closeBtns = document.querySelectorAll("[data-contact-close]");
  const form = document.querySelector("[data-contact-form]");
  const statusEl = document.querySelector("[data-contact-status]");
  const submitBtn = document.querySelector("[data-contact-submit]");

  const endpoint = window.CONTACT_ENDPOINT || "";

  function openContact() {
    modal.classList.add("isOpen");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      const first = form?.querySelector("input[name='name']");
      first?.focus();
    }, 50);
  }

  function closeContact() {
    modal.classList.remove("isOpen");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (statusEl) statusEl.textContent = "";
    if (statusEl) statusEl.className = "contactStatus";
    form?.reset();
    if (submitBtn) submitBtn.disabled = false;
  }

  openBtns.forEach((b) => b.addEventListener("click", openContact));
  closeBtns.forEach((b) => b.addEventListener("click", closeContact));

  modal.addEventListener("click", (e) => {
    if (e.target && e.target.matches && e.target.matches("[data-contact-close]")) closeContact();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("isOpen")) closeContact();
  });

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "contactStatus" + (type ? ` is${type}` : "");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = (form.querySelector("input[name='name']")?.value || "").trim();
    const phone = (form.querySelector("input[name='phone']")?.value || "").trim();
    const email = (form.querySelector("input[name='email']")?.value || "").trim();
    const preferredContact = (form.querySelector("select[name='preferredContact']")?.value || "phone").trim();
    const message = (form.querySelector("textarea[name='message']")?.value || "").trim();
    const honeypot = (form.querySelector("input[name='website']")?.value || "").trim();

    if (honeypot) {
      setStatus("✅ Sent! We’ll reach out shortly.", "Ok");
      if (submitBtn) submitBtn.disabled = true;
      setTimeout(closeContact, 800);
      return;
    }

    if (!name || !message) {
      setStatus("Please fill out your name and message.", "Err");
      return;
    }

    if (preferredContact === "phone" && !phone) {
      setStatus("Please enter your phone number if you want to be contacted by phone.", "Err");
      return;
    }

    if (preferredContact === "email" && !email) {
      setStatus("Please enter your email if you want to be contacted by email.", "Err");
      return;
    }

    if (!endpoint) {
      setStatus("Form is not connected yet (missing CONTACT_ENDPOINT).", "Err");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setStatus("Sending…", "");

    const payload = {
      name,
      phone,
      email,
      preferredContact,
      message,
      page: location.href,
      userAgent: navigator.userAgent,
      submittedAt: new Date().toISOString(),
    };

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      setStatus("✅ Sent! We’ll reach out shortly.", "Ok");
      setTimeout(closeContact, 1100);
    } catch (err) {
      console.error(err);
      if (submitBtn) submitBtn.disabled = false;
      setStatus("Something went wrong. Please call/text (971) 286-5503.", "Err");
    }
  });
})();


// =========================================================
// Premium campaign helpers and page-specific enhancements
// =========================================================

window.CONTACT_ENDPOINT = "https://script.google.com/macros/s/AKfycbxZQ_Jf4Rp27mL9nyRn_2oAVtwt_RIhXskoB2GjTmyJYGLBdkd7LKgKNNOK457clicn/exec";

document.addEventListener("DOMContentLoaded", function () {
        const lazyBackgrounds = Array.from(document.querySelectorAll("[data-bg]"));
        const lazyCompares = Array.from(document.querySelectorAll(".compare[data-before][data-after]"));

        function loadBackground(el) {
          const bg = el.getAttribute("data-bg");
          if (!bg) return;
          el.style.backgroundImage = `url('${bg}')`;
          el.removeAttribute("data-bg");
        }

        function loadCompare(el) {
          const before = el.getAttribute("data-before");
          const after = el.getAttribute("data-after");
          if (before) el.style.setProperty("--before", `url('${before}')`);
          if (after) el.style.setProperty("--after", `url('${after}')`);
          el.removeAttribute("data-before");
          el.removeAttribute("data-after");
        }

        if ("IntersectionObserver" in window) {
          const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
              if (!entry.isIntersecting) return;
              const el = entry.target;
              if (el.hasAttribute("data-bg")) loadBackground(el);
              if (el.matches(".compare")) loadCompare(el);
              obs.unobserve(el);
            });
          }, { rootMargin: "180px 0px" });

          lazyBackgrounds.forEach(el => observer.observe(el));
          lazyCompares.forEach(el => observer.observe(el));
        } else {
          lazyBackgrounds.forEach(loadBackground);
          lazyCompares.forEach(loadCompare);
        }
      });

document.addEventListener("DOMContentLoaded", function () {
        const quoteButtons = document.querySelectorAll("[data-quote-link]");
        const callButtons = document.querySelectorAll("[data-call-open]");
        const contactButtons = document.querySelectorAll("[data-contact-open]");
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        const contactForm = document.querySelector("[data-contact-form]");

        quoteButtons.forEach((button) => {
          button.addEventListener("click", function () {
            if (button.matches("[data-popular-quote-bubble]")) {
              const popularPreset = {
                preset: "standard-in-out",
                quick: "standard-inside-outside",
                autoPreset: "standard-in-out",
                category: "both",
                service: "inside-outside",
                interiorPackage: "standard",
                exteriorPackage: "standard",
                start: "vehicle",
                skipServiceSelection: true,
                forceContactAfterVehicle: true
              };

              try {
                sessionStorage.setItem("kmdQuotePreset", JSON.stringify(popularPreset));
                localStorage.setItem("kmdQuotePreset", JSON.stringify(popularPreset));
              } catch (error) {}
            }

            if (typeof gtag === "function") {
              gtag("event", "generate_lead", {
                event_category: "engagement",
                event_label: button.matches("[data-popular-quote-bubble]") ? "most_popular_bubble_click" : "quote_button_click"
              });
            }
          });
        });

        callButtons.forEach((button) => {
          button.addEventListener("click", function () {
            if (typeof gtag === "function") {
              gtag("event", "generate_lead", {
                event_category: "engagement",
                event_label: "call_button_click"
              });
            }
          });
        });

        contactButtons.forEach((button) => {
          button.addEventListener("click", function () {
            if (typeof gtag === "function") {
              gtag("event", "generate_lead", {
                event_category: "engagement",
                event_label: "contact_button_click"
              });
            }
          });
        });

        phoneLinks.forEach((link) => {
          link.addEventListener("click", function () {
            if (typeof gtag === "function") {
              gtag("event", "contact", {
                event_category: "engagement",
                event_label: "phone_number_click"
              });
            }
          });
        });

        if (contactForm) {
          contactForm.addEventListener("submit", function () {
            if (typeof gtag === "function") {
              gtag("event", "generate_lead", {
                event_category: "engagement",
                event_label: "contact_form_submit"
              });
            }
          });
        }
      });

document.addEventListener("DOMContentLoaded", function () {
        const contactForm = document.querySelector("[data-contact-form]");
        const contactStatus = document.querySelector("[data-contact-status]");
        const quoteBody = document.querySelector("[data-quote-body]");

        const spamKeywords = [
          "seo",
          "backlink",
          "guest post",
          "website traffic",
          "crypto",
          "forex",
          "viagra",
          "casino",
          "loan",
          "loan approval",
          "telegram"
        ];

        if (contactForm) {
          contactForm.addEventListener("submit", function (event) {
            const honeyPot = contactForm.querySelector('input[name="website"]');
            const messageField = contactForm.querySelector("#cMessage");
            const emailField = contactForm.querySelector("#cEmail");
            const combinedText = [
              honeyPot ? honeyPot.value : "",
              messageField ? messageField.value : "",
              emailField ? emailField.value : ""
            ].join(" ").toLowerCase();

            const isSpam = spamKeywords.some((keyword) => combinedText.includes(keyword)) || (honeyPot && honeyPot.value.trim() !== "");

            if (isSpam) {
              event.preventDefault();
              event.stopImmediatePropagation();
              if (contactStatus) {
                contactStatus.textContent = "Message blocked. Please remove promotional or spam-like wording and try again.";
              }
            }
          }, true);
        }

        function enhanceBookedScreen() {
          if (!quoteBody) return;

          const bodyText = quoteBody.textContent.toLowerCase();
          const looksLikeSuccess =
            bodyText.includes("you're booked") ||
            bodyText.includes("you’re booked") ||
            bodyText.includes("booking confirmed") ||
            bodyText.includes("thank you") ||
            bodyText.includes("we'll reach out") ||
            bodyText.includes("we’ll reach out");

          quoteBody.classList.toggle("quoteBody--success", looksLikeSuccess);

          if (!looksLikeSuccess) return;
          if (quoteBody.querySelector(".quoteSuccessWrap")) return;

          const originalMarkup = quoteBody.innerHTML.trim();
          if (!originalMarkup) return;

          quoteBody.innerHTML = `
            <div class="quoteSuccessWrap">
              <div class="quoteSuccessBadge">Request received</div>
              <h4 class="quoteSuccessTitle">You’re booked in.</h4>
              <p class="quoteSuccessText">
                Your request came through. We’ll reach out shortly to confirm the details and lock everything in.
              </p>
              <div class="quoteSuccessInner">${originalMarkup}</div>
            </div>
          `;
        }

        enhanceBookedScreen();

        if (quoteBody) {
          const quoteObserver = new MutationObserver(function () {
            enhanceBookedScreen();
          });

          quoteObserver.observe(quoteBody, {
            childList: true,
            subtree: true,
            characterData: true
          });
        }
      });

document.addEventListener("DOMContentLoaded", function () {
        const reviewImageModal = document.querySelector("[data-review-image-modal]");
        const reviewImageImg = document.querySelector("[data-review-image-img]");
        const reviewImageOpenButtons = document.querySelectorAll("[data-review-image-open]");
        const reviewImageCloseButtons = document.querySelectorAll("[data-review-image-close]");

        function openReviewImage(src) {
          if (!reviewImageModal) return;

          if (reviewImageImg && src) {
            reviewImageImg.src = src;
          }

          reviewImageModal.hidden = false;
          reviewImageModal.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }

        function closeReviewImage() {
          if (!reviewImageModal) return;

          reviewImageModal.hidden = true;
          reviewImageModal.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
        }

        reviewImageOpenButtons.forEach((button) => {
          button.addEventListener("click", function () {
            openReviewImage(button.getAttribute("data-review-image-open") || "./unnamed.webp");
          });
        });

        reviewImageCloseButtons.forEach((button) => {
          button.addEventListener("click", closeReviewImage);
        });

        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape" && reviewImageModal && !reviewImageModal.hidden) {
            closeReviewImage();
          }
        });
      });
