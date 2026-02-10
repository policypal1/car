// --------------------
// CONFIG
// --------------------
const BUSINESS_PHONE = "+15555555555";
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const supabaseClient = SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
/*
Supabase schema suggestion:
Table: availability_slots
- id (uuid, pk)
- start_time (timestamptz)
- end_time (timestamptz)
- is_available (boolean, default true)
- created_at (timestamptz)

Table: bookings
- id (uuid, pk)
- slot_id (uuid, fk -> availability_slots.id, unique)
- name (text)
- phone (text)
- vehicle_size (text)
- service_type (text)
- interior_tier (text)
- exterior_service (text)
- exterior_wash_tier (text)
- questions (text)
- created_at (timestamptz)
*/

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
      </ul>
    `,
  },
  ceramic: {
    title: "Ceramic Protection",
    body: `
      <p><strong>Best for:</strong> longer-lasting gloss and easier washes.</p>
      <ul>
        <li>Prep wash before application</li>
        <li>Decontamination steps for bonding</li>
        <li>Ceramic protection applied</li>
      </ul>
    `,
  },
  paint: {
    title: "Paint Correction",
    body: `
      <p><strong>Best for:</strong> reducing swirls, haze, and defects to improve clarity and depth.</p>
      <ul>
        <li>Paint inspection under proper lighting</li>
        <li>Machine polishing to reduce swirls and defects</li>
        <li>Protection recommended afterward</li>
      </ul>
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
    document.querySelector(".adminPanel")?.remove();
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

  goTo(0);
}
document.querySelectorAll("[data-carousel]").forEach(initCarousel);

