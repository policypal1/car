// -------------------------
// QUOTE WIZARD (Flow v7.1)
// -------------------------
// Vehicle -> Category -> Service -> Conditions -> HeardAbout -> Estimate -> Calendar -> Contact -> Done
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
  service: "",

  interiorCondition: "",
  exteriorCondition: "",

  heardAbout: "",

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
  "heardAbout",
  "estimate",
  "appointment",
  "contact",
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

// ✅ Services (Exterior Wash uses EXACT image you demanded)
const servicesAll = [
  { label: "Interior Detail", category: "Interior", img: "./63eaaf7a6f6b7f11ccae99f6_car-detailing-houston-1.jpg" },

  // ✅ command: Exterior Wash uses ONLY this image
  { label: "Exterior Wash", category: "Exterior", img: "./63eaaf7a6f6b7f11ccae99f6_car-detailing-houston-1.jpg" },

  { label: "Upkeep Plan", category: "Both", img: "./img_6480.webp" },

  // ✅ command: pre-wash indicator should NOT change layout -> use small badge over image
  { label: "Ceramic Coating", category: "Exterior", img: "./2626cb4b-d7f8-4cb3-b79b-be682b3b9112.png", prewash: true },
  { label: "Paint Correction", category: "Exterior", img: "./bee.jpg", prewash: true }
];

const interiorConditions = [
  { label: "Light", hint: "Mostly clean • quick refresh", img: "./IMG_2915.jpg" },
  { label: "Normal", hint: "Daily driver • solid reset", img: "./IMG_2916.jpg" },
  { label: "Heavy", hint: "Stains/pet hair • deep work", img: "./dirty-car-complete-with-moldy-carpets-v0-nb2pbgkkdalb1.png" }
];

// ✅ command: ONLY Normal changes to IMG_2910.jpg. Light + Heavy revert to original.
const exteriorConditions = [
  { label: "Light", hint: "", img: "./looks-dirty-even-after-wash-v0-0v8lqgjivccf1.webp" },
  { label: "Normal", hint: "", img: "./IMG_2910.jpg" },
  { label: "Heavy", hint: "", img: "./dirty-car.jpg" }
];

const heardAboutOptions = [
  { label: "Returning Client", hint: "Welcome back" },
  { label: "Family / Friend", hint: "Referral" },
  { label: "Social Media", hint: "Instagram / TikTok" },
  { label: "Google Search", hint: "Maps / Search" },
  { label: "Other", hint: "Another source" }
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
  "Ceramic Coating": {
    Small: [450, 900],
    Medium: [550, 1100],
    Large: [650, 1400],
    Truck: [650, 1400]
  },
  "Paint Correction": {
    Small: [350, 800],
    Medium: [450, 950],
    Large: [550, 1200],
    Truck: [550, 1200]
  },
  "Upkeep Plan": {
    Small: [90, 160],
    Medium: [110, 190],
    Large: [130, 220],
    Truck: [130, 240]
  }
};

// -------------------------
// FLOW HELPERS
// -------------------------
function serviceRequiresInteriorCondition() {
  if (quoteState.service === "Upkeep Plan") return true;
  if (quoteState.service === "Ceramic Coating" || quoteState.service === "Paint Correction") return false;
  return (
    quoteState.serviceCategory === "Interior" ||
    quoteState.serviceCategory === "Interior + Exterior" ||
    quoteState.service === "Interior Detail"
  );
}

function serviceRequiresExteriorCondition() {
  if (quoteState.service === "Upkeep Plan") return true;
  if (quoteState.service === "Interior Detail") return false;
  if (quoteState.service === "Ceramic Coating" || quoteState.service === "Paint Correction") return true;
  return (
    quoteState.serviceCategory === "Exterior" ||
    quoteState.serviceCategory === "Interior + Exterior" ||
    quoteState.service === "Exterior Wash"
  );
}

