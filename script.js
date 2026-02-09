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
    title: "Interior Detail",
    body: `
      <p><strong>Best for:</strong> stains, spills, pet hair, sand, and a full interior reset.</p>
      <ul>
        <li>Full vacuum (seats, carpets, mats, trunk area)</li>
        <li>Cracks and crevices detailed (seams, consoles, tight areas)</li>
        <li>Panels and trim cleaned and finished (no greasy shine)</li>
        <li>Spot stain treatment as needed</li>
        <li>Interior glass cleaned</li>
      </ul>
    `,
  },
  exterior: {
    title: "Exterior Detail",
    body: `
      <p><strong>Best for:</strong> a clean gloss, safe wash, and details that make the car look sharp.</p>
      <ul>
        <li>Safe hand wash and proper drying</li>
        <li>Wheels, tires, and wheel wells cleaned</li>
        <li>Bug and grime removal on front end</li>
        <li>Trim cleaned and protected</li>
        <li>Exterior glass cleaned</li>
      </ul>
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
    closeQuoteModal();
  }
});

// --------------------
// Before/After slider
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

// -------------------------
// QUOTE WIZARD (new questions)
// -------------------------
const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteDots = () => Array.from(document.querySelectorAll(".qpDot"));

let lastActiveElQuote = null;

const quoteState = {
  size: "",
  condition: "",
  contactWindow: "",
  heardAbout: "",
  bookingStatus: "",
  ackDeposit: false,
  name: "",
  phone: "",
  notes: "",
  honeypot: ""
};

const steps = ["size","condition","contactWindow","heardAbout","bookingStatus","contact","done"];
let stepIndex = 0;

const sizes = [
  { label: "Small", hint: "Coupe, sedan", img: "./cosySec.png" },
  { label: "Medium", hint: "Small SUV, wagon", img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp" },
  { label: "Large", hint: "3-row SUV, truck, van", img: "./Chevrolet_Suburban_LT_6cd76558e4.png", contain: true }
];

const conditions = [
  {
    label: "Light",
    hint: "Mostly clean • quick refresh",
    icon: "✨",
    bullets: ["Light dust", "Few crumbs", "No heavy stains"]
  },
  {
    label: "Normal",
    hint: "Daily driver • solid reset",
    icon: "🧼",
    bullets: ["Normal buildup", "Cupholders/crevices", "Some spots"]
  },
  {
    label: "Heavy",
    hint: "Stains/pet hair • deep work",
    icon: "💪",
    bullets: ["Pet hair", "Stains/spills", "Heavy buildup"]
  }
];

const contactWindows = [
  { label: "Morning", hint: "8am–12pm", icon: "🌤️" },
  { label: "Afternoon", hint: "12pm–5pm", icon: "☀️" },
  { label: "Evening", hint: "After 5pm", icon: "🌙" }
];

const heardAbout = [
  { label: "Returning Client", hint: "Welcome back", icon: "✅" },
  { label: "Family / Friend", hint: "Referral", icon: "🤝" },
  { label: "Social Media", hint: "Instagram / TikTok", icon: "📱" },
  { label: "Google Search", hint: "Maps / Search", icon: "🔎" },
  { label: "Other", hint: "Another source", icon: "🗂️" }
];

const bookingStatus = [
  { label: "I'm ready to book", hint: "Secure an appointment", icon: "📅" },
  { label: "I have a few questions", hint: "Before booking", icon: "❓" }
];

function openQuoteModal() {
  if (!quoteModal || !quoteBody) return;

  lastActiveElQuote = document.activeElement;

  Object.assign(quoteState, {
    size: "",
    condition: "",
    contactWindow: "",
    heardAbout: "",
    bookingStatus: "",
    ackDeposit: false,
    name: "",
    phone: "",
    notes: "",
    honeypot: ""
  });

  stepIndex = 0;
  renderStep();

  quoteModal.classList.add("isOpen");
  quoteModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  quoteModal.querySelector("[data-quote-close]")?.focus();
}

function closeQuoteModal() {
  if (!quoteModal) return;
  quoteModal.classList.remove("isOpen");
  quoteModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastActiveElQuote && typeof lastActiveElQuote.focus === "function") lastActiveElQuote.focus();
}

document.querySelectorAll("[data-quote-open]").forEach((btn) => {
  btn.addEventListener("click", openQuoteModal);
});
quoteCloseBtns.forEach((btn) => btn.addEventListener("click", closeQuoteModal));

function setProgress() {
  const dots = quoteDots();
  dots.forEach((d, i) => d.classList.toggle("isOn", i === stepIndex));
}

function canContinue() {
  const step = steps[stepIndex];
  if (step === "size") return !!quoteState.size;
  if (step === "condition") return !!quoteState.condition;
  if (step === "contactWindow") return !!quoteState.contactWindow;
  if (step === "heardAbout") return !!quoteState.heardAbout;
  if (step === "bookingStatus") return !!quoteState.bookingStatus;
  if (step === "contact") return quoteState.name.trim().length >= 2 && quoteState.phone.trim().length >= 7 && quoteState.ackDeposit === true;
  return true;
}

function updateNav() {
  if (!quoteBackBtn || !quoteNextBtn) return;

  quoteBackBtn.style.visibility = stepIndex === 0 ? "hidden" : "visible";

  const step = steps[stepIndex];
  if (step === "done") {
    quoteNextBtn.style.display = "none";
    quoteBackBtn.textContent = "Close";
    quoteBackBtn.style.visibility = "visible";
    return;
  }

  quoteNextBtn.style.display = "inline-flex";
  quoteBackBtn.textContent = "Back";
  quoteNextBtn.textContent = step === "contact" ? "Finish" : "Continue";
  quoteNextBtn.disabled = !canContinue();
}

function pickAndAdvance(pickFn) {
  pickFn();
  renderStep();
  setTimeout(() => nextStep(true), 80);
}

function cardButton(label, hint, img, isSelected, onClick, contain = false) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qCard" + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  btn.innerHTML = `
    <div class="qCardMedia">
      <img class="${contain ? "isContain" : ""}" src="${escapeHtml(img)}" alt="${escapeHtml(label)} option" loading="lazy" />
    </div>
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
  `;
  return btn;
}

function simpleCard(label, hint, icon, isSelected, onClick, bullets = null) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qCard" + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  const bulletsHtml = bullets && bullets.length
    ? `<div class="qCardHint" style="margin-top:8px;">
        • ${bullets.map(escapeHtml).join("<br/>• ")}
      </div>`
    : "";

  btn.innerHTML = `
    <div class="qIcon" aria-hidden="true">${escapeHtml(icon)}</div>
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
    ${bulletsHtml}
  `;
  return btn;
}

function renderStep() {
  if (!quoteBody) return;
  quoteBody.innerHTML = "";
  setProgress();

  const step = steps[stepIndex];

  const title = document.createElement("div");
  title.className = "qStepTitle";
  const sub = document.createElement("div");
  sub.className = "qStepSub";

  if (step === "size") {
    title.textContent = "Vehicle size";
    sub.textContent = "Pick the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    sizes.forEach((s) => {
      cards.appendChild(
        cardButton(s.label, s.hint, s.img, quoteState.size === s.label, () => {
          pickAndAdvance(() => (quoteState.size = s.label));
        }, !!s.contain)
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "condition") {
    title.textContent = "Vehicle condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    conditions.forEach((c) => {
      cards.appendChild(
        simpleCard(c.label, c.hint, c.icon, quoteState.condition === c.label, () => {
          pickAndAdvance(() => (quoteState.condition = c.label));
        }, c.bullets)
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "contactWindow") {
    title.textContent = "Preferred contact window";
    sub.textContent = "When should we reach out? Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    contactWindows.forEach((o) => {
      cards.appendChild(
        simpleCard(o.label, o.hint, o.icon, quoteState.contactWindow === o.label, () => {
          pickAndAdvance(() => (quoteState.contactWindow = o.label));
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "heardAbout") {
    title.textContent = "How did you hear about us?";
    sub.textContent = "Tap one option. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    heardAbout.forEach((o) => {
      cards.appendChild(
        simpleCard(o.label, o.hint, o.icon, quoteState.heardAbout === o.label, () => {
          pickAndAdvance(() => (quoteState.heardAbout = o.label));
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "bookingStatus") {
    title.textContent = "Booking status";
    sub.textContent = "Tap one option. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    bookingStatus.forEach((o) => {
      cards.appendChild(
        simpleCard(o.label, o.hint, o.icon, quoteState.bookingStatus === o.label, () => {
          pickAndAdvance(() => (quoteState.bookingStatus = o.label));
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "contact") {
    title.textContent = "Your contact info";
    sub.textContent = "Required. We’ll text/call you to confirm and schedule.";

    const grid = document.createElement("div");
    grid.className = "qGrid2";

    const f1 = document.createElement("div");
    f1.className = "qField";
    f1.innerHTML = `
      <label for="qName">Name *</label>
      <input id="qName" autocomplete="name" placeholder="Your name" value="${escapeHtml(quoteState.name)}" />
    `;

    const f2 = document.createElement("div");
    f2.className = "qField";
    f2.innerHTML = `
      <label for="qPhone">Phone number *</label>
      <input id="qPhone" autocomplete="tel" inputmode="tel" placeholder="(555) 555-5555" value="${escapeHtml(quoteState.phone)}" />
    `;

    grid.append(f1, f2);

    const notes = document.createElement("div");
    notes.className = "qField";
    notes.style.marginTop = "10px";
    notes.innerHTML = `
      <label for="qNotes">Anything else we should know?</label>
      <textarea id="qNotes" placeholder="Pet hair, stains, preferred timing, etc.">${escapeHtml(quoteState.notes)}</textarea>
    `;

    const ack = document.createElement("div");
    ack.style.marginTop = "10px";
    ack.innerHTML = `
      <div class="qCheck">
        <input id="qAck" type="checkbox" ${quoteState.ackDeposit ? "checked" : ""} />
        <label for="qAck">
          <strong>Acknowledgement *</strong><br/>
          I understand that a $25 booking deposit is required to reserve my appointment and will be applied to the total.
          All listed prices are starting prices and may adjust after a vehicle assessment based on condition.
        </label>
      </div>
      <div class="qStatus" data-q-status>
        ${canContinue() ? "" : "Required: name, phone, and acknowledgement."}
      </div>
      <div style="display:none;">
        <input id="qCompany" placeholder="Company" value="${escapeHtml(quoteState.honeypot)}" />
      </div>
    `;

    quoteBody.append(title, sub, grid, notes, ack);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");
    const notesEl = quoteBody.querySelector("#qNotes");
    const ackEl = quoteBody.querySelector("#qAck");
    const hpEl = quoteBody.querySelector("#qCompany");
    const statusEl = quoteBody.querySelector("[data-q-status]");

    const updateStatus = () => {
      if (!statusEl) return;
      statusEl.textContent = canContinue() ? "" : "Required: name, phone, and acknowledgement.";
    };

    nameEl?.addEventListener("input", (e) => {
      quoteState.name = e.target.value || "";
      updateNav();
      updateStatus();
    });
    phoneEl?.addEventListener("input", (e) => {
      quoteState.phone = e.target.value || "";
      updateNav();
      updateStatus();
    });
    notesEl?.addEventListener("input", (e) => {
      quoteState.notes = e.target.value || "";
    });
    ackEl?.addEventListener("change", (e) => {
      quoteState.ackDeposit = !!e.target.checked;
      updateNav();
      updateStatus();
    });
    hpEl?.addEventListener("input", (e) => {
      quoteState.honeypot = e.target.value || "";
    });

    setTimeout(() => nameEl?.focus(), 50);
  }

  if (step === "done") {
    title.textContent = "Request sent";
    sub.textContent = "We’ll reach out shortly to confirm and schedule.";

    const summary = document.createElement("div");
    summary.className = "qSummary";
    summary.innerHTML = `
      <div class="qStepSub" style="margin-top:10px;">
        <strong>Summary</strong><br/>
        Size: ${escapeHtml(quoteState.size)}<br/>
        Condition: ${escapeHtml(quoteState.condition)}<br/>
        Contact Window: ${escapeHtml(quoteState.contactWindow)}<br/>
        Heard About: ${escapeHtml(quoteState.heardAbout)}<br/>
        Booking Status: ${escapeHtml(quoteState.bookingStatus)}<br/>
        Name: ${escapeHtml(quoteState.name)}<br/>
        Phone: ${escapeHtml(quoteState.phone)}<br/>
        Notes: ${escapeHtml(quoteState.notes || "—")}
      </div>
    `;

    const actions = document.createElement("div");
    actions.style.marginTop = "12px";
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const callBtn = document.createElement("a");
    callBtn.className = "btn btn--call";
    callBtn.href = `tel:${BUSINESS_PHONE}`;
    callBtn.textContent = "CALL NOW";

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn--quote";
    closeBtn.type = "button";
    closeBtn.textContent = "CLOSE";
    closeBtn.addEventListener("click", closeQuoteModal);

    actions.append(callBtn, closeBtn);
    quoteBody.append(title, sub, summary, actions);
  }

  updateNav();
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitToGoogleAppsScript() {
  // honeypot anti-spam
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) return true;

  // Always advance UI even if Google blocks/cors/etc
  if (!SCRIPT_URL || !SCRIPT_URL.startsWith("https://script.google.com/")) return true;

  const payload = {
    timestamp: new Date().toISOString(),
    size: quoteState.size,
    condition: quoteState.condition,
    contactWindow: quoteState.contactWindow,
    heardAbout: quoteState.heardAbout,
    bookingStatus: quoteState.bookingStatus,
    ackDeposit: quoteState.ackDeposit,
    name: quoteState.name,
    phone: quoteState.phone,
    notes: quoteState.notes,
    source: "Website Quote Wizard"
  };

  try {
    // no-cors means we can't read response; that's fine
    await Promise.race([
      fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        keepalive: true
      }),
      timeout(2500)
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  if (step === "contact") {
    // Finish submit
    quoteNextBtn.disabled = true;
    const old = quoteNextBtn.textContent;
    quoteNextBtn.textContent = "Sending...";

    submitToGoogleAppsScript().finally(() => {
      // ALWAYS move to done, even if submission fails
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      renderStep();
      quoteNextBtn.textContent = old;
      quoteNextBtn.disabled = false;
    });
    return;
  }

  if (stepIndex < steps.length - 1) stepIndex++;
  renderStep();

  if (fromAutoAdvance) updateNav();
}

function prevStep() {
  if (steps[stepIndex] === "done") {
    closeQuoteModal();
    return;
  }
  if (stepIndex > 0) stepIndex--;
  renderStep();
}

quoteNextBtn?.addEventListener("click", () => nextStep(false));
quoteBackBtn?.addEventListener("click", prevStep);

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
