// -------------------------
// QUOTE WIZARD
// Conversion Flow v13.0
// Vehicle -> Category -> Service -> Package -> Contact -> Estimate -> Appointment -> Address -> Confirm -> Done
// -------------------------

const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxz7hB5guXRht1ISnif1Bbb1xHV04v_F-2GeOssdVzNECaxxO5WK1UB0a7R0WBCLIIfBg/exec";

const INTERIOR_DISPLAY_RANGE_ADD = 40;
const EXTERIOR_DISPLAY_RANGE_ADD = 15;
const HEADLIGHT_RESTORATION_PRICE = 80;

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
  // Add custom coupon codes here. Format: CODE: discountAmount
  // Example: SPRING25: 25,
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
let confirmEditingField = "";

const quoteState = {
  vehicleType: "",
  serviceCategory: "",
  services: [],

  interiorPackage: "",
  exteriorPackage: "",
  paintCorrectionPackage: "",
  ceramicPackage: "",

  upkeepFrequency: "",

  estimateLow: "",
  estimateHigh: "",
  estimateIsStartingAt: false,

  couponCode: "",
  couponDiscount: 0,
  couponMessage: "",

  slotId: "",
  slotSourceId: "",
  slotLabel: "",
  slotDate: "",
  slotTime: "",

  address: "",
  addressError: "",

  name: "",
  phone: "",
  email: "",
  city: "",
  notes: "",

  routeGroup: "",
  routeGroupLabel: "",

  leadId: "",
  leadEmailSent: false,
  leadEmailSignature: "",
  leadEmailSending: false,

  submittingBooking: false,
  bookingError: "",

  // Contact form validation
  contactErrors: {},
  showContactErrors: false,

  paymentMode: "after",
  paymentStatus: "appointment_requested",
  paymentAmountCharged: 0,
  squarePaymentId: "",

  honeypot: ""
};

const steps = [
  "vehicleType",
  "serviceCategory",
  "service",
  "interiorPackage",
  "exteriorPackage",
  "paintCorrectionPackage",
  "ceramicPackage",
  "upkeepFrequency",
  "contact",
  "estimate",
  "appointment",
  "address",
  "confirm",
  "done"
];

// -------------------------
// OPTIONS / IMAGES
// -------------------------

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

const SERVICECAT_INTERIOR_IMG = "./2017-05-22-07-32-26.jpg";
const SERVICECAT_EXTERIOR_IMG = "./c36084da09340612d8431de0221ea985.jpg";

const serviceCategories = [
  {
    label: "Interior",
    hint: "Inside-only detailing",
    img: SERVICECAT_INTERIOR_IMG
  },
  {
    label: "Exterior",
    hint: "Outside-only detailing",
    img: SERVICECAT_EXTERIOR_IMG
  },
  {
    label: "Interior + Exterior",
    hint: "Full detail inside + out",
    img: [SERVICECAT_INTERIOR_IMG, SERVICECAT_EXTERIOR_IMG],
    split: "h"
  }
];

const INTERIOR_UPKEEP_IMG = "./img_6480.webp";
const EXTERIOR_UPKEEP_IMG = "./Audi 2 Foamed_1704769098.webp";
const CERAMIC_IMG = "./2626cb4b-d7f8-4cb3-b79b-be682b3b9112.png";
const PAINT_CORRECTION_IMG = "./bee.jpg";
const HEADLIGHT_RESTORATION_IMG = "./CCC_Headlight_Mktplc_Before_After__95898.jpg";

const servicesAll = [
  {
    label: "Interior Detail",
    category: "Interior",
    img: "./Shampooing_interior_detail-55a7e5ac-640w.webp"
  },
  {
    label: "Exterior Wash",
    category: "Exterior",
    img: "./63eaaf7a6f6b7f11ccae99f6_car-detailing-houston-1.jpg"
  },
  {
    label: "Headlight Restoration",
    category: "Exterior",
    img: HEADLIGHT_RESTORATION_IMG
  },
  {
    label: "Interior Upkeep Plan",
    category: "Interior",
    img: INTERIOR_UPKEEP_IMG,
    upkeep: "interior"
  },
  {
    label: "Exterior Upkeep Plan",
    category: "Exterior",
    img: EXTERIOR_UPKEEP_IMG,
    upkeep: "exterior"
  },
  {
    label: "Interior + Exterior Upkeep Plan",
    category: "Both",
    img: [INTERIOR_UPKEEP_IMG, EXTERIOR_UPKEEP_IMG],
    split: "h",
    upkeep: "both"
  },
  {
    label: "Paint Correction",
    category: "Exterior",
    img: PAINT_CORRECTION_IMG,
    substep: "paint"
  },
  {
    label: "Ceramic Coating",
    category: "Exterior",
    img: CERAMIC_IMG,
    substep: "ceramic"
  }
];

