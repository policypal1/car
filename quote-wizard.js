// -------------------------
// QUOTE WIZARD (NEW FLOW)
// Size -> Service -> Condition(s) -> Appointment Slot -> Contact -> Done
// -------------------------

const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteDots = () => Array.from(document.querySelectorAll(".qpDot"));

let lastActiveElQuote = null;

/**
 * Required globals expected (set these in script.js or inline):
 * - const SCRIPT_URL = "https://script.google.com/macros/s/...../exec";
 * - const BUSINESS_PHONE = "+1971....";
 *
 * NOTE: To support live slots (auto-disappear when booked), your Apps Script must:
 * 1) Allow CORS (doGet/doPost with ContentService + setHeader)
 * 2) Return JSON
 *
 * Endpoints expected:
 * - GET  SCRIPT_URL?action=slots
 *    returns: { ok:true, timezone:"America/Los_Angeles", slots:[ { id:"2026-02-18T10:00", label:"Wed Feb 18 • 10:00 AM" }, ... ] }
 *
 * - POST SCRIPT_URL?action=reserve
 *    body JSON: { slotId, name, phone, email, ...wizardData }
 *    returns: { ok:true } or { ok:false, message:"Slot already booked" }
 *
 * - POST SCRIPT_URL?action=lead
 *    body JSON: { ...wizardData }  (fallback if reserve is not used)
 *    returns: { ok:true }
 */

const quoteState = {
  size: "",

  service: "", // "Interior" | "Exterior" | "Interior + Exterior"

  interiorCondition: "", // "Light" | "Normal" | "Heavy" (only if interior included)
  exteriorCondition: "", // "Light" | "Normal" | "Heavy" (only if exterior included)

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
  "size",
  "service",
  "conditionInterior",
  "conditionExterior",
  "appointment",
  "contact",
  "done"
];

let stepIndex = 0;

