// --------------------
// CONFIG
// --------------------
const BUSINESS_PHONE = "+15555555555";
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxdfZmt7x4ZCM4x8-jPjEJFN6gll0ZxYdY8dyjSEZDlM2lNDSJ8p-XTwueG4p7hM88/exec";

// --------------------
// Mobile nav
// --------------------
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("isOpen");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        nav.classList.remove("isOpen");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

// Footer year
const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// --------------------
// Service info modal
// --------------------
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalContent = document.querySelector("[data-modal-content]");
let lastActiveEl = null;

const serviceDetails = {
  interior: {
    title: "Interior Detail (3 Tiers)",
    body: `
      <p><strong>Best for:</strong> crumbs, stains, pet hair, and that “reset” feeling when you sit down.</p>

      <div class="tiers">
        <div class="tier">
          <div class="tier__top">
            <div class="tier__name">Tier 1 — Interior Refresh</div>
            <div class="tier__tag">Entry</div>
          </div>
          <ul>
            <li>Thorough vacuum (seats, carpets, mats)</li>
            <li>Wipe-down of dash/doors/console</li>
            <li>Interior glass cleaned</li>
            <li>Light crevice detailing</li>
          </ul>
        </div>

        <div class="tier">
          <div class="tier__top">
            <div class="tier__name">Tier 2 — Interior Reset</div>
            <div class="tier__tag">Most booked</div>
          </div>
          <ul>
            <li>Deep vacuum + cracks/crevices</li>
            <li>Panels/trim cleaned (no greasy shine)</li>
            <li>Spot stain treatment (as needed)</li>
            <li>Interior glass cleaned</li>
          </ul>
        </div>

        <div class="tier">
          <div class="tier__top">
            <div class="tier__name">Tier 3 — Deep Interior Restore</div>
            <div class="tier__tag">Heavy</div>
          </div>
          <ul>
            <li>Heavy stain focus + deeper extraction</li>
            <li>Pet hair removal focus (as needed)</li>
            <li>Deep crevice work + tight seams</li>
            <li>Full interior finish + glass</li>
          </ul>
        </div>
      </div>

      <p style="margin-top:12px;"><strong>Note:</strong> Final quote depends on vehicle size and condition.</p>
    `,
  },

  exterior: {
    title: "Exterior Wash (3 Levels)",
    body: `
      <p><strong>Best for:</strong> safe wash results and a clean gloss that makes the car look sharp.</p>

      <div class="tiers">
        <div class="tier">
          <div class="tier__top">
            <div class="tier__name">Level 1 — Basic Wash</div>
            <div class="tier__tag">Quick</div>
          </div>
          <ul>
            <li>Safe hand wash + dry</li>
            <li>Exterior glass cleaned</li>
            <li>Light wheel/tire clean</li>
          </ul>
        </div>

        <div class="tier">
          <div class="tier__top">
            <div class="tier__name">Level 2 — Wash + Wheel Detail</div>
            <div class="tier__tag">Popular</div>
          </div>
          <ul>
            <li>Safe hand wash + dry</li>
            <li>Wheels/tires + wheel wells cleaned</li>
            <li>Bug/grime removal on front end</li>
            <li>Exterior glass cleaned</li>
          </ul>
        </div>

        <div class="tier">
          <div class="tier__top">
            <div class="tier__name">Level 3 — Premium Exterior</div>
            <div class="tier__tag">Best</div>
          </div>
          <ul>
            <li>Everything in Level 2</li>
            <li>Trim cleaned and protected</li>
            <li>Enhanced finish for deeper gloss</li>
            <li>Extra time on problem areas</li>
          </ul>
        </div>
      </div>

      <p style="margin-top:12px;"><strong>Note:</strong> Final quote depends on vehicle size and condition.</p>
    `,
  },

  maintenance: {
    title: "Upkeep Detail",
    body: `
      <p><strong>Best for:</strong> keeping your car clean without letting it get bad again.</p>
      <ul>
        <li>Requires an initial interior and exterior detail first</li>
        <li>Then we maintain it on a schedule that fits your driving</li>
        <li>Weekly, biweekly, or monthly options</li>
      </ul>
    `,
  },

  ceramic: {
    title: "Ceramic Protection",
    body: `
      <p><strong>Best for:</strong> longer-lasting gloss and easier washes.</p>
      <ul>
        <li>Prep wash before application</li>
        <li>Decontamination steps for bonding</li>
        <li>Ceramic protection applied</li>
      </ul>
    `,
  },

  paint: {
    title: "Paint Correction",
    body: `
      <p><strong>Best for:</strong> reducing swirls, haze, and defects to improve clarity and depth.</p>
      <ul>
        <li>Paint inspection under proper lighting</li>
        <li>Machine polishing to reduce swirls and defects</li>
        <li>Protection recommended afterward</li>
      </ul>
    `,
  },
};