// NOTE: Package cards no longer render images. Image fields kept for back-compat only.
const interiorPackages = [
  {
    label: "Standard",
    displayLabel: "Standard Clean",
    serviceLabel: "Standard Interior Detail",
    hint: "Best if the interior is already maintained.",
    features: [
      "Full interior vacuum",
      "Full interior wipe down",
      "Floor mats cleaned",
      "Windows cleaned inside & out"
    ]
  },
  {
    label: "Deep Clean",
    displayLabel: "Deep Clean",
    serviceLabel: "Deep Clean Interior Detail",
    hint: "Best for dirt buildup, light stains, and a deeper reset.",
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
    displayLabel: "Premium Deep Clean",
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
    displayLabel: "Standard",
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
    displayLabel: "Premium",
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
    displayLabel: "Clay Decontamination",
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

const paintCorrectionPackages = [
  {
    label: "1 Step Paint Correction",
    serviceLabel: "Stage 1 Paint Correction",
    hint: "Gloss boost + defect reduction",
    img: "./2db4c116-33b7-4492-8922-1a3b5b25ee1c.png",
    badge: "1"
  },
  {
    label: "2 Step Paint Correction",
    serviceLabel: "Stage 2 Paint Correction",
    hint: "Heavier correction finish",
    img: "./9d828f71-efdd-4de9-a62b-1de399617334.png",
    badge: "2"
  }
];

const ceramicPackages = [
  {
    label: "Ceramic Coating with Clay Decontamination",
    serviceLabel: "Level 1 Ceramic Coating",
    hint: "Starting at $500",
    img: "./ChatGPT Image Mar 12, 2026, 07_07_29 PM.png",
    startingAt: 500
  },
  {
    label: "Ceramic Coating with Single Stage Paint Correction",
    serviceLabel: "Level 2 Ceramic Coating",
    hint: "Starting at $800",
    img: "./ChatGPT Image Mar 12, 2026, 07_09_50 PM.png",
    startingAt: 800
  },
  {
    label: "Ceramic Coating with 2 Stage Paint Correction",
    serviceLabel: "Level 3 Ceramic Coating",
    hint: "Starting at $1000",
    img: "./ChatGPT Image Mar 12, 2026, 07_14_23 PM.png",
    startingAt: 1000
  }
];

const upkeepFrequencies = [
  { label: "Weekly", hint: "Lowest per-visit price" },
  { label: "Biweekly", hint: "Best mix of value + consistency" },
  { label: "Monthly", hint: "Base upkeep rate" }
];

const serviceCities = ["Keizer", "Salem", "Portland", "Tigard", "Lake Oswego"];

// -------------------------
// PRICING
// -------------------------

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

const PAINT_CORRECTION_PRICES = {
  "Stage 1 Paint Correction": { Sedan: 275, SUV: 300, "Big SUV": 320, Truck: 295 },
  "Stage 2 Paint Correction": { Sedan: 370, SUV: 395, "Big SUV": 410, Truck: 395 }
};

const CERAMIC_COATING_STARTING_AT = {
  "Level 1 Ceramic Coating": 500,
  "Level 2 Ceramic Coating": 800,
  "Level 3 Ceramic Coating": 1000
};

const UPKEEP_BASE_PRICES = {
  "Interior Upkeep Plan": { Sedan: 85, SUV: 95, "Big SUV": 110, Truck: 100 },
  "Exterior Upkeep Plan": { Sedan: 55, SUV: 65, "Big SUV": 75, Truck: 70 },
  "Interior + Exterior Upkeep Plan": { Sedan: 125, SUV: 145, "Big SUV": 170, Truck: 155 }
};

const UPKEEP_FREQUENCY_MULTIPLIER = {
  Weekly: 0.85,
  Biweekly: 0.92,
  Monthly: 1
};

const INTERIOR_EXTERIOR_BUNDLE_DISCOUNT = 30;

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

function priceForVehicle(table, key) {
  const vehicle = quoteState.vehicleType;
  if (!vehicle || !table?.[key]) return null;
  return clampInt(table[key][vehicle]);
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

// Validate the contact step and return a map of fieldName -> error message.
function validateContactStep() {
  const errors = {};
  const name = String(quoteState.name || "").trim();
  const phone = String(quoteState.phone || "").trim();
  const email = String(quoteState.email || "").trim();
  const city = String(quoteState.city || "").trim();

  if (!name) errors.name = "Please enter your name";

  if (!phone) {
    errors.phone = "Please enter a phone number";
  } else {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) errors.phone = "Please enter a valid phone number";
  }

  if (!email) {
    errors.email = "Please enter your email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email";
  }

  if (!city) errors.city = "Please choose your closest city";

  return errors;
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

// -------------------------
// STEP LOGIC
// -------------------------

const UPKEEP_SET = new Set(["Interior Upkeep Plan", "Exterior Upkeep Plan", "Interior + Exterior Upkeep Plan"]);

function isUpkeepService(label) {
  return UPKEEP_SET.has(label);
}

function isUpkeepPlanSelected() {
  return quoteState.services.some(isUpkeepService);
}

function anyServiceRequiresInteriorPackage() {
  return quoteState.services.includes("Interior Detail");
}

function anyServiceRequiresExteriorPackage() {
  return quoteState.services.includes("Exterior Wash");
}

function anyServiceRequiresPaintCorrectionPackage() {
  return quoteState.services.includes("Paint Correction");
}

function anyServiceRequiresCeramicPackage() {
  return quoteState.services.includes("Ceramic Coating");
}

function stepIsActive(stepName) {
  if (stepName === "interiorPackage") return anyServiceRequiresInteriorPackage();
  if (stepName === "exteriorPackage") return anyServiceRequiresExteriorPackage();
  if (stepName === "paintCorrectionPackage") return anyServiceRequiresPaintCorrectionPackage();
  if (stepName === "ceramicPackage") return anyServiceRequiresCeramicPackage();
  if (stepName === "upkeepFrequency") return isUpkeepPlanSelected();
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

function resetPackageSelectionsIfNeeded() {
  if (!quoteState.services.includes("Interior Detail")) quoteState.interiorPackage = "";
  if (!quoteState.services.includes("Exterior Wash")) quoteState.exteriorPackage = "";
  if (!quoteState.services.includes("Paint Correction")) quoteState.paintCorrectionPackage = "";
  if (!quoteState.services.includes("Ceramic Coating")) quoteState.ceramicPackage = "";
  if (!isUpkeepPlanSelected()) quoteState.upkeepFrequency = "";
}

function getServicesForCategory() {
  if (quoteState.serviceCategory === "Interior") {
    return servicesAll.filter(s => s.category === "Interior");
  }

  if (quoteState.serviceCategory === "Exterior") {
    return servicesAll.filter(s => s.category === "Exterior");
  }

  if (quoteState.serviceCategory === "Interior + Exterior") {
    return servicesAll.filter(s => ["Interior", "Exterior", "Both"].includes(s.category));
  }

  return servicesAll;
}

function getSelectedDisplayServices() {
  return quoteState.services.map(service => {
    if (service === "Interior Detail") return quoteState.interiorPackage || service;
    if (service === "Exterior Wash") return quoteState.exteriorPackage || service;
    if (service === "Paint Correction") return quoteState.paintCorrectionPackage || service;
    if (service === "Ceramic Coating") return quoteState.ceramicPackage || service;
    return service;
  });
}

function getSelectedServiceChipData() {
  return quoteState.services.map(service => {
    if (service === "Interior Detail") return { baseLabel: service, displayLabel: quoteState.interiorPackage || service };
    if (service === "Exterior Wash") return { baseLabel: service, displayLabel: quoteState.exteriorPackage || service };
    if (service === "Paint Correction") return { baseLabel: service, displayLabel: quoteState.paintCorrectionPackage || service };
    if (service === "Ceramic Coating") return { baseLabel: service, displayLabel: quoteState.ceramicPackage || service };
    return { baseLabel: service, displayLabel: service };
  });
}

function hasInteriorExteriorBundle() {
  return quoteState.services.includes("Interior Detail") && quoteState.services.includes("Exterior Wash");
}

function getDisplayRangeAddForService(serviceLabel) {
  if (serviceLabel === "Interior Detail") return INTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Exterior Wash") return EXTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Headlight Restoration") return EXTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Paint Correction") return EXTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Ceramic Coating") return EXTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Interior Upkeep Plan") return INTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Exterior Upkeep Plan") return EXTERIOR_DISPLAY_RANGE_ADD;
  if (serviceLabel === "Interior + Exterior Upkeep Plan") return INTERIOR_DISPLAY_RANGE_ADD + EXTERIOR_DISPLAY_RANGE_ADD;
  return 0;
}

function computeUpkeepPrice(serviceLabel, frequency = quoteState.upkeepFrequency) {
  const vehicle = quoteState.vehicleType;
  if (!vehicle || !serviceLabel || !frequency) return null;

  const base = UPKEEP_BASE_PRICES?.[serviceLabel]?.[vehicle];
  const mult = UPKEEP_FREQUENCY_MULTIPLIER?.[frequency];

  if (!Number.isFinite(base) || !Number.isFinite(mult)) return null;
  return clampInt(base * mult);
}

// -------------------------
// ESTIMATE
// -------------------------

function computeEstimateInfo() {
  const vehicle = quoteState.vehicleType;
  const services = quoteState.services || [];

  if (!vehicle || !services.length) return null;

  let subtotal = 0;
  let hasStartingAt = false;
  let displayRangeAdd = 0;

  for (const service of services) {
    if (service === "Interior Detail") {
      const price = priceForVehicle(INTERIOR_DETAIL_PRICES, quoteState.interiorPackage);
      if (!Number.isFinite(price)) return null;
      subtotal += price;
      displayRangeAdd += getDisplayRangeAddForService(service);
      continue;
    }

    if (service === "Exterior Wash") {
      const price = priceForVehicle(EXTERIOR_DETAIL_PRICES, quoteState.exteriorPackage);
      if (!Number.isFinite(price)) return null;
      subtotal += price;
      displayRangeAdd += getDisplayRangeAddForService(service);
      continue;
    }

    if (service === "Headlight Restoration") {
      subtotal += HEADLIGHT_RESTORATION_PRICE;
      displayRangeAdd += getDisplayRangeAddForService(service);
      continue;
    }

    if (service === "Paint Correction") {
      const price = priceForVehicle(PAINT_CORRECTION_PRICES, quoteState.paintCorrectionPackage);
      if (!Number.isFinite(price)) return null;
      subtotal += price;
      displayRangeAdd += getDisplayRangeAddForService(service);
      continue;
    }

    if (service === "Ceramic Coating") {
      const price = CERAMIC_COATING_STARTING_AT?.[quoteState.ceramicPackage];
      if (!Number.isFinite(price)) return null;
      subtotal += price;
      displayRangeAdd += getDisplayRangeAddForService(service);
      hasStartingAt = true;
      continue;
    }

    if (isUpkeepService(service)) {
      const price = computeUpkeepPrice(service, quoteState.upkeepFrequency);
      if (!Number.isFinite(price)) return null;
      subtotal += price;
      displayRangeAdd += getDisplayRangeAddForService(service);
      continue;
    }
  }

  const bundleSavings = hasInteriorExteriorBundle() ? INTERIOR_EXTERIOR_BUNDLE_DISCOUNT : 0;
  const couponDiscount = getCouponDiscount();

  const lowBeforeCoupon = Math.max(0, subtotal - bundleSavings);
  const highBeforeCoupon = Math.max(0, lowBeforeCoupon + displayRangeAdd);

  const low = clampInt(Math.max(0, lowBeforeCoupon - couponDiscount));
  const high = clampInt(Math.max(0, highBeforeCoupon - couponDiscount));

  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;

  return {
    subtotal: clampInt(subtotal),
    lowBeforeCoupon: clampInt(lowBeforeCoupon),
    highBeforeCoupon: clampInt(highBeforeCoupon),
    low,
    high,
    total: low,
    hasStartingAt,
    savings: bundleSavings,
    couponCode: normalizeCoupon(quoteState.couponCode),
    couponDiscount
  };
}

function syncEstimateState() {
  const info = computeEstimateInfo();

  if (!info) {
    quoteState.estimateLow = "";
    quoteState.estimateHigh = "";
    quoteState.estimateIsStartingAt = false;
    quoteState.couponDiscount = 0;
    return null;
  }

  quoteState.estimateLow = String(info.low);
  quoteState.estimateHigh = String(info.high);
  quoteState.estimateIsStartingAt = !!info.hasStartingAt;
  quoteState.couponDiscount = info.couponDiscount || 0;

  return info;
}

function formatEstimateDisplay(info = computeEstimateInfo()) {
  if (!info) return "We’ll confirm after assessment";

  const lowText = formatMoney(info.low);
  const highText = formatMoney(info.high);

  if (Number(info.high) > Number(info.low)) {
    return info.hasStartingAt ? `Starting at ${lowText} - ${highText}` : `${lowText} - ${highText}`;
  }

  return info.hasStartingAt ? `Starting at ${lowText}` : lowText;
}

// -------------------------
// PROGRESS + NAV
// -------------------------

function ensureProgressDots() {
  const visibleSteps = getVisibleSteps();

  if (!quoteProgressEl) {
    return { dots: quoteDots(), visibleSteps };
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

  return { dots: quoteDots(), visibleSteps };
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
  if (step === "service") return quoteState.services.length > 0;

  if (step === "interiorPackage") return !anyServiceRequiresInteriorPackage() || !!quoteState.interiorPackage;
  if (step === "exteriorPackage") return !anyServiceRequiresExteriorPackage() || !!quoteState.exteriorPackage;
  if (step === "paintCorrectionPackage") return !anyServiceRequiresPaintCorrectionPackage() || !!quoteState.paintCorrectionPackage;
  if (step === "ceramicPackage") return !anyServiceRequiresCeramicPackage() || !!quoteState.ceramicPackage;
  if (step === "upkeepFrequency") return !isUpkeepPlanSelected() || !!quoteState.upkeepFrequency;

  if (step === "contact") {
    // Always allow click — validation runs in goNext() and shows inline errors if missing.
    return !quoteState.leadEmailSending;
  }

  if (step === "estimate") return !!computeEstimateInfo();
  if (step === "appointment") return !!quoteState.slotId;
  // Let users click Review My Request so we can show an inline Required message.
  if (step === "address") return true;
  if (step === "confirm") return !quoteState.submittingBooking;
  if (step === "done") return true;

  return true;
}

function getNextButtonText() {
  const step = steps[stepIndex];

  if (step === "contact") return quoteState.leadEmailSending ? "Sending..." : "See My Estimate";
  if (step === "estimate") return "Pick My Appointment Time";
  if (step === "appointment") return "Continue With This Time";
  if (step === "address") return "Review My Request";
  if (step === "confirm") return quoteState.submittingBooking ? "Sending..." : "Request My Appointment";
  if (step === "done") return "Close";

  return "Continue";
}

function updateNav() {
  if (!quoteBackBtn || !quoteNextBtn) return;

  const step = steps[stepIndex];

  // Hide Continue button on auto-advance steps so users can't accidentally double-tap.
  const isAutoAdvanceStep = step === "vehicleType" || step === "serviceCategory";

  quoteBackBtn.style.display = stepIndex <= 0 || step === "done" ? "none" : "inline-flex";

  if (isAutoAdvanceStep) {
    quoteNextBtn.style.display = "none";
    quoteNextBtn.disabled = true;
  } else {
    quoteNextBtn.style.display = "inline-flex";
    quoteNextBtn.textContent = getNextButtonText();
    quoteNextBtn.disabled = !canContinue();
  }

  if (step === "done") {
    quoteBackBtn.style.display = "none";
    quoteNextBtn.style.display = "inline-flex";
    quoteNextBtn.textContent = "Close";
    quoteNextBtn.disabled = false;
  }
}

function renderNavPrice() {
  return;
}

// -------------------------
// HTML HELPERS
// -------------------------

function renderMedia(item) {
  if (Array.isArray(item.img)) {
    return `
      <div class="qCardMedia">
        <div class="qCardMediaSplit">
          ${item.img.map(src => `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">`).join("")}
        </div>
      </div>
    `;
  }

  const zoomStyle = item.zoom ? `style="--imgZoom:${Number(item.zoom)};--carZoom:${Number(item.zoom)}"` : "";
  const zoomClass = item.zoom ? " isZoom" : "";
  const containClass = item.contain ? "isContain" : "";

  return `
    <div class="qCardMedia${zoomClass}" ${zoomStyle}>
      ${item.badge ? `<span class="qCardBadge">${escapeHtml(item.badge)}</span>` : ""}
      ${(item.label === "Paint Correction" || item.label === "Ceramic Coating") ? `<span class="requires-badge">Requires Exterior Wash</span>` : ""}
      <img class="${containClass}" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.label || "")}" loading="lazy" decoding="async">
    </div>
  `;
}

function optionCard(item, selected, action, opts = {}) {
  const cardType = opts.cardType || "qCard--img";
  const hint = opts.hint ?? item.hint ?? "";

  return `
    <button class="qCard ${cardType} ${selected ? "isSel" : ""}" type="button" data-action="${escapeHtml(action)}" data-value="${escapeHtml(item.label)}">
      ${renderMedia(item)}
      <div class="qCardLabel">${escapeHtml(item.displayLabel || item.label)}</div>
      <div class="qCardHint">${escapeHtml(hint)}</div>
    </button>
  `;
}

// Package feature card — IMAGES INTENTIONALLY REMOVED.
// Standard / Deep / Premium cards show only the title, feature list, and price.
function featureCard(pkg, selected, action, priceText) {
  return `
    <button class="qCard qFeatureCard qFeatureCard--noImg ${selected ? "isSel" : ""}" type="button" data-action="${escapeHtml(action)}" data-value="${escapeHtml(pkg.serviceLabel)}">
      <div class="qFeatureCardInner">
        <div class="qFeatureCardTitle">${escapeHtml(pkg.displayLabel || pkg.label)}</div>
        ${pkg.hint ? `<div class="qFeatureCardHint">${escapeHtml(pkg.hint)}</div>` : ""}
        <ul class="qFeatureList">
          ${(pkg.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join("")}
        </ul>
        <div class="qFeaturePrice">${escapeHtml(priceText || "")}</div>
      </div>
    </button>
  `;
}

function selectedChipsHtml() {
  const chips = getSelectedServiceChipData();

  return `
    <div class="qServiceTray">
      <div class="qServiceTrayTop">
        <div class="qServiceTrayTitle">Selected services</div>
        <div class="qServiceTrayHint">You can go back to adjust anything.</div>
      </div>
      <div class="qChips">
        ${
          chips.length
            ? chips.map(chip => `
              <span class="qChip">
                ${escapeHtml(chip.displayLabel)}
                <button type="button" aria-label="Remove ${escapeHtml(chip.baseLabel)}" data-action="remove-service" data-value="${escapeHtml(chip.baseLabel)}">×</button>
              </span>
            `).join("")
            : `<span class="qChipEmpty">No services selected yet.</span>`
        }
      </div>
    </div>
  `;
}

function selectedSummaryPillsHtml(info = computeEstimateInfo()) {
  const chips = [
    quoteState.vehicleType,
    ...getSelectedDisplayServices(),
    quoteState.upkeepFrequency,
    quoteState.routeGroupLabel
  ].filter(Boolean);

  return `
    <div class="qEstimatePills">
      ${chips.map(chip => `<span class="qPill">${escapeHtml(chip)}</span>`).join("")}
      ${info?.savings ? `<span class="qPill">Bundle savings: -${formatMoney(info.savings)}</span>` : ""}
      ${info?.couponDiscount ? `<span class="qPill">Coupon: -${formatMoney(info.couponDiscount)}</span>` : ""}
    </div>
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
  if (step === "service") renderServiceStep();
  if (step === "interiorPackage") renderInteriorPackageStep();
  if (step === "exteriorPackage") renderExteriorPackageStep();
  if (step === "paintCorrectionPackage") renderPaintCorrectionPackageStep();
  if (step === "ceramicPackage") renderCeramicPackageStep();
  if (step === "upkeepFrequency") renderUpkeepFrequencyStep();
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
  // No subtitle — auto-advance step, just the question and the cards.
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">What type of vehicle do you need detailed?</h3>
    <div class="qCards qCards--vehicle2x2 qCards--big">
      ${vehicleTypes.map(v => optionCard(v, quoteState.vehicleType === v.label, "select-vehicle", { cardType: "qCard--vehicle" })).join("")}
    </div>
  `;
}

function renderServiceCategoryStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">What do you need cleaned?</h3>
    <div class="qCards qCards--scroll qCards--big">
      ${serviceCategories.map(c => optionCard(c, quoteState.serviceCategory === c.label, "select-category", { cardType: "qCard--img qCard--square" })).join("")}
    </div>
  `;
}

function renderServiceStep() {
  const services = getServicesForCategory();

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your service</h3>
    <p class="qStepSub">Select what you want included. You can choose more than one.</p>
    ${selectedChipsHtml()}
    <div class="qCards qCards--scroll qCards--big">
      ${services.map(s => optionCard(s, quoteState.services.includes(s.label), "toggle-service", { cardType: "qCard--servicePick qCard--img qCard--square" })).join("")}
    </div>
  `;
}

function renderInteriorPackageStep() {
  // No "Selected services" chip tray, no images on cards.
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your interior package</h3>
    <p class="qStepSub">Pick the level that best matches the condition of the inside of the vehicle.</p>
    <div class="qCards qCards--scroll qCards--big">
      ${interiorPackages.map(pkg => {
        const price = priceForVehicle(INTERIOR_DETAIL_PRICES, pkg.serviceLabel);
        const high = Number.isFinite(price) ? price + INTERIOR_DISPLAY_RANGE_ADD : null;
        const priceText = Number.isFinite(price) ? `${formatMoney(price)} - ${formatMoney(high)}` : "Select vehicle first";
        return featureCard(pkg, quoteState.interiorPackage === pkg.serviceLabel, "select-interior-package", priceText);
      }).join("")}
    </div>
  `;
}

function renderExteriorPackageStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your exterior package</h3>
    <p class="qStepSub">Pick the outside detail level you want.</p>
    <div class="qCards qCards--scroll qCards--big">
      ${exteriorPackages.map(pkg => {
        const price = priceForVehicle(EXTERIOR_DETAIL_PRICES, pkg.serviceLabel);
        const high = Number.isFinite(price) ? price + EXTERIOR_DISPLAY_RANGE_ADD : null;
        const priceText = Number.isFinite(price) ? `${formatMoney(price)} - ${formatMoney(high)}` : "Select vehicle first";
        return featureCard(pkg, quoteState.exteriorPackage === pkg.serviceLabel, "select-exterior-package", priceText);
      }).join("")}
    </div>
  `;
}

function renderPaintCorrectionPackageStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your paint correction option</h3>
    <p class="qStepSub">Paint correction helps reduce swirls and improve gloss.</p>
    <div class="qCards qCards--scroll qCards--big">
      ${paintCorrectionPackages.map(pkg => {
        const price = priceForVehicle(PAINT_CORRECTION_PRICES, pkg.serviceLabel);
        const high = Number.isFinite(price) ? price + EXTERIOR_DISPLAY_RANGE_ADD : null;
        const hint = Number.isFinite(price) ? `${pkg.hint}\n${formatMoney(price)} - ${formatMoney(high)}` : pkg.hint;
        return optionCard(pkg, quoteState.paintCorrectionPackage === pkg.serviceLabel, "select-paint-package", { cardType: "qCard--condition qCard--img qCard--square", hint });
      }).join("")}
    </div>
  `;
}

function renderCeramicPackageStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Choose your ceramic coating option</h3>
    <p class="qStepSub">Ceramic pricing starts here and may change after vehicle condition is reviewed.</p>
    <div class="qCards qCards--scroll qCards--big">
      ${ceramicPackages.map(pkg => optionCard(pkg, quoteState.ceramicPackage === pkg.serviceLabel, "select-ceramic-package", { cardType: "qCard--condition qCard--img qCard--square" })).join("")}
    </div>
  `;
}

function renderUpkeepFrequencyStep() {
  quoteBody.innerHTML = `
    <h3 class="qStepTitle">How often do you want upkeep?</h3>
    <p class="qStepSub">Upkeep plans are for keeping the vehicle clean after the first detail.</p>
    <div class="qHearWrap">
      <div class="qHearGrid">
        ${upkeepFrequencies.map(freq => `
          <button class="qHearBtn ${quoteState.upkeepFrequency === freq.label ? "isSel" : ""}" type="button" data-action="select-upkeep" data-value="${escapeHtml(freq.label)}">
            <span class="qHearLeft">
              <span class="qHearLabel">${escapeHtml(freq.label)}</span>
              <span class="qHearHint">${escapeHtml(freq.hint)}</span>
            </span>
            <span class="qHearRight">
              <span class="qHearPill">Select</span>
              <span class="qHearCheck" aria-hidden="true"></span>
            </span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderContactStep() {
  const errors = quoteState.showContactErrors ? (quoteState.contactErrors || {}) : {};

  const fieldClass = name => `qInputField ${errors[name] ? "hasError" : ""} ${quoteState[name] ? "isFilled" : ""}`;

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Where should we send your quote?</h3>
    <p class="qStepSub">We’ll only use this for your quote, appointment request, and follow-up.</p>

    <div class="qContactGrid">
      <div class="${fieldClass("name")}">
        <span class="qInputIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
        <input id="qName" autocomplete="name" value="${escapeHtml(quoteState.name)}" placeholder=" " required>
        <label for="qName">Full name <span class="qReq">*</span></label>
        ${errors.name ? `<div class="qFieldError">${escapeHtml(errors.name)}</div>` : ""}
      </div>

      <div class="${fieldClass("phone")}">
        <span class="qInputIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </span>
        <input id="qPhone" autocomplete="tel" inputmode="tel" value="${escapeHtml(quoteState.phone)}" placeholder=" " required>
        <label for="qPhone">Phone number <span class="qReq">*</span></label>
        ${errors.phone ? `<div class="qFieldError">${escapeHtml(errors.phone)}</div>` : ""}
      </div>

      <div class="${fieldClass("email")}">
        <span class="qInputIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </span>
        <input id="qEmail" type="email" autocomplete="email" inputmode="email" value="${escapeHtml(quoteState.email)}" placeholder=" " required>
        <label for="qEmail">Email address <span class="qReq">*</span></label>
        ${errors.email ? `<div class="qFieldError">${escapeHtml(errors.email)}</div>` : ""}
      </div>

      <div class="${fieldClass("city")} qInputField--select">
        <span class="qInputIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
        <select id="qCity" required>
          <option value="" ${!quoteState.city ? "selected" : ""}>Choose your closest city</option>
          ${serviceCities.map(city => `<option value="${escapeHtml(city)}" ${quoteState.city === city ? "selected" : ""}>${escapeHtml(city)}</option>`).join("")}
        </select>
        <label for="qCity">Closest city <span class="qReq">*</span></label>
        ${errors.city ? `<div class="qFieldError">${escapeHtml(errors.city)}</div>` : ""}
      </div>

      <div class="qInputField qInputField--full ${quoteState.notes ? "isFilled" : ""}">
        <span class="qInputIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
        </span>
        <input id="qNotes" value="${escapeHtml(quoteState.notes)}" placeholder=" ">
        <label for="qNotes">Notes <span class="qOpt">(optional)</span></label>
      </div>
    </div>

    <input id="qCompany" tabindex="-1" autocomplete="off" value="${escapeHtml(quoteState.honeypot)}" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true">

    ${quoteState.leadEmailSending ? `<div class="qStatus">Sending your quote details...</div>` : ""}
  `;
}

// ✅ ESTIMATE STEP — premium, no pill bubbles, white Apply button.
function renderEstimateStep() {
  const info = syncEstimateState();
  const estimateText = formatEstimateDisplay(info);

  const oldEstimateText = info?.couponDiscount
    ? Number(info.highBeforeCoupon) > Number(info.lowBeforeCoupon)
      ? `${formatMoney(info.lowBeforeCoupon)} - ${formatMoney(info.highBeforeCoupon)}`
      : formatMoney(info.lowBeforeCoupon)
    : "";

  const couponApplied = !!quoteState.couponDiscount;

  quoteBody.innerHTML = `
    <div class="qEstimateHero">
      <div class="qEstimateEyebrow">Your Estimate</div>
      <h3 class="qEstimateHeroTitle">Your estimate is ready</h3>
      <p class="qEstimateHeroSub">Based on your vehicle and selected service. Final price may vary depending on vehicle condition — we'll always confirm before starting.</p>

      <div class="qEstimateHeroPrice">
        ${oldEstimateText ? `<div class="qEstimateOld">${escapeHtml(oldEstimateText)}</div>` : ""}
        <div class="qEstimateBig">${escapeHtml(estimateText)}</div>
      </div>

      ${info?.savings || info?.couponDiscount ? `
        <div class="qEstimateSavings">
          ${info?.savings ? `<span class="qSaveLine">Bundle savings <strong>−${formatMoney(info.savings)}</strong></span>` : ""}
          ${info?.couponDiscount ? `<span class="qSaveLine">Coupon <strong>−${formatMoney(info.couponDiscount)}</strong></span>` : ""}
        </div>
      ` : ""}
    </div>

    <div class="qCouponBox">
      <div class="qCouponHeader">
        <div class="qCouponTitle">Have a coupon code?</div>
        <div class="qCouponSub">Enter it below before continuing.</div>
      </div>

      <div class="qCouponRow">
        <input
          id="qCoupon"
          class="qCouponInput"
          value="${escapeHtml(quoteState.couponCode)}"
          placeholder="Enter code"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        >
        <button class="qCouponBtn ${couponApplied ? "isApplied" : ""}" type="button" data-action="apply-coupon">
          ${couponApplied ? "Applied" : "Apply"}
        </button>
      </div>

      ${quoteState.couponMessage ? `<div class="qCouponMsg ${couponApplied ? "isOk" : "isErr"}">${escapeHtml(quoteState.couponMessage)}</div>` : ""}
    </div>

    <p class="qEstimateFinePrint">Heavier stains, excessive pet hair, or unusual vehicle condition may affect final pricing.</p>
  `;
}

function renderAppointmentStep() {
  const selectedDateSlots = selectedCalendarDate
    ? appointmentSlots.filter(slot => slot.date === selectedCalendarDate)
    : [];

  const key = getSlotsLoadKey();
  const shouldStartFirstLoad = !appointmentSlotsLoading && appointmentSlotsLoadedKey !== key;
  const showLoading = appointmentSlotsLoading || shouldStartFirstLoad;

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Pick your appointment time</h3>

    <div class="qCalWrap">
      <div class="qCalTopRow">
        <div class="qCalTz">Local time${quoteState.routeGroupLabel ? ` · ${escapeHtml(quoteState.routeGroupLabel)}` : ""}</div>
      </div>

      <div class="qLoadBar ${showLoading ? "isOn" : ""}"><span class="qLoadBarFill"></span></div>

      ${showLoading ? `<div class="qStatus">Loading available times...</div>` : renderCalendarHtml(selectedDateSlots)}
    </div>
  `;

  if (shouldStartFirstLoad) {
    setTimeout(() => maybeLoadAppointmentSlots(), 0);
  } else {
    maybeLoadAppointmentSlots();
  }
}

function renderCalendarHtml(selectedDateSlots) {
  if (!appointmentSlots.length && !appointmentSlotsLoading) {
    return `
      <div class="qNoTimes">
        <div class="qNoTimesIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="qNoTimesTitle">No open times right now</div>
        <button class="qNoTimesBtn" type="button" data-action="reload-slots">Try again</button>
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
        <div class="qTimesTitle">${selectedCalendarDate ? `Available times for ${escapeHtml(formatDateNice(selectedCalendarDate))}` : "Choose an available date"}</div>

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
  const hasAddressError = !!quoteState.addressError;

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Where should we come for the detail?</h3>

    <div class="qAddressCard">
      <div class="qAddressIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>

      <div class="qInputField qInputField--full ${quoteState.address ? "isFilled" : ""} ${hasAddressError ? "hasError" : ""}">
        <input id="qAddress" autocomplete="street-address" value="${escapeHtml(quoteState.address)}" placeholder=" " required>
        <label for="qAddress">Street address <span class="qReq">*</span></label>
        ${hasAddressError ? `<div class="qFieldError">${escapeHtml(quoteState.addressError)}</div>` : ""}
      </div>

      <p class="qAddressHint">Please choose a location with enough room for mobile detailing and access to the vehicle.</p>
    </div>
  `;
}

function getConfirmEditInputType(field) {
  if (field === "email") return "email";
  if (field === "phone") return "tel";
  return "text";
}

function applyConfirmEdit(field, value) {
  const clean = String(value || "").trim();

  if (field === "name") quoteState.name = clean;
  if (field === "phone") quoteState.phone = clean;
  if (field === "email") quoteState.email = clean;
  if (field === "address") {
    quoteState.address = clean;
    quoteState.addressError = clean ? "" : "Required";
  }

  if (["name", "phone", "email"].includes(field)) {
    quoteState.leadEmailSent = false;
    quoteState.leadEmailSignature = "";
  }
}

function renderEditableSummaryRow(label, field, value) {
  const safeLabel = escapeHtml(label);
  const safeField = escapeHtml(field);
  const safeValue = escapeHtml(value || "");

  if (confirmEditingField === field) {
    return `
      <div class="qSummaryRow">
        <div class="qSummaryLabel">${safeLabel}</div>
        <div class="qSummaryValue" style="display:flex;gap:8px;align-items:center;">
          <input
            class="qSummaryEditInput"
            data-confirm-input="${safeField}"
            type="${getConfirmEditInputType(field)}"
            value="${safeValue}"
            style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(0,0,0,.14);font:inherit;font-weight:700;outline:none;"
          >
          <button
            type="button"
            data-action="save-confirm-edit"
            data-field="${safeField}"
            aria-label="Save ${safeLabel}"
            style="width:38px;height:38px;border-radius:999px;border:1px solid rgba(214,178,94,.65);background:rgba(214,178,94,.14);color:#111;font-weight:1000;cursor:pointer;flex:0 0 auto;"
          >✓</button>
        </div>
      </div>
    `;
  }

  return value ? `
    <div class="qSummaryRow">
      <div class="qSummaryLabel">${safeLabel}</div>
      <div class="qSummaryValue" style="display:flex;gap:10px;align-items:center;justify-content:space-between;">
        <span>${safeValue}</span>
        <button
          type="button"
          data-action="edit-confirm-field"
          data-field="${safeField}"
          aria-label="Edit ${safeLabel}"
          style="width:34px;height:34px;border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#fff;color:rgba(0,0,0,.68);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
      </div>
    </div>
  ` : "";
}

function renderConfirmStep() {
  const selectedServices = getSelectedDisplayServices();
  const info = syncEstimateState();

  const summaryRow = (label, value) => value ? `
    <div class="qSummaryRow">
      <div class="qSummaryLabel">${escapeHtml(label)}</div>
      <div class="qSummaryValue">${escapeHtml(value)}</div>
    </div>
  ` : "";

  quoteBody.innerHTML = `
    <h3 class="qStepTitle">Review your request</h3>

    <div class="qConfirmHero">
      <div class="qConfirmHeroLabel">Estimated total</div>
      <div class="qConfirmHeroPrice">${escapeHtml(formatEstimateDisplay(info))}</div>
    </div>

    <div class="qSummaryGroup">
      <div class="qSummaryGroupTitle">Customer</div>
      ${renderEditableSummaryRow("Name", "name", quoteState.name)}
      ${renderEditableSummaryRow("Phone", "phone", quoteState.phone)}
      ${renderEditableSummaryRow("Email", "email", quoteState.email)}
      ${summaryRow("City", quoteState.city)}
    </div>

    <div class="qSummaryGroup">
      <div class="qSummaryGroupTitle">Appointment</div>
      ${summaryRow("Preferred time", quoteState.slotLabel)}
      ${renderEditableSummaryRow("Address", "address", quoteState.address)}
      ${summaryRow("Vehicle", quoteState.vehicleType)}
      ${summaryRow("Service", selectedServices.join(", "))}
      ${quoteState.upkeepFrequency ? summaryRow("Frequency", quoteState.upkeepFrequency) : ""}
      ${quoteState.couponCode && quoteState.couponDiscount ? summaryRow("Coupon", `${normalizeCoupon(quoteState.couponCode)} (−${formatMoney(quoteState.couponDiscount)})`) : ""}
      ${quoteState.notes ? summaryRow("Notes", quoteState.notes) : ""}
    </div>

    ${quoteState.bookingError ? `<div class="qInlineError">${escapeHtml(quoteState.bookingError)}</div>` : ""}
  `;
}

function renderDoneStep() {
  const summaryRow = (label, value) => value ? `
    <div class="qSummaryRow">
      <div class="qSummaryLabel">${escapeHtml(label)}</div>
      <div class="qSummaryValue">${escapeHtml(value)}</div>
    </div>
  ` : "";

  quoteBody.innerHTML = `
    <div class="qDonePage">
      <div class="qDoneCheck" aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none">
          <circle class="qDoneCheckCircle" cx="26" cy="26" r="23" stroke="currentColor" stroke-width="3"/>
          <path class="qDoneCheckMark" d="M14 27l8 8 16-18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>

      <div class="qDoneBadge">Request received</div>
      <h3 class="qDoneTitle">You're all set</h3>
      <p class="qDoneText">Your appointment request was sent. We'll confirm shortly by text or email.</p>

      <div class="qSummaryGroup qSummaryGroup--done">
        <div class="qSummaryGroupTitle">Your request</div>
        ${summaryRow("Name", quoteState.name)}
        ${summaryRow("Preferred time", quoteState.slotLabel)}
        ${summaryRow("Address", quoteState.address)}
        ${summaryRow("Service", getSelectedDisplayServices().join(", "))}
        ${summaryRow("Estimate", formatEstimateDisplay())}
        ${quoteState.couponCode && quoteState.couponDiscount ? summaryRow("Coupon", normalizeCoupon(quoteState.couponCode)) : ""}
      </div>

      <p class="qDoneFootNote">Final price may vary based on vehicle condition. We'll confirm before starting.</p>
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
    if (quoteState.contactErrors?.name && e.target.value.trim()) {
      delete quoteState.contactErrors.name;
      e.target.closest(".qInputField")?.classList.remove("hasError");
      e.target.parentElement?.querySelector(".qFieldError")?.remove();
    }
    updateNav();
  });
  if (qPhone) qPhone.addEventListener("input", e => {
    quoteState.phone = e.target.value;
    if (quoteState.contactErrors?.phone && e.target.value.replace(/\D/g, "").length >= 10) {
      delete quoteState.contactErrors.phone;
      e.target.closest(".qInputField")?.classList.remove("hasError");
      e.target.parentElement?.querySelector(".qFieldError")?.remove();
    }
    updateNav();
  });
  if (qEmail) qEmail.addEventListener("input", e => {
    quoteState.email = e.target.value;
    if (quoteState.contactErrors?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value.trim())) {
      delete quoteState.contactErrors.email;
      e.target.closest(".qInputField")?.classList.remove("hasError");
      e.target.parentElement?.querySelector(".qFieldError")?.remove();
    }
    updateNav();
  });

  if (qCity) qCity.addEventListener("change", e => {
    quoteState.city = e.target.value;
    syncRouteGroupFromCity();
    clearAppointmentSelection();
    if (quoteState.contactErrors?.city && e.target.value) {
      delete quoteState.contactErrors.city;
      e.target.closest(".qInputField")?.classList.remove("hasError");
      e.target.parentElement?.querySelector(".qFieldError")?.remove();
    }
    updateNav();
  });

  if (qNotes) qNotes.addEventListener("input", e => { quoteState.notes = e.target.value; });
  if (qCompany) qCompany.addEventListener("input", e => { quoteState.honeypot = e.target.value; });

  if (qCoupon) {
    qCoupon.addEventListener("input", e => {
      quoteState.couponCode = e.target.value;
      quoteState.couponMessage = "";
    });
    qCoupon.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyCouponFromField();
        render();
      }
    });
  }

  if (qAddress) qAddress.addEventListener("input", e => {
    quoteState.address = e.target.value;
    if (quoteState.addressError && e.target.value.trim()) {
      quoteState.addressError = "";
      e.target.closest(".qInputField")?.classList.remove("hasError");
      e.target.parentElement?.querySelector(".qFieldError")?.remove();
    }
    updateNav();
  });

  quoteBody.querySelectorAll("[data-confirm-input]").forEach(input => {
    const saveConfirmInput = () => {
      const field = input.dataset.confirmInput || "";
      applyConfirmEdit(field, input.value);
      confirmEditingField = "";
      render();
    };

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveConfirmInput();
      }
    });

    input.addEventListener("blur", () => {
      saveConfirmInput();
    });
  });
}

