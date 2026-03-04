// -------------------------
// QUOTE WIZARD (Flow v7.8)
// -------------------------
// Vehicle -> Category -> Service(s) -> Conditions -> Upkeep Frequency (if upkeep)
// -> Contact -> Estimate -> Calendar -> Done
//
// Apps Script URL
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwgVow2uDZh0MGsoRzUV0MvZHTFnbWtXOjeuh4iXKPKrs3w4Qocu1yETtdRmIXnyvd5ag/exec";

const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteDots = () => Array.from(document.querySelectorAll(".qpDot"));
const quoteNav = document.querySelector(".quoteNav");

let lastActiveElQuote = null;

const quoteState = {
  vehicleType: "",
  serviceCategory: "",

  // ✅ multi-select services
  services: [],

  interiorCondition: "",
  exteriorCondition: "",

  upkeepFrequency: "",

  estimateLow: "",
  estimateHigh: "",

  // calendar
  slotId: "",
  slotLabel: "",
  slotDate: "", // YYYY-MM-DD
  slotTime: "", // HH:MM

  name: "",
  phone: "",
  email: "",
  notes: "",
  ackDeposit: false,

  honeypot: ""
};

const steps = [
  "vehicleType",
  "serviceCategory",
  "service",
  "conditionInterior",
  "conditionExterior",
  "upkeepFrequency",
  "contact",
  "estimate",
  "appointment",
  "done"
];

let stepIndex = 0;

// -------------------------
// OPTIONS / IMAGES
// -------------------------
const vehicleTypes = [
  { label: "Small", hint: "Coupe, sedan", img: "./55205_cc640_001_300.webp", contain: true, zoom: 1.26 },
  { label: "Medium", hint: "Small SUV, wagon", img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp", contain: true, zoom: 1.16 },
  { label: "Large", hint: "3-row SUV, large SUV", img: "./Chevrolet_Suburban_LT_6cd76558e4.png", contain: true, zoom: 1.12 },
  { label: "Truck", hint: "Pickup truck", img: "./silver-pickup-truck-side-view-svdvcb49lssczxnt.png", contain: true, zoom: 1.26 }
];

const serviceCategories = [
  { label: "Interior", hint: "Inside-only detailing", img: "./2017-05-22-07-32-26.jpg" },
  { label: "Exterior", hint: "Outside-only detailing", img: "./c36084da09340612d8431de0221ea985.jpg" },
  { label: "Interior + Exterior", hint: "Full detail inside + out", img: "./Untitled design (3).png" }
];

// Upkeep plan images
const INTERIOR_UPKEEP_IMG = "./img_6480.webp";
const EXTERIOR_UPKEEP_IMG = "./Audi 2 Foamed_1704769098.webp";

const servicesAll = [
  { label: "Interior Detail", category: "Interior", img: "./Shampooing_interior_detail-55a7e5ac-640w.webp" },
  { label: "Exterior Wash", category: "Exterior", img: "./63eaaf7a6f6b7f11ccae99f6_car-detailing-houston-1.jpg" },

  { label: "Interior Upkeep Plan", category: "Interior", img: INTERIOR_UPKEEP_IMG, upkeep: "interior" },
  { label: "Exterior Upkeep Plan", category: "Exterior", img: EXTERIOR_UPKEEP_IMG, upkeep: "exterior" },
  { label: "Interior + Exterior Upkeep Plan", category: "Both", img: [INTERIOR_UPKEEP_IMG, EXTERIOR_UPKEEP_IMG], upkeep: "both" },

  { label: "Ceramic Coating", category: "Exterior", img: "./2626cb4b-d7f8-4cb3-b79b-be682b3b9112.png", prewash: true },
  { label: "Paint Correction", category: "Exterior", img: "./bee.jpg", prewash: true }
];

const interiorConditions = [
  { label: "Light", hint: "Mostly clean • quick refresh", img: "./IMG_2915.jpg" },
  { label: "Normal", hint: "Daily driver • solid reset", img: "./IMG_2916.jpg" },
  { label: "Heavy", hint: "Stains/pet hair • deep work", img: "./dirty-car-complete-with-moldy-carpets-v0-nb2pbgkkdalb1.png" }
];

const exteriorConditions = [
  { label: "Light", hint: "", img: "./looks-dirty-even-after-wash-v0-0v8lqgjivccf1.webp" },
  { label: "Normal", hint: "", img: "./IMG_2910.jpg" },
  { label: "Heavy", hint: "", img: "./dirty-car.jpg" }
];

const upkeepFrequencies = [
  { label: "Weekly", hint: "Best for staying spotless" },
  { label: "Biweekly", hint: "Most popular" },
  { label: "Monthly", hint: "Maintenance refresh" }
];

// -------------------------
// ESTIMATES
// -------------------------
const estimateTable = {
  Interior: {
    Small: { Light: [120, 160], Normal: [160, 220], Heavy: [220, 320] },
    Medium: { Light: [140, 190], Normal: [190, 260], Heavy: [260, 380] },
    Large: { Light: [170, 230], Normal: [230, 320], Heavy: [320, 450] },
    Truck: { Light: [170, 240], Normal: [240, 340], Heavy: [340, 480] }
  },
  Exterior: {
    Small: { Light: [60, 90], Normal: [90, 130], Heavy: [130, 180] },
    Medium: { Light: [70, 100], Normal: [100, 150], Heavy: [150, 210] },
    Large: { Light: [90, 120], Normal: [120, 180], Heavy: [180, 260] },
    Truck: { Light: [90, 130], Normal: [130, 200], Heavy: [200, 290] }
  }
};

const serviceOverrides = {
  "Ceramic Coating": { Small: [450, 900], Medium: [550, 1100], Large: [650, 1400], Truck: [650, 1400] },
  "Paint Correction": { Small: [350, 800], Medium: [450, 950], Large: [550, 1200], Truck: [550, 1200] },

  "Interior Upkeep Plan": { Small: [90, 160], Medium: [110, 190], Large: [130, 220], Truck: [130, 240] },
  "Exterior Upkeep Plan": { Small: [90, 160], Medium: [110, 190], Large: [130, 220], Truck: [130, 240] },
  "Interior + Exterior Upkeep Plan": { Small: [140, 260], Medium: [170, 310], Large: [200, 360], Truck: [200, 390] }
};

// -------------------------
// HELPERS
// -------------------------
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setProgress() {
  const dots = quoteDots();
  if (!dots.length) return;
  dots.forEach((d, i) => d.classList.toggle("isOn", i === Math.min(stepIndex, dots.length - 1)));
}

// ✅ No bottom price pill
function renderNavPrice() { return; }

// -------------------------
// Upkeep / requirement rules (multi-service)
// -------------------------
const UPKEEP_SET = new Set(["Interior Upkeep Plan", "Exterior Upkeep Plan", "Interior + Exterior Upkeep Plan"]);
function isUpkeepService(label) { return UPKEEP_SET.has(label); }
function isUpkeepPlanSelected() { return quoteState.services.some(isUpkeepService); }

// If any upkeep plan selected, it becomes exclusive (keeps flow clean)
function enforceUpkeepExclusivity() {
  const upkeep = quoteState.services.find(isUpkeepService);
  if (upkeep) quoteState.services = [upkeep];
}

function anyServiceRequiresInteriorCondition() {
  const s = quoteState.services || [];
  if (!s.length) return false;
  if (s.includes("Interior Upkeep Plan")) return true;
  if (s.includes("Interior + Exterior Upkeep Plan")) return true;
  if (s.includes("Interior Detail")) return true;
  return false;
}

function anyServiceRequiresExteriorCondition() {
  const s = quoteState.services || [];
  if (!s.length) return false;
  if (s.includes("Exterior Upkeep Plan")) return true;
  if (s.includes("Interior + Exterior Upkeep Plan")) return true;
  if (s.includes("Exterior Wash")) return true;
  if (s.includes("Ceramic Coating")) return true;
  if (s.includes("Paint Correction")) return true;
  return false;
}

function stepIsActive(stepName) {
  if (stepName === "conditionInterior") return anyServiceRequiresInteriorCondition();
  if (stepName === "conditionExterior") return anyServiceRequiresExteriorCondition();
  if (stepName === "upkeepFrequency") return isUpkeepPlanSelected();
  return true;
}

function nextActiveStepIndex(fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) if (stepIsActive(steps[i])) return i;
  return steps.length - 1;
}
function prevActiveStepIndex(fromIndex) {
  for (let i = fromIndex - 1; i >= 0; i--) if (stepIsActive(steps[i])) return i;
  return 0;
}

