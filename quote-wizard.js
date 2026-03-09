/* quote-wizard.js
// -------------------------
// QUOTE WIZARD (Flow v10.3 - Apple Pay Fix + Deposit or Pay In Full)
// -------------------------
// Vehicle -> Category -> Service(s) -> Conditions -> Upkeep Frequency (if upkeep)
// -> Contact -> Estimate -> Appointment -> Payment -> Done
//
// Requirements:
// 1) Add <script src="https://web.squarecdn.com/v1/square.js"></script> to your HTML <head>
// 2) Add /api/create-square-payment.js on Vercel
*/

const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwgVow2uDZh0MGsoRzUV0MvZHTFnbWtXOjeuh4iXKPKrs3w4Qocu1yETtdRmIXnyvd5ag/exec";

const SQUARE_APP_ID = "sq0idp-9rqrzxMJ-huh115bZkPH5Q";
const SQUARE_LOCATION_ID = "LV9XSE8KC6F93";
const SQUARE_PAYMENT_ENDPOINT = "/api/create-square-payment";
const DEPOSIT_AMOUNT = 25;

const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteDots = () => Array.from(document.querySelectorAll(".qpDot"));

let lastActiveElQuote = null;
let squarePayments = null;
let squareCard = null;
let squareApplePay = null;
let squarePaymentsInitPromise = null;
let squareWarmStarted = false;