function handleStepAction(e) {
  const target = e.currentTarget;
  const action = target.dataset.action;
  const value = target.dataset.value || "";

  // ✅ AUTO-ADVANCE on vehicle pick
  if (action === "select-vehicle") {
    quoteState.vehicleType = value;
    clearEstimateDependentState();
    stepIndex = nextActiveStepIndex(stepIndex);
    render();
    return;
  }

  // ✅ AUTO-ADVANCE on category pick (Interior / Exterior / Both)
  if (action === "select-category") {
    quoteState.serviceCategory = value;
    quoteState.services = [];
    clearEstimateDependentState();
    stepIndex = nextActiveStepIndex(stepIndex);
    render();
    return;
  }

  if (action === "toggle-service") {
    toggleService(value);
    render();
    return;
  }

  if (action === "remove-service") {
    quoteState.services = quoteState.services.filter(s => s !== value);
    resetPackageSelectionsIfNeeded();
    clearEstimateDependentState();
    render();
    return;
  }

  // No auto-advance — user selects, then hits Continue.
  if (action === "select-interior-package") {
    quoteState.interiorPackage = value;
    clearEstimateDependentState();
    render();
    return;
  }

  if (action === "select-exterior-package") {
    quoteState.exteriorPackage = value;
    clearEstimateDependentState();
    render();
    return;
  }

  if (action === "select-paint-package") {
    quoteState.paintCorrectionPackage = paintCorrectionPackages.find(p => p.label === value)?.serviceLabel || value;
    clearEstimateDependentState();
    render();
    return;
  }

  if (action === "select-ceramic-package") {
    quoteState.ceramicPackage = ceramicPackages.find(p => p.label === value)?.serviceLabel || value;
    clearEstimateDependentState();
    render();
    return;
  }

  if (action === "select-upkeep") {
    quoteState.upkeepFrequency = value;
    clearEstimateDependentState();
    render();
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
    const dir = action === "month-next" ? 1 : -1;
    calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + dir, 1);
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

  if (action === "edit-confirm-field") {
    confirmEditingField = target.dataset.field || "";
    render();
    setTimeout(() => {
      const input = quoteBody?.querySelector(`[data-confirm-input="${confirmEditingField}"]`);
      input?.focus?.();
      input?.select?.();
    }, 30);
    return;
  }

  if (action === "save-confirm-edit") {
    const field = target.dataset.field || "";
    const input = quoteBody?.querySelector(`[data-confirm-input="${field}"]`);
    applyConfirmEdit(field, input?.value || "");
    confirmEditingField = "";
    render();
    return;
  }
}

