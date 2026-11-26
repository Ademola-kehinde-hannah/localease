/* Reviews page */
const filter = $("#artisan-filter");
const requestedArtisan = getParams().get("artisan");
const artisans = allArtisans();

filter.replaceChildren(
  h("option", { value: "" }, "All providers"),
  ...artisans.map((a) => h("option", { value: a.id }, a.name)),
);

/* Deep links from the services page open straight to one provider. */
if (requestedArtisan && artisans.some((a) => a.id === requestedArtisan)) {
  filter.value = requestedArtisan;
}

function render() {
  const reviews = allReviews()
    .filter((r) => !filter.value || r.artisanId === filter.value)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  $("#reviews-list").replaceChildren(
    ...(reviews.length
      ? reviews.map((r) => {
          const d = new Date(r.at);
          return h(
            "article",
            { class: "card" },
            h(
              "div",
              { class: "top" },
              h(
                "span",
                { class: "badge" },
                r.demo ? "Sample review" : "Community review",
              ),
              h(
                "span",
                {
                  class: "stars",
                  "aria-label": `${r.rating} out of 5`,
                },
                stars(Number(r.rating)),
              ),
            ),
            h("h3", {}, r.reviewer || "Community member"),
            h("p", { class: "muted" }, "Review for " + (r.name || "a local provider")),
            h("p", {}, r.comment),
            h(
              "small",
              { class: "muted" },
              isNaN(d) ? "Date unavailable" : d.toLocaleDateString(),
            ),
          );
        })
      : [
          h(
            "div",
            { class: "empty" },
            "No reviews yet. Open Find services and be the first!",
          ),
        ]),
  );
}

filter.addEventListener("change", render);
render();