// --- CONFIG: Images you provided ---
const sizes = [
  { label: "Small", hint: "Coupe, sedan", img: "./55205_cc640_001_300.webp" },
  // keep your existing medium/large unless you want to replace them too
  { label: "Medium", hint: "Small SUV, wagon", img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp" },
  { label: "Large", hint: "3-row SUV, truck, van", img: "./Chevrolet_Suburban_LT_6cd76558e4.png", contain: true }
];

const services = [
  { label: "Interior", hint: "Seats, carpets, plastics, glass", img: "./IMG_2915.heic", contain: true },
  { label: "Exterior", hint: "Wash, wheels, finish, protection", img: "./IMG_2469.jpg", contain: true },
  { label: "Interior + Exterior", hint: "Full reset inside and out", img: "./51ae0d9f-5775-427e-b565-cb5e0984e800.png" }
];

// Interior condition images
const interiorConditions = [
  { label: "Light", hint: "Mostly clean • quick refresh", img: "./IMG_2915.heic" },
  { label: "Normal", hint: "Daily driver • solid reset", img: "./IMG_2916.heic" },
  { label: "Heavy", hint: "Stains/pet hair • deep work", img: "./dirty-car-complete-with-moldy-carpets-v0-nb2pbgkkdalb1.png" }
];

// Exterior condition images
const exteriorConditions = [
  { label: "Light", hint: "Light dirt • quick wash", img: "./looks-dirty-even-after-wash-v0-0v8lqgjivccf1.webp" },
  { label: "Normal", hint: "Road film • wheels need love", img: "./IMG_2469.jpg" },
  { label: "Heavy", hint: "Neglected • heavy buildup", img: "./dirty-car.jpg" }
];

// Simple pricing estimator (edit these anytime)
const estimateTable = {
  Interior: {
    Small: { Light: [120, 160], Normal: [160, 220], Heavy: [220, 320] },
    Medium: { Light: [140, 190], Normal: [190, 260], Heavy: [260, 380] },
    Large: { Light: [170, 230], Normal: [230, 320], Heavy: [320, 450] }
  },
  Exterior: {
    Small: { Light: [60, 90], Normal: [90, 130], Heavy: [130, 180] },
    Medium: { Light: [70, 100], Normal: [100, 150], Heavy: [150, 210] },
    Large: { Light: [90, 120], Normal: [120, 180], Heavy: [180, 260] }
  }
};

function openQuoteModal() {
  if (!quoteModal || !quoteBody) return;

  lastActiveElQuote = document.activeElement;

  Object.assign(quoteState, {
    size: "",
    service: "",
    interiorCondition: "",
    exteriorCondition: "",
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

function setProgress() {
  const dots = quoteDots();
  dots.forEach((d, i) => d.classList.toggle("isOn", i === stepIndex));
}

function stepIsActive(stepName) {
  // Skip interior condition if service doesn't include interior
  if (stepName === "conditionInterior") return includesInterior();
  // Skip exterior condition if service doesn't include exterior
  if (stepName === "conditionExterior") return includesExterior();
  return true;
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

function includesInterior() {
  return quoteState.service === "Interior" || quoteState.service === "Interior + Exterior";
}
function includesExterior() {
  return quoteState.service === "Exterior" || quoteState.service === "Interior + Exterior";
}

function canContinue() {
  const step = steps[stepIndex];

  if (step === "size") return !!quoteState.size;
  if (step === "service") return !!quoteState.service;

  if (step === "conditionInterior") return !includesInterior() ? true : !!quoteState.interiorCondition;
  if (step === "conditionExterior") return !includesExterior() ? true : !!quoteState.exteriorCondition;

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

  // Text rules
  quoteNextBtn.textContent = step === "contact" ? "Finish" : "Continue";
  quoteNextBtn.disabled = !canContinue();
}

function pickAndAdvance(pickFn) {
  pickFn();
  renderStep();
  setTimeout(() => nextStep(true), 80);
}

function imageCard({ label, hint, img, isSelected, onClick, contain = false }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qCard qCard--img" + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  btn.innerHTML = `
    <div class="qCardMedia qCardMedia--square">
      <img class="${contain ? "isContain" : ""}" src="${escapeHtml(img)}" alt="${escapeHtml(label)}" loading="lazy" />
    </div>
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
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

  // ---- SIZE ----
  if (step === "size") {
    title.textContent = "Vehicle size";
    sub.textContent = "Pick the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    sizes.forEach((s) => {
      cards.appendChild(
        imageCard({
          label: s.label,
          hint: s.hint,
          img: s.img,
          contain: !!s.contain,
          isSelected: quoteState.size === s.label,
          onClick: () => pickAndAdvance(() => (quoteState.size = s.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // ---- SERVICE ----
  if (step === "service") {
    title.textContent = "Select service";
    sub.textContent = "Choose what you want detailed. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    services.forEach((s) => {
      cards.appendChild(
        imageCard({
          label: s.label,
          hint: s.hint,
          img: s.img,
          contain: !!s.contain,
          isSelected: quoteState.service === s.label,
          onClick: () =>
            pickAndAdvance(() => {
              quoteState.service = s.label;

              // reset conditions when service changes
              if (!includesInterior()) quoteState.interiorCondition = "";
              if (!includesExterior()) quoteState.exteriorCondition = "";
            })
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // ---- INTERIOR CONDITION ----
  if (step === "conditionInterior") {
    title.textContent = "Interior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    interiorConditions.forEach((c) => {
      cards.appendChild(
        imageCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          isSelected: quoteState.interiorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.interiorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // ---- EXTERIOR CONDITION ----
  if (step === "conditionExterior") {
    title.textContent = "Exterior condition";
    sub.textContent = "Choose the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    exteriorConditions.forEach((c) => {
      cards.appendChild(
        imageCard({
          label: c.label,
          hint: c.hint,
          img: c.img,
          isSelected: quoteState.exteriorCondition === c.label,
          onClick: () => pickAndAdvance(() => (quoteState.exteriorCondition = c.label))
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  // ---- APPOINTMENT SLOT (LIVE) ----
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

  // ---- CONTACT ----
  if (step === "contact") {
    title.textContent = "Your contact info";
    sub.textContent = "Required. We’ll confirm your appointment by text/call.";

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
        <strong>Selected time:</strong> ${escapeHtml(quoteState.slotLabel || "—")}
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

  // ---- DONE ----
  if (step === "done") {
    title.textContent = "Request sent";
    sub.textContent = "We’ll reach out shortly to confirm and schedule.";

    const estimate = getEstimateRange();
    const estimateLine = estimate
      ? `$${estimate[0]}–$${estimate[1]}`
      : "Provided after assessment";

    const summary = document.createElement("div");
    summary.className = "qSummary";
    summary.innerHTML = `
      <div class="qStepSub" style="margin-top:10px;">
        <strong>Summary</strong><br/>
        Size: ${escapeHtml(quoteState.size)}<br/>
        Service: ${escapeHtml(quoteState.service)}<br/>
        ${includesInterior() ? `Interior condition: ${escapeHtml(quoteState.interiorCondition)}<br/>` : ""}
        ${includesExterior() ? `Exterior condition: ${escapeHtml(quoteState.exteriorCondition)}<br/>` : ""}
        Appointment: ${escapeHtml(quoteState.slotLabel)}<br/>
        Name: ${escapeHtml(quoteState.name)}<br/>
        Phone: ${escapeHtml(quoteState.phone)}<br/>
        Email: ${escapeHtml(quoteState.email)}<br/>
        Notes: ${escapeHtml(quoteState.notes || "—")}<br/><br/>
        <strong>Estimated range:</strong> ${escapeHtml(estimateLine)}<br/>
        <span style="display:block;margin-top:6px;color:rgba(0,0,0,.62);font-weight:700;">
          Final price may adjust after vehicle assessment (condition, pet hair, stains, etc.)
        </span>
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

function getEstimateRange() {
  const size = quoteState.size;
  const service = quoteState.service;

  if (!size || !service) return null;

  // If only interior
  if (service === "Interior") {
    const c = quoteState.interiorCondition;
    if (!c) return null;
    return estimateTable.Interior?.[size]?.[c] || null;
  }

  // If only exterior
  if (service === "Exterior") {
    const c = quoteState.exteriorCondition;
    if (!c) return null;
    return estimateTable.Exterior?.[size]?.[c] || null;
  }

  // If both: add ranges together
  if (service === "Interior + Exterior") {
    const ic = quoteState.interiorCondition;
    const ec = quoteState.exteriorCondition;
    if (!ic || !ec) return null;

    const ir = estimateTable.Interior?.[size]?.[ic];
    const er = estimateTable.Exterior?.[size]?.[ec];
    if (!ir || !er) return null;

    return [ir[0] + er[0], ir[1] + er[1]];
  }

  return null;
}

// -------------------------
// Slots loading + selection
// -------------------------
async function loadSlots(statusEl, slotsGridEl) {
  if (!statusEl || !slotsGridEl) return;

  statusEl.textContent = "Loading available times...";
  slotsGridEl.innerHTML = "";

  // If no script URL, show fallback message
  if (!window.SCRIPT_URL || !String(window.SCRIPT_URL).startsWith("https://script.google.com/")) {
    statusEl.textContent = "Slot system not configured (SCRIPT_URL missing).";
    return;
  }

  try {
    const url = `${window.SCRIPT_URL}?action=slots&t=${Date.now()}`;
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
    statusEl.textContent = "Couldn’t load times (CORS/endpoint issue). Please call/text to schedule.";
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
  const estimate = getEstimateRange();
  return {
    timestamp: new Date().toISOString(),
    source: "Website Quote Wizard",

    size: quoteState.size,
    service: quoteState.service,
    interiorCondition: quoteState.interiorCondition,
    exteriorCondition: quoteState.exteriorCondition,

    slotId: quoteState.slotId,
    slotLabel: quoteState.slotLabel,

    name: quoteState.name,
    phone: quoteState.phone,
    email: quoteState.email,
    notes: quoteState.notes,

    ackDeposit: quoteState.ackDeposit,

    estimateLow: estimate ? estimate[0] : "",
    estimateHigh: estimate ? estimate[1] : ""
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

async function reserveSlotAndSendLead() {
  // Honeypot: silently "success"
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) return { ok: true };

  const script = window.SCRIPT_URL;
  if (!script || !String(script).startsWith("https://script.google.com/")) return { ok: true };

  const payload = buildPayload();

  // 1) Reserve slot (so it disappears for everyone else)
  try {
    const reserveUrl = `${script}?action=reserve`;
    const result = await Promise.race([postJson(reserveUrl, payload), timeout(6000)]);
    if (result && result.ok === true) return { ok: true };
    if (result && result.ok === false) return { ok: false, message: result.message || "That time was just booked. Pick another slot." };
  } catch (e) {
    // fall through to lead
  }

  // 2) Fallback: send lead anyway
  try {
    const leadUrl = `${script}?action=lead`;
    const result = await Promise.race([postJson(leadUrl, payload), timeout(6000)]);
    if (result && result.ok === true) return { ok: true };
  } catch (e) {
    // ignore
  }

  // Even if script fails, do not block UX (you can still see the lead in console if you want)
  return { ok: true };
}

// -------------------------
// Navigation
// -------------------------
function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = steps[stepIndex];

  if (step === "contact") {
    quoteNextBtn.disabled = true;
    const old = quoteNextBtn.textContent;
    quoteNextBtn.textContent = "Sending...";

    reserveSlotAndSendLead().then((result) => {
      if (result && result.ok === false) {
        // Slot collision: bounce user back to appointment step
        alert(result.message || "That time was just booked. Please choose another.");
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

// -------------------------
// Utilities
// -------------------------
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
