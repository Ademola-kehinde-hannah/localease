/* LocalEase Admin Dashboard */

const STATUS_KEY = "ll_verification";

const adminList = $("#admin-list");
const adminCount = $("#admin-count");

/* Get saved verification statuses */
function getStatuses() {
  return read(STATUS_KEY, {});
}

/* Display the verification status */
function getStatus(artisan) {
  const statuses = getStatuses();

  return statuses[artisan.id] || artisan.verificationStatus || "pending";
}

/* Save a new verification decision */
function updateStatus(id, status) {
  const statuses = getStatuses();

  statuses[id] = status;

  if (!write(STATUS_KEY, statuses)) {
    toast("Could not save the decision.", true);
    return;
  }

  toast("Artisan status updated successfully!");
  renderAdmin();
}

/* Create an artisan card */
function createAdminCard(artisan) {
  const status = getStatus(artisan);

  const statusLabels = {
    pending: "Pending verification",
    verified: "Verified",
    rejected: "Not verified",
    not_verified: "Not verified",
  };

  const statusClass =
    status === "rejected" || status === "not_verified" ? "rejected" : status;

  const card = h(
    "article",
    { class: "admin-card" },

    ...(artisan.demo
      ? [h("span", { class: "badge" }, "Demo profile")]
      : []),

    h("h3", {}, artisan.name),

    h("p", {}, "Profession: " + artisan.trade),

    h("p", {}, "Phone: " + (artisan.phone || "Not provided")),

    h("p", {}, "Location: " + (artisan.address || "Not provided")),

    h(
      "span",
      { class: "admin-status " + statusClass },
      statusLabels[status] || "Pending verification",
    ),

    h(
      "div",
      { class: "admin-actions" },

      h(
        "button",
        {
          type: "button",
          class: "btn",
        },
        "Verify",
      ),

      h(
        "button",
        {
          type: "button",
          class: "btn reject-btn",
        },
        "Reject",
      ),
    ),
  );

  const buttons = card.querySelectorAll("button");

  buttons[0].addEventListener("click", () => {
    updateStatus(artisan.id, "verified");
  });

  buttons[1].addEventListener("click", () => {
    updateStatus(artisan.id, "rejected");
  });

  return card;
}

/* Display all artisans */
function renderAdmin() {
  const artisans = allArtisans();

  adminCount.textContent = artisans.length + " artisan profiles";

  if (!artisans.length) {
    adminList.replaceChildren(
      h("p", { class: "admin-empty" }, "No artisans have registered yet."),
    );

    return;
  }

  adminList.replaceChildren(...artisans.map(createAdminCard));
}

/* Start the dashboard */
renderAdmin();
