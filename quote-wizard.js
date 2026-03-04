// -------------------------
// QUOTE WIZARD (Flow v7.7)
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

let lastActiveElQuote = null;

const quoteState = {
  vehicleType: "",
  serviceCategory: "",

  // ✅ multi-select support
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
  { label: "Exterior", hint: "Outside-only detailing", img: "./c36084da09340612d8431de0221ea985_car-detailing-houston-1.jpg" },
  { label: "Interior + Exterior", hint: "Full detail inside + out", img: "./Untitled design (3).png" }
];

// Upkeep plan image rules
const INTERIOR_UPKEEP_IMG = "./img_6480.webp";
const EXTERIOR_UPKEEP_IMG = "./Audi 2 Foamed_1704769098.webp"; // required

const servicesAll = [
  { label: "Interior Detail", category: "Interior", img: "./Shampooing_interior_detail-55a7e5ac-640w.webp" },
  { label: "Exterior Wash", category: "Exterior", img: "./63eaaf7a6f6b7f11ccae99f6_car-detailing-houston-1.jpg" },

  { label: "Interior Upkeep Plan", category: "Interior", img: INTERIOR_UPKEEP_IMG, upkeep: "interior" },
  { label: "Exterior Upkeep Plan", category: "Exterior", img: EXTERIOR_UPKEEP_IMG, upkeep: "exterior" },
  {
    label: "Interior + Exterior Upkeep Plan",
    category: "Both",
    img: [INTERIOR_UPKEEP_IMG, EXTERIOR_UPKEEP_IMG],
    upkeep: "both"
  },

  { label: "Ceramic Coating", category: "Exterior", img: "./2626cb4b-d7f8-4cb3-b79b-be682b3b9112.png", prewash: true },
  { label: "Paint Correction", category: "Exterior", img: "./bee.jpg", prewash: true }
];

const interiorConditions = [
  { label: "Light", hint: "Mostly clean • quick refresh", img: "./IMG_2915.jpg" },
  { label: "Normal", hint: "Daily driver • solid reset", img: "./IMG_2916.jpg" },
  { label: "Heavy", hint: "Stains/pet hair • deep work", img: "./dirty-car-complete-with-moldy-carpets-v0-nb2pbgkkdalb1.png" }
];

const exteriorConditions = [
  { label: "Light", hint: "Quick refresh", img: "./looks-dirty-even-after-wash-v0-0v8lqgjivccf1.webp" },
  { label: "Normal", hint: "Daily driver", img: "./IMG_2910.jpg" },
  { label: "Heavy", hint: "Heavy grime/bugs/tar", img: "./dirty-car.jpg" }
];

const upkeepFrequencies = [
  { label: "Weekly", hint: "Best for staying spotless" },
  { label: "Biweekly", hint: "Most popular" },
  { label: "Monthly", hint: "Maintenance refresh" }
];

// -------------------------
// PRICING TABLES (starting price + ranges)
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
  "Ceramic Coating": {
    Small: [450, 900], Medium: [550, 1100], Large: [650, 1400], Truck: [650, 1400]
  },
  "Paint Correction": {
    Small: [350, 800], Medium: [450, 950], Large: [550, 1200], Truck: [550, 1200]
  },

  // Upkeep base ranges (we apply condition factors to these)
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

function clampInt(n) {
  const x = Math.round(Number(n));
  return Number.isFinite(x) ? x : null;
}

function conditionFactor(cond) {
  if (cond === "Light") return 0.92;
  if (cond === "Normal") return 1.0;
  if (cond === "Heavy") return 1.14;
  return 1.0;
}

function hasService(label) {
  return quoteState.services.includes(label);
}

function toggleService(label) {
  if (hasService(label)) {
    quoteState.services = quoteState.services.filter((s) => s !== label);
  } else {
    // single-select unless Interior+Exterior category
    if (quoteState.serviceCategory !== "Interior + Exterior") {
      quoteState.services = [label];
    } else {
      quoteState.services = [...quoteState.services, label];
    }
  }

  // reset downstream when services change
  quoteState.interiorCondition = "";
  quoteState.exteriorCondition = "";
  quoteState.upkeepFrequency = "";
  quoteState.slotId = "";
  quoteState.slotLabel = "";
  quoteState.slotDate = "";
  quoteState.slotTime = "";
}

function isAnyUpkeepSelected() {
  return (
    hasService("Interior Upkeep Plan") ||
    hasService("Exterior Upkeep Plan") ||
    hasService("Interior + Exterior Upkeep Plan")
  );
}

function serviceNeedsInterior(label) {
  if (label === "Interior Detail") return true;
  if (label === "Interior Upkeep Plan") return true;
  if (label === "Interior + Exterior Upkeep Plan") return true;
  // other services don’t need interior condition
  return false;
}