// --------------------
// Reviews rail arrows
// --------------------
(function initReviewsRail() {
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
// QUOTE WIZARD (conversion flow + scheduling)
// -------------------------
const quoteModal = document.querySelector("[data-quote-modal]");
const quoteBody = document.querySelector("[data-quote-body]");
const quoteNextBtn = document.querySelector("[data-quote-next]");
const quoteBackBtn = document.querySelector("[data-quote-back]");
const quoteCloseBtns = document.querySelectorAll("[data-quote-close]");
const quoteProgress = document.querySelector("[data-quote-progress]");

let lastActiveElQuote = null;
let availabilitySlots = [];
let availabilityStatus = "idle";
let availabilityError = "";
let availabilityChannel = null;
let adminUnlocked = false;

const quoteState = {
  size: "",
  serviceType: "",
  interiorTier: "",
  exteriorService: "",
  exteriorWashTier: "",
  scheduleSlotId: "",
  scheduleSlotLabel: "",
  scheduleError: "",
  bookingStatus: "",
  questions: "",
  name: "",
  phone: "",
  honeypot: ""
};

let stepIndex = 0;

const sizes = [
  { label: "Small", hint: "Coupe, sedan", img: "./55205_cc640_001_300.webp" },
  { label: "Medium", hint: "Small SUV, wagon", img: "./8a87c202-14fd-4492-b01f-dd41dc1f29b0.webp" },
  { label: "Large", hint: "3-row SUV, truck, van", img: "./Chevrolet_Suburban_LT_6cd76558e4.png", contain: true }
];

const serviceTypes = [
  { label: "Exterior", hint: "Paint + wheels + gloss", img: "./d578cf79-5a6e-440a-a943-aa515b51447f.png" },
  { label: "Interior", hint: "Cabin-focused clean", img: "./2017-05-22-07-32-26.jpg" },
  { label: "Both", hint: "Interior + Exterior", img: "./Untitled design (3).png" }
];

const exteriorServices = [
  { label: "Exterior Wash", hint: "Safe wash + shine", img: "./08db8ba8-9dbd-4ee5-b99e-d8f0a8462297.png" },
  { label: "Paint Correction", hint: "Remove swirls + haze", img: "./07752da8-f5f0-413a-890b-c6de41317df6 (1).png" },
  { label: "Ceramic Coating", hint: "Long-term protection", img: "./827c7c7e-ff7d-48bc-befc-e9e2555ebf39.png" }
];

const exteriorWashTiers = [
  {
    label: "Basic Wash",
    hint: "Entry clean: hand wash + quick dry",
    img: "./08db8ba8-9dbd-4ee5-b99e-d8f0a8462297.png"
  },
  {
    label: "Standard Wash",
    hint: "Mid tier: wheel scrub + added protection",
    img: "./08db8ba8-9dbd-4ee5-b99e-d8f0a8462297.png"
  },
  {
    label: "Premium Wash",
    hint: "Top tier: most thorough wash + gloss finish",
    img: "./08db8ba8-9dbd-4ee5-b99e-d8f0a8462297.png"
  }
];

const interiorTiers = [
  {
    label: "Light Interior Clean",
    hint: "Light reset for already-maintained interiors",
    img: "./51ae0d9f-5775-427e-b565-cb5e0984e800.png"
  },
  {
    label: "Deep Interior Clean",
    hint: "More thorough cleaning for everyday buildup",
    img: "./3a1e17c7-bcc9-49db-9c9d-ae7b6e1f8ab8.png"
  },
  {
    label: "Full Interior Detail",
    hint: "Most complete interior restoration tier",
    img: "./6107e54c-faba-40e2-924c-8e72db768435 (1).png"
  }
];

const bookingStatusOptions = [
  { label: "I'm ready to book", hint: "Secure an appointment", icon: "📅" },
  { label: "I still have more questions", hint: "Before booking", icon: "❓" }
];

function getStepSequence() {
  const sequence = ["size", "serviceType"];

  if (quoteState.serviceType === "Interior" || quoteState.serviceType === "Both") {
    sequence.push("interiorTier");
  }
  if (quoteState.serviceType === "Exterior" || quoteState.serviceType === "Both") {
    sequence.push("exteriorService");
    if (quoteState.exteriorService === "Exterior Wash") {
      sequence.push("exteriorWashTier");
    }
  }

  sequence.push("schedule", "bookingStatus");

  if (quoteState.bookingStatus === "I still have more questions") {
    sequence.push("questions");
  }

  sequence.push("contact", "done");
  return sequence;
}

function openQuoteModal() {
  if (!quoteModal || !quoteBody) return;

  lastActiveElQuote = document.activeElement;

  Object.assign(quoteState, {
    size: "",
    serviceType: "",
    interiorTier: "",
    exteriorService: "",
    exteriorWashTier: "",
    scheduleSlotId: "",
    scheduleSlotLabel: "",
    scheduleError: "",
    bookingStatus: "",
    questions: "",
    name: "",
    phone: "",
    honeypot: ""
  });

  availabilityStatus = "idle";
  availabilityError = "";
  stepIndex = 0;
  renderStep();
  setupRealtime();

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
  btn.addEventListener("click", openQuoteModal);
});
quoteCloseBtns.forEach((btn) => btn.addEventListener("click", closeQuoteModal));

function setProgress() {
  const steps = getStepSequence();
  if (!quoteProgress) return;

  if (quoteProgress.children.length !== steps.length) {
    quoteProgress.innerHTML = "";
    steps.forEach(() => {
      const dot = document.createElement("span");
      dot.className = "qpDot";
      quoteProgress.appendChild(dot);
    });
  }

  Array.from(quoteProgress.children).forEach((d, i) => d.classList.toggle("isOn", i === stepIndex));
}

function canContinue() {
  const step = getStepSequence()[stepIndex];
  if (step === "size") return !!quoteState.size;
  if (step === "serviceType") return !!quoteState.serviceType;
  if (step === "interiorTier") return !!quoteState.interiorTier;
  if (step === "exteriorService") return !!quoteState.exteriorService;
  if (step === "exteriorWashTier") return !!quoteState.exteriorWashTier;
  if (step === "schedule") return !!quoteState.scheduleSlotId;
  if (step === "bookingStatus") return !!quoteState.bookingStatus;
  if (step === "questions") return quoteState.questions.trim().length > 0;
  if (step === "contact") return quoteState.name.trim().length >= 2 && quoteState.phone.trim().length >= 7;
  return true;
}

function updateNav() {
  if (!quoteBackBtn || !quoteNextBtn) return;

  quoteBackBtn.style.visibility = stepIndex === 0 ? "hidden" : "visible";

  const step = getStepSequence()[stepIndex];
  if (step === "done") {
    quoteNextBtn.style.display = "none";
    quoteBackBtn.textContent = "Close";
    quoteBackBtn.style.visibility = "visible";
    return;
  }

  quoteNextBtn.style.display = "inline-flex";
  quoteBackBtn.textContent = "Back";
  quoteNextBtn.textContent = step === "contact" ? "Submit Quote" : "Continue";
  quoteNextBtn.disabled = !canContinue();
}

function pickAndAdvance(pickFn) {
  pickFn();
  renderStep();
  setTimeout(() => nextStep(true), 80);
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

function simpleCard(label, hint, icon, isSelected, onClick, bullets = null) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "qCard" + (isSelected ? " isSel" : "");
  btn.addEventListener("click", onClick);

  const bulletsHtml = bullets && bullets.length
    ? `<div class="qCardHint" style="margin-top:8px;">
        • ${bullets.map(escapeHtml).join("<br/>• ")}
      </div>`
    : "";

  btn.innerHTML = `
    <div class="qIcon" aria-hidden="true">${escapeHtml(icon)}</div>
    <div class="qCardLabel">${escapeHtml(label)}</div>
    <div class="qCardHint">${escapeHtml(hint)}</div>
    ${bulletsHtml}
  `;
  return btn;
}

function formatDateLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTimeLabel(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function buildSlotLabel(slot) {
  return `${formatDateLabel(slot.start_time)} • ${formatTimeLabel(slot.start_time)}`;
}

function groupSlotsByDate(slots) {
  return slots.reduce((acc, slot) => {
    const key = new Date(slot.start_time).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});
}

function resetScheduleSelection() {
  quoteState.scheduleSlotId = "";
  quoteState.scheduleSlotLabel = "";
}

async function loadAvailability() {
  if (!supabaseClient) {
    availabilityStatus = "error";
    availabilityError = "Supabase is not configured yet.";
    return;
  }
  availabilityStatus = "loading";
  availabilityError = "";

  const { data, error } = await supabaseClient
    .from("availability_slots")
    .select("id,start_time,end_time,is_available")
    .eq("is_available", true)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    availabilityStatus = "error";
    availabilityError = "Unable to load availability.";
    return;
  }

  availabilitySlots = data || [];
  availabilityStatus = "ready";
}

function setupRealtime() {
  if (!supabaseClient || availabilityChannel) return;
  availabilityChannel = supabaseClient
    .channel("availability-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "availability_slots" }, () => {
      availabilityStatus = "idle";
      if (getStepSequence()[stepIndex] === "schedule") renderStep();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
      availabilityStatus = "idle";
      if (getStepSequence()[stepIndex] === "schedule") renderStep();
    })
    .subscribe();
}