const quoteState = {
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
  city: "",
  notes: "",

  paymentMode: "deposit", // "deposit" | "full"
  ackDeposit: false,
  ackPriceVariance: false,
  depositAmount: DEPOSIT_AMOUNT,
  paymentStatus: "", // "", "ready", "processing", "paid"
  paymentMessage: "",
  squarePaymentId: "",
  paidAmount: "",

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
  "payment",
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

const SERVICECAT_INTERIOR_IMG = "./2017-05-22-07-32-26.jpg";
const SERVICECAT_EXTERIOR_IMG = "./c36084da09340612d8431de0221ea985.jpg";

const serviceCategories = [
  { label: "Interior", hint: "Inside-only detailing", img: SERVICECAT_INTERIOR_IMG },
  { label: "Exterior", hint: "Outside-only detailing", img: SERVICECAT_EXTERIOR_IMG },
  { label: "Interior + Exterior", hint: "Full detail inside + out", img: [SERVICECAT_INTERIOR_IMG, SERVICECAT_EXTERIOR_IMG], split: "h" }
];

const INTERIOR_UPKEEP_IMG = "./img_6480.webp";
const EXTERIOR_UPKEEP_IMG = "./Audi 2 Foamed_1704769098.webp";

const REQUIRES_WASH = new Set(["Ceramic Coating", "Paint Correction"]);
const REQUIRED_WASH_LABEL = "Exterior Wash";

const servicesAll = [
  { label: "Interior Detail", category: "Interior", img: "./Shampooing_interior_detail-55a7e5ac-640w.webp" },
  { label: "Exterior Wash", category: "Exterior", img: "./63eaaf7a6f6b7f11ccae99f6_car-detailing-houston-1.jpg" },

  { label: "Interior Upkeep Plan", category: "Interior", img: INTERIOR_UPKEEP_IMG, upkeep: "interior" },
  { label: "Exterior Upkeep Plan", category: "Exterior", img: EXTERIOR_UPKEEP_IMG, upkeep: "exterior" },
  { label: "Interior + Exterior Upkeep Plan", category: "Both", img: [INTERIOR_UPKEEP_IMG, EXTERIOR_UPKEEP_IMG], split: "h", upkeep: "both" },

  { label: "Ceramic Coating", category: "Exterior", img: "./2626cb4b-d7f8-4cb3-b79b-be682b3b9112.png", prewash: true },
  { label: "Paint Correction", category: "Exterior", img: "./bee.jpg", prewash: true }
];

const interiorConditions = [
  { label: "Light", hint: "Mostly clean • quick refresh", img: "./IMG_2915.jpg" },
  { label: "Normal", hint: "Daily driver • solid reset", img: "./IMG_2916.jpg" },
  { label: "Heavy", hint: "Stains/pet hair • deep work", img: "./dirty-car-complete-with-moldy-carpets-v0-nb2pbgkkdalb1.png" }
];

const exteriorConditions = [
  { label: "Light", hint: "Light grime • quick reset", img: "./looks-dirty-even-after-wash-v0-0v8lqgjivccf1.webp" },
  { label: "Normal", hint: "Daily driver • full wash", img: "./IMG_2910.jpg", zoom: 1.28 },
  { label: "Heavy", hint: "Build-up • extra prep", img: "./dirty-car.jpg" }
];

const upkeepFrequencies = [
  { label: "Weekly", hint: "Best for staying spotless" },
  { label: "Biweekly", hint: "Most popular" },
  { label: "Monthly", hint: "Maintenance refresh" }
];

const serviceCities = [
  "Keizer",
  "Salem",
  "Portland",
  "Tigard",
  "Lake Oswego"
];

// -------------------------
// ESTIMATES
// -------------------------
const VEHICLE_ADDON = {
  Small: 0,
  Medium: 20,
  Large: 40,
  Truck: 30
};

const INTERIOR_BASE_BY_COND = { Light: 150, Normal: 190, Heavy: 240 };
const EXTERIOR_BASE_BY_COND = { Light: 80, Normal: 95, Heavy: 115 };

const INTERIOR_SPREAD = 70;
const EXTERIOR_SPREAD = 45;

function buildConditionTable(baseByCond, spread) {
  return {
    Small: {
      Light: [baseByCond.Light + VEHICLE_ADDON.Small, baseByCond.Light + VEHICLE_ADDON.Small + spread],
      Normal: [baseByCond.Normal + VEHICLE_ADDON.Small, baseByCond.Normal + VEHICLE_ADDON.Small + spread],
      Heavy: [baseByCond.Heavy + VEHICLE_ADDON.Small, baseByCond.Heavy + VEHICLE_ADDON.Small + spread]
    },
    Medium: {
      Light: [baseByCond.Light + VEHICLE_ADDON.Medium, baseByCond.Light + VEHICLE_ADDON.Medium + spread],
      Normal: [baseByCond.Normal + VEHICLE_ADDON.Medium, baseByCond.Normal + VEHICLE_ADDON.Medium + spread],
      Heavy: [baseByCond.Heavy + VEHICLE_ADDON.Medium, baseByCond.Heavy + VEHICLE_ADDON.Medium + spread]
    },
    Large: {
      Light: [baseByCond.Light + VEHICLE_ADDON.Large, baseByCond.Light + VEHICLE_ADDON.Large + spread],
      Normal: [baseByCond.Normal + VEHICLE_ADDON.Large, baseByCond.Normal + VEHICLE_ADDON.Large + spread],
      Heavy: [baseByCond.Heavy + VEHICLE_ADDON.Large, baseByCond.Heavy + VEHICLE_ADDON.Large + spread]
    },
    Truck: {
      Light: [baseByCond.Light + VEHICLE_ADDON.Truck, baseByCond.Light + VEHICLE_ADDON.Truck + spread],
      Normal: [baseByCond.Normal + VEHICLE_ADDON.Truck, baseByCond.Normal + VEHICLE_ADDON.Truck + spread],
      Heavy: [baseByCond.Heavy + VEHICLE_ADDON.Truck, baseByCond.Heavy + VEHICLE_ADDON.Truck + spread]
    }
  };
}

const estimateTable = {
  Interior: buildConditionTable(INTERIOR_BASE_BY_COND, INTERIOR_SPREAD),
  Exterior: buildConditionTable(EXTERIOR_BASE_BY_COND, EXTERIOR_SPREAD)
};

const serviceOverrides = {
  "Paint Correction": { Small: [450, 450], Medium: [500, 500], Large: [550, 550], Truck: [520, 520] },
  "Ceramic Coating": { Small: [700, 700], Medium: [750, 750], Large: [800, 800], Truck: [770, 770] },

  "Interior Upkeep Plan": { Small: [85, 85], Medium: [95, 95], Large: [110, 110], Truck: [100, 100] },
  "Exterior Upkeep Plan": { Small: [55, 55], Medium: [65, 65], Large: [75, 75], Truck: [70, 70] },

  "Interior + Exterior Upkeep Plan": {
    Small: [INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Small + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Small - 20, INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Small + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Small - 20],
    Medium: [INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Medium + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Medium - 20, INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Medium + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Medium - 20],
    Large: [INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Large + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Large - 20, INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Large + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Large - 20],
    Truck: [INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Truck + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Truck - 20, INTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Truck + EXTERIOR_BASE_BY_COND.Normal + VEHICLE_ADDON.Truck - 20]
  }
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

function renderNavPrice() { return; }

function moneyToCents(n) {
  return Math.round(Number(n || 0) * 100);
}

function makeIdempotencyKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `qw_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatMoney(n) {
  return `$${Number(n || 0).toFixed(0)}`;
}

function getEstimateRange() {
  const est = computeEstimate();
  if (!est) return null;
  return { low: Number(est[0] || 0), high: Number(est[1] || 0) };
}

function getFullPayAmount() {
  const est = getEstimateRange();
  if (!est) return DEPOSIT_AMOUNT;
  return Math.round((est.low + est.high) / 2);
}

function getCurrentChargeAmount() {
  return quoteState.paymentMode === "full" ? getFullPayAmount() : Number(quoteState.depositAmount || DEPOSIT_AMOUNT);
}

function getPaymentLabel() {
  return quoteState.paymentMode === "full"
    ? "Keizer Mobile Detailing Full Payment"
    : "Keizer Mobile Detailing Deposit";
}

function resetPaymentState() {
  quoteState.ackDeposit = false;
  quoteState.ackPriceVariance = false;
  quoteState.paymentStatus = "";
  quoteState.paymentMessage = "";
  quoteState.squarePaymentId = "";
  quoteState.paidAmount = "";
}

// -------------------------
// Upkeep / requirement rules
// -------------------------
const UPKEEP_SET = new Set(["Interior Upkeep Plan", "Exterior Upkeep Plan", "Interior + Exterior Upkeep Plan"]);
function isUpkeepService(label) { return UPKEEP_SET.has(label); }
function isUpkeepPlanSelected() { return quoteState.services.some(isUpkeepService); }

function enforceUpkeepExclusivity() {
  const upkeep = quoteState.services.find(isUpkeepService);
  if (upkeep) quoteState.services = [upkeep];
}

function enforceWashDependencies() {
  const hasReq = quoteState.services.some((s) => REQUIRES_WASH.has(s));
  if (hasReq && !quoteState.services.includes(REQUIRED_WASH_LABEL)) {
    quoteState.services = [REQUIRED_WASH_LABEL, ...quoteState.services.filter((s) => s !== REQUIRED_WASH_LABEL)];
  }

  if (!quoteState.services.includes(REQUIRED_WASH_LABEL)) {
    quoteState.services = quoteState.services.filter((s) => !REQUIRES_WASH.has(s));
  }
}

function anyServiceRequiresInteriorCondition() {
  const s = quoteState.services || [];
  if (!s.length) return false;
  return s.includes("Interior Upkeep Plan") || s.includes("Interior + Exterior Upkeep Plan") || s.includes("Interior Detail");
}

function anyServiceRequiresExteriorCondition() {
  const s = quoteState.services || [];
  if (!s.length) return false;
  return (
    s.includes("Exterior Upkeep Plan") ||
    s.includes("Interior + Exterior Upkeep Plan") ||
    s.includes("Exterior Wash") ||
    s.includes("Ceramic Coating") ||
    s.includes("Paint Correction")
  );
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

function computeRangeForService(serviceLabel, opts = {}) {
  const type = quoteState.vehicleType;
  if (!type) return null;

  const ic = opts.interiorCondition ?? quoteState.interiorCondition;
  const ec = opts.exteriorCondition ?? quoteState.exteriorCondition;

  if (isUpkeepService(serviceLabel) && serviceOverrides[serviceLabel]) {
    const base = serviceOverrides[serviceLabel][type];
    if (!base) return null;

    if (serviceLabel === "Interior Upkeep Plan" && !ic) return null;
    if (serviceLabel === "Exterior Upkeep Plan" && !ec) return null;
    if (serviceLabel === "Interior + Exterior Upkeep Plan" && (!ic || !ec)) return null;

    let f = 1.0;
    if (serviceLabel === "Interior Upkeep Plan") f = conditionFactor(ic);
    if (serviceLabel === "Exterior Upkeep Plan") f = conditionFactor(ec);
    if (serviceLabel === "Interior + Exterior Upkeep Plan") {
      f = (conditionFactor(ic) + conditionFactor(ec)) / 2;
    }

    return [base[0] * f, base[1] * f].map(clampInt);
  }

  if ((serviceLabel === "Ceramic Coating" || serviceLabel === "Paint Correction") && serviceOverrides[serviceLabel]) {
    const r = serviceOverrides[serviceLabel][type];
    return r ? [clampInt(r[0]), clampInt(r[1])] : null;
  }

  if (serviceLabel === "Interior Detail") {
    if (!ic) return null;
    const r = estimateTable.Interior?.[type]?.[ic];
    return r ? [clampInt(r[0]), clampInt(r[1])] : null;
  }

  if (serviceLabel === "Exterior Wash") {
    if (!ec) return null;
    const r = estimateTable.Exterior?.[type]?.[ec];
    return r ? [clampInt(r[0]), clampInt(r[1])] : null;
  }

  return null;
}

function computeEstimateWithOverrides(overrides = {}) {
  const type = quoteState.vehicleType;
  if (!type) return null;

  const svcs = quoteState.services || [];
  if (!svcs.length) return null;

  const ic = overrides.interiorCondition ?? quoteState.interiorCondition;
  const ec = overrides.exteriorCondition ?? quoteState.exteriorCondition;

  const icPreview = ic || "Light";
  const ecPreview = ec || "Light";

  let low = 0, high = 0;

  for (const s of svcs) {
    let useIc = ic;
    let useEc = ec;

    if (s === "Interior Detail" || s === "Interior Upkeep Plan") useIc = icPreview;
    if (s === "Exterior Wash" || s === "Exterior Upkeep Plan") useEc = ecPreview;
    if (s === "Interior + Exterior Upkeep Plan") {
      useIc = icPreview;
      useEc = ecPreview;
    }

    const r = computeRangeForService(s, { interiorCondition: useIc, exteriorCondition: useEc });
    if (!r) return null;
    low += Number(r[0] || 0);
    high += Number(r[1] || 0);
  }

  const hasInterior = svcs.includes("Interior Detail");
  const hasExterior = svcs.includes("Exterior Wash");
  const hasUpkeep = svcs.some(isUpkeepService);
  const hasCeramicOrPaint = svcs.includes("Ceramic Coating") || svcs.includes("Paint Correction");
  if (hasInterior && hasExterior && !hasUpkeep && !hasCeramicOrPaint) {
    low = Math.max(0, low - 20);
    high = Math.max(0, high - 20);
  }

  return tightenAndHeavier([low, high]);
}

function computeEstimate() {
  return computeEstimateWithOverrides({});
}

// -------------------------
// Continue rules
// -------------------------
function canContinue() {
  const step = steps[stepIndex];

  if (step === "vehicleType") return !!quoteState.vehicleType;
  if (step === "serviceCategory") return !!quoteState.serviceCategory;
  if (step === "service") return Array.isArray(quoteState.services) && quoteState.services.length > 0;

  if (step === "conditionInterior") return !anyServiceRequiresInteriorCondition() ? true : !!quoteState.interiorCondition;
  if (step === "conditionExterior") return !anyServiceRequiresExteriorCondition() ? true : !!quoteState.exteriorCondition;
  if (step === "upkeepFrequency") return !isUpkeepPlanSelected() ? true : !!quoteState.upkeepFrequency;

  if (step === "contact") {
    return (
      quoteState.name.trim().length >= 2 &&
      quoteState.phone.trim().length >= 7 &&
      quoteState.email.trim().includes("@") &&
      quoteState.city.trim().length > 0
    );
  }

  if (step === "appointment") return !!quoteState.slotId;

  if (step === "payment") {
    const baseAck = quoteState.ackDeposit === true;
    const fullAck = quoteState.paymentMode === "full" ? quoteState.ackPriceVariance === true : true;
    return baseAck && fullAck && quoteState.paymentStatus === "paid";
  }

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

  if (step === "service") {
    const n = Array.isArray(quoteState.services) ? quoteState.services.length : 0;
    quoteNextBtn.textContent = n > 0 ? `Continue (${n} selected)` : "Continue";
  } else if (step === "payment") {
    quoteNextBtn.textContent = "Complete Booking";
  } else {
    quoteNextBtn.textContent = "Continue";
  }

  quoteNextBtn.disabled = !canContinue();
  renderNavPrice();
}

function pickAndAdvance(pickFn) {
  pickFn();
  renderStep();
  setTimeout(() => nextStep(true), 80);
}

function resetBookingTail() {
  quoteState.slotId = "";
  quoteState.slotLabel = "";
  quoteState.slotDate = "";
  quoteState.slotTime = "";
  quoteState.paymentMode = "deposit";
  resetPaymentState();
}

// -------------------------
// Service selection
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
  enforceWashDependencies();

  if (!anyServiceRequiresInteriorCondition()) quoteState.interiorCondition = "";
  if (!anyServiceRequiresExteriorCondition()) quoteState.exteriorCondition = "";
  if (!isUpkeepPlanSelected()) quoteState.upkeepFrequency = "";

  resetBookingTail();
  updateNav();
}

function removeService(label) {
  quoteState.services = (quoteState.services || []).filter((s) => s !== label);
  enforceWashDependencies();

  if (!anyServiceRequiresInteriorCondition()) quoteState.interiorCondition = "";
  if (!anyServiceRequiresExteriorCondition()) quoteState.exteriorCondition = "";
  if (!isUpkeepPlanSelected()) quoteState.upkeepFrequency = "";

  resetBookingTail();
  updateNav();
}

function pickSingleServiceAndAdvance(label) {
  if (REQUIRES_WASH.has(label)) {
    quoteState.services = [REQUIRED_WASH_LABEL, label];
  } else {
    quoteState.services = [label];
  }

  enforceUpkeepExclusivity();
  enforceWashDependencies();

  if (!anyServiceRequiresInteriorCondition()) quoteState.interiorCondition = "";
  if (!anyServiceRequiresExteriorCondition()) quoteState.exteriorCondition = "";
  if (!isUpkeepPlanSelected()) quoteState.upkeepFrequency = "";

  resetBookingTail();
  renderStep();
  setTimeout(() => nextStep(true), 80);
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
  imgZoom = null,
  split = "h",
  isSelected = false,
  onClick,
  variant = "",
  badge = "",
  tag = ""
}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `qCard qCard--img ${variant}`.trim() + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  const zoomStyle = typeof zoom === "number" ? `style="--carZoom:${zoom}"` : "";
  const mediaZoomStyle = typeof imgZoom === "number" ? `style="--imgZoom:${imgZoom}"` : "";

  const badgeHtml = badge ? `<span class="qCardBadge" aria-hidden="true">${escapeHtml(badge)}</span>` : "";
  const tagHtml = tag ? `<span class="requires-badge" aria-hidden="true">${escapeHtml(tag)}</span>` : "";

  const mediaHtml = Array.isArray(img)
    ? `
      <div class="qCardMedia" ${zoomStyle}>
        ${badgeHtml}
        ${tagHtml}
        <div class="qCardMediaSplit ${split === "v" ? "qCardMediaSplit--v" : ""}" aria-hidden="true">
          <img src="${escapeHtml(img[0])}" alt="" loading="lazy" />
          <img src="${escapeHtml(img[1])}" alt="" loading="lazy" />
        </div>
      </div>
    `
    : `
      <div class="qCardMedia ${typeof imgZoom === "number" ? "isZoom" : ""}" ${mediaZoomStyle} ${zoomStyle}>
        ${badgeHtml}
        ${tagHtml}
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
    city: "",
    notes: "",
    paymentMode: "deposit",
    ackDeposit: false,
    ackPriceVariance: false,
    depositAmount: DEPOSIT_AMOUNT,
    paymentStatus: "",
    paymentMessage: "",
    squarePaymentId: "",
    paidAmount: "",
    honeypot: ""
  });

  stepIndex = 0;
  renderStep();

  quoteModal.classList.add("isOpen");
  quoteModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  quoteModal.querySelector("[data-quote-close]")?.focus();

  warmSquare();
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
// Square
// -------------------------
async function waitForSquare(maxMs = 7000) {
  const start = Date.now();
  while (!window.Square && Date.now() - start < maxMs) {
    await sleep(120);
  }
  return !!window.Square;
}

