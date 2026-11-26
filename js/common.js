/* LocalEase – shared helpers, data and map utilities (load this first on every page) */
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props))
    k === "class" ? (e.className = v) : e.setAttribute(k, v);
  e.append(...kids);
  return e;
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- safe storage (never throws) ---- */
const KEYS = {
  artisans: "ll_artisans",
  reviews: "ll_reviews",
  loc: "ll_location",
  geo: "ll_geocache",
  reports: "localease_reports",
};
const mem = {};
function read(key, fallback) {
  // Values written during this page view are cached so repeated reads stay
  // consistent even if storage becomes unavailable mid-session.
  if (key in mem) return mem[key];
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    mem[key] = value;
    return true;
  } catch {
    return false;
  }
}

/* ---- navigation (multi-page site; the live preview overrides via window.__bundle) ---- */
const pageHref = (p) => (window.__bundle ? "#" + p : p + ".html");
function navigate(page, qs = "") {
  if (window.__bundle) {
    window.__params = qs;
    const same = location.hash === "#" + page;
    location.hash = page;
    if (same) window.dispatchEvent(new Event("hashchange"));
  } else location.href = page + ".html" + (qs ? "?" + qs : "");
}
const getParams = () =>
  new URLSearchParams(
    window.__bundle ? window.__params || "" : location.search,
  );

/* ---- data ---- */
const TRADES = {
  Plumber: "🔧",
  Electrician: "💡",
  Carpenter: "🪚",
  Painter: "🎨",
  Bricklayer: "🧱",
  Tiler: "🏠",
  Mechanic: "🚗",
  "Building materials": "🏪",
  Essentials: "🧺",
  Other: "🛠️",
};
const CATS = [
  ["Plumbing", "plumbing", "Plumber"],
  ["Electrical", "electrical", "Electrician"],
  ["Carpentry", "carpentry", "Carpenter"],
  ["Painting", "painting", "Painter"],
  ["Bricklaying", "bricklaying", "Bricklayer"],
  ["Building materials", "materials", "Building materials"],
  ["Mechanics", "mechanics", "Mechanic"],
  ["Essential services", "essentials", "Essentials"],
];
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/* Fictional profiles; coordinates are approximate and only used to demo "nearest" sorting */
const DEMO = [
  [
    "d1",
    "Daniel Adewale",
    "Plumber",
    "Common plumbing and pipe repairs.",
    6.8005,
    3.431,
  ],
  [
    "d2",
    "Samuel Okoro",
    "Electrician",
    "Household wiring and fault finding.",
    6.7968,
    3.4262,
  ],
  [
    "d3",
    "Michael Adebayo",
    "Carpenter",
    "Furniture and woodwork.",
    6.8041,
    3.4355,
  ],
  [
    "d4",
    "Grace Bello",
    "Painter",
    "Painting and wall finishing.",
    6.7931,
    3.433,
  ],
  ["d5", "Joseph Musa", "Bricklayer", "Blockwork and masonry.", 6.8089, 3.4271],
  [
    "d6",
    "Tunde Balogun",
    "Mechanic",
    "Car servicing and minor repairs.",
    6.799,
    3.4402,
  ],
  [
    "d7",
    "Ibafo Build Mart",
    "Building materials",
    "Cement, blocks and roofing sheets.",
    6.802,
    3.4245,
  ],
  [
    "d8",
    "Mama Ngozi Provisions",
    "Essentials",
    "Groceries, gas refills and daily needs.",
    6.7955,
    3.429,
  ],
].map(([id, name, trade, description, lat, lng]) => ({
  id,
  name,
  trade,
  description,
  lat,
  lng,
  address: "Ibafo community",
  demo: true,
  at: "2026-01-01",
}));