function serviceNeedsExterior(label) {
  if (label === "Exterior Wash") return true;
  if (label === "Exterior Upkeep Plan") return true;
  if (label === "Interior + Exterior Upkeep Plan") return true;
  if (label === "Ceramic Coating") return true;
  if (label === "Paint Correction") return true;
  return false;
}

function stepIsActive(stepName) {
  if (stepName === "conditionInterior") {
    return quoteState.services.some(serviceNeedsInterior);
  }
  if (stepName === "conditionExterior") {
    return quoteState.services.some(serviceNeedsExterior);
  }
  if (stepName === "upkeepFrequency") return isAnyUpkeepSelected();
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

function setProgress() {
  const dots = quoteDots();
  if (!dots.length) return;
  dots.forEach((d, i) => d.classList.toggle("isOn", i === Math.min(stepIndex, dots.length - 1)));
}

// -------------------------
// STARTING PRICE + ESTIMATE
// -------------------------
// Starting price = lowest possible price for the selected config.
// If a condition isn't chosen yet, we assume Light (lowest).
function startingPriceForService(label, opts) {
  const type = quoteState.vehicleType;
  if (!type) return null;

  const ic = opts?.interiorCondition || quoteState.interiorCondition || "Light";
  const ec = opts?.exteriorCondition || quoteState.exteriorCondition || "Light";

  // Upkeep plans
  if (serviceOverrides[label] && label.includes("Upkeep Plan")) {
    const base = serviceOverrides[label]?.[type];
    if (!base) return null;

    let f = 1.0;
    if (label === "Interior Upkeep Plan") f = conditionFactor(ic);
    else if (label === "Exterior Upkeep Plan") f = conditionFactor(ec);
    else if (label === "Interior + Exterior Upkeep Plan") f = (conditionFactor(ic) + conditionFactor(ec)) / 2;

    return clampInt(base[0] * f);
  }

  // Overrides (coating/correction)
  if (serviceOverrides[label] && !label.includes("Upkeep Plan")) {
    const r = serviceOverrides[label]?.[type];
    return r ? clampInt(r[0]) : null;
  }

  // Base services
  if (label === "Interior Detail") {
    const r = estimateTable.Interior?.[type]?.[ic];
    return r ? clampInt(r[0]) : null;
  }
  if (label === "Exterior Wash") {
    const r = estimateTable.Exterior?.[type]?.[ec];
    return r ? clampInt(r[0]) : null;
  }

  return null;
}

// Total starting price for selected services with optional conditions plugged in
function startingPriceTotal(opts) {
  if (!quoteState.services.length) return null;
  let total = 0;
  for (const s of quoteState.services) {
    const p = startingPriceForService(s, opts);
    if (p == null) return null;
    total += p;
  }
  return clampInt(total);
}

// Ranged estimate used later (still useful for “what it might be”)
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

function computeEstimateRange() {
  const type = quoteState.vehicleType;
  if (!type || !quoteState.services.length) return null;

  const ic = quoteState.interiorCondition || "Light";
  const ec = quoteState.exteriorCondition || "Light";

  let lowTotal = 0;
  let highTotal = 0;

  for (const label of quoteState.services) {
    // Upkeep plans
    if (serviceOverrides[label] && label.includes("Upkeep Plan")) {
      const base = serviceOverrides[label]?.[type];
      if (!base) return null;

      let f = 1.0;
      if (label === "Interior Upkeep Plan") f = conditionFactor(ic);
      else if (label === "Exterior Upkeep Plan") f = conditionFactor(ec);
      else if (label === "Interior + Exterior Upkeep Plan") f = (conditionFactor(ic) + conditionFactor(ec)) / 2;

      lowTotal += base[0] * f;
      highTotal += base[1] * f;
      continue;
    }

    // Overrides (coating/correction)
    if (serviceOverrides[label] && !label.includes("Upkeep Plan")) {
      const r = serviceOverrides[label]?.[type];
      if (!r) return null;
      lowTotal += r[0];
      highTotal += r[1];
      continue;
    }

    // Base services
    if (label === "Interior Detail") {
      const r = estimateTable.Interior?.[type]?.[ic];
      if (!r) return null;
      lowTotal += r[0];
      highTotal += r[1];
      continue;
    }
    if (label === "Exterior Wash") {
      const r = estimateTable.Exterior?.[type]?.[ec];
      if (!r) return null;
      lowTotal += r[0];
      highTotal += r[1];
      continue;
    }

    return null;
  }

  return tightenAndHeavier([clampInt(lowTotal), clampInt(highTotal)]);
}

// -------------------------
// Continue rules
// -------------------------
function canContinue() {
  const step = steps[stepIndex];

  if (step === "vehicleType") return !!quoteState.vehicleType;
  if (step === "serviceCategory") return !!quoteState.serviceCategory;
  if (step === "service") return quoteState.services.length > 0;

  if (step === "conditionInterior") {
    // only required if any selected service needs interior
    const needs = quoteState.services.some(serviceNeedsInterior);
    return needs ? !!quoteState.interiorCondition : true;
  }

  if (step === "conditionExterior") {
    const needs = quoteState.services.some(serviceNeedsExterior);
    return needs ? !!quoteState.exteriorCondition : true;
  }

  if (step === "upkeepFrequency") return isAnyUpkeepSelected() ? !!quoteState.upkeepFrequency : true;

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
// Calendar state + helpers
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

  // 1) Vehicle
  if (step === "vehicleType") {
    title.textContent = "Vehicle type";
    sub.textContent = "Pick the closest match. Then press Continue.";

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
          onClick: () => {
            quoteState.vehicleType = v.label;
            renderStep();
          }
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 2) Category
  if (step === "serviceCategory") {
    title.textContent = "Service category";
    sub.textContent = "Choose what you want. Then press Continue.";

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
          onClick: () => {
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
            renderStep();
          }
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 3) Service(s) (✅ multi-select for Interior+Exterior)
  if (step === "service") {
    const multi = quoteState.serviceCategory === "Interior + Exterior";
    title.textContent = multi ? "Select services" : "Select service";
    sub.textContent = multi
      ? "Pick as many as you want (ex: Interior Detail + Paint Correction). Then press Continue."
      : "Pick the service you want. Then press Continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    const filtered = servicesAll.filter((s) => {
      if (quoteState.serviceCategory === "Interior") return s.category === "Interior";
      if (quoteState.serviceCategory === "Exterior") return s.category === "Exterior";

      if (quoteState.serviceCategory === "Interior + Exterior") {
        // ✅ allow only combined upkeep plan in this category (no interior-only/exterior-only upkeep)
        if (s.label === "Interior Upkeep Plan") return false;
        if (s.label === "Exterior Upkeep Plan") return false;

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
      const start = startingPriceForService(s.label, {
        interiorCondition: "Light",
        exteriorCondition: "Light"
      });

      const hint = `${multi ? "Tap to toggle" : "Tap to select"}${start ? `\nStarting at $${start}` : ""}`;

      cards.appendChild(
        imgCard({
          label: s.label,
          hint,
          img: s.img,
          variant: "qCard--square qCard--servicePick",
          badge: s.prewash ? "*" : "",
          isSelected: hasService(s.label),
          onClick: () => {
            toggleService(s.label);
            renderStep();
          }
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 4) Interior condition (✅ starting price is total with this condition)
  if (step === "conditionInterior") {
    title.textContent = "Interior condition";
    sub.textContent = "Choose the closest match. Then press Continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    interiorConditions.forEach((c) => {
      const startTotal = startingPriceTotal({
        interiorCondition: c.label,
        exteriorCondition: quoteState.exteriorCondition || "Light"
      });

      const hint = `${c.hint || ""}${startTotal ? `\nStarting at $${startTotal}` : ""}`.trim();

      cards.appendChild(
        imgCard({
          label: c.label,
          hint,
          img: c.img,
          variant: "qCard--square qCard--condition",
          isSelected: quoteState.interiorCondition === c.label,
          onClick: () => {
            quoteState.interiorCondition = c.label;
            renderStep();
          }
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 5) Exterior condition (✅ starting price is total with this condition)
  if (step === "conditionExterior") {
    title.textContent = "Exterior condition";
    sub.textContent = "Choose the closest match. Then press Continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    exteriorConditions.forEach((c) => {
      const startTotal = startingPriceTotal({
        interiorCondition: quoteState.interiorCondition || "Light",
        exteriorCondition: c.label
      });

      const hint = `${c.hint || ""}${startTotal ? `\nStarting at $${startTotal}` : ""}`.trim();

      cards.appendChild(
        imgCard({
          label: c.label,
          hint,
          img: c.img,
          variant: "qCard--square qCard--condition",
          isSelected: quoteState.exteriorCondition === c.label,
          onClick: () => {
            quoteState.exteriorCondition = c.label;
            renderStep();
          }
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 6) Upkeep frequency
  if (step === "upkeepFrequency") {
    title.textContent = "Upkeep frequency";
    sub.textContent = "How often would you like us to come out? Then press Continue.";

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
          onClick: () => {
            quoteState.upkeepFrequency = o.label;
            renderStep();
          }
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
      <input id="qPhone" autocomplete="tel" inputmode="tel" placeholder="(555) 555-5555" value="${escapeHtml(quoteState