function toggleService(label) {
  if (!label) return;

  if (quoteState.services.includes(label)) {
    quoteState.services = quoteState.services.filter(s => s !== label);
  } else {
    quoteState.services = [...quoteState.services, label];
  }

  if ((label === "Paint Correction" || label === "Ceramic Coating") && !quoteState.services.includes("Exterior Wash")) {
    quoteState.services.unshift("Exterior Wash");
  }

  resetPackageSelectionsIfNeeded();
  clearEstimateDependentState();
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
    quoteState.couponMessage = "That code isn't valid.";
    return;
  }

  quoteState.couponMessage = `Code applied. You saved ${formatMoney(quoteState.couponDiscount)}.`;
}

function clearEstimateDependentState() {
  quoteState.estimateLow = "";
  quoteState.estimateHigh = "";
  quoteState.estimateIsStartingAt = false;
  quoteState.leadEmailSent = false;
  quoteState.leadEmailSignature = "";
  quoteState.bookingError = "";
  quoteState.addressError = "";
  confirmEditingField = "";
  clearAppointmentSelection();
}

function clearAppointmentSelection() {
  quoteState.slotId = "";
  quoteState.slotSourceId = "";
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

  // Don't retry the same key automatically — only on explicit user action (force=true).
  // This prevents the infinite "Try again" flashing loop when the request errors out.
  if (!force && appointmentSlotsLoadedKey === key) return;
  if (appointmentSlotsLoading) return;

  appointmentSlotsLoading = true;
  appointmentSlotsError = "";
  updateNav();

  try {
    // POST with text/plain matches the same pattern used by sendLeadNotificationIfNeeded()
    // and submitAppointmentRequest() — both of which are confirmed working. Apps Script
    // treats text/plain as a "simple" request, dodging the CORS preflight that breaks
    // arbitrary GETs against script.google.com.
    const scriptUrl = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;
    const payload = {
      action: "slots",
      city: quoteState.city,
      routeGroup: quoteState.routeGroup,
      t: Date.now()
    };

    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();

    if (!data?.ok) {
      throw new Error(data?.message || data?.error || "Could not load times.");
    }

    // Build slots with GUARANTEED-UNIQUE keys so clicking one time doesn't highlight all of them.
    appointmentSlots = (data.slots || [])
      .filter(slot => slot?.id)
      .map((slot, index) => {
        const date = normalizeDateValue(slot.date || slot.id);
        const time = normalizeTimeValue(slot.time || slot.id);
        const sourceId = String(slot.id || "");
        return {
          id: `${date}_${time}_${sourceId}_${index}`,
          sourceId,
          label: String(slot.label || slot.id || ""),
          date,
          time,
          timeLabel: formatTimeLabel(slot.label || slot.time || slot.id)
        };
      })
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
    // CRITICAL: mark this key as "tried" so we don't auto-retry on every render.
    // User must click "Try again" (which calls force=true) to retry.
    appointmentSlotsLoadedKey = key;
  } finally {
    appointmentSlotsLoading = false;
    if (steps[stepIndex] === "appointment") render();
  }
}

