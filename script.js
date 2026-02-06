// Mobile nav
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("isOpen");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  // close on link click (mobile)
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        nav.classList.remove("isOpen");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

// Reviews slider
const track = document.querySelector("[data-track]");
const prevBtn = document.querySelector("[data-prev]");
const nextBtn = document.querySelector("[data-next]");

let index = 0;

function updateSlider() {
  if (!track) return;
  const width = track.children[0]?.getBoundingClientRect().width || 0;
  track.style.transform = `translateX(${-index * (width + 12)}px)`;
}

function clampIndex() {
  if (!track) return;
  const max = Math.max(0, track.children.length - 1);
  index = Math.min(Math.max(index, 0), max);
}

if (track && prevBtn && nextBtn) {
  window.addEventListener("resize", updateSlider);

  prevBtn.addEventListener("click", () => {
    index -= 1;
    clampIndex();
    updateSlider();
  });

  nextBtn.addEventListener("click", () => {
    index += 1;
    clampIndex();
    updateSlider();
  });

  updateSlider();
}

// Modals (service details)
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
        <li>Cracks and crevices cleaning</li>
        <li>Interior glass cleaned</li>
      </ul>
    `,
  },
  exterior: {
    title: "Exterior Detail",
    body: `
      <ul>
        <li>Hand wash and safe drying</li>
        <li>Wheel and tire cleaning</li>
        <li>Trim cleaned and protected</li>
        <li>Exterior glass cleaned</li>
      </ul>
    `,
  },
  engine: {
    title: "Engine Bay Detail",
    body: `
      <ul>
        <li>Safe degreasing and agitation</li>
        <li>Careful rinse/steam as appropriate</li>
        <li>Dressing for a clean finish</li>
      </ul>
    `,
  },
  paint: {
    title: "Paint Correction",
    body: `
      <ul>
        <li>Swirl and scratch reduction</li>
        <li>Single or multi-stage polishing</li>
        <li>Prep for long-term protection</li>
      </ul>
    `,
  },
  ceramic: {
    title: "Ceramic Coating",
    body: `
      <ul>
        <li>Hydrophobic protection and gloss</li>
        <li>Easier washes and longer-lasting finish</li>
        <li>Multiple durability options</li>
      </ul>
    `,
  },
  maintenance: {
    title: "Maintenance Detail",
    body: `
      <ul>
        <li>Quick reset for interior and exterior</li>
        <li>Perfect for keeping the vehicle consistently clean</li>
        <li>Recommended for returning clients</li>
      </ul>
    `,
  },
};

function openModal(key) {
  if (!modal || !modalTitle || !modalContent) return;
  const data = serviceDetails[key];
  if (!data) return;

  modalTitle.textContent = data.title;
  modalContent.innerHTML = data.body;

  modal.classList.add("isOpen");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("isOpen");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-modal-open]").forEach((btn) => {
  btn.addEventListener("click", () => openModal(btn.getAttribute("data-modal-open")));
});

document.querySelectorAll("[data-modal-close]").forEach((btn) => {
  btn.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Lead form demo
const leadForm = document.querySelector("[data-lead-form]");
const submitBtn = document.querySelector("[data-submit]");

if (leadForm && submitBtn) {
  leadForm.addEventListener("submit", () => {
    submitBtn.textContent = "SENT (DEMO)";
    submitBtn.disabled = true;
  });
}
