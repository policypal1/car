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

// Topbar close
const topbarClose = document.querySelector("[data-topbar-close]");
if (topbarClose) {
  topbarClose.addEventListener("click", () => {
    const topbar = topbarClose.closest(".topbar");
    if (topbar) topbar.style.display = "none";
  });
}

// Reviews slider (simple)
const slider = document.querySelector("[data-slider]");
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
  if (!track) return 0;
  const max = Math.max(0, track.children.length - 1);
  index = Math.min(Math.max(index, 0), max);
}

if (slider && track && prevBtn && nextBtn) {
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
        <li>Deep vacuum + thorough wipe-down</li>
        <li>Stain treatment (as needed)</li>
        <li>Cracks/crevices cleaning</li>
        <li>Glass cleaned inside</li>
      </ul>
      <p><strong>Tip:</strong> Add pet hair removal if needed.</p>
    `,
  },
  exterior: {
    title: "Exterior Detail",
    body: `
      <ul>
        <li>Hand wash + safe drying</li>
        <li>Wheel/tire cleaning</li>
        <li>Trim wiped + protected</li>
        <li>Glass cleaned outside</li>
      </ul>
    `,
  },
  engine: {
    title: "Engine Bay Detail",
    body: `
      <ul>
        <li>Safe degreasing + careful agitation</li>
        <li>Rinse/steam (when appropriate)</li>
        <li>Dressing for a clean finish</li>
      </ul>
    `,
  },
  paint: {
    title: "Paint Correction",
    body: `
      <ul>
        <li>Swirl/scratch reduction</li>
        <li>Single or multi-stage polishing options</li>
        <li>Prep for long-term protection</li>
      </ul>
      <p><strong>Best paired with:</strong> Ceramic coating.</p>
    `,
  },
  ceramic: {
    title: "Ceramic Coating",
    body: `
      <ul>
        <li>Hydrophobic protection + gloss</li>
        <li>Easier washes + longer-lasting finish</li>
        <li>Multiple durability options</li>
      </ul>
    `,
  },
  maintenance: {
    title: "Maintenance Detail",
    body: `
      <ul>
        <li>Perfect for returning clients</li>
        <li>Quick reset for interior + exterior</li>
        <li>Keep your vehicle consistently clean</li>
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

// Lead form (swap to your backend / Formspree / email service)
const leadForm = document.querySelector("[data-lead-form]");
const submitBtn = document.querySelector("[data-submit]");

if (leadForm && submitBtn) {
  leadForm.addEventListener("submit", () => {
    submitBtn.textContent = "SENT (DEMO)";
    submitBtn.disabled = true;

    // For real use: send to Formspree, Resend, etc.
    // fetch("/api/lead", { method:"POST", body: new FormData(leadForm) })
  });
}