function selectSlot(slotId) {
  const slot = appointmentSlots.find(s => s.id === slotId);
  if (!slot) return;

  quoteState.slotId = slot.id;
  quoteState.slotSourceId = slot.sourceId || slot.id;
  quoteState.slotLabel = slot.label || `${formatDateNice(slot.date)} at ${slot.timeLabel}`;
  quoteState.slotDate = slot.date;
  quoteState.slotTime = slot.time;
}

// -------------------------
// PAYLOAD + SUBMIT
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
    quoteState.upkeepFrequency,
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
    paintCorrectionPackage: quoteState.paintCorrectionPackage,
    ceramicPackage: quoteState.ceramicPackage,
    upkeepFrequency: quoteState.upkeepFrequency,

    estimateLow: info?.low ?? "",
    estimateHigh: info?.high ?? "",
    estimateDisplay: formatEstimateDisplay(info),
    estimateIsStartingAt: !!info?.hasStartingAt,
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
    // Send the ORIGINAL slot id to Apps Script (not the composite uid we use locally to dedupe UI selection).
    payload.slotId = quoteState.slotSourceId || quoteState.slotId;
    payload.slotUid = quoteState.slotId;
    payload.slotLabel = quoteState.slotLabel;
    payload.slotDate = quoteState.slotDate;
    payload.slotTime = quoteState.slotTime;
  }

  return payload;
}