function renderSchedule(container) {
  container.innerHTML = "";

  if (quoteState.scheduleError) {
    const errorEl = document.createElement("div");
    errorEl.className = "qNotice qNotice--error";
    errorEl.textContent = quoteState.scheduleError;
    container.appendChild(errorEl);
  }

  if (availabilityStatus === "loading") {
    const loading = document.createElement("div");
    loading.className = "qNotice";
    loading.textContent = "Loading available times...";
    container.appendChild(loading);
    return;
  }

  if (availabilityStatus === "error") {
    const error = document.createElement("div");
    error.className = "qNotice qNotice--error";
    error.textContent = availabilityError || "Availability is unavailable right now.";
    container.appendChild(error);
    return;
  }

  if (!availabilitySlots.length) {
    const empty = document.createElement("div");
    empty.className = "qNotice";
    empty.textContent = "No open slots right now. Please check back shortly.";
    container.appendChild(empty);
    return;
  }

  const grouped = groupSlotsByDate(availabilitySlots);
  Object.entries(grouped).forEach(([dateKey, slots]) => {
    const group = document.createElement("div");
    group.className = "qDateGroup";

    const title = document.createElement("div");
    title.className = "qDateTitle";
    title.textContent = formatDateLabel(dateKey);

    const slotWrap = document.createElement("div");
    slotWrap.className = "qSlots";

    slots.forEach((slot) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qSlot" + (quoteState.scheduleSlotId === slot.id ? " isSel" : "");
      btn.textContent = formatTimeLabel(slot.start_time);
      btn.addEventListener("click", () => {
        quoteState.scheduleSlotId = slot.id;
        quoteState.scheduleSlotLabel = buildSlotLabel(slot);
        quoteState.scheduleError = "";
        renderStep();
      });
      slotWrap.appendChild(btn);
    });

    group.append(title, slotWrap);
    container.appendChild(group);
  });
}

