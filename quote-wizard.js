// -------------------------
// QUOTE WIZARD (Flow v4)
// -------------------------
// Vehicle -> Category -> Service (auto-select if 1) -> Conditions -> HeardAbout -> Estimate -> Calendar -> Contact -> Done
//
// Apps Script URL (provided)
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzqReZg1ewa_mjsKi7eymwfAtFJYxe2gPGtJiQaoCwJts0_tRis6QAxEc89hyWZvpFO6Q/exec";

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

  slotId: "",
  slotLabel: "",

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
  { label: "Small", hint: "Coupe, sedan", img: "./55205_cc640_001_300.webp", contain: true },
  { label: "Medium", hint: "Small SUV, wagon", img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp", contain: true },
  { label: "Large", hint: "3-row SUV, large SUV", img: "./Chevrolet_Suburban_LT_6cd76558e4.png", contain: true },
  { label: "Truck", hint: "Pickup truck", img: "./silver-pickup-truck-side-view-svdvcb49lssczxnt.png", contain: true }
];

const serviceCategories = [
  { label: "Interior", hint: "Inside-only detailing", img: "./2017-05-22-07-32-26.jpg" },
  { label: "Exterior", hint: "Outside-only detailing", img: "./c36084da09340612d8431de0221ea985.jpg" },
  { label: "Interior + Exterior", hint: "Full detail inside + out", img: "./Untitled design (3).png" }
];

// From your Services section images (index.html)
const servicesAll = [
  { label: "Interior Detail", category: "Interior", img: "./51ae0d9f-5775-427e-b565-cb5e0984e800.png" },
  { label: "Exterior Wash", category: "Exterior", img: "./08db8ba8-9dbd-4ee5-b99e-d8f0a8462297.png" },
  { label: "Upkeep Plan", category: "Interior + Exterior", img: "./593000c7-e7a5-44a3-9ee8-b68781fa76e7.png" },
  { label: "Ceramic Coating", category: "Exterior", img: "./827c7c7e-ff7d-48bc-befc-e9e2555ebf39.png" },
  { label: "Paint Correction", category: "Exterior", img: "./07752da8-f5f0-413a-890b-c6de41317df6 (1).png" }
];

const interiorConditions = [
  { label: "Light", hint: "Mostly clean • quick refresh", img: "./IMG_2915.jpg" },
  { label: "Normal", hint: "Daily driver • solid reset", img: "./IMG_2916.jpg" },
  { label: "Heavy", hint: "Stains/pet hair • deep work", img: "./dirty-car-complete-with-moldy-carpets-v0-nb2pbgkkdalb1.png" }
];

const exteriorConditions = [
  { label: "Light", hint: "Light dirt • quick wash", img: "./looks-dirty-even-after-wash-v0-0v8lqgjivccf1.webp" },
  { label: "Normal", hint: "Road film • wheels need love", img: "./IMG_2469.jpg" },
  { label: "Heavy", hint: "Neglected • heavy buildup", img: "./dirty-car.jpg" }
];

const heardAboutOptions = [
  { label: "Returning Client", hint: "Welcome back" },
  { label: "Family / Friend", hint: "Referral" },
  { label: "Social Media", hint: "Instagram / TikTok" },
  { label: "Google Search", hint: "Maps / Search" },
  { label: "Other", hint: "Another source" }
];

