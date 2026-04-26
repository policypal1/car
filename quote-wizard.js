// -------------------------
// KEIZER MOBILE DETAILING QUOTE WIZARD
// Clean Conversion Flow v12.3
// Vehicle -> Service Type -> Package(s) -> Contact -> Estimate -> Time -> Address -> Confirm -> Success
// -------------------------

const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwHjH4JaJ_9Vl6xegBIuLztbcGnfPwvxdV00ej7LPEX4Tu0Da5ZbBseHxcbQg8Q217v/exec";

const INTERIOR_DISPLAY_RANGE_ADD = 40;
const EXTERIOR_DISPLAY_RANGE_ADD = 15;
const INTERIOR_EXTERIOR_BUNDLE_DISCOUNT = 30;

const ROUTE_GROUP_SOUTH = "south";
const ROUTE_GROUP_NORTH = "north";

const CITY_ROUTE_MAP = {
  keizer: ROUTE_GROUP_SOUTH,
  salem: ROUTE_GROUP_SOUTH,
  portland: ROUTE_GROUP_NORTH,
  tigard: ROUTE_GROUP_NORTH,
  "lake oswego": ROUTE_GROUP_NORTH
};

const VALID_COUPONS = {
  DETAIL10: 10,
  CLEAN10: 10,
  RESET10: 10
};

const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteProgressEl = document.querySelector(".quoteProgress");
const quoteDots = () => Array.from(document.querySelectorAll(".qpDot"));

let lastActiveElQuote = null;
let stepIndex = 0;

let appointmentSlots = [];
let appointmentSlotsLoading = false;
let appointmentSlotsLoadedKey = "";
let appointmentSlotsError = "";
let selectedCalendarDate = "";
let calendarMonthDate = null;

const quoteState = {
  vehicleType: "",
  serviceCategory: "",
  services: [],

  interiorPackage: "",
  exteriorPackage: "",

  estimateLow: "",
  estimateHigh: "",
  estimateIsStartingAt: false,

  couponCode: "",
  couponDiscount: 0,
  couponMessage: "",

  name: "",
  phone: "",
  email: "",
  city: "",
  notes: "",
  address: "",

  routeGroup: "",
  routeGroupLabel: "",

  slotId: "",
  slotLabel: "",
  slotDate: "",
  slotTime: "",

  leadId: "",
  leadEmailSent: false,
  leadEmailSignature: "",
  leadEmailSending: false,

  submittingBooking: false,
  bookingError: "",

  honeypot: ""
};

const steps = [
  "vehicleType",
  "serviceCategory",
  "interiorPackage",
  "exteriorPackage",
  "contact",
  "estimate",
  "appointment",
  "address",
  "confirm",
  "done"
];

const vehicleTypes = [
  {
    label: "Sedan",
    hint: "Coupe, sedan",
    img: "./55205_cc640_001_300.webp",
    contain: true,
    zoom: 1.26
  },
  {
    label: "SUV",
    hint: "Small SUV, wagon",
    img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp",
    contain: true,
    zoom: 1.16
  },
  {
    label: "Big SUV",
    hint: "3-row SUV, large SUV",
    img: "./Chevrolet_Suburban_LT_6cd76558e4.png",
    contain: true,
    zoom: 1.12
  },
  {
    label: "Truck",
    hint: "Pickup truck",
    img: "./silver-pickup-truck-side-view-svdvcb49lssczxnt.png",
    contain: true,
    zoom: 1.26
  }
];

const serviceCategories = [
  {
    label: "Interior",
    hint: "Inside-only detailing",
    img: "./2017-05-22-07-32-26.jpg"
  },
  {
    label: "Exterior",
    hint: "Outside-only detailing",
    img: "./c36084da09340612d8431de0221ea985.jpg"
  },
  {
    label: "Interior + Exterior",
    hint: "Full detail inside + out",
    img: ["./2017-05-22-07-32-26.jpg", "./c36084da09340612d8431de0221ea985.jpg"],
    split: "h"
  }
];

const interiorPackages = [
  {
    label: "Standard Clean",
    serviceLabel: "Standard Interior Detail",
    hint: "Best if the interior is already maintained and needs a simple reset.",
    features: [
      "Full interior vacuum",
      "Full interior wipe down",
      "Floor mats cleaned",
      "Windows cleaned inside & out"
    ]
  },
  {
    label: "Deep Clean",
    serviceLabel: "Deep Clean Interior Detail",
    hint: "Best for dirt buildup, light stains, and a more complete interior clean.",
    features: [
      "Full interior vacuum",
      "Full interior wipe down",
      "Carpet shampoo",
      "Steam clean",
      "Light stain removal",
      "Light pet hair removal",
      "Windows cleaned inside & out"
    ]
  },
  {
    label: "Premium Deep Clean",
    serviceLabel: "Premium Deep Clean Interior Detail",
    hint: "Best for heavier dirt, pet hair, stains, or neglected interiors.",
    features: [
      "Full interior vacuum",
      "Full interior wipe down",
      "Carpet & floor mats shampoo",
      "Seat extraction",
      "Steam clean",
      "Steam extraction",
      "Deep stain removal",
      "Pet hair removal",
      "Windows cleaned inside & out"
    ]
  }
];

const exteriorPackages = [
  {
    label: "Standard",
    serviceLabel: "Standard Exterior Detail",
    hint: "Best for a basic exterior reset.",
    features: [
      "Pre-wash foam",
      "Contact wash",
      "Wheels and tires cleaned",
      "Tire dressing",
      "Spray wax",
      "Dry with microfiber towel"
    ]
  },
  {
    label: "Premium",
    serviceLabel: "Premium Exterior Detail",
    hint: "Best for a more complete exterior clean and protection.",
    features: [
      "Pre-wash foam",
      "Contact wash",
      "Wheels and tires cleaned",
      "Tire dressing",
      "Bug removal",
      "Light tar removal",
      "Paint sealant"
    ]
  },
  {
    label: "Clay Decontamination",
    serviceLabel: "Clay Decontamination Exterior Detail",
    hint: "Best for deeper contamination removal.",
    features: [
      "Pre-wash foam",
      "Contact wash",
      "Iron remover",
      "Clay bar",
      "Wheels and tires cleaned",
      "Tire dressing",
      "Bug removal",
      "Light tar removal",
      "Paint sealant",
      "Wax"
    ]
  }
];