function renderStep() {
  if (!quoteBody) return;
  quoteBody.innerHTML = "";

  const steps = getStepSequence();
  if (stepIndex >= steps.length) stepIndex = steps.length - 1;
  const step = steps[stepIndex];

  setProgress();

  const title = document.createElement("div");
  title.className = "qStepTitle";
  const sub = document.createElement("div");
  sub.className = "qStepSub";

  if (step === "size") {
    title.textContent = "Vehicle size";
    sub.textContent = "Pick the closest match. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    sizes.forEach((s) => {
      cards.appendChild(
        cardButton(s.label, s.hint, s.img, quoteState.size === s.label, () => {
          pickAndAdvance(() => (quoteState.size = s.label));
        }, !!s.contain)
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "serviceType") {
    title.textContent = "Select Service";
    sub.textContent = "Choose one category to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    serviceTypes.forEach((s) => {
      cards.appendChild(
        cardButton(s.label, s.hint, s.img, quoteState.serviceType === s.label, () => {
          pickAndAdvance(() => {
            quoteState.serviceType = s.label;
            quoteState.interiorTier = "";
            quoteState.exteriorService = "";
            quoteState.exteriorWashTier = "";
            resetScheduleSelection();
            quoteState.bookingStatus = "";
            quoteState.questions = "";
          });
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "interiorTier") {
    title.textContent = "Interior service tier";
    sub.textContent = "Each tier gets more thorough. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    interiorTiers.forEach((tier) => {
      cards.appendChild(
        cardButton(tier.label, tier.hint, tier.img, quoteState.interiorTier === tier.label, () => {
          pickAndAdvance(() => (quoteState.interiorTier = tier.label));
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "exteriorService") {
    title.textContent = "Exterior service";
    sub.textContent = "Select one exterior service. Tap to continue.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    exteriorServices.forEach((service) => {
      cards.appendChild(
        cardButton(service.label, service.hint, service.img, quoteState.exteriorService === service.label, () => {
          pickAndAdvance(() => {
            quoteState.exteriorService = service.label;
            if (service.label !== "Exterior Wash") {
              quoteState.exteriorWashTier = "";
            }
          });
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "exteriorWashTier") {
    title.textContent = "Exterior wash tier";
    sub.textContent = "Pick the wash level that fits your needs.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    exteriorWashTiers.forEach((tier) => {
      cards.appendChild(
        cardButton(tier.label, tier.hint, tier.img, quoteState.exteriorWashTier === tier.label, () => {
          pickAndAdvance(() => (quoteState.exteriorWashTier = tier.label));
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "schedule") {
    title.textContent = "Choose your appointment";
    sub.textContent = "Tap a date and time to reserve your spot.";

    const calendar = document.createElement("div");
    calendar.className = "qCalendar";

    quoteBody.append(title, sub, calendar);

    if (availabilityStatus === "idle") {
      loadAvailability().then(() => {
        if (getStepSequence()[stepIndex] === "schedule") renderStep();
      });
    }

    renderSchedule(calendar);
  }

  if (step === "bookingStatus") {
    title.textContent = "Anything else before we book?";
    sub.textContent = "Tell us if you’re ready or still have questions.";

    const cards = document.createElement("div");
    cards.className = "qCards";

    bookingStatusOptions.forEach((o) => {
      cards.appendChild(
        simpleCard(o.label, o.hint, o.icon, quoteState.bookingStatus === o.label, () => {
          pickAndAdvance(() => {
            quoteState.bookingStatus = o.label;
            if (o.label !== "I still have more questions") {
              quoteState.questions = "";
            }
          });
        })
      );
    });

    quoteBody.append(title, sub, cards);
  }

  if (step === "questions") {
    title.textContent = "I still have more questions";
    sub.textContent = "Tell us anything we should know.";

    const field = document.createElement("div");
    field.className = "qField";
    field.innerHTML = `
      <label for="qQuestions">Tell us anything we should know *</label>
      <textarea id="qQuestions" placeholder="Add your questions here.">${escapeHtml(quoteState.questions)}</textarea>
      <div class="qStatus" data-q-status>${canContinue() ? "" : "Please add a quick note so we can help."}</div>
    `;

    quoteBody.append(title, sub, field);

    const questionsEl = quoteBody.querySelector("#qQuestions");
    const statusEl = quoteBody.querySelector("[data-q-status]");

    questionsEl?.addEventListener("input", (e) => {
      quoteState.questions = e.target.value || "";
      if (statusEl) statusEl.textContent = canContinue() ? "" : "Please add a quick note so we can help.";
      updateNav();
    });

    setTimeout(() => questionsEl?.focus(), 50);
  }

  if (step === "contact") {
    title.textContent = "Your contact info";
    sub.textContent = "Required. We’ll text/call you to confirm.";

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

    grid.append(f1, f2);

    const status = document.createElement("div");
    status.className = "qStatus";
    status.textContent = canContinue() ? "" : "Required: name and phone number.";

    const honeypot = document.createElement("div");
    honeypot.style.display = "none";
    honeypot.innerHTML = `
      <input id="qCompany" placeholder="Company" value="${escapeHtml(quoteState.honeypot)}" />
    `;

    quoteBody.append(title, sub, grid, status, honeypot);

    const nameEl = quoteBody.querySelector("#qName");
    const phoneEl = quoteBody.querySelector("#qPhone");
    const hpEl = quoteBody.querySelector("#qCompany");

    const updateStatus = () => {
      status.textContent = canContinue() ? "" : "Required: name and phone number.";
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
    hpEl?.addEventListener("input", (e) => {
      quoteState.honeypot = e.target.value || "";
    });

    setTimeout(() => nameEl?.focus(), 50);
  }

  if (step === "done") {
    title.textContent = "Request sent";
    sub.textContent = "We’ll reach out shortly to confirm your appointment.";

    const summary = document.createElement("div");
    summary.className = "qSummary";
    summary.innerHTML = `
      <div class="qStepSub" style="margin-top:10px;">
        <strong>Summary</strong><br/>
        Size: ${escapeHtml(quoteState.size)}<br/>
        Service Type: ${escapeHtml(quoteState.serviceType)}<br/>
        Interior Tier: ${escapeHtml(quoteState.interiorTier || "—")}<br/>
        Exterior Service: ${escapeHtml(quoteState.exteriorService || "—")}<br/>
        Exterior Wash Tier: ${escapeHtml(quoteState.exteriorWashTier || "—")}<br/>
        Appointment: ${escapeHtml(quoteState.scheduleSlotLabel || "—")}<br/>
        Questions: ${escapeHtml(quoteState.questions || "—")}<br/>
        Name: ${escapeHtml(quoteState.name)}<br/>
        Phone: ${escapeHtml(quoteState.phone)}
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

async function submitToSupabase() {
  if (quoteState.honeypot && quoteState.honeypot.trim().length > 0) return { ok: true };
  if (!supabaseClient) return { ok: true };

  if (!quoteState.scheduleSlotId) {
    return { ok: false, message: "Please select a time slot." };
  }

  const payload = {
    slot_id: quoteState.scheduleSlotId,
    name: quoteState.name,
    phone: quoteState.phone,
    vehicle_size: quoteState.size,
    service_type: quoteState.serviceType,
    interior_tier: quoteState.interiorTier || null,
    exterior_service: quoteState.exteriorService || null,
    exterior_wash_tier: quoteState.exteriorWashTier || null,
    questions: quoteState.questions || null
  };

  const { error } = await supabaseClient.from("bookings").insert([payload]);
  if (error) {
    return { ok: false, message: "That time just booked. Please choose another slot." };
  }

  await supabaseClient
    .from("availability_slots")
    .update({ is_available: false })
    .eq("id", quoteState.scheduleSlotId);

  return { ok: true };
}

function nextStep(fromAutoAdvance = false) {
  if (!canContinue()) return;

  const step = getStepSequence()[stepIndex];

  if (step === "contact") {
    quoteNextBtn.disabled = true;
    const old = quoteNextBtn.textContent;
    quoteNextBtn.textContent = "Sending...";

    submitToSupabase().then((result) => {
      quoteNextBtn.textContent = old;
      quoteNextBtn.disabled = false;

      if (!result.ok) {
        quoteState.scheduleError = result.message;
        const scheduleIndex = getStepSequence().indexOf("schedule");
        stepIndex = scheduleIndex >= 0 ? scheduleIndex : 0;
        renderStep();
        return;
      }

      stepIndex = Math.min(stepIndex + 1, getStepSequence().length - 1);
      renderStep();
    });
    return;
  }

  if (stepIndex < getStepSequence().length - 1) stepIndex++;
  renderStep();

  if (fromAutoAdvance) updateNav();
}

function prevStep() {
  if (getStepSequence()[stepIndex] === "done") {
    closeQuoteModal();
    return;
  }
  if (stepIndex > 0) stepIndex--;
  renderStep();
}

quoteNextBtn?.addEventListener("click", () => nextStep(false));
quoteBackBtn?.addEventListener("click", prevStep);

function openAdminPanel() {
  if (!adminUnlocked) return;
  let panel = document.querySelector(".adminPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.className = "adminPanel";
    panel.innerHTML = `
      <div class="adminPanel__card" role="dialog" aria-modal="true" aria-label="Admin scheduling panel">
        <div class="adminPanel__header">
          <div>
            <div class="adminPanel__title">Admin Schedule Control</div>
            <div class="adminPanel__sub">Add or remove appointment slots.</div>
          </div>
          <button class="adminPanel__close" type="button" aria-label="Close admin panel">×</button>
        </div>
        <div class="adminPanel__body">
          <div class="adminPanel__section">
            <div class="adminPanel__sectionTitle">Create slot</div>
            <div class="adminPanel__form">
              <div class="adminField">
                <label for="adminDate">Date</label>
                <input id="adminDate" type="date" />
              </div>
              <div class="adminField">
                <label for="adminTime">Start time</label>
                <input id="adminTime" type="time" />
              </div>
              <div class="adminField">
                <label for="adminDuration">Duration</label>
                <select id="adminDuration">
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
              </div>
              <button class="btn btn--quote adminPanel__action" type="button" data-admin-add>Add Slot</button>
            </div>
          </div>
          <div class="adminPanel__section">
            <div class="adminPanel__sectionTitle">Current slots</div>
            <div class="adminPanel__list" data-admin-list></div>
            <div class="adminPanel__status" data-admin-status></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    panel.addEventListener("click", (e) => {
      if (e.target === panel) panel.remove();
    });

    panel.querySelector(".adminPanel__close")?.addEventListener("click", () => panel?.remove());
  }

  const listEl = panel.querySelector("[data-admin-list]");
  const statusEl = panel.querySelector("[data-admin-status]");
  const addBtn = panel.querySelector("[data-admin-add]");

  const refreshAdminList = async () => {
    if (!listEl || !statusEl) return;
    if (!supabaseClient) {
      statusEl.textContent = "Supabase is not configured.";
      listEl.innerHTML = "";
      return;
    }

    statusEl.textContent = "Loading slots...";
    const { data, error } = await supabaseClient
      .from("availability_slots")
      .select("id,start_time,end_time,is_available")
      .order("start_time", { ascending: true });

    if (error) {
      statusEl.textContent = "Unable to load slots.";
      listEl.innerHTML = "";
      return;
    }

    statusEl.textContent = "";
    if (!data || !data.length) {
      listEl.innerHTML = "<div class=\"qNotice\">No slots yet.</div>";
      return;
    }

    listEl.innerHTML = "";
    data.forEach((slot) => {
      const item = document.createElement("div");
      item.className = "adminSlot";
      item.innerHTML = `
        <div>
          <div class="adminSlot__title">${escapeHtml(buildSlotLabel(slot))}</div>
          <div class="adminSlot__meta">${slot.is_available ? "Available" : "Booked"}</div>
        </div>
        <button class="btn btn--ghostGold adminSlot__remove" type="button">Remove</button>
      `;
      item.querySelector(".adminSlot__remove")?.addEventListener("click", async () => {
        await supabaseClient.from("availability_slots").delete().eq("id", slot.id);
        refreshAdminList();
        availabilityStatus = "idle";
      });
      listEl.appendChild(item);
    });
  };

  if (!panel.dataset.bound) {
    addBtn?.addEventListener("click", async () => {
      if (!supabaseClient) return;
      const date = panel.querySelector("#adminDate")?.value;
      const time = panel.querySelector("#adminTime")?.value;
      const duration = Number(panel.querySelector("#adminDuration")?.value || 60);
      const statusEl = panel.querySelector("[data-admin-status]");

      if (!date || !time) {
        if (statusEl) statusEl.textContent = "Add a date and time.";
        return;
      }

      const start = new Date(`${date}T${time}`);
      const end = new Date(start.getTime() + duration * 60000);
      await supabaseClient.from("availability_slots").insert([
        { start_time: start.toISOString(), end_time: end.toISOString(), is_available: true }
      ]);
      if (statusEl) statusEl.textContent = "Slot added.";
      refreshAdminList();
      availabilityStatus = "idle";
    });
    panel.dataset.bound = "true";
  }

  refreshAdminList();
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === "a") {
    const passcode = window.prompt("Admin access code");
    if (passcode === "1111") {
      adminUnlocked = true;
      openAdminPanel();
    }
  }
});

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
