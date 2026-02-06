// Mobile nav
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("isOpen");
    navToggle.setAttribute("aria-expanded", String(open));
  });

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

// Service modal (ONLY 3 services)
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
        <li>Wheel and tire deep clean</li>
        <li>Trim cleaned and protected</li>
        <li>Exterior glass cleaned</li>
      </ul>
    `,
  },
  maintenance: {
    title: "Maintenance Detail",
    body: `
      <ul>
        <li>Quick reset inside and out</li>
        <li>Ideal for returning clients</li>
        <li>Keeps your vehicle consistently clean</li>
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

// Call/Text modal (fade in, instant close)
const callModal = document.querySelector("[data-call-modal]");

function openCallModal() {
  if (!callModal) return;
  callModal.classList.add("isOpen");
  callModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCallModal() {
  if (!callModal) return;
  callModal.classList.remove("isOpen"); // instant close
  callModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-call-open]").forEach((btn) => {
  btn.addEventListener("click", openCallModal);
});

document.querySelectorAll("[data-call-close]").forEach((btn) => {
  btn.addEventListener("click", closeCallModal);
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeServiceModal();
    closeCallModal();
  }
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