// -------------------------
// ESTIMATES (edit anytime)
// -------------------------
const estimateTable = {
  Interior: {
    Small: { Light: [120, 160], Normal: [160, 220], Heavy: [220, 320] },
    Medium:{ Light: [140, 190], Normal: [190, 260], Heavy: [260, 380] },
    Large: { Light: [170, 230], Normal: [230, 320], Heavy: [320, 450] },
    Truck: { Light: [170, 240], Normal: [240, 340], Heavy: [340, 480] }
  },
  Exterior: {
    Small: { Light: [60, 90],  Normal: [90, 130],  Heavy: [130, 180] },
    Medium:{ Light: [70, 100], Normal: [100, 150], Heavy: [150, 210] },
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
  "Upkeep Plan": {
    Small: [90, 160], Medium: [110, 190], Large: [130, 220], Truck: [130, 240]
  }
};

// -------------------------
// FLOW HELPERS
// -------------------------
function includesInteriorByCategory() {
  return quoteState.serviceCategory === "Interior" || quoteState.serviceCategory === "Interior + Exterior";
}
function includesExteriorByCategory() {
  return quoteState.serviceCategory === "Exterior" || quoteState.serviceCategory === "Interior + Exterior";
}

function serviceRequiresInteriorCondition() {
  if (quoteState.service === "Ceramic Coating" || quoteState.service === "Paint Correction") return false;
  return includesInteriorByCategory() || quoteState.service === "Interior Detail";
}
function serviceRequiresExteriorCondition() {
  if (quoteState.service === "Interior Detail") return false;
  if (quoteState.service === "Ceramic Coating" || quoteState.service === "Paint Correction") return true;
  return includesExteriorByCategory() || quoteState.service === "Exterior Wash" || quoteState.service === "Upkeep Plan";
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
function imgCard({ label, hint, img, contain = false, isSelected = false, onClick, variant = "" }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `qCard qCard--img ${variant}`.trim() + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  btn.innerHTML = `
    <div class="qCardMedia">
      <img class="${contain ? "isContain" : ""}" src="${escapeHtml(img)}" alt="${escapeHtml(label)}" loading="lazy" />
    </div>
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
  `;
  return btn;
}

function textCard({ label, hint, isSelected = false, onClick }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qCard qCard--text" + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);
  btn.innerHTML = `
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
  `;
  return btn;
}

// -------------------------
// Estimate
// -------------------------
function computeEstimate() {
  const type = quoteState.vehicleType;
  if (!type) return null;

  if (serviceOverrides[quoteState.service]) {
    const r = serviceOverrides[quoteState.service][type];
    if (r) return r;
  }

  const cat = quoteState.serviceCategory;

  if (cat === "Interior") {
    const ic = quoteState.interiorCondition;
    if (!ic) return null;
    return estimateTable.Interior?.[type]?.[ic] || null;
  }

  if (cat === "Exterior") {
    const ec = quoteState.exteriorCondition;
    if (!ec) return null;
    return estimateTable.Exterior?.[type]?.[ec] || null;
  }

  if (cat === "Interior + Exterior") {
    const ic = quoteState.interiorCondition;
    const ec = quoteState.exteriorCondition;
    if (!ic || !ec) return null;

    const ir = estimateTable.Interior?.[type]?.[ic];
    const er = estimateTable.Exterior?.[type]?.[ec];
    if (!ir || !er) return null;

    return [ir[0] + er[0], ir[1] + er[1]];
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

  // 1) Vehicle type (2x2 grid container)
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
          variant: "qCard--vehicle",
          isSelected: quoteState.vehicleType === v.label,
          onClick: () => pickAndAdvance(() => (quoteState.vehicleType = v.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 2) Category (portrait images)
  if (step === "serviceCategory") {
    title.textContent = "Service category";
    sub.textContent = "Choose what you want detailed. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

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
            })
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 3) Specific service (auto-select if only 1)
  if (step === "service") {
    const filtered = servicesAll.filter((s) => {
      if (quoteState.serviceCategory === "Interior + Exterior") return true;
      return s.category === quoteState.serviceCategory;
    });

    // Auto-select if exactly one option
    if (filtered.length === 1 && quoteState.service !== filtered[0].label) {
      quoteState.service = filtered[0].label;
      // skip rendering this step; jump forward
      stepIndex = nextActiveStepIndex(stepIndex);
      renderStep();
      return;
    }

    title.textContent = "Select service";
    sub.textContent = "Pick the service you want. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    filtered.forEach((s) => {
      cards.appendChild(
        imgCard({
          label: s.label,
          hint: "Tap to select",
          img: s.img,
          contain: false,
          variant: "qCard--portrait qCard--servicePick",
          isSelected: quoteState.service === s.label,
          onClick: () =>
            pickAndAdvance(() => {
              quoteState.service = s.label;
              quoteState.interiorCondition = "";
              quoteState.exteriorCondition = "";
            })
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 4) Interior condition (portrait)
  if (step === "conditionInterior") {
    title.textContent = "Interior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    interiorConditions.forEach((c) => {
      cards.appendChild(
        imgCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          contain: false,
          variant: "qCard--portrait qCard--condition",
          isSelected: quoteState.interiorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.interiorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 5) Exterior condition (portrait)
  if (step === "conditionExterior") {
    title.textContent = "Exterior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    exteriorConditions.forEach((c) => {
      cards.appendChild(
        imgCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          contain: false,
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
    sub.textContent = "Tap one option. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    heardAboutOptions.forEach((o) => {
      cards.appendChild(
        textCard({
          label: o.label,
          hint: o.hint,
          isSelected: quoteState.heardAbout === o.label,
          onClick: () => pickAndAdvance(() => (quoteState.heardAbout = o.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // 7) Estimate (fancy)
  if (step === "estimate") {
    title.textContent = "Estimated price range";
    sub.textContent = "Based on your selections. Final price may adjust after assessment.";

    const est = computeEstimate();
    if (est) {
      quoteState.estimateLow = est[0];
      quoteState.estimateHigh = est[1];
    } else {
      quoteState.estimateLow = "";
      quoteState.estimateHigh = "";
    }

    const box = document.createElement("div");
    box.className = "qEstimateBox";
    box.innerHTML = `
      <div class="qEstimateBadge">ESTIMATE</div>
      <div class="qEstimateBig">${est ? `$${escapeHtml(est[0])}–$${escapeHtml(est[1])}` : "We’ll confirm after assessment"}</div>
      <div class="qEstimateMeta">
        <div><strong>Vehicle</strong>: ${escapeHtml(quoteState.vehicleType)}</div>
        <div><strong>Category</strong>: ${escapeHtml(quoteState.serviceCategory)}</div>
        <div><strong>Service</strong>: ${escapeHtml(quoteState.service)}</div>
        ${quoteState.interiorCondition ? `<div><strong>Interior</strong>: ${escapeHtml(quoteState.interiorCondition)}</div>` : ""}
        ${quoteState.exteriorCondition ? `<div><strong>Exterior</strong>: ${escapeHtml(quoteState.exteriorCondition)}</div>` : ""}
      </div>
    `;

    quoteBody.append(title, sub, box);
  }

  // 8) Calendar / Slots
  if (step === "appointment") {
    title.textContent = "Pick an appointment time";
    sub.textContent = "Select an available slot. Once booked, it disappears for everyone else.";

    const wrap = document.createElement("div");
    wrap.className = "qSlotsWrap";

    const status = document.createElement("div");
    status.className = "qStatus";
    status.textContent = "Loading available times...";

    const slotsGrid = document.createElement("div");
    slotsGrid.className = "qSlots";

    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "btn btn--quote qReload";
    reload.textContent = "Reload times";
    reload.addEventListener("click", () => loadSlots(status, slotsGrid));

    wrap.append(status, slotsGrid, reload);
    quoteBody.append(title, sub, wrap);

    loadSlots(status, slotsGrid);
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
    appt.style.marginTop = "10px";
    appt.innerHTML = `
      <div class="qStepSub" style="margin:0;">
        <strong>Appointment:</strong> ${escapeHtml(quoteState.slotLabel || "—")}
      </div>
      <div class="qStepSub" style="margin:6px 0 0;">
        <strong>Estimated:</strong> ${
          quoteState.estimateLow && quoteState.estimateHigh
            ? `$${escapeHtml(quoteState.estimateLow)}–$${escapeHtml(quoteState.estimateHigh)}`
            : "—"
        }
      </div>
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

    nameEl?.addEventListener("input", (e) => { quoteState.name = e.target.value || ""; updateNav(); updateStatus(); });
    phoneEl?.addEventListener("input", (e) => { quoteState.phone = e.target.value || ""; updateNav(); updateStatus(); });
    emailEl?.addEventListener("input", (e) => { quoteState.email = e.target.value || ""; updateNav(); updateStatus(); });
    notesEl?.addEventListener("input", (e) => { quoteState.notes = e.target.value || ""; });
    ackEl?.addEventListener("change", (e) => { quoteState.ackDeposit = !!e.target.checked; updateNav(); updateStatus(); });
    hpEl?.addEventListener("input", (e) => { quoteState.honeypot = e.target.value || ""; });

    setTimeout(() => nameEl?.focus(), 50);
  }

  // 10) Done
  if (step === "done") {
    title.textContent = "Request sent";
    sub.textContent = "We’ll reach out shortly to confirm.";

    const summary = document.createElement("div");
    summary.className = "qSummary";
    summary.innerHTML = `
      <div class="qStepSub" style="margin-top:10px;">
        <strong>Summary</strong><br/>
        Vehicle: ${escapeHtml(quoteState.vehicleType)}<br/>
        Category: ${escapeHtml(quoteState.serviceCategory)}<br/>
        Service: ${escapeHtml(quoteState.service)}<br/>
        ${quoteState.interiorCondition ? `Interior: ${escapeHtml(quoteState.interiorCondition)}<br/>` : ""}
        ${quoteState.exteriorCondition ? `Exterior: ${escapeHtml(quoteState.exteriorCondition)}<br/>` : ""}
        Heard about us: ${escapeHtml(quoteState.heardAbout)}<br/>
        Appointment: ${escapeHtml(quoteState.slotLabel || "—")}<br/>
        Estimated: ${
          quoteState.estimateLow && quoteState.estimateHigh
            ? `$${escapeHtml(quoteState.estimateLow)}–$${escapeHtml(quoteState.estimateHigh)}`
            : "—"
        }<br/>
        Name: ${escapeHtml(quoteState.name)}<br/>
        Phone: ${escapeHtml(quoteState.phone)}<br/>
        Email: ${escapeHtml(quoteState.email)}<br/>
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
    callBtn.href = `tel:${window.BUSINESS_PHONE || ""}`;
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

// -------------------------
// Slots (Apps Script)
// -------------------------
async function loadSlots(statusEl, slotsGridEl) {
  if (!statusEl || !slotsGridEl) return;

  statusEl.textContent = "Loading available times...";
  slotsGridEl.innerHTML = "";

  const script = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;
  if (!script || !String(script).startsWith("https://script.google.com/")) {
    statusEl.textContent = "Scheduling not configured.";
    return;
  }

  try {
    const url = `${script}?action=slots&t=${Date.now()}`;
    const res = await fetch(url, { method: "GET", mode: "cors", cache: "no-store" });
    const data = await res.json();

    if (!data || data.ok !== true || !Array.isArray(data.slots)) {
      statusEl.textContent = "Couldn’t load available times. Try again.";
      return;
    }

    if (data.slots.length === 0) {
      statusEl.textContent = "No times available right now. Please call/text to schedule.";
      return;
    }

    statusEl.textContent = "Select a time:";
    data.slots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qSlotBtn" + (quoteState.slotId === slot.id ? " isSel" : "");
      btn.textContent = slot.label || slot.id;

      btn.addEventListener("click", () => {
        quoteState.slotId = String(slot.id || "");
        quoteState.slotLabel = String(slot.label || slot.id || "");
        renderStep();
      });

      slotsGridEl.appendChild(btn);
    });
  } catch (e) {
    statusEl.textContent = "Couldn’t load times (Apps Script response/CORS).";
  } finally {
    updateNav();
  }
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
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function reserveAndSend() {
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) return { ok: true };

  const script = window.SCRIPT_URL || DEFAULT_SCRIPT_URL;
  if (!script || !String(script).startsWith("https://script.google.com/")) return { ok: true };

  const payload = buildPayload();
  const reserveUrl = `${script}?action=reserve`;

  try {
    const result = await Promise.race([postJson(reserveUrl, payload), timeout(8000)]);
    if (result && result.ok === true) return { ok: true };
    if (result && result.ok === false) return { ok: false, message: result.message || "That time was just booked. Pick another." };
  } catch (e) {
    // don't block UX
  }
  return { ok: true };
}

// -------------------------
// Nav
// -------------------------
function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  // leaving heardAbout -> compute estimate
  if (step === "heardAbout") {
    const est = computeEstimate();
    if (est) {
      quoteState.estimateLow = est[0];
      quoteState.estimateHigh = est[1];
    } else {
      quoteState.estimateLow = "";
      quoteState.estimateHigh = "";
    }
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
