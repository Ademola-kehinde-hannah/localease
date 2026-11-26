/* Artisan registration with optional photo and map location */
const form = $("#artisan-form");
const mapMsg = $("#map-message");
const formMsg = $("#form-message");
let picked = null;

$("#artisan-trade").replaceChildren(
  h("option", { value: "" }, "Select your profession"),
  ...Object.keys(TRADES).map((t) => h("option", { value: t }, t)),
);

const picker = makePicker(
  "registration-map",
  "Service location",
  (loc, stage) => {
    picked = loc;
    mapMsg.textContent =
      stage === "moving"
        ? "Updating your selected location…"
        : loc.name
          ? "Location selected: " + loc.name
          : "Pin placed. Drag it to adjust.";
  },
);

$("#find-location").addEventListener("click", async (e) => {
  const btn = e.currentTarget,
    address = $("#artisan-address").value.trim();
  if (!address) {
    mapMsg.textContent = "Please enter your service area first.";
    return $("#artisan-address").focus();
  }
  btn.disabled = true;
  btn.textContent = "Searching…";
  mapMsg.textContent = "Searching for your location…";
  try {
    const hit = await geocode(address, $("#artisan-landmark").value.trim());
    hit
      ? picker.set(hit)
      : (mapMsg.textContent =
          "Location not found. Try a recognised street, area or landmark.");
  } catch {
    mapMsg.textContent =
      "Something went wrong. Check your connection and try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Find my location on map";
  }
});

/* shrink the chosen photo to a small square so it fits in localStorage */
function readPhoto(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) return resolve("");
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        const size = 128,
          c = document.createElement("canvas"),
          m = Math.min(img.width, img.height);
        c.width = c.height = size;
        c.getContext("2d").drawImage(
          img,
          (img.width - m) / 2,
          (img.height - m) / 2,
          m,
          m,
          0,
          0,
          size,
          size,
        );
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');

  submitButton.disabled = true;
  submitButton.textContent = "Saving…";
  formMsg.textContent = "";

  try {
    
    
const profile = {
  id: "u" + Date.now(),
  verificationStatus: "pending",

  // Personal information
  name: $("#artisan-name").value.trim(),
  phone: $("#artisan-phone").value.trim(),
  trade: $("#artisan-trade").value,
  description: $("#artisan-description").value.trim(),

  // Professional experience and qualifications
  experience: $("#artisan-experience").value.trim(),
  portfolio: $("#artisan-portfolio").value.trim(),
  qualification: $("#artisan-qualification").value.trim(),

  // Service location
  address: $("#artisan-address").value.trim(),
  landmark: $("#artisan-landmark").value.trim(),

  // Profile picture
  photo: await readPhoto($("#artisan-photo").files[0]),

  // Registration date
  at: new Date().toISOString(),

  // Map coordinates
  ...(picked ? { lat: picked.lat, lng: picked.lng } : {}),
};


    const saved = read(KEYS.artisans, []);
    const list = Array.isArray(saved) ? saved : [];

    list.push(profile);

    if (!write(KEYS.artisans, list)) {
      formMsg.textContent =
        "Registration could not be saved. Try a smaller photo.";
      toast("Registration could not be saved.", true);
      return;
    }

    toast("Registration successful!");
    navigate("services", "search=" + encodeURIComponent(profile.name));
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit registration";
  }
});