const DEMO_REVIEWS = [
  ["d1", 5, "Adaeze O.", "Very helpful and professional service."],
  ["d2", 4, "Emeka N.", "Fixed our socket quickly and tidily."],
  ["d4", 4, "Bola A.", "The work was neat and well presented."],
  ["d3", 5, "Ngozi I.", "A sample review showing how feedback appears."],
  ["d6", 4, "Femi T.", "Honest about what the car needed."],
].map(([artisanId, rating, reviewer, comment], i) => ({
  id: "r" + i,
  artisanId,
  name: DEMO.find((a) => a.id === artisanId).name,
  reviewer,
  rating,
  comment,
  at: `2026-11-0${i + 1}T10:00:00`,
  demo: true,
}));

const storedList = (key) => {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
};
const allArtisans = () => [...DEMO, ...storedList(KEYS.artisans)];
const allReviews = () => [...DEMO_REVIEWS, ...storedList(KEYS.reviews)];

function ratingFor(id) {
  const r = allReviews().filter((x) => x.artisanId === id);
  return {
    n: r.length,
    avg: r.length ? r.reduce((s, x) => s + Number(x.rating), 0) / r.length : 0,
  };
}

function addReview(review) {
  const list = storedList(KEYS.reviews);
  list.push({ id: Date.now(), at: new Date().toISOString(), ...review });
  return write(KEYS.reviews, list);
}

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

function avatar(a) {
  const box = h("div", { class: "avatar", "aria-hidden": "true" });
  if (a.photo) box.append(h("img", { src: a.photo, alt: "" }));
  else box.textContent = TRADES[a.trade] || TRADES.Other;
  return box;
}

function distanceKm(a, b) {
  if (!a || !b) return null;
  const v = [a.lat, a.lng, b.lat, b.lng].map(Number);
  if (!v.every(Number.isFinite)) return null;
  const rad = (d) => (d * Math.PI) / 180,
    [la1, lo1, la2, lo2] = v;
  const x =
    Math.sin(rad(la2 - la1) / 2) ** 2 +
    Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

/* =================================
   LIGHT / NIGHT MODE
================================= */

const THEME_KEY = "ll_theme";

/* Read the saved theme. New visitors get light mode. */
function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

/* Apply the selected theme and save the choice. */
function applyTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", selectedTheme);

  try {
    localStorage.setItem(THEME_KEY, selectedTheme);
  } catch {
    // Theme switching still works if browser storage is unavailable.
  }

  updateThemeButton(selectedTheme);
}

/* Keep the button label in sync with the current theme. */
function updateThemeButton(theme) {
  const button = document.querySelector("#theme-toggle");

  if (!button) return;

  if (theme === "dark") {
    button.textContent = "☀";
    button.setAttribute("aria-label", "Switch to light mode");
    button.setAttribute("title", "Switch to light mode");
  } else {
    button.textContent = "☾";
    button.setAttribute("aria-label", "Switch to night mode");
    button.setAttribute("title", "Switch to night mode");
  }
}

/* Switch from the current theme to the other theme. */
function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";

  const nextTheme = currentTheme === "light" ? "dark" : "light";

  applyTheme(nextTheme);
}

/* Apply the saved theme before the page is displayed. */
applyTheme(getSavedTheme());

