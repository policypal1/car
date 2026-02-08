// Mobile nav
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

// Service modal
const modal = document.querySelector("[data-modal]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalContent = document.querySelector("[data-modal-content]");

const serviceDetails = {
  interior: {
    title: "Interior Detail",
    body: `
      <ul>
        <li>Deep vacuum and wipe-down</li>
        <li>Stain treatment (as needed)</li>
        <li>Crevices and trim detailed</li>
        <li>Interior glass cleaned</li>
      </ul>
    `,
  },
  exterior: {
    title: "Exterior Detail",
    body: `
      <ul>
        <li>Safe hand wash and drying</li>
        <li>Wheels and tires cleaned</li>
        <li>Trim cleaned and protected</li>
        <li>Exterior glass cleaned</li>
      </ul>
    `,
  },
  maintenance: {
    title: "Upkeep Detail",
    body: `
      <p><strong>Returning clients only.</strong></p>
      <ul>
        <li>Requires <strong>Interior + Exterior</strong> first</li>
        <li>Then we maintain it on a recurring schedule</li>
        <li>Weekly, biweekly, or monthly options</li>
      </ul>
    `,
  },
  ceramic: {
    title: "Ceramic Protection",
    body: `
      <ul>
        <li>Hydrophobic protection and enhanced gloss</li>
        <li>Easier washes and longer-lasting finish</li>
        <li>Great paired with paint correction</li>
      </ul>
    `,
  },
  paint: {
    title: "Paint Correction",
    body: `
      <ul>
        <li>Reduces swirls and paint defects</li>
        <li>Single or multi-stage options</li>
        <li>Best prep before ceramic protection</li>
      </ul>
    `,
  },
};

function openServiceModal(key) {
  if (!modal || !modalTitle || !modalContent) return;
  const data = serviceDetails[key];
  if (!data) return;

  modalTitle.textContent = data.title;
  modalContent.innerHTML = data.body;

  modal.classList.add("isOpen");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeServiceModal() {
  if (!modal) return;
  modal.classList.remove("isOpen");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-modal-open]").forEach((btn) => {
  btn.addEventListener("click", () => openServiceModal(btn.getAttribute("data-modal-open")));
});

document.querySelectorAll("[data-modal-close]").forEach((btn) => {
  btn.addEventListener("click", closeServiceModal);
});

// Call/Text modal
const callModal = document.querySelector("[data-call-modal]");

function openCallModal() {
  if (!callModal) return;
  callModal.classList.add("isOpen");
  callModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCallModal() {
  if (!callModal) return;
  callModal.classList.remove("isOpen");
  callModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-call-open]").forEach((btn) => {
  btn.addEventListener("click", openCallModal);
});

document.querySelectorAll("[data-call-close]").forEach((btn) => {
  btn.addEventListener("click", closeCallModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeServiceModal();
    closeCallModal();
  }
});

// Before/After slider logic
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

// Simple carousel logic (buttons + dots + swipe/drag)
function initCarousel(root) {
  const track = root.querySelector("[data-carousel-track]");
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const dotsWrap = root.querySelector("[data-carousel-dots]");
  const slides = Array.from(root.querySelectorAll(".carousel__slide"));

  if (!track || slides.length === 0) return;

  let index = 0;
  let startX = 0;
  let dragging = false;
  let dragDelta = 0;

  // Build dots
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

  // Drag/swipe on viewport
  const viewport = root.querySelector("[data-carousel-viewport]");
  if (!viewport) return;

  const onDown = (clientX) => {
    dragging = true;
    startX = clientX;
    dragDelta = 0;
    viewport.style.cursor = "grabbing";
  };

  const onMove = (clientX) => {
    if (!dragging) return;
    dragDelta = clientX - startX;
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    viewport.style.cursor = "";

    const threshold = 60; // swipe distance
    if (dragDelta > threshold) goTo(index - 1);
    else if (dragDelta < -threshold) goTo(index + 1);
  };

  // Mouse
  viewport.addEventListener("mousedown", (e) => onDown(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", onUp);

  // Touch
  viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchend", onUp);

  // Optional: keyboard
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  });

  goTo(0);
}

document.querySelectorAll("[data-carousel]").forEach(initCarousel);
