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
    title: "Maintenance Detail",
    body: `
      <p><strong>Returning clients only.</strong></p>
      <ul>
        <li>Requires <strong>Interior + Exterior Detail first</strong></li>
        <li>Then we maintain it on a recurring schedule</li>
        <li>Perfect for weekly, biweekly, or monthly upkeep</li>
      </ul>
    `,
  },
  ceramic: {
    title: "Ceramic Coating",
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
        <li>Best prep before ceramic coating</li>
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