async function warmSquare() {
  if (squareWarmStarted) return;
  squareWarmStarted = true;
  try {
    const hasSquare = await waitForSquare(7000);
    if (!hasSquare) return;
    if (!squarePaymentsInitPromise) {
      squarePaymentsInitPromise = Promise.resolve(window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID));
    }
    squarePayments = await squarePaymentsInitPromise;
  } catch {
    // no-op
  }
}

function getCurrentMoneyConfig() {
  return {
    countryCode: "US",
    currencyCode: "USD",
    total: {
      amount: String(Number(getCurrentChargeAmount()).toFixed(2)),
      label: getPaymentLabel()
    }
  };
}

async function initSquareCard(cardEl, statusEl) {
  if (!cardEl) return false;

  try {
    if (statusEl) statusEl.textContent = "Loading secure payment options...";
    await warmSquare();

    if (!window.Square) {
      if (statusEl) statusEl.textContent = "Square failed to load. Refresh and try again.";
      return false;
    }

    if (!squarePayments) {
      if (!squarePaymentsInitPromise) {
        squarePaymentsInitPromise = Promise.resolve(window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID));
      }
      squarePayments = await squarePaymentsInitPromise;
    }

    if (squareCard && typeof squareCard.destroy === "function") {
      try { await squareCard.destroy(); } catch {}
    }
    squareCard = null;

    squareCard = await squarePayments.card();
    await squareCard.attach(cardEl);

    quoteState.paymentStatus = quoteState.paymentStatus === "paid" ? "paid" : "ready";
    if (statusEl) statusEl.textContent = "Use Apple Pay or enter card details.";
    return true;
  } catch (err) {
    if (statusEl) statusEl.textContent = err?.message || "Could not load card form.";
    squareCard = null;
    return false;
  }
}