// -------------------------
// Pricing helpers
// -------------------------
function conditionFactor(cond) {
  if (cond === "Light") return 0.92;
  if (cond === "Normal") return 1.0;
  if (cond === "Heavy") return 1.14;
  return 1.0;
}
function clampInt(n) {
  const x = Math.round(Number(n));
  return Number.isFinite(x) ? x : null;
}
function tightenAndHeavier(range) {
  if (!range) return null;
  const low = Number(range[0]);
  const high = Number(range[1]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return range;

  const mid = (low + high) / 2;
  const delta = Math.max(50, Math.round((high - low) * 0.22));
  const newLow = Math.round(mid + (high - mid) * 0.12);
  const newHigh = Math.max(newLow + 30, newLow + delta);
  return [newLow, newHigh];
}

function computeRangeForService(serviceLabel) {
  const type = quoteState.vehicleType;
  if (!type) return null;

  if (isUpkeepService(serviceLabel) && serviceOverrides[serviceLabel]) {
    const base = serviceOverrides[serviceLabel][type];
    if (!base) return null;

    if (serviceLabel === "Interior Upkeep Plan" && !quoteState.interiorCondition) return null;
    if (serviceLabel === "Exterior Upkeep Plan" && !quoteState.exteriorCondition) return null;
    if (serviceLabel === "Interior + Exterior Upkeep Plan" && (!quoteState.interiorCondition || !quoteState.exteriorCondition)) return null;

    let f = 1.0;
    if (serviceLabel === "Interior Upkeep Plan") f = conditionFactor(quoteState.interiorCondition);
    if (serviceLabel === "Exterior Upkeep Plan") f = conditionFactor(quoteState.exteriorCondition);
    if (serviceLabel === "Interior + Exterior Upkeep Plan") {
      const fi = conditionFactor(quoteState.interiorCondition);
      const fe = conditionFactor(quoteState.exteriorCondition);
      f = (fi + fe) / 2;
    }

    return [base[0] * f, base[1] * f].map(clampInt);
  }

  if ((serviceLabel === "Ceramic Coating" || serviceLabel === "Paint Correction") && serviceOverrides[serviceLabel]) {
    const r = serviceOverrides[serviceLabel][type];
    return r ? [clampInt(r[0]), clampInt(r[1])] : null;
  }

  if (serviceLabel === "Interior Detail") {
    if (!quoteState.interiorCondition) return null;
    const r = estimateTable.Interior?.[type]?.[quoteState.interiorCondition];
    return r ? [clampInt(r[0]), clampInt(r[1])] : null;
  }

  if (serviceLabel === "Exterior Wash") {
    if (!quoteState.exteriorCondition) return null;
    const r = estimateTable.Exterior?.[type]?.[quoteState.exteriorCondition];
    return r ? [clampInt(r[0]), clampInt(r[1])] : null;
  }

  return null;
}

function computeEstimate() {
  const type = quoteState.vehicleType;
  if (!type) return null;

  const svcs = quoteState.services || [];
  if (!svcs.length) return null;

  let low = 0, high = 0;
  for (const s of svcs) {
    const r = computeRangeForService(s);
    if (!r) return null;
    low += Number(r[0] || 0);
    high += Number(r[1] || 0);
  }
  return tightenAndHeavier([low, high]);
}

// -------------------------
// ✅ Starting-at ONLY on condition cards
// -------------------------
function startingAtForInteriorCondition(icLabel) {
  const type = quoteState.vehicleType;
  if (!type) return null;

  if (quoteState.services.includes("Interior Upkeep Plan")) {
    const base = serviceOverrides["Interior Upkeep Plan"]?.[type];
    return base ? clampInt(base[0] * conditionFactor(icLabel)) : null;
  }

  if (quoteState.services.includes("Interior + Exterior Upkeep Plan")) {
    const base = serviceOverrides["Interior + Exterior Upkeep Plan"]?.[type];
    if (!base) return null;
    const f = (conditionFactor(icLabel) + conditionFactor("Light")) / 2;
    return clampInt(base[0] * f);
  }

  const r = estimateTable.Interior?.[type]?.[icLabel];
  return r ? clampInt(r[0]) : null;
}

function startingAtForExteriorCondition(ecLabel) {
  const type = quoteState.vehicleType;
  if (!type) return null;

  if (quoteState.services.includes("Exterior Upkeep Plan")) {
    const base = serviceOverrides["Exterior Upkeep Plan"]?.[type];
    return base ? clampInt(base[0] * conditionFactor(ecLabel)) : null;
  }

  if (quoteState.services.includes("Interior + Exterior Upkeep Plan")) {
    const base = serviceOverrides["Interior + Exterior Upkeep Plan"]?.[type];
    if (!base) return null;
    const f = (conditionFactor("Light") + conditionFactor(ecLabel)) / 2;
    return clampInt(base[0] * f);
  }

  const r = estimateTable.Exterior?.[type]?.[ecLabel];
  return r ? clampInt(r[0]) : null;
}

// -------------------------
// Continue rules
// -------------------------
function canContinue() {
  const step = steps[stepIndex];

  if (step === "vehicleType") return !!quoteState.vehicleType;
  if (step === "serviceCategory") return !!quoteState.serviceCategory;

  // ✅ must pick at least 1 service on the service step
  if (step === "service") return Array.isArray(quoteState.services) && quoteState.services.length > 0;

  if (step === "conditionInterior") return !anyServiceRequiresInteriorCondition() ? true : !!quoteState.interiorCondition;
  if (step === "conditionExterior") return !anyServiceRequiresExteriorCondition() ? true : !!quoteState.exteriorCondition;

  if (step === "upkeepFrequency") return !isUpkeepPlanSelected() ? true : !!quoteState.upkeepFrequency;

  if (step === "contact") {
    return (
      quoteState.name.trim().length >= 2 &&
      quoteState.phone.trim().length >= 7 &&
      quoteState.email.trim().includes("@") &&
      quoteState.ackDeposit === true
    );
  }

  if (step === "appointment") return !!quoteState.slotId;

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
  quoteNextBtn.textContent = step === "appointment" ? "Finish" : "Continue";
  quoteNextBtn.disabled = !canContinue();

  renderNavPrice();
}

// -------------------------
// ✅ AUTO-ADVANCE (everything except services step)
// -------------------------
function pickAndAdvance(pickFn) {
  pickFn();
  renderStep();
  setTimeout(() => nextStep(true), 80);
}

// -------------------------
// Service multi-select (NO AUTO ADVANCE)
// -------------------------
function toggleService(label) {
  const current = Array.isArray(quoteState.services) ? [...quoteState.services] : [];
  const isSelected = current.includes(label);

  if (!isSelected && isUpkeepService(label)) {
    quoteState.services = [label];
  } else {
    let next = current.filter((s) => !isUpkeepService(s));
    if (isSelected) next = next.filter((s) => s !== label);
    else next.push(label);
    quoteState.services = next;
  }

  enforceUpkeepExclusivity();

  // clear condition/frequency if no longer needed
  if (!anyServiceRequiresInteriorCondition()) quoteState.interiorCondition = "";
  if (!anyServiceRequiresExteriorCondition()) quoteState.exteriorCondition = "";
  if (!isUpkeepPlanSelected()) quoteState.upkeepFrequency = "";

  // reset calendar selection when services change
  quoteState.slotId = "";
  quoteState.slotLabel = "";
  quoteState.slotDate = "";
  quoteState.slotTime = "";

  updateNav();
}

// -------------------------
// Cards
// -------------------------
function imgCard({
  label,
  hint,
  img,
  contain = false,
  zoom = null,
  isSelected = false,
  onClick,
  variant = "",
  badge = ""
}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `qCard qCard--img ${variant}`.trim() + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  const zoomStyle = typeof zoom === "number" ? `style="--carZoom:${zoom}"` : "";

  const mediaHtml = Array.isArray(img)
    ? `
      <div class="qCardMedia" ${zoomStyle}>
        ${badge ? `<span class="qCardBadge" aria-hidden="true">${escapeHtml(badge)}</span>` : ""}
        <div class="qCardMediaSplit" aria-hidden="true">
          <img src="${escapeHtml(img[0])}" alt="" loading="lazy" />
          <img src="${escapeHtml(img[1])}" alt="" loading="lazy" />
        </div>
      </div>
    `
    : `
      <div class="qCardMedia" ${zoomStyle}>
        ${badge ? `<span class="qCardBadge" aria-hidden="true">${escapeHtml(badge)}</span>` : ""}
        <img class="${contain ? "isContain" : ""}" src="${escapeHtml(img)}" alt="${escapeHtml(label)}" loading="lazy" />
      </div>
    `;

  btn.innerHTML = `
    ${mediaHtml}
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
  `;
  return btn;
}

function optionCard({ label, hint, isSelected = false, onClick }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qHearBtn" + (isSelected ? " isSel" : "");
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", onClick);

  btn.innerHTML = `
    <span class="qHearLeft">
      <span class="qHearLabel">${escapeHtml(label)}</span>
      <span class="qHearHint">${escapeHtml(hint)}</span>
    </span>
    <span class="qHearRight" aria-hidden="true">
      <span class="qHearPill">${isSelected ? "Selected" : "Select"}</span>
      <span class="qHearCheck"></span>
    </span>
  `;
  return btn;
}

// -------------------------
// Modal open/close
// -------------------------
function openQuoteModal() {
  if (!quoteModal || !quoteBody) return;
  lastActiveElQuote = document.activeElement;

  Object.assign(quoteState, {
    vehicleType: "",
    serviceCategory: "",
    services: [],
    interiorCondition: "",
    exteriorCondition: "",
    upkeepFrequency: "",
    estimateLow: "",
    estimateHigh: "",
    slotId: "",
    slotLabel: "",
    slotDate: "",
    slotTime: "",
    name: "",
    phone: "",
    email: "",
    notes: "",
    ackDeposit: false,
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

window.openQuoteModal = openQuoteModal;
window.closeQuoteModal = closeQuoteModal;

document.querySelectorAll("[data-quote-open]").forEach((btn) => btn.addEventListener("click", openQuoteModal));
quoteCloseBtns.forEach((btn) => btn.addEventListener("click", closeQuoteModal));

if (quoteModal) {
  quoteModal.addEventListener(
    "click",
    (e) => {
      if (e.target === quoteModal) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}

// -------------------------
// Render
// -------------------------
function renderStep() {
  if (!quoteBody) return;

  quoteBody.innerHTML = "";
  setProgress();

  const step = steps[stepIndex];

  const title = document.createElement("div");
  title.className = "qStepTitle";
  const sub = document.createElement("div");
  sub.className = "qStepSub";

  // 1) Vehicle (✅ auto-advance)
  if (step === "vehicleType") {
    title.textContent = "Vehicle type";
    sub.textContent = "Pick the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--vehicle2x2";

    vehicleTypes.forEach((v) => {
      cards.appendChild(
        imgCard({
          label: v.label,
          hint: v.hint,
          img: v.img,
          contain: !!v.contain,
          zoom: v.zoom,
          variant: "qCard--vehicle",
          isSelected: quoteState.vehicleType === v.label,
          onClick: () => pickAndAdvance(() => (quoteState.vehicleType = v.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 2) Category (✅ auto-advance)
  if (step === "serviceCategory") {
    title.textContent = "Service category";
    sub.textContent = "Choose what you want detailed. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    serviceCategories.forEach((c) => {
      cards.appendChild(
        imgCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          variant: "qCard--square qCard--serviceCat",
          isSelected: quoteState.serviceCategory === c.label,
          onClick: () =>
            pickAndAdvance(() => {
              quoteState.serviceCategory = c.label;

              // reset downstream
              quoteState.services = [];
              quoteState.interiorCondition = "";
              quoteState.exteriorCondition = "";
              quoteState.upkeepFrequency = "";
              quoteState.slotId = "";
              quoteState.slotLabel = "";
              quoteState.slotDate = "";
              quoteState.slotTime = "";
            })
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 3) Services (✅ multi-select, NO auto-advance)
  if (step === "service") {
    title.textContent = "Select service(s)";
    sub.textContent = "Select one or more services, then press Continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    const filtered = servicesAll.filter((s) => {
      if (quoteState.serviceCategory === "Interior") {
        return s.label === "Interior Detail" || s.label === "Interior Upkeep Plan";
      }
      if (quoteState.serviceCategory === "Exterior") {
        return (
          s.label === "Exterior Wash" ||
          s.label === "Exterior Upkeep Plan" ||
          s.label === "Ceramic Coating" ||
          s.label === "Paint Correction"
        );
      }
      if (quoteState.serviceCategory === "Interior + Exterior") {
        return (
          s.label === "Interior Detail" ||
          s.label === "Exterior Wash" ||
          s.label === "Ceramic Coating" ||
          s.label === "Paint Correction" ||
          s.label === "Interior + Exterior Upkeep Plan"
        );
      }
      return false;
    });

    filtered.forEach((s) => {
      cards.appendChild(
        imgCard({
          label: s.label,
          hint: "Tap to select",
          img: s.img,
          variant: "qCard--square qCard--servicePick",
          badge: s.prewash ? "*" : "",
          isSelected: quoteState.services.includes(s.label),
          onClick: () => {
            toggleService(s.label);
            renderStep(); // update selection UI immediately
          }
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 4) Interior condition (✅ auto-advance, ✅ starting at shown here only)
  if (step === "conditionInterior") {
    title.textContent = "Interior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    interiorConditions.forEach((c) => {
      const start = startingAtForInteriorCondition(c.label);
      const hint = `${c.hint || ""}${start ? `\nStarting at $${start}` : ""}`.trim();

      cards.appendChild(
        imgCard({
          label: c.label,
          hint,
          img: c.img,
          variant: "qCard--square qCard--condition",
          isSelected: quoteState.interiorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.interiorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 5) Exterior condition (✅ auto-advance, ✅ starting at shown here only)
  if (step === "conditionExterior") {
    title.textContent = "Exterior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    exteriorConditions.forEach((c) => {
      const start = startingAtForExteriorCondition(c.label);
      const hint = `${c.hint || ""}${start ? `\nStarting at $${start}` : ""}`.trim();

      cards.appendChild(
        imgCard({
          label: c.label,
          hint,
          img: c.img,
          variant: "qCard--square qCard--condition",
          isSelected: quoteState.exteriorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.exteriorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 6) Upkeep frequency (✅ auto-advance)
  if (step === "upkeepFrequency") {
    title.textContent = "Upkeep frequency";
    sub.textContent = "How often would you like us to come out? Tap one to continue.";

    const wrap = document.createElement("div");
    wrap.className = "qHearWrap";

    const grid = document.createElement("div");
    grid.className = "qHearGrid";

    upkeepFrequencies.forEach((o) => {
      grid.appendChild(
        optionCard({
          label: o.label,
          hint: o.hint,
          isSelected: quoteState.upkeepFrequency === o.label,
          onClick: () => pickAndAdvance(() => (quoteState.upkeepFrequency = o.label))
        })
      );
    });

    wrap.appendChild(grid);
    quoteBody.append(title, sub, wrap);
  }

  // 7) Contact
  if (step === "contact") {
    title.textContent = "Your contact info";
    sub.textContent = "Required. We’ll confirm by text/call.";

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

    const f3 = document.createElement("div");
    f3.className = "qField";
    f3.innerHTML = `
      <label for="qEmail">Email *</label>
      <input id="qEmail" autocomplete="email" inputmode="email" placeholder="you@email.com" value="${escapeHtml(quoteState.email)}" />
    `;

    grid.append(f1, f2, f3);

    const notes = document.createElement("div");
    notes.className = "qField";
    notes.style.marginTop = "10px";
    notes.innerHTML = `
      <label for="qNotes">Anything else we should know?</label>
      <textarea id="qNotes" placeholder="Pet hair, stains, address notes, etc.">${escapeHtml(quoteState.notes)}</textarea>
    `;

    const ack = document.createElement("div");
    ack.style.marginTop = "10px";
    ack.innerHTML = `
      <div class="qCheck">
        <input id="qAck" type="checkbox" ${quoteState.ackDeposit ? "checked" : ""} />
        <label for="qAck">
          <strong>$25 Booking Deposit Required *</strong><br/>
          A $25 deposit is required to reserve your appointment.
          This deposit is applied to your total (example: if the job is $170, you’ll pay $25 now and the remaining $145 at service).<br/><br/>
          You can reschedule with at least <strong>2 days notice</strong>. If rescheduled with less than 2 days notice or canceled last minute, the deposit is kept.
        </label>
      </div>
      <div class="qStatus" data-q-status>
        ${canContinue() ? "" : "Required: name, phone, email, and deposit acknowledgement."}
      </div>
      <div style="display:none;">
        <input id="qCompany" placeholder="Company" value="${escapeHtml(quoteState.honeypot)}" />
      </div>
    `;

    quoteBody.append(title, sub, grid, notes, ack);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");
    const emailEl = quoteBody.querySelector("#qEmail");
    const notesEl = quoteBody.querySelector("#qNotes");
    const ackEl = quoteBody.querySelector("#qAck");
    const hpEl = quoteBody.querySelector("#qCompany");
    const statusEl = quoteBody.querySelector("[data-q-status]");

    const updateStatus = () => {
      if (!statusEl) return;
      statusEl.textContent = canContinue() ? "" : "Required: name, phone, email, and deposit acknowledgement.";
    };

    nameEl?.addEventListener("input", (e) => { quoteState.name = e.target.value || ""; updateNav(); updateStatus(); });
    phoneEl?.addEventListener("input", (e) => { quoteState.phone = e.target.value || ""; updateNav(); updateStatus(); });
    emailEl?.addEventListener("input", (e) => { quoteState.email = e.target.value || ""; updateNav(); updateStatus(); });
    notesEl?.addEventListener("input", (e) => { quoteState.notes = e.target.value || ""; });
    ackEl?.addEventListener("change", (e) => { quoteState.ackDeposit = !!e.target.checked; updateNav(); updateStatus(); });
    hpEl?.addEventListener("input", (e) => { quoteState.honeypot = e.target.value || ""; });

    setTimeout(() => nameEl?.focus(), 50);
  }

  // 8) Estimate
  if (step === "estimate") {
    title.textContent = "Estimated price";
    sub.textContent = "Estimate based on your selections.";

    const est = computeEstimate();
    quoteState.estimateLow = est ? est[0] : "";
    quoteState.estimateHigh = est ? est[1] : "";

    const box = document.createElement("div");
    box.className = "qEstimateBox qEstimateBox--simple";
    box.innerHTML = `
      <div class="qEstimateBig">
        ${est ? `$${escapeHtml(est[0])}–$${escapeHtml(est[1])}` : "We’ll confirm after assessment"}
      </div>
      <div class="qEstimatePills">
        <span class="qPill"><strong>Vehicle:</strong> ${escapeHtml(quoteState.vehicleType)}</span>
        <span class="qPill"><strong>Services:</strong> ${escapeHtml((quoteState.services || []).join(", "))}</span>
        ${quoteState.upkeepFrequency ? `<span class="qPill"><strong>Frequency:</strong> ${escapeHtml(quoteState.upkeepFrequency)}</span>` : ""}
        ${quoteState.interiorCondition ? `<span class="qPill"><strong>Interior:</strong> ${escapeHtml(quoteState.interiorCondition)}</span>` : ""}
        ${quoteState.exteriorCondition ? `<span class="qPill"><strong>Exterior:</strong> ${escapeHtml(quoteState.exteriorCondition)}</span>` : ""}
      </div>
      <div class="qEstimateFine">Final price confirmed after quick assessment.</div>
    `;
    quoteBody.append(title, sub, box);
  }

  // 9) Appointment
  if (step === "appointment") {
    title.textContent = "Select a Date and Time";
    sub.textContent = "Choose an available date, then pick a time.";

    const wrap = document.createElement("div");
    wrap.className = "qCalWrap";

    const topRow = document.createElement("div");
    topRow.className = "qCalTopRow";

    const tz = document.createElement("div");
    tz.className = "qCalTz";
    tz.textContent = calendarCache.tzLabel || "Local Time";

    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "qReloadLink";
    reload.textContent = "Reload";
    reload.addEventListener("click", () => loadAvailabilityAndRender(status, loadBar, cal, timesBox, nextAvailBtn, tz));

    topRow.append(tz, reload);

    const status = document.createElement("div");
    status.className = "qStatus";
    status.textContent = "Loading availability...";

    const loadBar = document.createElement("div");
    loadBar.className = "qLoadBar";
    loadBar.innerHTML = `<span class="qLoadBarFill" aria-hidden="true"></span>`;

    const cal = document.createElement("div");
    cal.className = "qCal";

    const timesBox = document.createElement("div");
    timesBox.className = "qTimes";

    const nextAvailBtn = document.createElement("button");
    nextAvailBtn.type = "button";
    nextAvailBtn.className = "btn btn--quote qNextAvail";
    nextAvailBtn.textContent = "Check Next Availability";
    nextAvailBtn.addEventListener("click", () => {
      const nextDate = findNextAvailableDate(quoteState.slotDate || "");
      if (nextDate) {
        quoteState.slotDate = nextDate;
        quoteState.slotTime = "";
        quoteState.slotId = "";
        quoteState.slotLabel = "";
        renderStep();
      }
    });

    wrap.append(topRow, status, loadBar, cal, timesBox, nextAvailBtn);
    quoteBody.append(title, sub, wrap);

    loadAvailabilityAndRender(status, loadBar, cal, timesBox, nextAvailBtn, tz);
  }

  // 10) Done
  if (step === "done") {
    title.textContent = "You're booked";
    sub.textContent = "We received your request and will confirm shortly.";

    const box = document.createElement("div");
    box.className = "qDoneBox";
    box.innerHTML = `
      <div class="qDoneBig">✅ Request submitted</div>
      <div class="qDoneLine"><strong>Services:</strong> ${escapeHtml((quoteState.services || []).join(", ") || "—")}</div>
      ${quoteState.upkeepFrequency ? `<div class="qDoneLine"><strong>Frequency:</strong> ${escapeHtml(quoteState.upkeepFrequency)}</div>` : ""}
      <div class="qDoneLine"><strong>Appointment:</strong> ${escapeHtml(quoteState.slotLabel || "—")}</div>
      <div class="qDoneLine"><strong>Estimate:</strong> ${
        quoteState.estimateLow && quoteState.estimateHigh
          ? `$${escapeHtml(quoteState.estimateLow)}–$${escapeHtml(quoteState.estimateHigh)}`
          : "—"
      }</div>
      <div class="qDoneFine">If you need anything immediately, call us.</div>
    `;

    const actions = document.createElement("div");
    actions.style.marginTop = "12px";
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const callBtn = document.createElement("a");
    callBtn.className = "btn btn--call";
    callBtn.href = `tel:${window.BUSINESS_PHONE || ""}`;
    callBtn.textContent = "CALL NOW";

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn--quote";
    closeBtn.type = "button";
    closeBtn.textContent = "CLOSE";
    closeBtn.addEventListener("click", closeQuoteModal);

    actions.append(callBtn, closeBtn);
    quoteBody.append(title, sub, box, actions);
  }

  updateNav();
}

// -------------------------
// Availability (Apps Script)
// -------------------------
let calendarCache = { tzLabel: "Local Time", slots: [], byDate: new Map() };

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function daysInMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }
function monthLabel(date) { return date.toLocaleString(undefined, { month: "long", year: "numeric" }); }

function buildCalendarIndex(slots) {
  const map = new Map();
  slots.forEach((s) => {
    const k = s.date;
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  });
  for (const [k, arr] of map.entries()) arr.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  return map;
}
function findNextAvailableDate(fromDateISO) {
  const dates = Array.from(calendarCache.byDate.keys()).sort();
  for (const d of dates) if (!fromDateISO || d >= fromDateISO) return d;
  return "";
}
function parseSlotToDateTime(slot) {
  const id = String(slot.id || "").trim();
  const label = String(slot.label || "").trim();

  const m1 = id.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  if (m1) return { date: m1[1], time: m1[2], pretty: label || id };

  const m2 = id.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m2) return { date: m2[1], time: m2[2], pretty: label || id };

  const d = new Date(label);
  if (!isNaN(d.getTime())) {
    const date = isoDate(d);
    const time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    return { date, time, pretty: label || id };
  }
  return { date: "", time: "", pretty: label || id };
}

async function loadAvailabilityAndRender(statusEl, loadBarEl, calEl, timesEl, nextAvailBtn, tzEl) {
  if (!statusEl || !calEl || !timesEl || !loadBarEl) return;

  statusEl.textContent = "Loading availability...";
  loadBarEl.classList.add("isOn");
  calEl.innerHTML = "";
  timesEl.innerHTML = "";
  nextAvailBtn.style.display = "none";

  const script = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;

  try {
    const url = `${script}?action=slots&t=${Date.now()}`;
    const res = await fetch(url, { method: "GET", cache: "no-store", redirect: "follow" });
    const text = await res.text();

    let data = null;
    try { data = JSON.parse(text); }
    catch {
      statusEl.textContent = "Scheduling error: Apps Script did not return JSON. (Deploy Web App access: Anyone / Anyone with link)";
      loadBarEl.classList.remove("isOn");
      return;
    }

    if (!data || data.ok !== true || !Array.isArray(data.slots)) {
      statusEl.textContent = "Couldn’t load availability. (Bad response format)";
      loadBarEl.classList.remove("isOn");
      return;
    }

    calendarCache.tzLabel = data.tzLabel || "Local Time";
    if (tzEl) tzEl.textContent = calendarCache.tzLabel;

    const normalized = data.slots
      .filter((s) => String(s.status || "open").toLowerCase() === "open" || !("status" in s))
      .map((s) => {
        const parsed =
          "date" in s && "time" in s && s.date && s.time
            ? { date: String(s.date), time: String(s.time), pretty: String(s.label || "") }
            : parseSlotToDateTime(s);
        return { id: String(s.id || ""), date: parsed.date, time: parsed.time, label: String(s.label || parsed.pretty || s.id || "") };
      })
      .filter((s) => s.id && s.date && s.time);

    calendarCache.slots = normalized;
    calendarCache.byDate = buildCalendarIndex(calendarCache.slots);

    if (calendarCache.slots.length === 0) {
      statusEl.textContent = "No availability right now.";
      nextAvailBtn.style.display = "inline-flex";
      loadBarEl.classList.remove("isOn");
      return;
    }

    if (!quoteState.slotDate) quoteState.slotDate = findNextAvailableDate("");
    else if (!calendarCache.byDate.has(quoteState.slotDate)) quoteState.slotDate = findNextAvailableDate(quoteState.slotDate);

    statusEl.textContent = "Select a date, then choose a time:";
    renderCalendar(calEl, timesEl, nextAvailBtn);
  } catch {
    statusEl.textContent = "Couldn’t load availability. Check Apps Script deployment + sheet rows.";
  } finally {
    loadBarEl.classList.remove("isOn");
    updateNav();
  }
}

function renderCalendar(calEl, timesEl, nextAvailBtn) {
  const selected = quoteState.slotDate ? new Date(`${quoteState.slotDate}T12:00:00`) : new Date();
  let cursor = startOfMonth(selected);

  const head = document.createElement("div");
  head.className = "qCalHead";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "qCalNav";
  prev.textContent = "‹";
  prev.addEventListener("click", () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    quoteState.slotTime = "";
    quoteState.slotId = "";
    quoteState.slotLabel = "";
    drawMonth(cursor);
  });

  const label = document.createElement("div");
  label.className = "qCalMonth";
  label.textContent = monthLabel(cursor);

  const next = document.createElement("button");
  next.type = "button";
  next.className = "qCalNav";
  next.textContent = "›";
  next.addEventListener("click", () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    quoteState.slotTime = "";
    quoteState.slotId = "";
    quoteState.slotLabel = "";
    drawMonth(cursor);
  });

  head.append(prev, label, next);

  const week = document.createElement("div");
  week.className = "qCalWeek";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => {
    const w = document.createElement("div");
    w.className = "qCalW";
    w.textContent = d;
    week.appendChild(w);
  });

  const grid = document.createElement("div");
  grid.className = "qCalGrid";

  calEl.innerHTML = "";
  calEl.append(head, week, grid);

  const drawMonth = (mStart) => {
    label.textContent = monthLabel(mStart);
    grid.innerHTML = "";

    const firstDow = mStart.getDay();
    const total = daysInMonth(mStart);

    for (let i = 0; i < firstDow; i++) {
      const blank = document.createElement("div");
      blank.className = "qCalDay qCalDay--blank";
      grid.appendChild(blank);
    }

    for (let d = 1; d <= total; d++) {
      const date = new Date(mStart.getFullYear(), mStart.getMonth(), d);
      const dateISO = isoDate(date);
      const hasSlots = calendarCache.byDate.has(dateISO);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qCalDay" + (hasSlots ? "" : " isDisabled") + (quoteState.slotDate === dateISO ? " isSel" : "");
      btn.textContent = String(d);
      btn.disabled = !hasSlots;

      btn.addEventListener("click", () => {
        quoteState.slotDate = dateISO;
        quoteState.slotTime = "";
        quoteState.slotId = "";
        quoteState.slotLabel = "";
        renderCalendar(calEl, timesEl, nextAvailBtn);
      });

      grid.appendChild(btn);
    }

    renderTimes(timesEl, nextAvailBtn);
  };

  drawMonth(cursor);
}

function renderTimes(timesEl, nextAvailBtn) {
  timesEl.innerHTML = "";

  const selectedDate = quoteState.slotDate;
  const list = calendarCache.byDate.get(selectedDate) || [];

  const title = document.createElement("div");
  title.className = "qTimesTitle";
  title.textContent = selectedDate ? `Availability for ${selectedDate}` : "Availability";
  timesEl.appendChild(title);

  const selectedLine = document.createElement("div");
  selectedLine.className = "qTimesNone";
  selectedLine.setAttribute("data-q-selected-line", "true");
  selectedLine.textContent = quoteState.slotLabel ? `Selected: ${quoteState.slotLabel}` : "Selected: —";
  timesEl.appendChild(selectedLine);

  if (!list.length) {
    const none = document.createElement("div");
    none.className = "qTimesNone";
    none.textContent = "No availability";
    timesEl.appendChild(none);

    nextAvailBtn.style.display = "inline-flex";
    return;
  }

  nextAvailBtn.style.display = "none";

  const grid = document.createElement("div");
  grid.className = "qTimesGrid";

  list.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "qTimeBtn" + (quoteState.slotId === s.id ? " isSel" : "");
    b.textContent = s.time;

    b.addEventListener("click", () => {
      quoteState.slotId = s.id;
      quoteState.slotDate = s.date;
      quoteState.slotTime = s.time;
      quoteState.slotLabel = s.label || `${s.date} ${s.time}`;

      grid.querySelectorAll(".qTimeBtn.isSel").forEach((btn) => btn.classList.remove("isSel"));
      b.classList.add("isSel");

      const line = timesEl.querySelector('[data-q-selected-line="true"]');
      if (line) line.textContent = `Selected: ${quoteState.slotLabel}`;

      updateNav();
    });

    grid.appendChild(b);
  });

  timesEl.appendChild(grid);
  updateNav();
}

// -------------------------
// Submit
// -------------------------
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPayload() {
  return {
    timestamp: new Date().toISOString(),
    source: "Website Quote Wizard",

    vehicleType: quoteState.vehicleType,
    serviceCategory: quoteState.serviceCategory,
    services: quoteState.services,

    interiorCondition: quoteState.interiorCondition,
    exteriorCondition: quoteState.exteriorCondition,

    upkeepFrequency: quoteState.upkeepFrequency,

    estimateLow: quoteState.estimateLow,
    estimateHigh: quoteState.estimateHigh,

    slotId: quoteState.slotId,
    slotLabel: quoteState.slotLabel,
    slotDate: quoteState.slotDate,
    slotTime: quoteState.slotTime,

    name: quoteState.name,
    phone: quoteState.phone,
    email: quoteState.email,
    notes: quoteState.notes,

    ackDeposit: quoteState.ackDeposit
  };
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    cache: "no-store",
    redirect: "follow"
  });

  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { ok: false, message: "Apps Script returned non-JSON." }; }
}

async function reserveAndSend() {
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) return { ok: true };

  const script = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;
  const payload = buildPayload();
  const reserveUrl = `${script}?action=reserve`;

  try {
    const result = await Promise.race([postJson(reserveUrl, payload), timeout(12000)]);

    if (result && result.ok === true) return { ok: true };
    if (result && result.ok === false) return { ok: false, message: result.message || "That time was just booked." };
    return { ok: false, message: "Submit failed." };
  } catch {
    return { ok: false, message: "Submission blocked (CORS)." };
  }
}

// -------------------------
// Nav actions
// -------------------------
function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  if (step === "appointment") {
    quoteNextBtn.disabled = true;
    const old = quoteNextBtn.textContent;
    quoteNextBtn.textContent = "Sending...";

    const est = computeEstimate();
    quoteState.estimateLow = est ? est[0] : "";
    quoteState.estimateHigh = est ? est[1] : "";

    reserveAndSend().then((result) => {
      if (result && result.ok === false) {
        alert(result.message || "That time was just booked. Pick another slot.");
        quoteNextBtn.textContent = old;
        quoteNextBtn.disabled = false;
        return;
      }

      stepIndex = steps.indexOf("done");
      renderStep();
      quoteNextBtn.textContent = old;
      quoteNextBtn.disabled = false;
    });

    return;
  }

  stepIndex = nextActiveStepIndex(stepIndex);
  renderStep();
  if (fromAutoAdvance) updateNav();
}

function prevStep() {
  if (steps[stepIndex] === "done") {
    closeQuoteModal();
    return;
  }
  stepIndex = prevActiveStepIndex(stepIndex);
  renderStep();
}

quoteNextBtn?.addEventListener("click", () => nextStep(false));
quoteBackBtn?.addEventListener("click", prevStep);

if (quoteModal?.classList.contains("isOpen")) renderStep();
