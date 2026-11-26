/* Home page */
const locInput = $("#location-input");
const savedLoc = read(KEYS.loc, null);
if (savedLoc && (savedLoc.address || savedLoc.name)) locInput.value = savedLoc.address || String(savedLoc.name).split(",")[0];

$("#search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const term = $("#search-input").value.trim();
  if (term) params.set("search", term); // an empty search simply browses everything
  if (locInput.value.trim()) params.set("location", locInput.value.trim());
  navigate("services", params.toString());
});

$("#cats").replaceChildren(...CATS.map(([label, key, trade]) => {
  const b = h("button", { class: "cat", type: "button" }, h("b", { "aria-hidden": "true" }, TRADES[trade]), label);
  b.addEventListener("click", () => navigate("services", "category=" + key));
  return b;
}));

$("#featured").replaceChildren(...DEMO.slice(0, 3).map((a) =>
  h("article", { class: "card" },
    h("div", { class: "top" }, avatar(a), h("span", { class: "badge" }, "Demo profile")),
    h("h3", {}, a.name), h("span", { class: "trade" }, a.trade),
    h("p", { class: "muted" }, a.description), h("p", { class: "muted" }, "📍 " + a.address))));