function stepIsActive(stepName) {
  if (stepName === "conditionInterior") return serviceRequiresInteriorCondition();
  if (stepName === "conditionExterior") return serviceRequiresExteriorCondition();
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

function canContinue() {
  const step = steps[stepIndex];

  if (step === "vehicleType") return !!quoteState.vehicleType;
  if (step === "serviceCategory") return !!quoteState.serviceCategory;
  if (step === "service") return !!quoteState.service;

  if (step === "conditionInterior") return !serviceRequiresInteriorCondition() ? true : !!quoteState.interiorCondition;
  if (step === "conditionExterior") return !serviceRequiresExteriorCondition() ? true : !!quoteState.exteriorCondition;

  if (step === "heardAbout") return !!quoteState.heardAbout;
  if (step === "appointment") return !!quoteState.slotId;

  if (step === "contact") {
    return (
      quoteState.name.trim().length >= 2 &&
      quoteState.phone.trim().length >= 7 &&
      quoteState.email.trim().includes("@") &&
      quoteState.ackDeposit === true
    );
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
  quoteNextBtn.textContent = step === "contact" ? "Finish" : "Continue";
  quoteNextBtn.disabled = !canContinue();
}

function pickAndAdvance(pickFn) {
  pickFn();
  renderStep();
  setTimeout(() => nextStep(true), 80);
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Cards
function imgCard({
  label,
  hint,
  img,
  contain = false,
  zoom = null,
  isSelected = false,
  onClick,
  variant = "",
  badge = "" // ✅ small overlay badge (used for prewash)
}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `qCard qCard--img ${variant}`.trim() + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  const zoomStyle = typeof zoom === "number" ? `style="--carZoom:${zoom}"` : "";

  btn.innerHTML = `
    <div class="qCardMedia" ${zoomStyle}>
      ${badge ? `<span class="qCardBadge" aria-hidden="true">${escapeHtml(badge)}</span>` : ""}
      <img class="${contain ? "isContain" : ""}" src="${escapeHtml(img)}" alt="${escapeHtml(label)}" loading="lazy" />
    </div>
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
  `;
  return btn;
}

function heardCard({ label, hint, isSelected = false, onClick }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qHearBtn" + (isSelected ? " isSel" : "");
  btn.setAttribute("aria-label", `Heard about us: ${label}`);
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
// Estimate (shorter + heavier)
// -------------------------
function tightenAndHeavier(range) {
  if (!range) return null;
  const low = Number(range[0]);
  const high = Number(range[1]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return range;

  const mid = (low + high) / 2;
  const delta = Math.max(50, Math.round((high - low) * 0.22)); // shorter range
  const newLow = Math.round(mid + (high - mid) * 0.12); // push upward
  const newHigh = Math.max(newLow + 30, newLow + delta);
  return [newLow, newHigh];
}

function computeEstimate() {
  const type = quoteState.vehicleType;
  if (!type) return null;

  if (serviceOverrides[quoteState.service]) {
    const r = serviceOverrides[quoteState.service][type];
    return tightenAndHeavier(r || null);
  }

  const cat = quoteState.serviceCategory;

  if (cat === "Interior") {
    const ic = quoteState.interiorCondition;
    if (!ic) return null;
    return tightenAndHeavier(estimateTable.Interior?.[type]?.[ic] || null);
  }

  if (cat === "Exterior") {
    const ec = quoteState.exteriorCondition;
    if (!ec) return null;
    return tightenAndHeavier(estimateTable.Exterior?.[type]?.[ec] || null);
  }

  if (cat === "Interior + Exterior") {
    const ic = quoteState.interiorCondition;
    const ec = quoteState.exteriorCondition;
    if (!ic || !ec) return null;

    const ir = estimateTable.Interior?.[type]?.[ic];
    const er = estimateTable.Exterior?.[type]?.[ec];
    if (!ir || !er) return null;
    return tightenAndHeavier([ir[0] + er[0], ir[1] + er[1]]);
  }

  if (quoteState.service === "Upkeep Plan") {
    const ic = quoteState.interiorCondition;
    const ec = quoteState.exteriorCondition;
    if (!ic || !ec) return null;
    const ir = estimateTable.Interior?.[type]?.[ic];
    const er = estimateTable.Exterior?.[type]?.[ec];
    if (ir && er) return tightenAndHeavier([ir[0] + er[0], ir[1] + er[1]]);
  }

  return null;
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
    service: "",
    interiorCondition: "",
    exteriorCondition: "",
    heardAbout: "",
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

// ✅ command: DO NOT close if they click outside the panel
// This blocks backdrop click-to-close even if another script tries to use it.
if (quoteModal) {
  quoteModal.addEventListener(
    "click",
    (e) => {
      if (e.target === quoteModal) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true // capture
  );
}

// -------------------------
// Calendar state + helpers
// -------------------------
let calendarCache = {
  tzLabel: "Local Time",
  slots: [], // [{id,date,time,label}]
  byDate: new Map()
};

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthLabel(date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function buildCalendarIndex(slots) {
  const map = new Map();
  slots.forEach((s) => {
    const k = s.date;
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  });
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }
  return map;
}

function findNextAvailableDate(fromDateISO) {
  const dates = Array.from(calendarCache.byDate.keys()).sort();
  for (const d of dates) {
    if (!fromDateISO || d >= fromDateISO) return d;
  }
  return "";
}

// ✅ robust parsing for YOUR SHEET format:
// Columns: id | label | status | bookedAt
// Example id: "2026-02-20 10:00"
// label: "Fri Feb 20 • 10:00 AM"
function parseSlotToDateTime(slot) {
  const id = String(slot.id || "").trim();
  const label = String(slot.label || "").trim();

  // try id first: YYYY-MM-DD HH:MM
  const m1 = id.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  if (m1) return { date: m1[1], time: m1[2], pretty: label || id };

  // try id: YYYY-MM-DDTHH:MM
  const m2 = id.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m2) return { date: m2[1], time: m2[2], pretty: label || id };

  // fallback: attempt to parse label
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

  // 1) Vehicle type
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

  // 2) Category  ✅ MOBILE FIX: compact 3-up grid
  if (step === "serviceCategory") {
    title.textContent = "Service category";
    sub.textContent = "Choose what you want detailed. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--compact3";

    serviceCategories.forEach((c) => {
      cards.appendChild(
        imgCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          contain: false,
          variant: "qCard--portrait qCard--serviceCat",
          isSelected: quoteState.serviceCategory === c.label,
          onClick: () =>
            pickAndAdvance(() => {
              quoteState.serviceCategory = c.label;
              quoteState.service = "";
              quoteState.interiorCondition = "";
              quoteState.exteriorCondition = "";
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

  // 3) Service
  if (step === "service") {
    const filtered = servicesAll.filter((s) => {
      if (s.category === "Both") return true;
      if (quoteState.serviceCategory === "Interior + Exterior") return true;
      return s.category === quoteState.serviceCategory;
    });

    if (filtered.length === 1 && quoteState.service !== filtered[0].label) {
      quoteState.service = filtered[0].label;
      stepIndex = nextActiveStepIndex(stepIndex);
      renderStep();
      return;
    }

    title.textContent = "Select service";
    sub.textContent = "Pick the service you want. Tap to continue.";

    const cards = document.createElement("div");
    if (quoteState.serviceCategory === "Exterior") {
      cards.className = "qCards qCards--row";
    } else {
      cards.className = "qCards";
    }

    filtered.forEach((s) => {
      cards.appendChild(
        imgCard({
          label: s.label,
          hint: "Tap to select",
          img: s.img,
          variant: "qCard--square qCard--servicePick",
          badge: s.prewash ? "*" : "",
          isSelected: quoteState.service === s.label,
          onClick: () =>
            pickAndAdvance(() => {
              quoteState.service = s.label;
              quoteState.interiorCondition = "";
              quoteState.exteriorCondition = "";
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

  // 4) Interior condition ✅ MOBILE FIX: compact 3-up grid
  if (step === "conditionInterior") {
    title.textContent = "Interior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--compact3";

    interiorConditions.forEach((c) => {
      cards.appendChild(
        imgCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          variant: "qCard--portrait qCard--condition",
          isSelected: quoteState.interiorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.interiorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 5) Exterior condition ✅ MOBILE FIX: compact 3-up grid
  if (step === "conditionExterior") {
    title.textContent = "Exterior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards qCards--compact3";

    exteriorConditions.forEach((c) => {
      cards.appendChild(
        imgCard({
          label: c.label,
          hint: "",
          img: c.img,
          variant: "qCard--portrait qCard--condition",
          isSelected: quoteState.exteriorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.exteriorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 6) Heard about
  if (step === "heardAbout") {
    title.textContent = "How did you hear about us?";
    sub.textContent = "Tap one option to continue.";

    const wrap = document.createElement("div");
    wrap.className = "qHearWrap";

    const cards = document.createElement("div");
    cards.className = "qHearGrid";

    heardAboutOptions.forEach((o) => {
      cards.appendChild(
        heardCard({
          label: o.label,
          hint: o.hint,
          isSelected: quoteState.heardAbout === o.label,
          onClick: () => pickAndAdvance(() => (quoteState.heardAbout = o.label))
        })
      );
    });

    wrap.appendChild(cards);
    quoteBody.append(title, sub, wrap);
  }

  // 7) Estimate
  if (step === "estimate") {
    title.textContent = "Estimated price";
    sub.textContent = "Starting estimate based on your selections.";

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
        <span class="qPill"><strong>Service:</strong> ${escapeHtml(quoteState.service)}</span>
        ${quoteState.interiorCondition ? `<span class="qPill"><strong>Interior:</strong> ${escapeHtml(quoteState.interiorCondition)}</span>` : ""}
        ${quoteState.exteriorCondition ? `<span class="qPill"><strong>Exterior:</strong> ${escapeHtml(quoteState.exteriorCondition)}</span>` : ""}
      </div>

      <div class="qEstimateFine">
        Final price confirmed after quick assessment.
      </div>
    `;

    quoteBody.append(title, sub, box);
  }

  // 8) Appointment (calendar-style + loading bar + small reload)
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

  // 9) Contact
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

    const appt = document.createElement("div");
    appt.className = "qApptSummary";
    appt.innerHTML = `
      <div class="qApptLine"><strong>Appointment:</strong> ${escapeHtml(quoteState.slotLabel || "—")}</div>
      <div class="qApptLine"><strong>Estimated:</strong> ${
        quoteState.estimateLow && quoteState.estimateHigh
          ? `$${escapeHtml(quoteState.estimateLow)}–$${escapeHtml(quoteState.estimateHigh)}`
          : "—"
      }</div>
    `;

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
          <strong>Acknowledgement *</strong><br/>
          I understand that a $25 booking deposit is required to reserve my appointment and will be applied to the total.
          All listed prices are starting prices and may adjust after a vehicle assessment based on condition.
        </label>
      </div>
      <div class="qStatus" data-q-status>
        ${canContinue() ? "" : "Required: name, phone, email, and acknowledgement."}
      </div>
      <div style="display:none;">
        <input id="qCompany" placeholder="Company" value="${escapeHtml(quoteState.honeypot)}" />
      </div>
    `;

    quoteBody.append(title, sub, grid, appt, notes, ack);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");
    const emailEl = quoteBody.querySelector("#qEmail");
    const notesEl = quoteBody.querySelector("#qNotes");
    const ackEl = quoteBody.querySelector("#qAck");
    const hpEl = quoteBody.querySelector("#qCompany");
    const statusEl = quoteBody.querySelector("[data-q-status]");

    const updateStatus = () => {
      if (!statusEl) return;
      statusEl.textContent = canContinue() ? "" : "Required: name, phone, email, and acknowledgement.";
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
    emailEl?.addEventListener("input", (e) => {
      quoteState.email = e.target.value || "";
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

  // 10) Done
  if (step === "done") {
    title.textContent = "You're booked";
    sub.textContent = "We received your request and will confirm shortly.";

    const box = document.createElement("div");
    box.className = "qDoneBox";
    box.innerHTML = `
      <div class="qDoneBig">✅ Request submitted</div>
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
    try {
      data = JSON.parse(text);
    } catch {
      statusEl.textContent =
        "Scheduling error: Apps Script did not return JSON. (Deploy Web App access: Anyone / Anyone with link)";
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

    // ✅ Robust: accept either {id,label,status} or {id,date,time,label}
    const normalized = data.slots
      .filter((s) => String(s.status || "open").toLowerCase() === "open" || !("status" in s))
      .map((s) => {
        const parsed =
          "date" in s && "time" in s && s.date && s.time
            ? { date: String(s.date), time: String(s.time), pretty: String(s.label || "") }
            : parseSlotToDateTime(s);
        return {
          id: String(s.id || ""),
          date: parsed.date,
          time: parsed.time,
          label: String(s.label || parsed.pretty || s.id || "")
        };
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

    // default selected date
    if (!quoteState.slotDate) {
      quoteState.slotDate = findNextAvailableDate("");
    } else {
      if (!calendarCache.byDate.has(quoteState.slotDate)) {
        quoteState.slotDate = findNextAvailableDate(quoteState.slotDate);
      }
    }

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
      renderStep();
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
    service: quoteState.service,

    interiorCondition: quoteState.interiorCondition,
    exteriorCondition: quoteState.exteriorCondition,

    heardAbout: quoteState.heardAbout,

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
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, message: "Apps Script returned non-JSON." };
  }
}

async function reserveAndSend() {
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) {
    return { ok: true };
  }

  const script = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;
  const payload = buildPayload();
  const reserveUrl = `${script}?action=reserve`;

  try {
    const result = await Promise.race([postJson(reserveUrl, payload), timeout(12000)]);

    if (result && result.ok === true) return { ok: true };

    if (result && result.ok === false) {
      return {
        ok: false,
        message: result.message || "That time was just booked."
      };
    }

    return { ok: false, message: "Submit failed." };
  } catch (e) {
    return { ok: false, message: "Submission blocked (CORS)." };
  }
}

// -------------------------
// Nav
// -------------------------
function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  if (step === "heardAbout") {
    const est = computeEstimate();
    quoteState.estimateLow = est ? est[0] : "";
    quoteState.estimateHigh = est ? est[1] : "";
  }

  if (step === "contact") {
    quoteNextBtn.disabled = true;
    const old = quoteNextBtn.textContent;
    quoteNextBtn.textContent = "Sending...";

    reserveAndSend().then((result) => {
      if (result && result.ok === false) {
        alert(result.message || "That time was just booked. Pick another slot.");
        stepIndex = steps.indexOf("appointment");
        renderStep();
        quoteNextBtn.textContent = old;
        quoteNextBtn.disabled = false;
        return;
      }

      stepIndex = nextActiveStepIndex(stepIndex);
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