async function initSquareApplePay(applePayEl, statusEl) {
  if (!applePayEl) return false;

  try {
    await warmSquare();

    if (!window.Square) return false;

    if (!squarePayments) {
      if (!squarePaymentsInitPromise) {
        squarePaymentsInitPromise = Promise.resolve(
          window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID)
        );
      }
      squarePayments = await squarePaymentsInitPromise;
    }

    const buttonEl = applePayEl.querySelector("#qApplePayButton");
    if (!buttonEl) return false;

    squareApplePay = null;

    const paymentRequest = squarePayments.paymentRequest(getCurrentMoneyConfig());
    squareApplePay = await squarePayments.applePay(paymentRequest);

    let canUseApplePay = true;
    if (typeof squareApplePay?.canMakePayment === "function") {
      canUseApplePay = await squareApplePay.canMakePayment();
    }

    if (!canUseApplePay) {
      applePayEl.style.display = "none";
      return false;
    }

    buttonEl.style.display = "inline-flex";

    if (statusEl && quoteState.paymentStatus !== "paid") {
      statusEl.textContent = "Use Apple Pay or enter card details.";
    }

    return true;
  } catch (err) {
    console.error("Apple Pay init error:", err);
    applePayEl.style.display = "none";
    squareApplePay = null;
    return false;
  }
}

