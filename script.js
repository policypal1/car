// --------------------
// CONFIG (set these)
// --------------------
const BUSINESS_PHONE = "+15555555555";
const SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

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
      <p><strong>Good to know:</strong> Heavy pet hair or deep stains can take extra time. We’ll tell you before we start.</p>
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
      <p><strong>Good to know:</strong> We focus on safe methods to avoid swirls and scratches.</p>
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
        <li>Faster appointments with consistent results</li>
      </ul>
      <p><strong>Good to know:</strong> Upkeep is the easiest way to keep the car looking fresh year-round.</p>
    `,
  },
  ceramic: {
    title: "Ceramic Protection",
    body: `
      <p><strong>Best for:</strong> longer-lasting gloss and easier washes.</p>
      <ul>
        <li>Proper prep wash before application</li>
        <li>Decontamination steps as needed for bonding</li>
        <li>Ceramic protection applied for hydrophobic behavior</li>
        <li>Final wipe-down and inspection</li>
      </ul>
      <p><strong>Recommended:</strong> Pair with paint correction for the best finish before coating.</p>
    `,
  },
  paint: {
    title: "Paint Correction",
    body: `
      <p><strong>Best for:</strong> reducing swirls, haze, and defects to improve clarity and depth.</p>
      <ul>
        <li>Paint inspection under proper lighting</li>
        <li>Machine polishing to reduce swirls and defects</li>
        <li>Single-stage or multi-stage options</li>
        <li>Protection recommended afterward (sealant or ceramic)</li>
      </ul>
      <p><strong>Good to know:</strong> We’ll be honest about what’s realistic for your paint condition.</p>
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
  let startX = 0;
  let dragging = false;
  let dragDelta = 0;

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

    const threshold = 60;
    if (dragDelta > threshold) goTo(index - 1);
    else if (dragDelta < -threshold) goTo(index + 1);
  };

  viewport.addEventListener("mousedown", (e) => onDown(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", onUp);

  viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchend", onUp);

  goTo(0);
}
document.querySelectorAll("[data-carousel]").forEach(initCarousel);

// --------------------
// Reviews rail arrows
// --------------------
(function initReviewsRail(){
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
// QUOTE WIZARD (auto-advance)
// -------------------------
const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteDots = () => Array.from(document.querySelectorAll(".qpDot"));

let lastActiveElQuote = null;

const quoteState = {
  service: "",
  size: "",
  condition: "",
  addons: [],
  name: "",
  phone: "",
  notes: "",
  honeypot: ""
};

const steps = ["service","size","condition","addons","contact","done"];
let stepIndex = 0;

/* ✅ SERVICES use the SAME images as the Services section */
const services = [
  { label: "Interior Detail", hint: "Seats, carpets, stains, pet hair", img: "./51ae0d9f-5775-427e-b565-cb5e0984e800.png" },
  { label: "Exterior Detail", hint: "Wash, wheels, trim, gloss", img: "./08db8ba8-9dbd-4ee5-b99e-d8f0a8462297.png" },
  { label: "Interior + Exterior", hint: "Full reset inside and out", img: "./593000c7-e7a5-44a3-9ee8-b68781fa76e7.png" },
  { label: "Upkeep Detail", hint: "Maintenance for returning clients", img: "./593000c7-e7a5-44a3-9ee8-b68781fa76e7.png" },
  { label: "Paint Correction", hint: "Reduce swirls, improve clarity", img: "./07752da8-f5f0-413a-890b-c6de41317df6 (1).png" },
  { label: "Ceramic Protection", hint: "Longer gloss, easier washes", img: "./827c7c7e-ff7d-48bc-befc-e9e2555ebf39.png" }
];

const sizes = [
  { label: "Small", hint: "Coupe, sedan", img: "./cosySec.png" },
  { label: "Medium", hint: "Small SUV, wagon", img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp" },
  { label: "Large", hint: "3-row SUV, truck, van", img: "./Chevrolet_Suburban_LT_6cd76558e4.png", contain: true }
];

const conditions = [
  { label: "Light", hint: "Pretty clean, just needs a refresh" },
  { label: "Normal", hint: "Daily driver, needs a solid reset" },
  { label: "Heavy", hint: "Stains, pet hair, heavy build-up" }
];

/* ✅ Engine bay removed */
const addons = [
  "Pet hair focus",
  "Odor removal focus",
  "Shampoo seats/carpets",
  "Headlight restoration"
];

function openQuoteModal(presetService = "") {
  if (!quoteModal || !quoteBody) return;

  lastActiveElQuote = document.activeElement;

  quoteState.service = presetService || "";
  quoteState.size = "";
  quoteState.condition = "";
  quoteState.addons = [];
  quoteState.name = "";
  quoteState.phone = "";
  quoteState.notes = "";
  quoteState.honeypot = "";

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
  btn.addEventListener("click", () => {
    const preset = btn.getAttribute("data-quote-preset") || "";
    openQuoteModal(preset);
  });
});
quoteCloseBtns.forEach((btn) => btn.addEventListener("click", closeQuoteModal));

function setProgress() {
  const dots = quoteDots();
  dots.forEach((d, i) => d.classList.toggle("isOn", i === stepIndex));
}

function canContinue() {
  const step = steps[stepIndex];
  if (step === "service") return !!quoteState.service;
  if (step === "size") return !!quoteState.size;
  if (step === "condition") return !!quoteState.condition;
  if (step === "contact") return quoteState.name.trim().length >= 2 && quoteState.phone.trim().length >= 7;
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
  setTimeout(() => nextStep(true), 60);
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

function tagButton(label, isSelected, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qTag" + (isSelected ? " isSel" : "");
  btn.textContent = label;
  btn.addEventListener("click", onClick);
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

  if (step === "service") {
    title.textContent = "Choose a service";
    sub.textContent = "Tap one option. You can go back any time.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    services.forEach((s) => {
      cards.appendChild(
        cardButton(s.label, s.hint, s.img, quoteState.service === s.label, () => {
          pickAndAdvance(() => { quoteState.service = s.label; });
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "size") {
    title.textContent = "Vehicle size";
    sub.textContent = "Pick the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    sizes.forEach((s) => {
      cards.appendChild(
        cardButton(s.label, s.hint, s.img, quoteState.size === s.label, () => {
          pickAndAdvance(() => { quoteState.size = s.label; });
        }, !!s.contain)
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "condition") {
    title.textContent = "Vehicle condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const opts = document.createElement("div");
    opts.className = "qOptions";

    conditions.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qOpt" + (quoteState.condition === c.label ? " isSel" : "");
      btn.innerHTML = `<span>${escapeHtml(c.label)}</span><small>${escapeHtml(c.hint)}</small>`;
      btn.addEventListener("click", () => {
        pickAndAdvance(() => { quoteState.condition = c.label; });
      });
      opts.appendChild(btn);
    });

    quoteBody.append(title, sub, opts);
  }

  if (step === "addons") {
    title.textContent = "Any extras?";
    sub.textContent = "Optional. Tap to add or remove, then hit Continue.";

    const tags = document.createElement("div");
    tags.className = "qTags";

    addons.forEach((a) => {
      const sel = quoteState.addons.includes(a);
      tags.appendChild(
        tagButton(a, sel, () => {
          quoteState.addons = sel ? quoteState.addons.filter((x) => x !== a) : [...quoteState.addons, a];
          renderStep();
        })
      );
    });

    quoteBody.append(title, sub, tags);
  }

  if (step === "contact") {
    title.textContent = "Where should we send the quote?";
    sub.textContent = "We’ll text/call you to confirm details and schedule.";

    const wrap = document.createElement("div");
    wrap.className = "qInputs";

    const f1 = document.createElement("div");
    f1.className = "qField";
    f1.innerHTML = `
      <label for="qName">Name</label>
      <input id="qName" autocomplete="name" placeholder="Your name" value="${escapeHtml(quoteState.name)}" />
    `;

    const f2 = document.createElement("div");
    f2.className = "qField";
    f2.innerHTML = `
      <label for="qPhone">Phone number</label>
      <input id="qPhone" autocomplete="tel" inputmode="tel" placeholder="(555) 555-5555" value="${escapeHtml(quoteState.phone)}" />
    `;

    const f3 = document.createElement("div");
    f3.className = "qField";
    f3.innerHTML = `
      <label for="qNotes">Notes (optional)</label>
      <input id="qNotes" placeholder="Pet hair, stains, etc." value="${escapeHtml(quoteState.notes)}" />
    `;

    const f4 = document.createElement("div");
    f4.style.display = "none";
    f4.innerHTML = `<input id="qCompany" placeholder="Company" value="${escapeHtml(quoteState.honeypot)}" />`;

    wrap.append(f1, f2, f3, f4);
    quoteBody.append(title, sub, wrap);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");
    const notesEl = quoteBody.querySelector("#qNotes");
    const hpEl = quoteBody.querySelector("#qCompany");

    nameEl?.addEventListener("input", (e) => {
      quoteState.name = e.target.value || "";
      updateNav();
    });
    phoneEl?.addEventListener("input", (e) => {
      quoteState.phone = e.target.value || "";
      updateNav();
    });
    notesEl?.addEventListener("input", (e) => {
      quoteState.notes = e.target.value || "";
    });
    hpEl?.addEventListener("input", (e) => {
      quoteState.honeypot = e.target.value || "";
    });

    setTimeout(() => nameEl?.focus(), 50);
  }

  if (step === "done") {
    title.textContent = "Request sent";
    sub.textContent = "We’ll reach out shortly to confirm and schedule.";

    const addOnText = quoteState.addons.length ? quoteState.addons.join(", ") : "None";

    const summary = document.createElement("div");
    summary.className = "qSummary";
    summary.innerHTML = `
      <div class="qStepSub" style="margin-top:10px;">
        <strong>Summary</strong><br/>
        Service: ${escapeHtml(quoteState.service)}<br/>
        Size: ${escapeHtml(quoteState.size)}<br/>
        Condition: ${escapeHtml(quoteState.condition)}<br/>
        Add-ons: ${escapeHtml(addOnText)}<br/>
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

async function submitToGoogleAppsScript() {
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) return true;
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR")) return true;

  const payload = {
    timestamp: new Date().toISOString(),
    service: quoteState.service,
    size: quoteState.size,
    condition: quoteState.condition,
    addons: quoteState.addons,
    name: quoteState.name,
    phone: quoteState.phone,
    notes: quoteState.notes,
    source: "Website Quote Wizard"
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    return false;
  }
}

function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  if (step === "contact") {
    quoteNextBtn.disabled = true;
    const old = quoteNextBtn.textContent;
    quoteNextBtn.textContent = "Sending...";

    submitToGoogleAppsScript().finally(() => {
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
