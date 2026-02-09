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

// Footer year
const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Service info modal
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

// Call/Text modal
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

// Before/After slider
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

// Carousel (buttons + dots + swipe/drag)
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

/* -------------------------
   QUOTE WIZARD (multi-step)
-------------------------- */
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
  phone: ""
};

const steps = [
  "service",
  "size",
  "condition",
  "addons",
  "contact",
  "done"
];
let stepIndex = 0;

const services = [
  { label: "Interior Detail", hint: "Seats, carpets, stains, pet hair" },
  { label: "Exterior Detail", hint: "Wash, wheels, trim, gloss" },
  { label: "Interior + Exterior", hint: "Full reset inside and out" },
  { label: "Upkeep Detail", hint: "Maintenance for returning clients" },
  { label: "Paint Correction", hint: "Reduce swirls, improve clarity" },
  { label: "Ceramic Protection", hint: "Longer gloss, easier washes" }
];

const sizes = [
  { label: "Small", hint: "Coupe, sedan" },
  { label: "Medium", hint: "Small SUV, wagon" },
  { label: "Large", hint: "3-row SUV, truck, van" }
];

const conditions = [
  { label: "Light", hint: "Pretty clean, just needs a refresh" },
  { label: "Normal", hint: "Daily driver, needs a solid reset" },
  { label: "Heavy", hint: "Stains, pet hair, heavy build-up" }
];

const addons = [
  "Pet hair focus",
  "Odor removal focus",
  "Shampoo seats/carpets",
  "Engine bay (light)",
  "Headlight restoration"
];

function openQuoteModal(presetService = "") {
  if (!quoteModal || !quoteBody) return;

  lastActiveElQuote = document.activeElement;

  if (presetService) quoteState.service = presetService;

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
  dots.forEach((d, i) => {
    d.classList.toggle("isOn", i === stepIndex);
  });
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

function optionButton(label, hint, isSelected, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qOpt" + (isSelected ? " isSel" : "");
  btn.innerHTML = `<span>${label}</span>${hint ? `<small>${hint}</small>` : ""}`;
  btn.addEventListener("click", onClick);
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
    sub.textContent = "Pick one option. You can add details later.";
    const opts = document.createElement("div");
    opts.className = "qOptions";

    services.forEach((s) => {
      opts.appendChild(
        optionButton(s.label, s.hint, quoteState.service === s.label, () => {
          quoteState.service = s.label;
          renderStep();
        })
      );
    });

    quoteBody.append(title, sub, opts);
  }

  if (step === "size") {
    title.textContent = "Vehicle size";
    sub.textContent = "This keeps the quote accurate.";
    const opts = document.createElement("div");
    opts.className = "qOptions";

    sizes.forEach((s) => {
      opts.appendChild(
        optionButton(s.label, s.hint, quoteState.size === s.label, () => {
          quoteState.size = s.label;
          renderStep();
        })
      );
    });

    quoteBody.append(title, sub, opts);
  }

  if (step === "condition") {
    title.textContent = "Vehicle condition";
    sub.textContent = "Choose the closest match. We’ll confirm with you.";
    const opts = document.createElement("div");
    opts.className = "qOptions";

    conditions.forEach((c) => {
      opts.appendChild(
        optionButton(c.label, c.hint, quoteState.condition === c.label, () => {
          quoteState.condition = c.label;
          renderStep();
        })
      );
    });

    quoteBody.append(title, sub, opts);
  }

  if (step === "addons") {
    title.textContent = "Any extras?";
    sub.textContent = "Optional. Tap to add or remove.";
    const tags = document.createElement("div");
    tags.className = "qTags";

    addons.forEach((a) => {
      const sel = quoteState.addons.includes(a);
      tags.appendChild(
        tagButton(a, sel, () => {
          if (sel) quoteState.addons = quoteState.addons.filter((x) => x !== a);
          else quoteState.addons = [...quoteState.addons, a];
          renderStep();
        })
      );
    });

    quoteBody.append(title, sub, tags);
  }

  if (step === "contact") {
    title.textContent = "Where should we send the quote?";
    sub.textContent = "Just the basics. We’ll reach out to schedule.";

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

    wrap.append(f1, f2);
    quoteBody.append(title, sub, wrap);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");

    nameEl?.addEventListener("input", (e) => {
      quoteState.name = e.target.value || "";
      updateNav();
    });
    phoneEl?.addEventListener("input", (e) => {
      quoteState.phone = e.target.value || "";
      updateNav();
    });

    setTimeout(() => nameEl?.focus(), 50);
  }

  if (step === "done") {
    title.textContent = "All set";
    sub.textContent = "Use the button below to send your quote request. You can edit anytime.";

    const summary = document.createElement("div");
    summary.className = "qSummary";
    const addOnText = quoteState.addons.length ? quoteState.addons.join(", ") : "None";
    const message = `Quote request:
Service: ${quoteState.service}
Size: ${quoteState.size}
Condition: ${quoteState.condition}
Add-ons: ${addOnText}
Name: ${quoteState.name}
Phone: ${quoteState.phone}`;

    summary.innerHTML = `
      <div class="qStepSub" style="margin-top:10px;">
        <strong>Summary</strong><br/>
        Service: ${escapeHtml(quoteState.service)}<br/>
        Size: ${escapeHtml(quoteState.size)}<br/>
        Condition: ${escapeHtml(quoteState.condition)}<br/>
        Add-ons: ${escapeHtml(addOnText)}<br/>
        Name: ${escapeHtml(quoteState.name)}<br/>
        Phone: ${escapeHtml(quoteState.phone)}
      </div>
    `;

    const actions = document.createElement("div");
    actions.style.marginTop = "12px";
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    // IMPORTANT: set your business phone here (same one used elsewhere)
    const businessPhone = "+15555555555";

    const smsHref = buildSmsLink(businessPhone, message);

    const smsBtn = document.createElement("a");
    smsBtn.className = "btn btn--call";
    smsBtn.href = smsHref;
    smsBtn.textContent = "SEND TEXT REQUEST";

    const callBtn = document.createElement("a");
    callBtn.className = "btn btn--quote";
    callBtn.href = `tel:${businessPhone}`;
    callBtn.textContent = "CALL INSTEAD";

    actions.append(smsBtn, callBtn);

    quoteBody.append(title, sub, summary, actions);
  }

  updateNav();
}

function nextStep() {
  if (!canContinue()) return;
  if (stepIndex < steps.length - 1) stepIndex++;
  renderStep();
}

function prevStep() {
  if (steps[stepIndex] === "done") {
    closeQuoteModal();
    return;
  }
  if (stepIndex > 0) stepIndex--;
  renderStep();
}

quoteNextBtn?.addEventListener("click", nextStep);
quoteBackBtn?.addEventListener("click", prevStep);

function buildSmsLink(phone, text) {
  const encoded = encodeURIComponent(text);
  // iOS uses sms:&body=, Android supports ?body=
  // This version works in most modern mobile browsers:
  return `sms:${phone}?&body=${encoded}`;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