async function createSquareCharge(sourceId) {
  const amount = getCurrentChargeAmount();

  const payload = {
    sourceId,
    idempotencyKey: makeIdempotencyKey(),
    amountCents: moneyToCents(amount),
    booking: {
      name: quoteState.name,
      email: quoteState.email,
      phone: quoteState.phone,
      slotId: quoteState.slotId,
      slotLabel: quoteState.slotLabel,
      city: quoteState.city,
      paymentMode: quoteState.paymentMode
    }
  };

  const res = await fetch(SQUARE_PAYMENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); }
  catch { data = { ok: false, message: "Payment endpoint returned non-JSON." }; }

  return data;
}

async function handlePayNowCard(payBtn, statusEl) {
  if (!squareCard) {
    statusEl.textContent = "Card form is not ready yet.";
    return;
  }

  try {
    quoteState.paymentStatus = "processing";
    updateNav();

    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = "Processing...";
    }

    const tokenResult = await squareCard.tokenize();
    if (tokenResult.status !== "OK" || !tokenResult.token) {
      throw new Error("Card details were not accepted. Please check the form and try again.");
    }

    const result = await createSquareCharge(tokenResult.token);
    if (!result || result.ok !== true) {
      throw new Error(result?.message || "Payment failed.");
    }

    quoteState.paymentStatus = "paid";
    quoteState.paymentMessage = quoteState.paymentMode === "full"
      ? "Full payment paid successfully."
      : "Deposit paid successfully.";
    quoteState.squarePaymentId = String(result.paymentId || result.id || "");
    quoteState.paidAmount = String(getCurrentChargeAmount());

    if (statusEl) statusEl.textContent = quoteState.paymentMessage;
    renderStep();
  } catch (err) {
    quoteState.paymentStatus = "";
    quoteState.paymentMessage = err?.message || "Payment failed.";
    if (statusEl) statusEl.textContent = quoteState.paymentMessage;
    updateNav();
  } finally {
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.textContent = quoteState.paymentMode === "full"
        ? `Pay ${formatMoney(getCurrentChargeAmount())} in Full`
        : `Pay ${formatMoney(getCurrentChargeAmount())} Deposit`;
    }
  }
}