/* ---- shared header, footer and toast ---- */
function renderChrome(active) {
  const links = [
    ["index", "Home"],
    ["services", "Find services"],
    // ["safety", "Safety"],
    ["register", "Register"],
    ["about", "About"],
    ["privacy", "Privacy Policy"],
  ];

  /* Let keyboard users jump past the repeated navigation. */
  if (!document.querySelector(".skip-link")) {
    document.body.prepend(
      h("a", { class: "skip-link", href: "#page" }, "Skip to main content"),
    );
    const main = $("#page");
    if (main) main.tabIndex = -1;
  }

  /* Create the theme button. */
  const themeButton = h(
    "button",
    {
      type: "button",
      class: "theme-toggle",
      id: "theme-toggle",
      "aria-label": "Switch to night mode",
      title: "Switch to night mode",
    },
    "☾",
  );

  themeButton.addEventListener("click", toggleTheme);

  /* Build the shared header and navigation. */
  $("#site-header").replaceChildren(
    h(
      "header",
      { class: "site" },
      h(
        "div",
        { class: "bar" },
        h(
          "a",
          { class: "logo", href: pageHref("index") },
          h("span", { class: "logo-icon", "aria-hidden": "true" }, "⌂"),
          "LocalEase",
        ),
        h(
          "nav",
          { "aria-label": "Main" },
          ...links.map(([p, t]) =>
            h(
              "a",
              {
                href: pageHref(p),
                ...(p === active ? { "aria-current": "page" } : {}),
              },
              t,
            ),
          ),
        ),
        themeButton,
      ),
    ),
  );

  /* Show the correct label for the saved theme. */
  updateThemeButton(getSavedTheme());

  /* Build the shared footer. */
  $("#site-footer").replaceChildren(
    h(
      "footer",
      { class: "site" },
      h(
        "p",
        {},
        "© 2026 LocalEase · Built for the Ibafo community ·",
      ),
      h(
        "nav",
        { class: "footer-links", "aria-label": "Footer" },
        h("a", { href: pageHref("privacy") }, "Privacy Policy"),
        h("a", { href: pageHref("reviews") }, "Reviews"),
        h("a", { href: pageHref("admin") }, "Admin (demo)"),
      ),
    ),
  );
}

function toast(msg, isError) {
  let t = $("#toast");
  if (!t) {
    t = h("div", { id: "toast", role: "status" });
    document.body.append(t);
  }
  t.textContent = msg;
  t.className = isError ? "show err" : "show";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = ""), 3200);
}

if (!window.__bundle)
  document.addEventListener("DOMContentLoaded", () =>
    renderChrome(document.body.dataset.page),
  );

/* ---- maps (Leaflet + OpenStreetMap/Nominatim) ---- */
const osmLink = (l) =>
  `https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=16/${l.lat}/${l.lng}`;

async function nominatim(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("Lookup failed");
  return r.json();
}

async function geocode(address, landmark) {
  const cache = read(KEYS.geo, {});
  const terms = [
    [address, landmark, "Ibafo", "Ogun State", "Nigeria"]
      .filter(Boolean)
      .join(", "),
    `${address}, Ogun State, Nigeria`,
    "Ibafo, Ogun State, Nigeria",
  ];

  for (let i = 0; i < terms.length; i++) {
    if (cache[terms[i]]) return cache[terms[i]];

    const r = await nominatim(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
        encodeURIComponent(terms[i]),
    );

    if (r[0]) {
      const hit = {
        lat: +r[0].lat,
        lng: +r[0].lon,
        name: r[0].display_name,
      };
      cache[terms[i]] = hit;
      write(KEYS.geo, cache);
      return hit;
    }

    if (i < terms.length - 1) await sleep(1100);
  }

  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    return (
      (
        await nominatim(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`,
        )
      ).display_name || ""
    );
  } catch {
    return "";
  }
}

/* One draggable-pin map. onPick(loc, stage) fires on set / while moving / after address lookup. */
function makePicker(id, label, onPick) {
  const map = L.map(id).setView([6.8, 3.43], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const icon = L.divIcon({
    html: "📍",
    className: "pin",
    iconSize: [28, 28],
    iconAnchor: [14, 26],
  });

  let marker = null;

  function set(loc) {
    map.setView([loc.lat, loc.lng], 16);

    if (marker) map.removeLayer(marker);

    marker = L.marker([loc.lat, loc.lng], {
      draggable: true,
      icon,
    }).addTo(map);

    const tip = (name) =>
      marker.bindPopup(`<strong>${esc(label)}</strong><br>${esc(name || "")}`);

    tip(loc.name);

    marker.on("dragend", async () => {
      const p = marker.getLatLng();

      loc = { ...loc, lat: p.lat, lng: p.lng, name: "" };

      onPick(loc, "moving");

      loc.name = await reverseGeocode(p.lat, p.lng);

      tip(loc.name);
      onPick(loc, "done");
    });

    onPick(loc, "set");
  }

  setTimeout(() => map.invalidateSize(), 250);

  return { set };
}