const serviceCities = ["Keizer", "Salem", "Portland", "Tigard", "Lake Oswego"];

const INTERIOR_DETAIL_PRICES = {
  "Standard Interior Detail": { Sedan: 80, SUV: 90, "Big SUV": 100, Truck: 80 },
  "Deep Clean Interior Detail": { Sedan: 110, SUV: 120, "Big SUV": 130, Truck: 125 },
  "Premium Deep Clean Interior Detail": { Sedan: 145, SUV: 165, "Big SUV": 180, Truck: 165 }
};

const EXTERIOR_DETAIL_PRICES = {
  "Standard Exterior Detail": { Sedan: 70, SUV: 80, "Big SUV": 90, Truck: 70 },
  "Premium Exterior Detail": { Sedan: 100, SUV: 110, "Big SUV": 120, Truck: 115 },
  "Clay Decontamination Exterior Detail": { Sedan: 130, SUV: 150, "Big SUV": 165, Truck: 150 }
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

function formatMoney(n) {
  return `$${Number(n || 0).toFixed(0)}`;
}

function clampInt(n) {
  const x = Math.round(Number(n));
  return Number.isFinite(x) ? x : null;
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function normalizeCoupon(code) {
  return String(code || "").trim().toUpperCase();
}

function getCouponDiscount(code = quoteState.couponCode) {
  return VALID_COUPONS[normalizeCoupon(code)] || 0;
}

function normalizeCityKey(city) {
  return String(city || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function getRouteGroupFromCity(city) {
  return CITY_ROUTE_MAP[normalizeCityKey(city)] || "";
}

function getRouteGroupLabel(routeGroup) {
  if (routeGroup === ROUTE_GROUP_SOUTH) return "Keizer / Salem";
  if (routeGroup === ROUTE_GROUP_NORTH) return "Portland / Tigard / Lake Oswego";
  return "";
}

function syncRouteGroupFromCity() {
  quoteState.routeGroup = getRouteGroupFromCity(quoteState.city);
  quoteState.routeGroupLabel = getRouteGroupLabel(quoteState.routeGroup);
}

function buildScriptUrl(action, extraParams = {}) {
  const script = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;
  const params = new URLSearchParams({
    action,
    t: String(Date.now())
  });

  Object.entries(extraParams).forEach(([key, value]) => {
    const safe = String(value ?? "").trim();
    if (safe) params.set(key, safe);
  });

  return `${script}?${params.toString()}`;
}

function isoDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(ymd) {
  const [y, m, d] = String(ymd || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function normalizeDateValue(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  const isoMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return isoDate(parsed);
}

function extractTimeInfo(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;

  const match12 = value.match(/\b(1[0-2]|0?\d):([0-5]\d)\s*(A\.?M\.?|P\.?M\.?)\b/i);
  if (match12) {
    const rawHour = Number(match12[1]);
    const minute = String(match12[2]).padStart(2, "0");
    const meridiem = String(match12[3] || "")
      .toUpperCase()
      .replaceAll(".", "")
      .startsWith("P") ? "PM" : "AM";

    let hour24 = rawHour % 12;
    if (meridiem === "PM") hour24 += 12;

    return {
      normalized: `${String(hour24).padStart(2, "0")}:${minute}`,
      label: `${rawHour}:${minute} ${meridiem}`
    };
  }

  const match24 = value.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (match24) {
    const hour = String(match24[1]).padStart(2, "0");
    const minute = String(match24[2]).padStart(2, "0");

    return {
      normalized: `${hour}:${minute}`,
      label: `${hour}:${minute}`
    };
  }

  return null;
}

function normalizeTimeValue(raw) {
  return extractTimeInfo(raw)?.normalized || "";
}

function formatTimeLabel(raw, normalized = normalizeTimeValue(raw)) {
  const found = extractTimeInfo(raw);
  if (found?.label) return found.label;
  if (!normalized) return "";

  const [h, m] = normalized.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDateNice(ymd) {
  const d = parseLocalDate(ymd);
  if (!d) return ymd || "";

  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function monthLabel(date) {
  return date.toLocaleDateString([], {
    month: "long",
    year: "numeric"
  });
}

function advanceSoon(delay = 140) {
  window.setTimeout(() => {
    if (canContinue()) goNext();
  }, delay);
}

// -------------------------
// FLOW LOGIC
// -------------------------

function needsInteriorPackage() {
  return quoteState.services.includes("Interior Detail");
}

function needsExteriorPackage() {
  return quoteState.services.includes("Exterior Wash");
}

function stepIsActive(stepName) {
  if (stepName === "interiorPackage") return needsInteriorPackage();
  if (stepName === "exteriorPackage") return needsExteriorPackage();
  return true;
}

function getVisibleSteps() {
  return steps.filter(stepIsActive);
}

function nextActiveStepIndex(fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (stepIsActive(steps[i])) return i;
  }

  return steps.length - 1;
}

function prevActiveStepIndex(fromIndex) {
  for (let i = fromIndex - 1; i >= 0; i--) {
    if (stepIsActive(steps[i])) return i;
  }

  return 0;
}

function setServiceByCategory(category) {
  quoteState.serviceCategory = category;

  if (category === "Interior") {
    quoteState.services = ["Interior Detail"];
    quoteState.exteriorPackage = "";
  }

  if (category === "Exterior") {
    quoteState.services = ["Exterior Wash"];
    quoteState.interiorPackage = "";
  }

  if (category === "Interior + Exterior") {
    quoteState.services = ["Interior Detail", "Exterior Wash"];
  }

  clearEstimateDependentState();
}

function getSelectedDisplayServices() {
  return quoteState.services.map(service => {
    if (service === "Interior Detail") return quoteState.interiorPackage || service;
    if (service === "Exterior Wash") return quoteState.exteriorPackage || service;
    return service;
  });
}

// -------------------------
// ESTIMATE
// -------------------------

function priceForVehicle(table, key) {
  const vehicle = quoteState.vehicleType;
  if (!vehicle || !table?.[key]) return null;
  return clampInt(table[key][vehicle]);
}

function computeEstimateInfo() {
  if (!quoteState.vehicleType || !quoteState.services.length) return null;

  let subtotal = 0;
  let rangeAdd = 0;

  if (quoteState.services.includes("Interior Detail")) {
    const interiorPrice = priceForVehicle(INTERIOR_DETAIL_PRICES, quoteState.interiorPackage);
    if (!Number.isFinite(interiorPrice)) return null;

    subtotal += interiorPrice;
    rangeAdd += INTERIOR_DISPLAY_RANGE_ADD;
  }

  if (quoteState.services.includes("Exterior Wash")) {
    const exteriorPrice = priceForVehicle(EXTERIOR_DETAIL_PRICES, quoteState.exteriorPackage);
    if (!Number.isFinite(exteriorPrice)) return null;

    subtotal += exteriorPrice;
    rangeAdd += EXTERIOR_DISPLAY_RANGE_ADD;
  }

  const bundleSavings =
    quoteState.services.includes("Interior Detail") &&
    quoteState.services.includes("Exterior Wash")
      ? INTERIOR_EXTERIOR_BUNDLE_DISCOUNT
      : 0;

  const couponDiscount = getCouponDiscount();

  const lowBeforeCoupon = Math.max(0, subtotal - bundleSavings);
  const highBeforeCoupon = Math.max(0, lowBeforeCoupon + rangeAdd);

  const low = clampInt(Math.max(0, lowBeforeCoupon - couponDiscount));
  const high = clampInt(Math.max(0, highBeforeCoupon - couponDiscount));

  return {
    subtotal: clampInt(subtotal),
    lowBeforeCoupon: clampInt(lowBeforeCoupon),
    highBeforeCoupon: clampInt(highBeforeCoupon),
    low,
    high,
    savings: bundleSavings,
    couponDiscount
  };
}

function syncEstimateState() {
  const info = computeEstimateInfo();

  if (!info) {
    quoteState.estimateLow = "";
    quoteState.estimateHigh = "";
    quoteState.couponDiscount = 0;
    return null;
  }

  quoteState.estimateLow = String(info.low);
  quoteState.estimateHigh = String(info.high);
  quoteState.couponDiscount = info.couponDiscount || 0;

  return info;
}

function formatEstimateDisplay(info = computeEstimateInfo()) {
  if (!info) return "We’ll confirm after assessment";

  if (Number(info.high) > Number(info.low)) {
    return `${formatMoney(info.low)} - ${formatMoney(info.high)}`;
  }

  return formatMoney(info.low);
}

// -------------------------
// PROGRESS + NAV
// -------------------------

function ensureProgressDots() {
  const visibleSteps = getVisibleSteps();

  if (!quoteProgressEl) {
    return {
      dots: quoteDots(),
      visibleSteps
    };
  }

  const desiredCount = Math.max(visibleSteps.length, 1);
  const currentDots = Array.from(quoteProgressEl.querySelectorAll(".qpDot"));

  if (currentDots.length !== desiredCount) {
    quoteProgressEl.innerHTML = "";

    for (let i = 0; i < desiredCount; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "qpDot";
      dot.setAttribute("aria-label", `Progress step ${i + 1} of ${desiredCount}`);
      quoteProgressEl.appendChild(dot);
    }
  }

  return {
    dots: quoteDots(),
    visibleSteps
  };
}

function setProgress() {
  const { dots, visibleSteps } = ensureProgressDots();
  if (!dots.length) return;

  const currentStep = steps[stepIndex];
  const activeIndex = Math.max(0, visibleSteps.indexOf(currentStep));

  dots.forEach((dot, i) => {
    dot.classList.toggle("isOn", i === Math.min(activeIndex, dots.length - 1));
  });
}

function canContinue() {
  const step = steps[stepIndex];

  if (step === "vehicleType") return !!quoteState.vehicleType;
  if (step === "serviceCategory") return !!quoteState.serviceCategory;
  if (step === "interiorPackage") return !needsInteriorPackage() || !!quoteState.interiorPackage;
  if (step === "exteriorPackage") return !needsExteriorPackage() || !!quoteState.exteriorPackage;

  if (step === "contact") {
    return (
      !!quoteState.name &&
      !!quoteState.phone &&
      !!quoteState.email &&
      !!quoteState.city &&
      !!quoteState.routeGroup &&
      !quoteState.leadEmailSending
    );
  }

  if (step === "estimate") return !!computeEstimateInfo();
  if (step === "appointment") return !!quoteState.slotId;
  if (step === "address") return !!quoteState.address;
  if (step === "confirm") return !quoteState.submittingBooking;
  if (step === "done") return true;

  return true;
}

function getNextButtonText() {
  const step = steps[stepIndex];

  if (step === "contact") return quoteState.leadEmailSending ? "Sending..." : "Get My Quote";
  if (step === "estimate") return "Pick Appointment Time";
  if (step === "appointment") return "Continue";
  if (step === "address") return "Review Request";
  if (step === "confirm") return quoteState.submittingBooking ? "Sending..." : "Request My Appointment";
  if (step === "done") return "Close";

  return "Continue";
}

function updateNav() {
  if (!quoteBackBtn || !quoteNextBtn) return;

  const step = steps[stepIndex];

  quoteBackBtn.style.display = stepIndex <= 0 || step === "done" ? "none" : "inline-flex";
  quoteNextBtn.style.display = "inline-flex";
  quoteNextBtn.textContent = getNextButtonText();
  quoteNextBtn.disabled = !canContinue();

  if (step === "done") {
    quoteBackBtn.style.display = "none";
    quoteNextBtn.disabled = false;
  }
}

function renderNavPrice() {
  return;
}

// -------------------------
// HTML COMPONENTS
// -------------------------

function renderMedia(item) {
  if (Array.isArray(item.img)) {
    return `
      <div class="qCardMedia">
        <div class="qCardMediaSplit">
          ${item.img.map(src => `<img src="${escapeHtml(src)}" alt="" loading="lazy">`).join("")}
        </div>
      </div>
    `;
  }

  const zoomStyle = item.zoom
    ? `style="--imgZoom:${Number(item.zoom)};--carZoom:${Number(item.zoom)}"`
    : "";

  const zoomClass = item.zoom ? " isZoom" : "";
  const containClass = item.contain ? "isContain" : "";

  return `
    <div class="qCardMedia${zoomClass}" ${zoomStyle}>
      <img class="${containClass}" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.label || "")}" loading="lazy">
    </div>
  `;
}

function imageCard(item, selected, action, cardType = "qCard--img") {
  return `
    <button class="qCard ${cardType} ${selected ? "isSel" : ""}" type="button" data-action="${escapeHtml(action)}" data-value="${escapeHtml(item.label)}">
      ${renderMedia(item)}
      <div class="qCardLabel">${escapeHtml(item.label)}</div>
      <div class="qCardHint">${escapeHtml(item.hint || "")}</div>
    </button>
  `;
}

function packageTextCard(pkg, selected, action, priceText) {
  return `
    <button class="qHearBtn ${selected ? "isSel" : ""}" type="button" data-action="${escapeHtml(action)}" data-value="${escapeHtml(pkg.serviceLabel)}">
      <span class="qHearLeft">
        <span class="qHearLabel">${escapeHtml(pkg.label)}</span>
        <span class="qHearHint">${escapeHtml(pkg.hint)}</span>
        <span class="qHearHint" style="margin-top:6px;font-weight:900;color:#111;">${escapeHtml(priceText)}</span>
        <span class="qHearHint" style="margin-top:6px;">
          ${(pkg.features || []).map(f => `• ${escapeHtml(f)}`).join("<br>")}
        </span>
      </span>
      <span class="qHearRight">
        <span class="qHearPill">Select</span>
        <span class="qHearCheck" aria-hidden="true"></span>
      </span>
    </button>
  `;
}

// -------------------------
// RENDER
// -------------------------

function render() {
  if (!quoteBody) return;

  syncEstimateState();
  setProgress();

  const step = steps[stepIndex];

  quoteBody.classList.toggle("quoteBody--success", step === "done");

  if (step === "vehicleType") renderVehicleTypeStep();
  if (step === "serviceCategory") renderServiceCategoryStep();
  if (step === "interiorPackage") renderInteriorPackageStep();
  if (step === "exteriorPackage") renderExteriorPackageStep();
  if (step === "contact") renderContactStep();
  if (step === "estimate") renderEstimateStep();
  if (step === "appointment") renderAppointmentStep();
  if (step === "address") renderAddressStep();
  if (step === "confirm") renderConfirmStep();
  if (step === "done") renderDoneStep();

  bindStepEvents();
  updateNav();
  renderNavPrice();
}

function renderVehicleTypeStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">What type of vehicle do you need detailed?</h3>
    <p class="qStepSub">Choose your vehicle type.</p>

    <div class="qCards qCards--vehicle2x2 qCards--big">
      ${vehicleTypes.map(v => imageCard(v, quoteState.vehicleType === v.label, "select-vehicle", "qCard--vehicle")).join("")}
    </div>
  `;
}

function renderServiceCategoryStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">What do you need cleaned?</h3>
    <p class="qStepSub">Choose the main service you want.</p>

    <div class="qCards qCards--scroll qCards--big">
      ${serviceCategories.map(c => imageCard(c, quoteState.serviceCategory === c.label, "select-category", "qCard--img qCard--square")).join("")}
    </div>
  `;
}

function renderInteriorPackageStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your interior package</h3>
    <p class="qStepSub">Pick the interior detail level that fits your vehicle.</p>

    <div class="qHearWrap">
      <div class="qHearGrid">
        ${interiorPackages.map(pkg => {
          const price = priceForVehicle(INTERIOR_DETAIL_PRICES, pkg.serviceLabel);
          const high = Number.isFinite(price) ? price + INTERIOR_DISPLAY_RANGE_ADD : null;
          const priceText = Number.isFinite(price) ? `${formatMoney(price)} - ${formatMoney(high)}` : "Select vehicle first";

          return packageTextCard(pkg, quoteState.interiorPackage === pkg.serviceLabel, "select-interior-package", priceText);
        }).join("")}
      </div>
    </div>
  `;
}

function renderExteriorPackageStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your exterior package</h3>
    <p class="qStepSub">Pick the exterior detail level that fits your vehicle.</p>

    <div class="qHearWrap">
      <div class="qHearGrid">
        ${exteriorPackages.map(pkg => {
          const price = priceForVehicle(EXTERIOR_DETAIL_PRICES, pkg.serviceLabel);
          const high = Number.isFinite(price) ? price + EXTERIOR_DISPLAY_RANGE_ADD : null;
          const priceText = Number.isFinite(price) ? `${formatMoney(price)} - ${formatMoney(high)}` : "Select vehicle first";

          return packageTextCard(pkg, quoteState.exteriorPackage === pkg.serviceLabel, "select-exterior-package", priceText);
        }).join("")}
      </div>
    </div>
  `;
}

function renderContactStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Where should we send your quote?</h3>
    <p class="qStepSub">Enter your contact info so we can send your quote and appointment confirmation.</p>

    <div class="qGrid2">
      <div class="qField">
        <label for="qName">Name</label>
        <input id="qName" autocomplete="name" value="${escapeHtml(quoteState.name)}" placeholder="Your name">
      </div>

      <div class="qField">
        <label for="qPhone">Phone</label>
        <input id="qPhone" autocomplete="tel" value="${escapeHtml(quoteState.phone)}" placeholder="Phone number">
      </div>

      <div class="qField">
        <label for="qEmail">Email</label>
        <input id="qEmail" type="email" autocomplete="email" value="${escapeHtml(quoteState.email)}" placeholder="Email address">
      </div>
    </div>

    <div class="qGrid2" style="margin-top:10px;">
      <div class="qField">
        <label for="qCity">Closest city</label>
        <select id="qCity">
          <option value="">Choose city</option>
          ${serviceCities.map(city => `<option value="${escapeHtml(city)}" ${quoteState.city === city ? "selected" : ""}>${escapeHtml(city)}</option>`).join("")}
        </select>
      </div>

      <div class="qField" style="grid-column:span 2;">
        <label for="qNotes">Notes, optional</label>
        <input id="qNotes" value="${escapeHtml(quoteState.notes)}" placeholder="Pet hair, stains, special requests, etc.">
      </div>
    </div>

    <input id="qCompany" tabindex="-1" autocomplete="off" value="${escapeHtml(quoteState.honeypot)}" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true">

    ${quoteState.leadEmailSending ? `<div class="qStatus">Sending your quote details...</div>` : ""}
  `;
}

function renderEstimateStep() {
  const info = syncEstimateState();
  const estimateText = formatEstimateDisplay(info);

  const oldEstimateText = info?.couponDiscount
    ? Number(info.highBeforeCoupon) > Number(info.lowBeforeCoupon)
      ? `${formatMoney(info.lowBeforeCoupon)} - ${formatMoney(info.highBeforeCoupon)}`
      : formatMoney(info.lowBeforeCoupon)
    : "";

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Your estimate is ready</h3>
    <p class="qStepSub">Final price may vary depending on vehicle condition. We’ll confirm before starting.</p>

    <div class="qEstimateBox">
      <div style="font-weight:1000;color:rgba(0,0,0,.62);text-transform:uppercase;letter-spacing:.08em;font-size:.82rem;">
        Estimated price
      </div>

      ${oldEstimateText ? `<div style="margin-top:8px;color:rgba(0,0,0,.45);font-weight:900;text-decoration:line-through;">${escapeHtml(oldEstimateText)}</div>` : ""}

      <div class="qEstimateBig">${escapeHtml(estimateText)}</div>

      <div class="qEstimateFine">
        Based on your selected vehicle and package.
      </div>
    </div>

    <div class="qDoneBox" style="margin-top:12px;">
      <div class="qDoneBig">Coupon code</div>

      <div class="qGrid2">
        <div class="qField" style="grid-column:span 2;">
          <label for="qCoupon">Enter coupon code</label>
          <input id="qCoupon" value="${escapeHtml(quoteState.couponCode)}" placeholder="Enter coupon code" autocomplete="off">
        </div>

        <button class="btn btn--quote" type="button" data-action="apply-coupon" style="align-self:end;min-height:45px;">
          Apply
        </button>
      </div>

      ${quoteState.couponMessage ? `<div class="qStatus">${escapeHtml(quoteState.couponMessage)}</div>` : ""}
    </div>
  `;
}

function renderAppointmentStep() {
  const selectedDateSlots = selectedCalendarDate
    ? appointmentSlots.filter(slot => slot.date === selectedCalendarDate)
    : [];

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Pick your preferred appointment time</h3>
    <p class="qStepSub">Choose the time that works best. We’ll confirm your appointment shortly.</p>

    <div class="qCalWrap">
      <div class="qCalTopRow">
        <div class="qCalTz">Local time${quoteState.routeGroupLabel ? ` · ${escapeHtml(quoteState.routeGroupLabel)}` : ""}</div>
        <button class="qReloadLink" type="button" data-action="reload-slots">Reload times</button>
      </div>

      <div class="qLoadBar ${appointmentSlotsLoading ? "isOn" : ""}">
        <span class="qLoadBarFill"></span>
      </div>

      ${appointmentSlotsError ? `<div class="qStatus">${escapeHtml(appointmentSlotsError)}</div>` : ""}
      ${appointmentSlotsLoading ? `<div class="qStatus">Loading available times...</div>` : renderCalendarHtml(selectedDateSlots)}
    </div>
  `;

  maybeLoadAppointmentSlots();
}

function renderCalendarHtml(selectedDateSlots) {
  if (!appointmentSlots.length && !appointmentSlotsLoading) {
    return `
      <div class="qDoneBox">
        <div class="qDoneBig">No times are open right now</div>
        <div class="qDoneLine">Reload available times or contact us directly for scheduling.</div>
      </div>
    `;
  }

  const slotDates = Array.from(new Set(appointmentSlots.map(slot => slot.date).filter(Boolean))).sort();

  if (!selectedCalendarDate && slotDates.length) selectedCalendarDate = slotDates[0];

  if (!calendarMonthDate) {
    const first = parseLocalDate(slotDates[0]) || new Date();
    calendarMonthDate = new Date(first.getFullYear(), first.getMonth(), 1);
  }

  const availableDateSet = new Set(slotDates);
  const year = calendarMonthDate.getFullYear();
  const month = calendarMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: startOffset });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return `
    <div class="qCal">
      <div class="qCalHead">
        <button class="qCalNav" type="button" data-action="month-prev" aria-label="Previous month">‹</button>
        <div class="qCalMonth">${escapeHtml(monthLabel(calendarMonthDate))}</div>
        <button class="qCalNav" type="button" data-action="month-next" aria-label="Next month">›</button>
      </div>

      <div class="qCalWeek">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="qCalW">${d}</div>`).join("")}
      </div>

      <div class="qCalGrid">
        ${blanks.map(() => `<button class="qCalDay qCalDay--blank" type="button" disabled></button>`).join("")}

        ${days.map(day => {
          const ymd = isoDate(new Date(year, month, day));
          const available = availableDateSet.has(ymd);
          const selected = selectedCalendarDate === ymd;

          return `
            <button class="qCalDay ${selected ? "isSel" : ""} ${available ? "" : "isDisabled"}" type="button" data-action="select-date" data-value="${ymd}" ${available ? "" : "disabled"}>
              ${day}
            </button>
          `;
        }).join("")}
      </div>

      <div class="qTimes">
        <div class="qTimesTitle">
          ${selectedCalendarDate ? `Available times for ${escapeHtml(formatDateNice(selectedCalendarDate))}` : "Choose an available date"}
        </div>

        ${
          selectedDateSlots.length
            ? `
              <div class="qTimesGrid">
                ${selectedDateSlots.map(slot => `
                  <button class="qTimeBtn ${quoteState.slotId === slot.id ? "isSel" : ""}" type="button" data-action="select-slot" data-id="${escapeHtml(slot.id)}">
                    ${escapeHtml(slot.timeLabel || formatTimeLabel(slot.label || slot.time))}
                  </button>
                `).join("")}
              </div>
            `
            : `<div class="qTimesNone">Select a highlighted date to see available times.</div>`
        }
      </div>
    </div>
  `;
}

function renderAddressStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Service address</h3>
    <p class="qStepSub">Enter the address where the vehicle will be detailed.</p>

    <div class="qDoneBox">
      <div class="qField">
        <label for="qAddress">Street address</label>
        <input id="qAddress" autocomplete="street-address" value="${escapeHtml(quoteState.address)}" placeholder="Street address">
      </div>

      <div class="qEstimateFine">
        Please choose a location with enough room for mobile detailing.
      </div>
    </div>
  `;
}

function renderConfirmStep() {
  const info = syncEstimateState();

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Confirm appointment request</h3>
    <p class="qStepSub">Review your request before sending it in.</p>

    <div class="qEstimateBox qEstimateBox--simple">
      <div style="font-weight:1000;color:rgba(0,0,0,.62);text-transform:uppercase;letter-spacing:.08em;font-size:.82rem;">
        Estimated price
      </div>

      <div class="qEstimateBig">${escapeHtml(formatEstimateDisplay(info))}</div>

      <div class="qEstimateFine">
        No online payment required right now.
      </div>
    </div>

    <div class="qDoneBox" style="margin-top:12px;">
      <div class="qDoneBig">Request summary</div>
      <div class="qDoneLine"><strong>Name:</strong> ${escapeHtml(quoteState.name || "-")}</div>
      <div class="qDoneLine"><strong>Phone:</strong> ${escapeHtml(quoteState.phone || "-")}</div>
      <div class="qDoneLine"><strong>Email:</strong> ${escapeHtml(quoteState.email || "-")}</div>
      <div class="qDoneLine"><strong>Service:</strong> ${escapeHtml(getSelectedDisplayServices().join(", ") || "-")}</div>
      <div class="qDoneLine"><strong>Time:</strong> ${escapeHtml(quoteState.slotLabel || "-")}</div>
      <div class="qDoneLine"><strong>Address:</strong> ${escapeHtml(quoteState.address || "-")}</div>
      ${quoteState.couponCode ? `<div class="qDoneLine"><strong>Coupon:</strong> ${escapeHtml(normalizeCoupon(quoteState.couponCode))}</div>` : ""}
    </div>

    ${quoteState.bookingError ? `<div class="qStatus" style="color:#b00020;">${escapeHtml(quoteState.bookingError)}</div>` : ""}
  `;
}

function renderDoneStep() {
  quoteBody.innerHTML = `
    <div class="quoteSuccessWrap">
      <div class="quoteSuccessBadge">Request Received</div>
      <h3 class="quoteSuccessTitle">You’re all set.</h3>
      <p class="quoteSuccessText">Your appointment request was sent. We’ll confirm shortly by text or email.</p>

      <div class="quoteSuccessInner">
        <div class="qDoneBox">
          <div class="qDoneBig">Summary</div>
          <div class="qDoneLine"><strong>Service:</strong> ${escapeHtml(getSelectedDisplayServices().join(", ") || "-")}</div>
          <div class="qDoneLine"><strong>Time:</strong> ${escapeHtml(quoteState.slotLabel || "-")}</div>
          <div class="qDoneLine"><strong>Address:</strong> ${escapeHtml(quoteState.address || "-")}</div>
          <div class="qDoneLine"><strong>Estimate:</strong> ${escapeHtml(formatEstimateDisplay())}</div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------
// EVENTS
// -------------------------

function bindStepEvents() {
  if (!quoteBody) return;

  quoteBody.querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", handleStepAction);
  });

  const qName = quoteBody.querySelector("#qName");
  const qPhone = quoteBody.querySelector("#qPhone");
  const qEmail = quoteBody.querySelector("#qEmail");
  const qCity = quoteBody.querySelector("#qCity");
  const qNotes = quoteBody.querySelector("#qNotes");
  const qCompany = quoteBody.querySelector("#qCompany");
  const qCoupon = quoteBody.querySelector("#qCoupon");
  const qAddress = quoteBody.querySelector("#qAddress");

  if (qName) qName.addEventListener("input", e => {
    quoteState.name = e.target.value;
    updateNav();
  });

  if (qPhone) qPhone.addEventListener("input", e => {
    quoteState.phone = e.target.value;
    updateNav();
  });

  if (qEmail) qEmail.addEventListener("input", e => {
    quoteState.email = e.target.value;
    updateNav();
  });

  if (qCity) qCity.addEventListener("change", e => {
    quoteState.city = e.target.value;
    syncRouteGroupFromCity();
    clearAppointmentSelection();
    updateNav();
  });

  if (qNotes) qNotes.addEventListener("input", e => {
    quoteState.notes = e.target.value;
  });

  if (qCompany) qCompany.addEventListener("input", e => {
    quoteState.honeypot = e.target.value;
  });

  if (qCoupon) qCoupon.addEventListener("input", e => {
    quoteState.couponCode = e.target.value;
    quoteState.couponMessage = "";
  });

  if (qAddress) qAddress.addEventListener("input", e => {
    quoteState.address = e.target.value;
    updateNav();
  });
}

function handleStepAction(e) {
  const target = e.currentTarget;
  const action = target.dataset.action;
  const value = target.dataset.value || "";

  if (action === "select-vehicle") {
    quoteState.vehicleType = value;
    clearEstimateDependentState();
    render();
    advanceSoon();
    return;
  }

  if (action === "select-category") {
    setServiceByCategory(value);
    render();
    advanceSoon();
    return;
  }

  if (action === "select-interior-package") {
    quoteState.interiorPackage = value;
    clearEstimateDependentState();
    render();
    advanceSoon();
    return;
  }

  if (action === "select-exterior-package") {
    quoteState.exteriorPackage = value;
    clearEstimateDependentState();
    render();
    advanceSoon();
    return;
  }

  if (action === "apply-coupon") {
    applyCouponFromField();
    render();
    return;
  }

  if (action === "reload-slots") {
    appointmentSlotsLoadedKey = "";
    appointmentSlotsError = "";
    maybeLoadAppointmentSlots(true);
    render();
    return;
  }

  if (action === "month-prev" || action === "month-next") {
    if (!calendarMonthDate) calendarMonthDate = new Date();

    const direction = action === "month-next" ? 1 : -1;
    calendarMonthDate = new Date(
      calendarMonthDate.getFullYear(),
      calendarMonthDate.getMonth() + direction,
      1
    );

    render();
    return;
  }

  if (action === "select-date") {
    selectedCalendarDate = value;
    render();
    return;
  }

  if (action === "select-slot") {
    selectSlot(target.dataset.id || "");
    render();
    return;
  }
}

function applyCouponFromField() {
  const input = quoteBody?.querySelector("#qCoupon");
  const code = normalizeCoupon(input?.value || quoteState.couponCode);

  quoteState.couponCode = code;
  quoteState.couponDiscount = getCouponDiscount(code);

  if (!code) {
    quoteState.couponMessage = "Enter a coupon code first.";
    return;
  }

  if (!quoteState.couponDiscount) {
    quoteState.couponMessage = "That coupon code is not valid.";
    return;
  }

  quoteState.couponMessage = `${code} applied.`;
}

function clearEstimateDependentState() {
  quoteState.estimateLow = "";
  quoteState.estimateHigh = "";
  quoteState.leadEmailSent = false;
  quoteState.leadEmailSignature = "";
  quoteState.bookingError = "";
  clearAppointmentSelection();
}

function clearAppointmentSelection() {
  quoteState.slotId = "";
  quoteState.slotLabel = "";
  quoteState.slotDate = "";
  quoteState.slotTime = "";

  appointmentSlots = [];
  appointmentSlotsLoading = false;
  appointmentSlotsLoadedKey = "";
  appointmentSlotsError = "";
  selectedCalendarDate = "";
  calendarMonthDate = null;
}

// -------------------------
// SLOTS
// -------------------------

function getSlotsLoadKey() {
  return [quoteState.city, quoteState.routeGroup].join("|");
}

async function maybeLoadAppointmentSlots(force = false) {
  const key = getSlotsLoadKey();

  if (!force && appointmentSlotsLoadedKey === key) return;
  if (appointmentSlotsLoading) return;

  appointmentSlotsLoading = true;
  appointmentSlotsError = "";
  updateNav();

  try {
    const url = buildScriptUrl("slots", {
      city: quoteState.city,
      routeGroup: quoteState.routeGroup
    });

    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    if (!data?.ok) {
      throw new Error(data?.message || data?.error || "Could not load times.");
    }

    appointmentSlots = (data.slots || [])
      .filter(slot => slot?.id)
      .map(slot => ({
        id: String(slot.id || ""),
        label: String(slot.label || slot.id || ""),
        date: normalizeDateValue(slot.date || slot.id),
        time: normalizeTimeValue(slot.time || slot.id),
        timeLabel: formatTimeLabel(slot.label || slot.time || slot.id)
      }))
      .filter(slot => slot.date && slot.time)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    appointmentSlotsLoadedKey = key;

    const dates = Array.from(new Set(appointmentSlots.map(slot => slot.date))).sort();

    if (!selectedCalendarDate && dates.length) selectedCalendarDate = dates[0];

    if (!calendarMonthDate && dates.length) {
      const first = parseLocalDate(dates[0]) || new Date();
      calendarMonthDate = new Date(first.getFullYear(), first.getMonth(), 1);
    }
  } catch (err) {
    appointmentSlotsError = err?.message || "Could not load appointment times.";
    appointmentSlots = [];
  } finally {
    appointmentSlotsLoading = false;

    if (steps[stepIndex] === "appointment") {
      render();
    }
  }
}

function selectSlot(slotId) {
  const slot = appointmentSlots.find(s => s.id === slotId);
  if (!slot) return;

  quoteState.slotId = slot.id;
  quoteState.slotLabel = slot.label || `${formatDateNice(slot.date)} at ${slot.timeLabel}`;
  quoteState.slotDate = slot.date;
  quoteState.slotTime = slot.time;
}

// -------------------------
// PAYLOAD + EMAILS
// -------------------------

function buildLeadSignature() {
  return [
    quoteState.name,
    quoteState.phone,
    quoteState.email,
    quoteState.city,
    quoteState.vehicleType,
    quoteState.serviceCategory,
    getSelectedDisplayServices().join("|"),
    quoteState.notes,
    normalizeCoupon(quoteState.couponCode)
  ]
    .map(v => String(v || "").trim().toLowerCase())
    .join("||");
}

function buildPayload(includeSlot = false) {
  const info = syncEstimateState();
  const displayServices = getSelectedDisplayServices();

  const payload = {
    leadId: quoteState.leadId || "",

    name: quoteState.name,
    phone: quoteState.phone,
    email: quoteState.email,
    city: quoteState.city,
    routeGroup: quoteState.routeGroup,
    routeGroupLabel: quoteState.routeGroupLabel,

    vehicleType: quoteState.vehicleType,
    serviceCategory: quoteState.serviceCategory,
    services: displayServices,
    baseServices: quoteState.services.slice(),

    interiorPackage: quoteState.interiorPackage,
    interiorCondition: quoteState.interiorPackage,
    exteriorPackage: quoteState.exteriorPackage,
    exteriorCondition: quoteState.exteriorPackage,

    estimateLow: info?.low ?? "",
    estimateHigh: info?.high ?? "",
    estimateDisplay: formatEstimateDisplay(info),
    bundleSavings: info?.savings || 0,

    couponCode: normalizeCoupon(quoteState.couponCode),
    couponDiscount: info?.couponDiscount || 0,

    notes: quoteState.notes,
    address: quoteState.address,

    paymentMode: "after",
    paymentBypass: false,
    ackDeposit: false,
    ackPriceVariance: false,
    depositPaid: false,
    fullPaid: false,
    depositAmount: 0,
    paymentAmountCharged: 0,
    paymentStatus: "appointment_requested",
    squarePaymentId: ""
  };

  if (includeSlot) {
    payload.slotId = quoteState.slotId;
    payload.slotLabel = quoteState.slotLabel;
    payload.slotDate = quoteState.slotDate;
    payload.slotTime = quoteState.slotTime;
  }

  return payload;
}

async function sendLeadNotificationIfNeeded() {
  if (quoteState.honeypot) return { ok: true, skipped: true };

  if (!quoteState.leadId) quoteState.leadId = makeId();

  const signature = buildLeadSignature();

  if (quoteState.leadEmailSent && quoteState.leadEmailSignature === signature) {
    return { ok: true, skipped: true };
  }

  quoteState.leadEmailSending = true;
  updateNav();

  try {
    const payload = buildPayload(false);

    const res = await fetch(window.SCRIPT_URL || DEFAULT_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data?.ok && !data?.emailSent) {
      throw new Error(data?.message || data?.error || data?.emailError || "Lead email failed.");
    }

    quoteState.leadEmailSent = true;
    quoteState.leadEmailSignature = signature;

    if (data?.leadId) {
      quoteState.leadId = data.leadId;
    }

    return data;
  } catch (err) {
    console.warn("Lead notification failed:", err);
    return {
      ok: false,
      error: err?.message || String(err)
    };
  } finally {
    quoteState.leadEmailSending = false;
    updateNav();
  }
}

async function submitAppointmentRequest() {
  if (!canContinue()) return;

  quoteState.submittingBooking = true;
  quoteState.bookingError = "";
  render();

  try {
    if (!quoteState.leadId) quoteState.leadId = makeId();

    const payload = buildPayload(true);

    const res = await fetch(window.SCRIPT_URL || DEFAULT_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data?.ok) {
      throw new Error(data?.message || data?.error || data?.emailError || "Could not submit appointment request.");
    }

    quoteState.submittingBooking = false;
    stepIndex = steps.indexOf("done");
    render();
  } catch (err) {
    quoteState.submittingBooking = false;
    quoteState.bookingError = err?.message || "Could not submit appointment request. Please try again.";
    render();
  }
}

// -------------------------
// NAVIGATION
// -------------------------

async function goNext() {
  const step = steps[stepIndex];

  if (step === "done") {
    closeQuote();
    return;
  }

  if (!canContinue()) {
    updateNav();
    return;
  }

  if (step === "contact") {
    await sendLeadNotificationIfNeeded();
  }

  if (step === "confirm") {
    await submitAppointmentRequest();
    return;
  }

  stepIndex = nextActiveStepIndex(stepIndex);
  render();
}

function goBack() {
  if (stepIndex <= 0) return;

  stepIndex = prevActiveStepIndex(stepIndex);
  render();
}

function resetQuoteFlow() {
  Object.assign(quoteState, {
    vehicleType: "",
    serviceCategory: "",
    services: [],

    interiorPackage: "",
    exteriorPackage: "",

    estimateLow: "",
    estimateHigh: "",
    estimateIsStartingAt: false,

    couponCode: "",
    couponDiscount: 0,
    couponMessage: "",

    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
    address: "",

    routeGroup: "",
    routeGroupLabel: "",

    slotId: "",
    slotLabel: "",
    slotDate: "",
    slotTime: "",

    leadId: "",
    leadEmailSent: false,
    leadEmailSignature: "",
    leadEmailSending: false,

    submittingBooking: false,
    bookingError: "",

    honeypot: ""
  });

  appointmentSlots = [];
  appointmentSlotsLoading = false;
  appointmentSlotsLoadedKey = "";
  appointmentSlotsError = "";
  selectedCalendarDate = "";
  calendarMonthDate = null;

  stepIndex = 0;
}

// -------------------------
// MODAL OPEN / CLOSE
// -------------------------

function openQuote() {
  if (!quoteModal) return;

  lastActiveElQuote = document.activeElement;

  quoteModal.hidden = false;
  quoteModal.removeAttribute("hidden");
  quoteModal.setAttribute("aria-hidden", "false");

  quoteModal.classList.add("isOpen", "is-open", "open", "active");

  quoteModal.style.display = "flex";
  quoteModal.style.opacity = "1";
  quoteModal.style.pointerEvents = "auto";

  document.body.style.overflow = "hidden";

  try {
    render();

    setTimeout(() => {
      const firstFocusable = quoteModal.querySelector("button, input, select, textarea");
      firstFocusable?.focus?.();
    }, 50);
  } catch (err) {
    console.error("Quote wizard render error:", err);

    if (quoteBody) {
      quoteBody.innerHTML = `
        <h3 class="qStepTitle">Quote form loading issue</h3>
        <p class="qStepSub">Something went wrong while loading the quote form.</p>
        <div class="qDoneBox">
          <div class="qDoneBig">Temporary error</div>
          <div class="qDoneLine">Open the browser console and send the red JavaScript error.</div>
        </div>
      `;
    }
  }
}

function closeQuote() {
  if (!quoteModal) return;

  quoteModal.setAttribute("hidden", "");
  quoteModal.hidden = true;
  quoteModal.setAttribute("aria-hidden", "true");

  quoteModal.classList.remove("isOpen", "is-open", "open", "active");

  quoteModal.style.display = "";
  quoteModal.style.opacity = "";
  quoteModal.style.pointerEvents = "";

  document.body.style.overflow = "";

  lastActiveElQuote?.focus?.();
}

window.forceCloseQuote = function () {
  document.body.style.overflow = "";

  const modal = document.querySelector("[data-quote-modal]");

  if (modal) {
    modal.hidden = true;
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("isOpen", "is-open", "open", "active");
    modal.style.display = "";
    modal.style.opacity = "";
    modal.style.pointerEvents = "";
  }
};

// -------------------------
// INIT
// -------------------------

function initQuoteWizard() {
  if (!quoteModal || !quoteBody) {
    console.warn("Quote wizard missing modal/body elements.");
    return;
  }

  document.querySelectorAll("[data-quote-open]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      resetQuoteFlow();
      openQuote();
    });
  });

  quoteCloseBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      closeQuote();
    });
  });

  quoteNextBtn?.addEventListener("click", e => {
    e.preventDefault();
    goNext();
  });

  quoteBackBtn?.addEventListener("click", e => {
    e.preventDefault();
    goBack();
  });

  quoteModal?.addEventListener("click", e => {
    if (e.target === quoteModal) {
      closeQuote();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && quoteModal && !quoteModal.hasAttribute("hidden")) {
      closeQuote();
    }
  });
}

initQuoteWizard();