async function handleApplePayCharge(statusEl) {
  if (!squareApplePay) {
    if (statusEl) statusEl.textContent = "Apple Pay is not available on this device/browser.";
    return;
  }

  try {
    quoteState.paymentStatus = "processing";
    updateNav();

    if (statusEl) statusEl.textContent = "Opening Apple Pay...";

    const tokenResult = await squareApplePay.tokenize();

    if (tokenResult.status !== "OK" || !tokenResult.token) {
      throw new Error("Apple Pay was not completed.");
    }

    const result = await createSquareCharge(tokenResult.token);
    if (!result || result.ok !== true) {
      throw new Error(result?.message || "Apple Pay payment failed.");
    }

    quoteState.paymentStatus = "paid";
    quoteState.paymentMessage = quoteState.paymentMode === "full"
      ? "Full payment paid successfully with Apple Pay."
      : "Deposit paid successfully with Apple Pay.";
    quoteState.squarePaymentId = String(result.paymentId || result.id || "");
    quoteState.paidAmount = String(getCurrentChargeAmount());

    if (statusEl) statusEl.textContent = quoteState.paymentMessage;
    renderStep();
  } catch (err) {
    quoteState.paymentStatus = "";
    quoteState.paymentMessage = err?.message || "Apple Pay payment failed.";
    if (statusEl) statusEl.textContent = quoteState.paymentMessage;
    updateNav();
  }
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
          split: c.split || "h",
          variant: "qCard--square qCard--serviceCat",
          isSelected: quoteState.serviceCategory === c.label,
          onClick: () =>
            pickAndAdvance(() => {
              quoteState.serviceCategory = c.label;
              quoteState.services = [];
              quoteState.interiorCondition = "";
              quoteState.exteriorCondition = "";
              quoteState.upkeepFrequency = "";
              resetBookingTail();
            })
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "service") {
    const isInterior = quoteState.serviceCategory === "Interior";
    const isExterior = quoteState.serviceCategory === "Exterior";
    const isBoth = quoteState.serviceCategory === "Interior + Exterior";

    title.textContent = "Select service(s)";
    sub.textContent = isBoth ? "" : "Tap one service to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    const filtered = servicesAll.filter((s) => {
      if (isInterior) {
        return s.label === "Interior Detail" || s.label === "Interior Upkeep Plan";
      }
      if (isExterior) {
        return s.label === "Exterior Wash" || s.label === "Exterior Upkeep Plan" || s.label === "Ceramic Coating" || s.label === "Paint Correction";
      }
      if (isBoth) {
        return s.label === "Interior Detail" || s.label === "Exterior Wash" || s.label === "Ceramic Coating" || s.label === "Paint Correction" || s.label === "Interior + Exterior Upkeep Plan";
      }
      return false;
    });

    if (isInterior || isExterior) {
      filtered.forEach((s) => {
        cards.appendChild(
          imgCard({
            label: s.label,
            hint: "Tap to select",
            img: s.img,
            split: s.split || "h",
            variant: "qCard--square qCard--servicePick",
            isSelected: quoteState.services.includes(s.label),
            onClick: () => pickSingleServiceAndAdvance(s.label)
          })
        );
      });

      quoteBody.append(title, sub, cards);
      updateNav();
      return;
    }

    const tray = document.createElement("div");
    tray.className = "qServiceTray";

    const trayTop = document.createElement("div");
    trayTop.className = "qServiceTrayTop";

    const trayTitle = document.createElement("div");
    trayTitle.className = "qServiceTrayTitle";
    trayTitle.textContent = "Pick all that apply";

    const trayHint = document.createElement("div");
    trayHint.className = "qServiceTrayHint";
    const n = (quoteState.services || []).length;
    trayHint.textContent = n ? `${n} selected • tap × to remove` : "Select one or more services below";

    trayTop.append(trayTitle, trayHint);

    const chips = document.createElement("div");
    chips.className = "qChips";

    if (!n) {
      const empty = document.createElement("div");
      empty.className = "qChipEmpty";
      empty.textContent = "Tip: tap everything you want, then press Continue.";
      chips.appendChild(empty);
    } else {
      (quoteState.services || []).forEach((lbl) => {
        const chip = document.createElement("span");
        chip.className = "qChip";
        chip.innerHTML = `
          <span>${escapeHtml(lbl)}</span>
          <button type="button" aria-label="Remove ${escapeHtml(lbl)}">×</button>
        `;
        chip.querySelector("button")?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeService(lbl);
          renderStep();
        });
        chips.appendChild(chip);
      });
    }

    tray.append(trayTop, chips);

    filtered.forEach((s) => {
      cards.appendChild(
        imgCard({
          label: s.label,
          hint: quoteState.services.includes(s.label) ? "Selected" : "Tap to select",
          img: s.img,
          split: s.split || "h",
          variant: "qCard--square qCard--servicePick",
          isSelected: quoteState.services.includes(s.label),
          onClick: () => {
            toggleService(s.label);
            renderStep();
          }
        })
      );
    });

    quoteBody.append(title, sub, tray, cards);
  }

  if (step === "conditionInterior") {
    title.textContent = "Interior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    interiorConditions.forEach((c) => {
      const est = computeEstimateWithOverrides({
        interiorCondition: c.label,
        exteriorCondition: quoteState.exteriorCondition || "Light"
      });

      const start = est ? est[0] : null;
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

  if (step === "conditionExterior") {
    title.textContent = "Exterior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--scroll qCards--big";

    exteriorConditions.forEach((c) => {
      const est = computeEstimateWithOverrides({
        exteriorCondition: c.label,
        interiorCondition: quoteState.interiorCondition || "Light"
      });

      const start = est ? est[0] : null;
      const hint = `${c.hint || ""}${start ? `\nStarting at $${start}` : ""}`.trim();

      cards.appendChild(
        imgCard({
          label: c.label,
          hint,
          img: c.img,
          imgZoom: c.zoom || null,
          variant: "qCard--square qCard--condition",
          isSelected: quoteState.exteriorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.exteriorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

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

  if (step === "contact") {
    title.textContent = "Your contact info";
    sub.textContent = "Required. We’ll confirm by text or call.";

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

    const f4 = document.createElement("div");
    f4.className = "qField";
    f4.innerHTML = `
      <label for="qCity">Closest city *</label>
      <select id="qCity">
        <option value="">Select closest city</option>
        ${serviceCities.map((city) => `<option value="${escapeHtml(city)}" ${quoteState.city === city ? "selected" : ""}>${escapeHtml(city)}</option>`).join("")}
      </select>
    `;

    grid.append(f1, f2, f3, f4);

    const notes = document.createElement("div");
    notes.className = "qField";
    notes.style.marginTop = "10px";
    notes.innerHTML = `
      <label for="qNotes">Anything else we should know?</label>
      <textarea id="qNotes" placeholder="Pet hair, stains, address notes, etc.">${escapeHtml(quoteState.notes)}</textarea>
    `;

    const status = document.createElement("div");
    status.className = "qStatus";
    status.textContent = canContinue() ? "" : "Required: name, phone, email, and closest city.";

    const hp = document.createElement("div");
    hp.style.display = "none";
    hp.innerHTML = `<input id="qCompany" placeholder="Company" value="${escapeHtml(quoteState.honeypot)}" />`;

    quoteBody.append(title, sub, grid, notes, status, hp);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");
    const emailEl = quoteBody.querySelector("#qEmail");
    const cityEl = quoteBody.querySelector("#qCity");
    const notesEl = quoteBody.querySelector("#qNotes");
    const hpEl = quoteBody.querySelector("#qCompany");

    const updateStatus = () => {
      status.textContent = canContinue() ? "" : "Required: name, phone, email, and closest city.";
    };

    nameEl?.addEventListener("input", (e) => { quoteState.name = e.target.value || ""; updateNav(); updateStatus(); });
    phoneEl?.addEventListener("input", (e) => { quoteState.phone = e.target.value || ""; updateNav(); updateStatus(); });
    emailEl?.addEventListener("input", (e) => { quoteState.email = e.target.value || ""; updateNav(); updateStatus(); });
    cityEl?.addEventListener("change", (e) => { quoteState.city = e.target.value || ""; updateNav(); updateStatus(); });
    notesEl?.addEventListener("input", (e) => { quoteState.notes = e.target.value || ""; });
    hpEl?.addEventListener("input", (e) => { quoteState.honeypot = e.target.value || ""; });

    setTimeout(() => nameEl?.focus(), 50);
  }

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
        resetPaymentState();
        renderStep();
      }
    });

    wrap.append(topRow, status, loadBar, cal, timesBox, nextAvailBtn);
    quoteBody.append(title, sub, wrap);

    loadAvailabilityAndRender(status, loadBar, cal, timesBox, nextAvailBtn, tz);

    warmSquare();
  }

  if (step === "payment") {
    title.textContent = "Pay to reserve your appointment";
    sub.textContent = "Choose a deposit or pay in full today.";

    const estLine = quoteState.estimateLow && quoteState.estimateHigh
      ? `$${quoteState.estimateLow}–$${quoteState.estimateHigh}`
      : "We’ll confirm after assessment";

    const fullPayAmount = getFullPayAmount();
    const currentChargeAmount = getCurrentChargeAmount();
    const payBtnLabel = quoteState.paymentMode === "full"
      ? `Pay ${formatMoney(currentChargeAmount)} in Full`
      : `Pay ${formatMoney(currentChargeAmount)} Deposit`;

    const summary = document.createElement("div");
    summary.className = "qEstimateBox qEstimateBox--simple";
    summary.innerHTML = `
      <div class="qEstimateBig">${formatMoney(currentChargeAmount)}</div>
      <div class="qEstimateFine" style="margin-top:8px;">
        ${quoteState.paymentMode === "full" ? "Selected payment amount" : "Deposit to reserve your appointment"}
      </div>
      <div class="qEstimatePills" style="margin-top:14px;">
        <span class="qPill"><strong>Appointment:</strong> ${escapeHtml(quoteState.slotLabel || "—")}</span>
        <span class="qPill"><strong>Estimate:</strong> ${escapeHtml(estLine)}</span>
        <span class="qPill"><strong>Pay in full midpoint:</strong> ${formatMoney(fullPayAmount)}</span>
      </div>
    `;

    const paymentChoice = document.createElement("div");
    paymentChoice.className = "qCalWrap";
    paymentChoice.style.marginTop = "12px";
    paymentChoice.innerHTML = `
      <div class="qStepTitle" style="font-size:1rem; margin-bottom:8px;">Choose payment option</div>
      <div style="display:grid; gap:10px;">
        <label class="qCheck" style="align-items:flex-start;">
          <input id="qPayModeDeposit" type="radio" name="qPayMode" value="deposit" ${quoteState.paymentMode === "deposit" ? "checked" : ""} />
          <span>
            <strong>Pay deposit now</strong><br/>
            Pay ${formatMoney(DEPOSIT_AMOUNT)} now to reserve your appointment. It is applied to your total.
          </span>
        </label>

        <label class="qCheck" style="align-items:flex-start;">
          <input id="qPayModeFull" type="radio" name="qPayMode" value="full" ${quoteState.paymentMode === "full" ? "checked" : ""} />
          <span>
            <strong>Pay in full now</strong><br/>
            Pay the midpoint of your estimate now: <strong>${formatMoney(fullPayAmount)}</strong>.
          </span>
        </label>
      </div>
    `;

    const ack = document.createElement("div");
    ack.style.marginTop = "12px";
    ack.innerHTML = `
      <div class="qCheck">
        <input id="qAck" type="checkbox" ${quoteState.ackDeposit ? "checked" : ""} />
        <label for="qAck">
          ${
            quoteState.paymentMode === "full"
              ? `<strong>I understand this payment is being made today to reserve and cover the current quoted work.</strong><br/>
                 You can reschedule with at least <strong>2 days notice</strong>. Late cancellations or no-shows may forfeit the amount paid.`
              : `<strong>I understand the ${formatMoney(DEPOSIT_AMOUNT)} deposit is applied to my total.</strong><br/>
                 You can reschedule with at least <strong>2 days notice</strong>. Late cancellations or no-shows forfeit the deposit.`
          }
        </label>
      </div>
      ${
        quoteState.paymentMode === "full"
          ? `
            <div class="qCheck" style="margin-top:10px;">
              <input id="qAckPriceVariance" type="checkbox" ${quoteState.ackPriceVariance ? "checked" : ""} />
              <label for="qAckPriceVariance">
                <strong>I understand the final price can be higher or lower depending on the actual condition of the vehicle.</strong><br/>
                The upfront full payment is based on the midpoint of the estimate, and any difference can be settled after inspection if needed.
              </label>
            </div>
          `
          : ""
      }
    `;

    const squareBox = document.createElement("div");
    squareBox.className = "qCalWrap";
    squareBox.style.marginTop = "12px";

    squareBox.innerHTML = `
      <div class="qStepTitle" style="font-size:1rem; margin-bottom:8px;">Payment method</div>
      <div class="qStatus" data-q-pay-status>
        ${quoteState.paymentStatus === "paid" ? "Payment completed successfully." : "Use Apple Pay or enter card details."}
      </div>
      ${
        quoteState.paymentStatus === "paid"
          ? ""
          : `
            <div id="qApplePayWrap" style="margin:12px 0 14px;">
              <button
                type="button"
                id="qApplePayButton"
                style="display:none; width:100%; min-height:48px; border:none; border-radius:12px; background:#000; color:#fff; font-size:16px; font-weight:600; cursor:pointer;"
              >
                Apple Pay
              </button>
            </div>

            <div class="qStatus" style="margin:8px 0 10px;">Or pay with card</div>
            <div id="qSquareCard"></div>

            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn--quote" id="qPayNowBtn">${escapeHtml(payBtnLabel)}</button>
            </div>
          `
      }
      <div data-q-paid-wrap style="margin-top:10px;">
        ${
          quoteState.paymentStatus === "paid"
            ? `
              <div class="qDoneLine"><strong>Payment:</strong> Paid</div>
              <div class="qDoneLine"><strong>Type:</strong> ${quoteState.paymentMode === "full" ? "Paid in Full" : "Deposit"}</div>
              <div class="qDoneLine"><strong>Amount:</strong> ${formatMoney(quoteState.paidAmount || currentChargeAmount)}</div>
              ${quoteState.squarePaymentId ? `<div class="qDoneLine"><strong>Payment ID:</strong> ${escapeHtml(quoteState.squarePaymentId)}</div>` : ""}
            `
            : ""
        }
      </div>
    `;

    const foot = document.createElement("div");
    foot.className = "qStatus";
    foot.style.marginTop = "10px";
    foot.textContent = canContinue()
      ? ""
      : quoteState.paymentMode === "full"
        ? "Required: payment selection, both checkboxes, and successful payment."
        : "Required: payment selection, acknowledgment, and successful payment.";

    quoteBody.append(title, sub, summary, paymentChoice, ack, squareBox, foot);

    const ackEl = quoteBody.querySelector("#qAck");
    const ackPriceVarianceEl = quoteBody.querySelector("#qAckPriceVariance");
    const payStatusEl = quoteBody.querySelector("[data-q-pay-status]");
    const squareCardEl = quoteBody.querySelector("#qSquareCard");
    const applePayWrapEl = quoteBody.querySelector("#qApplePayWrap");
    const payBtn = quoteBody.querySelector("#qPayNowBtn");
    const applePayButtonEl = quoteBody.querySelector("#qApplePayButton");
    const payModeDepositEl = quoteBody.querySelector("#qPayModeDeposit");
    const payModeFullEl = quoteBody.querySelector("#qPayModeFull");

    const updateFoot = () => {
      foot.textContent = canContinue()
        ? ""
        : quoteState.paymentMode === "full"
          ? "Required: payment selection, both checkboxes, and successful payment."
          : "Required: payment selection, acknowledgment, and successful payment.";
      updateNav();
    };

    payModeDepositEl?.addEventListener("change", (e) => {
      if (!e.target.checked) return;
      quoteState.paymentMode = "deposit";
      resetPaymentState();
      renderStep();
    });

    payModeFullEl?.addEventListener("change", (e) => {
      if (!e.target.checked) return;
      quoteState.paymentMode = "full";
      resetPaymentState();
      renderStep();
    });

    ackEl?.addEventListener("change", (e) => {
      quoteState.ackDeposit = !!e.target.checked;
      updateFoot();
    });

    ackPriceVarianceEl?.addEventListener("change", (e) => {
      quoteState.ackPriceVariance = !!e.target.checked;
      updateFoot();
    });

    if (quoteState.paymentStatus !== "paid") {
      initSquareCard(squareCardEl, payStatusEl).then(() => updateFoot());

      initSquareApplePay(applePayWrapEl, payStatusEl).then((available) => {
        if (!available && applePayWrapEl) {
          applePayWrapEl.style.display = "none";
        }
        updateFoot();
      });
    } else {
      if (squareCardEl) squareCardEl.innerHTML = "";
      if (applePayWrapEl) applePayWrapEl.innerHTML = "";
      updateFoot();
    }

    payBtn?.addEventListener("click", () => handlePayNowCard(payBtn, payStatusEl));
    applePayButtonEl?.addEventListener("click", () => handleApplePayCharge(payStatusEl));
  }

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
      <div class="qDoneLine"><strong>Payment Type:</strong> ${quoteState.paymentMode === "full" ? "Paid in Full" : "Deposit"}</div>
      <div class="qDoneLine"><strong>Amount Paid:</strong> ${formatMoney(quoteState.paidAmount || getCurrentChargeAmount())}</div>
      ${quoteState.squarePaymentId ? `<div class="qDoneLine"><strong>Payment ID:</strong> ${escapeHtml(quoteState.squarePaymentId)}</div>` : ""}
      ${
        quoteState.paymentMode === "full"
          ? `<div class="qDoneFine">Final price may still be adjusted after inspection if the vehicle condition differs from the estimate.</div>`
          : `<div class="qDoneFine">Your deposit will be applied to the final total.</div>`
      }
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
      statusEl.textContent = "Scheduling error: Apps Script did not return JSON.";
      loadBarEl.classList.remove("isOn");
      return;
    }

    if (!data || data.ok !== true || !Array.isArray(data.slots)) {
      statusEl.textContent = "Couldn’t load availability.";
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
    resetPaymentState();
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
    resetPaymentState();
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
        resetPaymentState();
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
      resetPaymentState();

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
    city: quoteState.city,
    notes: quoteState.notes,

    paymentMode: quoteState.paymentMode,
    ackDeposit: quoteState.ackDeposit,
    ackPriceVariance: quoteState.ackPriceVariance,
    depositAmount: quoteState.depositAmount,
    paymentAmountCharged: getCurrentChargeAmount(),
    depositPaid: quoteState.paymentStatus === "paid" && quoteState.paymentMode === "deposit",
    fullPaid: quoteState.paymentStatus === "paid" && quoteState.paymentMode === "full",
    paymentStatus: quoteState.paymentStatus,
    squarePaymentId: quoteState.squarePaymentId
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

function finalizeBooking() {
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
}

// -------------------------
// Nav actions
// -------------------------
function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  if (step === "payment") {
    finalizeBooking();
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

