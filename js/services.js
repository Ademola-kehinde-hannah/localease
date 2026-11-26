/* Find services: search, filter, sort, ratings, reviews and safety */

const params = getParams();

const CATEGORY_TO_TRADE = Object.fromEntries(
  CATS.map(([, key, trade]) => [key, trade]),
);

const savedLocation = read(KEYS.loc, null);
const me =
  savedLocation &&
  Number.isFinite(Number(savedLocation.lat)) &&
  Number.isFinite(Number(savedLocation.lng))
    ? savedLocation
    : null;

/* =================================
   VERIFICATION BADGE
================================= */

const VERIFICATION_KEY = "ll_verification";

function verificationBadge(a) {
  const statuses = read(VERIFICATION_KEY, {});

  const status = statuses[a.id] || a.verificationStatus || "pending";

  // Demo profiles can show simulated admin decisions.
  if (a.demo) {
    if (status === "verified") {
      return h(
        "span",
        { class: "verification-badge verified" },
        "Demo profile · Verified (simulation)",
      );
    }

    if (status === "rejected" || status === "not_verified") {
      return h(
        "span",
        { class: "verification-badge not-verified" },
        "Demo profile · Not verified",
      );
    }

    return h(
      "span",
      { class: "verification-badge pending" },
      "Demo profile · Pending verification",
    );
  }

  if (status === "verified") {
    return h("span", { class: "verification-badge verified" }, "✓ Verified");
  }

  if (status === "rejected" || status === "not_verified") {
    return h(
      "span",
      { class: "verification-badge not-verified" },
      "Not verified",
    );
  }

  return h(
    "span",
    { class: "verification-badge pending" },
    "Pending verification",
  );
}



/* =================================
   SEARCH AND SORT SETTINGS
================================= */

const state = {
  trade: CATEGORY_TO_TRADE[params.get("category")] || "All",
  q: params.get("search") || "",
  sort: me ? "near" : "rating",
};

$("#q").value = state.q;

const sortOptions = [
  ["rating", "Top rated"],
  ["name", "Name A–Z"],
  ["new", "Newest"],
];

if (me) sortOptions.unshift(["near", "Nearest to me"]);

$("#sort").replaceChildren(
  ...sortOptions.map(([v, t]) => h("option", { value: v }, t)),
);

$("#sort").value = state.sort;

if (params.get("location")) {
  const note = $("#loc-note");

  note.hidden = false;

  note.textContent =
    "📍 Showing providers around Ibafo. Your location: " +
    params.get("location");
}

/* =================================
   REVIEW FORM
================================= */

function reviewForm(a, rerender) {
  const formId = "review-form-" + a.id;

  const reviewer = h("input", {
    type: "text",
    maxlength: "40",
    autocomplete: "name",
    placeholder: "Your name (optional)",
  });

  const rating = h(
    "select",
    { required: "" },
    h("option", { value: "" }, "Choose rating"),
    ...[5, 4, 3, 2, 1].map((n) =>
      h("option", { value: n }, `${n} – ${RATING_LABELS[n]}`),
    ),
  );

  const comment = h("textarea", {
    required: "",
    maxlength: "500",
    rows: "3",
  });

  const form = h(
    "form",
    { class: "rform", hidden: "", id: formId },
    h("label", {}, "Your name (optional)", reviewer),
    h("label", {}, "Your rating", rating),
    h("label", {}, "Share your experience", comment),
    h("button", { class: "btn sm" }, "Submit review"),
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = comment.value.trim();

    if (!rating.value) {
      return toast("Please choose a rating.", true);
    }

    if (!text) {
      return toast("Please write a review before submitting.", true);
    }

    const ok = addReview({
      artisanId: a.id,
      name: a.name,
      reviewer: reviewer.value.trim() || "Community member",
      rating: Number(rating.value),
      comment: text,
    });

    toast(
      ok
        ? "Thank you! Your review was saved."
        : "Your review could not be saved.",
      !ok,
    );

    if (ok) rerender();
  });

  return form;
}

/* =================================
   ARTISAN CARD
================================= */