function openServiceModal(key) {
  if (!modal || !modalTitle || !modalContent) return;
  const data = serviceDetails[key];
  if (!data) return;

  lastActiveEl = document.activeElement;

  modalTitle.textContent = data.title;
  modalContent.innerHTML = data.body;

  modal.classList.add("isOpen");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  modal.querySelector("[data-modal-close]")?.focus();
}

function closeServiceModal() {
  if (!modal) return;
  modal.classList.remove("isOpen");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastActiveEl && typeof lastActiveEl.focus === "function") lastActiveEl.focus();
}

document.querySelectorAll("[data-modal-open]").forEach((btn) => {
  btn.addEventListener("click", () => openServiceModal(btn.getAttribute("data-modal-open")));
});
document.querySelectorAll("[data-modal-close]").forEach((btn) => {
  btn.addEventListener("click", closeServiceModal);
});

// --------------------
// Call/Text modal
// --------------------
const callModal = document.querySelector("[data-call-modal]");
let lastActiveElCall = null;

function openCallModal() {
  if (!callModal) return;
  lastActiveElCall = document.activeElement;

  callModal.classList.add("isOpen");
  callModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  callModal.querySelector("[data-call-close]")?.focus();
}

function closeCallModal() {
  if (!callModal) return;
  callModal.classList.remove("isOpen");
  callModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastActiveElCall && typeof lastActiveElCall.focus === "function") lastActiveElCall.focus();
}

document.querySelectorAll("[data-call-open]").forEach((btn) => btn.addEventListener("click", openCallModal));
document.querySelectorAll("[data-call-close]").forEach((btn) => btn.addEventListener("click", closeCallModal));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeServiceModal();
    closeCallModal();
    if (typeof closeQuoteModal === "function") closeQuoteModal();
  }
});

// --------------------
// Before/After slider (supports vertical via CSS --ratio)
// --------------------
function initCompare() {
  document.querySelectorAll("[data-compare]").forEach((wrap) => {
    const range = wrap.querySelector("[data-compare-range]");
    if (!range) return;

    const setPos = (val) => {
      const clamped = Math.max(0, Math.min(100, Number(val)));
      wrap.style.setProperty("--pos", clamped + "%");
    };

    setPos(range.value);
    range.addEventListener("input", (e) => setPos(e.target.value));
  });
}
initCompare();

// --------------------
// Carousel (work)
// --------------------
function initCarousel(root) {
  const track = root.querySelector("[data-carousel-track]");
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const dotsWrap = root.querySelector("[data-carousel-dots]");
  const slides = Array.from(root.querySelectorAll(".carousel__slide"));
  if (!track || slides.length === 0) return;

  let index = 0;

  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot" + (i === 0 ? " isActive" : "");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  const setDots = () => {
    if (!dotsWrap) return;
    const dots = Array.from(dotsWrap.querySelectorAll(".dot"));
    dots.forEach((d, i) => d.classList.toggle("isActive", i === index));
  };

  const goTo = (i) => {
    index = Math.max(0, Math.min(slides.length - 1, i));
    track.style.transform = `translateX(${-index * 100}%)`;
    setDots();
  };

  prev?.addEventListener("click", () => goTo(index - 1));
  next?.addEventListener("click", () => goTo(index + 1));

  goTo(0);
}
document.querySelectorAll("[data-carousel]").forEach(initCarousel);

// --------------------
// Reviews rail arrows
// --------------------
(function initReviewsRail() {
  const wrap = document.querySelector("[data-rail]");
  if (!wrap) return;

  const track = wrap.querySelector("[data-rail-track]");
  const prev = wrap.querySelector("[data-rail-prev]");
  const next = wrap.querySelector("[data-rail-next]");
  if (!track) return;

  const scrollByAmount = () => Math.max(280, Math.round(track.clientWidth * 0.92));

  prev?.addEventListener("click", () => {
    track.scrollBy({ left: -scrollByAmount(), behavior: "smooth" });
  });

  next?.addEventListener("click", () => {
    track.scrollBy({ left: scrollByAmount(), behavior: "smooth" });
  });
})();