async function sendLeadNotificationIfNeeded({ silent = false } = {}) {
  if (quoteState.honeypot) return { ok: true, skipped: true };

  if (!quoteState.leadId) quoteState.leadId = makeId();

  const signature = buildLeadSignature();

  if (quoteState.leadEmailSent && quoteState.leadEmailSignature === signature) {
    return { ok: true, skipped: true };
  }

  quoteState.leadEmailSending = true;
  if (!silent) render();

  try {
    const payload = buildPayload(false);

    const res = await fetch(window.SCRIPT_URL || DEFAULT_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data?.ok && !data?.emailSent) {
      throw new Error(data?.message || data?.error || data?.emailError || "Lead email failed.");
    }

    quoteState.leadEmailSent = true;
    quoteState.leadEmailSignature = signature;

    if (data?.leadId) quoteState.leadId = data.leadId;

    return data;
  } catch (err) {
    console.warn("Lead notification failed:", err);
    return { ok: false, error: err?.message || String(err) };
  } finally {
    quoteState.leadEmailSending = false;
    if (!silent && steps[stepIndex] === "contact") render();
    if (silent) updateNav();
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
      headers: { "Content-Type": "text/plain;charset=utf-8" },
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

  // Special-case: validate contact form and show inline errors instead of silent disable.
  if (step === "contact") {
    const errors = validateContactStep();
    quoteState.contactErrors = errors;

    if (Object.keys(errors).length || !quoteState.routeGroup) {
      quoteState.showContactErrors = true;
      if (!quoteState.routeGroup && !errors.city) {
        quoteState.contactErrors.city = "Please choose your closest city";
      }
      render();

      // Scroll the first error into view on mobile.
      const firstErr = quoteBody?.querySelector(".qFieldError");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    quoteState.showContactErrors = false;
    quoteState.contactErrors = {};

    // Move straight to the estimate. The lead email sends quietly in the background.
    stepIndex = nextActiveStepIndex(stepIndex);
    render();
    sendLeadNotificationIfNeeded({ silent: true });
    return;
  }

  if (step === "address") {
    if (!String(quoteState.address || "").trim()) {
      quoteState.addressError = "Required";
      render();
      const firstErr = quoteBody?.querySelector(".qFieldError");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    quoteState.addressError = "";
  }

  if (!canContinue()) {
    updateNav();
    return;
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
    paintCorrectionPackage: "",
    ceramicPackage: "",

    upkeepFrequency: "",

    estimateLow: "",
    estimateHigh: "",
    estimateIsStartingAt: false,

    couponCode: "",
    couponDiscount: 0,
    couponMessage: "",

    slotId: "",
    slotSourceId: "",
    slotLabel: "",
    slotDate: "",
    slotTime: "",

    address: "",
    addressError: "",

    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",

    routeGroup: "",
    routeGroupLabel: "",

    leadId: "",
    leadEmailSent: false,
    leadEmailSignature: "",
    leadEmailSending: false,

    submittingBooking: false,
    bookingError: "",

    contactErrors: {},
    showContactErrors: false,

    paymentMode: "after",
    paymentStatus: "appointment_requested",
    paymentAmountCharged: 0,
    squarePaymentId: "",

    honeypot: ""
  });

  appointmentSlots = [];
  appointmentSlotsLoading = false;
  appointmentSlotsLoadedKey = "";
  appointmentSlotsError = "";
  selectedCalendarDate = "";
  calendarMonthDate = null;
  stepIndex = 0;
  confirmEditingField = "";
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
  quoteModal.style.background = "rgba(0,0,0,.45)";
  quoteModal.style.backdropFilter = "blur(2px)";
  quoteModal.style.webkitBackdropFilter = "blur(2px)";

  document.body.style.overflow = "hidden";

  styleQuoteCloseButtons();

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
  quoteModal.style.background = "";
  quoteModal.style.backdropFilter = "";
  quoteModal.style.webkitBackdropFilter = "";

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
    modal.style.background = "";
    modal.style.backdropFilter = "";
    modal.style.webkitBackdropFilter = "";
  }
};

// -------------------------
// UI PATCHES
// -------------------------

function injectQuoteWizardStylePatches() {
  if (document.getElementById("quote-wizard-js-style-patches")) return;

  const style = document.createElement("style");
  style.id = "quote-wizard-js-style-patches";
  style.textContent = `
    [data-quote-modal]:not([hidden]) {
      background: rgba(0,0,0,.52) !important;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    [data-quote-close] {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      min-height: 40px !important;
      padding: 0 !important;
      border-radius: 14px !important;
      border: 1px solid rgba(0,0,0,.14) !important;
      background: #fff !important;
      color: #111 !important;
      box-shadow: 0 10px 26px rgba(0,0,0,.08) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      font-size: 0 !important;
      font-weight: 900 !important;
      cursor: pointer !important;
      appearance: none !important;
      -webkit-appearance: none !important;
    }

    [data-quote-close]::before {
      content: "×";
      display: block;
      font-size: 22px;
      font-weight: 900;
      line-height: 1;
      transform: translateY(-1px);
    }

    [data-quote-close]:hover {
      background: #f7f7f7 !important;
      border-color: rgba(0,0,0,.22) !important;
    }

    [data-quote-close]:focus-visible {
      outline: none !important;
      box-shadow: 0 0 0 4px rgba(214,178,94,.22), 0 10px 26px rgba(0,0,0,.08) !important;
      border-color: rgba(214,178,94,.72) !important;
    }

    .qInputField.hasError .qInputIcon {
      top: 28px !important;
      transform: translateY(-50%) !important;
    }

    .qInputField.hasError label {
      top: 28px !important;
      transform: translateY(-50%) !important;
    }

    .qInputField.hasError input:focus + label,
    .qInputField.hasError input:not(:placeholder-shown) + label,
    .qInputField.hasError.isFilled label,
    .qInputField.hasError.qInputField--select label {
      top: 10px !important;
      transform: translateY(0) !important;
    }
  `;

  document.head.appendChild(style);
}

function styleQuoteCloseButtons() {
  quoteCloseBtns.forEach(btn => {
    btn.removeAttribute("aria-hidden");
    btn.removeAttribute("tabindex");
    btn.setAttribute("aria-label", "Close quote form");
    btn.style.display = "inline-flex";
  });
}

function preventBackdropClose() {
  if (!quoteModal || quoteModal.dataset.backdropCloseLocked === "true") return;

  quoteModal.dataset.backdropCloseLocked = "true";

  ["click", "mousedown", "mouseup", "touchstart", "touchend"].forEach(eventName => {
    quoteModal.addEventListener(eventName, e => {
      if (e.target === quoteModal) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
}

// -------------------------
// INIT
// -------------------------

function initQuoteWizard() {
  injectQuoteWizardStylePatches();
  preventBackdropClose();
  styleQuoteCloseButtons();

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
    btn.removeAttribute("aria-hidden");
    btn.removeAttribute("tabindex");
    btn.style.display = "inline-flex";
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
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

  // Click-outside, X-close, and Escape-close are disabled so users stay inside the quote flow.
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && quoteModal && !quoteModal.hasAttribute("hidden")) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

initQuoteWizard();