function card(a) {
  const { n, avg } = ratingFor(a.id);

  const km = distanceKm(me, a);

  const form = reviewForm(a, render);

  const toggle = h(
    "button",
    {
      class: "btn alt sm",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": "review-form-" + a.id,
    },
    "Write a review",
  );

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;

    toggle.setAttribute("aria-expanded", String(!form.hidden));
  });

  const acts = h("div", { class: "acts" });

  /* PHONE CALL */
  if (a.phone) {
    acts.append(
      h(
        "a",
        {
          class: "btn sm",
          href: "tel:" + String(a.phone).replace(/[^\d+]/g, ""),
          "data-safety-phone": "",
        },
        "Call",
      ),
    );
  }

  /* VIEW ARTISAN LOCATION */
  if (Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lng))) {
    acts.append(
      h(
        "a",
        {
          class: "btn alt sm",
          href: osmLink(a),
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "View location",
      ),
    );
  }

  /* REVIEW BUTTON */
  acts.append(toggle);

  const reviewsLink = h(
    "a",
    {
      href:
        pageHref("reviews") +
        (window.__bundle ? "" : "?artisan=" + encodeURIComponent(a.id)),
    },
    "View all reviews",
  );

  reviewsLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigate("reviews", "artisan=" + encodeURIComponent(a.id));
  });

  return h(
    "article",
    { class: "card" },

    h("div", { class: "top" }, avatar(a), verificationBadge(a)),

    h("h3", {}, a.name),

    h("span", { class: "trade" }, a.trade),

    h("p", { class: "muted" }, a.description),

    h(
      "p",
      { class: "muted" },
      "📍 " +
        (a.address || "Location not provided") +
        (a.landmark ? " — " + a.landmark : "") +
        (km !== null ? ` · ${km.toFixed(1)} km away` : ""),
    ),

    /* RATINGS */
    n
      ? h(
          "p",
          {},
          h(
            "span",
            {
              class: "stars",
              "aria-label": `${avg.toFixed(1)} out of 5`,
            },
            stars(Math.round(avg)),
          ),
          ` ${avg.toFixed(1)} (${n} review${n === 1 ? "" : "s"})`,
        )
      : h("p", { class: "muted" }, "No reviews yet"),

    reviewsLink,

    /* SAFETY REMINDER */
    h(
      "p",
      { class: "safety-reminder" },
      "Safety reminder: Confirm the artisan's details, agree on the price and work before starting, and take reasonable precautions when arranging a visit.",
    ),

    acts,

    form,
  );
}

/* =================================
   DISPLAY AND FILTER ARTISANS
================================= */

function render() {
  const q = state.q.toLowerCase().trim();

  const list = allArtisans().filter(
    (a) =>
      (state.trade === "All" || a.trade === state.trade) &&
      [a.name, a.trade, a.address, a.description]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );

  const sorters = {
    rating: (a, b) => ratingFor(b.id).avg - ratingFor(a.id).avg,

    name: (a, b) => a.name.localeCompare(b.name),

    new: (a, b) => String(b.at).localeCompare(String(a.at)),

    near: (a, b) => (distanceKm(me, a) ?? 1e9) - (distanceKm(me, b) ?? 1e9),
  };

  list.sort(sorters[state.sort]);

  $("#count").textContent =
    `${list.length} provider${list.length === 1 ? "" : "s"}`;

  $("#list").replaceChildren(
    ...(list.length
      ? list.map(card)
      : [
          h(
            "div",
            { class: "empty" },
            h("h3", {}, "No providers found"),
            h("p", { class: "muted" }, "Try another search or trade, or "),
            h("a", { href: pageHref("register") }, "register as a provider"),
          ),
        ]),
  );

  syncChips();
}

/* CATEGORY FILTER BUTTONS: built once so clicking one keeps keyboard focus. */
const chipButtons = ["All", ...Object.keys(TRADES)].map((trade) => {
  const button = h(
    "button",
    { class: "chip", type: "button", "aria-pressed": "false" },
    trade,
  );

  button.dataset.trade = trade;
  button.addEventListener("click", () => {
    state.trade = trade;
    render();
  });

  return button;
});

$("#chips").replaceChildren(...chipButtons);

function syncChips() {
  for (const button of chipButtons) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.trade === state.trade),
    );
  }
}

/* =================================
   SEARCH AND SORT EVENTS
================================= */

$("#q").addEventListener("input", (e) => {
  state.q = e.target.value;
  render();
});

$("#sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

/* =================================
   START THE PAGE
================================= */

render();
