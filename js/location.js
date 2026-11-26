/* Client location picker */
const box = $("#location-message"),
  directions = $("#directions-link");
function say(title, text, isError) {
  box.hidden = false;
  box.classList.toggle("error", !!isError);
  $("#message-title").textContent = title;
  $("#message-text").textContent = text;
}
function applyLocation(loc, stage) {
  write(KEYS.loc, loc);
  directions.href = osmLink(loc);
  directions.setAttribute("aria-disabled", "false");
  if (stage === "moving")
    say("Finding address…", "Please wait while we identify your new location.");
  else say("Location saved", loc.name || "Your pin position was saved.");
}
const picker = makePicker("map", "Your location", applyLocation);

$("#location-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const address = $("#address").value.trim(),
    btn = e.currentTarget.querySelector("button[type=submit]");
  if (!address)
    return say("Address required", "Please enter your location.", true);
  btn.disabled = true;
  btn.textContent = "Searching…";
  try {
    const hit = await geocode(address, $("#landmark").value.trim());
    hit
      ? picker.set({ ...hit, address, landmark: $("#landmark").value.trim() })
      : say(
          "Location not found",
          "Try a recognised street, area or nearby landmark.",
          true,
        );
  } catch {
    say(
      "Something went wrong",
      "Please check your internet connection and try again.",
      true,
    );
  } finally {
    btn.disabled = false;
    btn.textContent = "Show on map";
  }
});

$("#use-gps").addEventListener("click", () => {
  if (!navigator.geolocation)
    return say(
      "Not supported",
      "Your browser can't share your position.",
      true,
    );
  say("Locating…", "Please allow location access when asked.");
  navigator.geolocation.getCurrentPosition(
    async (p) => {
      const name = await reverseGeocode(p.coords.latitude, p.coords.longitude);
      picker.set({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        name,
        address: String(name).split(",")[0],
      });
    },
    () => say("Couldn't get your position", "Type your address instead.", true),
    { enableHighAccuracy: true, timeout: 10000 },
  );
});

const saved = read(KEYS.loc, null);
if (saved && Number.isFinite(Number(saved.lat))) picker.set(saved);
