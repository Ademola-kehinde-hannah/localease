/* =================================
   LOCALEASE SAFETY FEATURES
================================= */

document.addEventListener("DOMContentLoaded", () => {
  // =================================
  // 1. GET REPORT FORM ELEMENTS
  // =================================

  const reportForm = document.getElementById("report-form");
  const reportMessage = document.getElementById("report-message");

  // =================================
  // 2. PRE-FILL ARTISAN DETAILS
  // =================================

  const reportParams = getParams();

  const artisanName = reportParams.get("artisan");
  const artisanPhone = reportParams.get("phone");

  if (artisanName && document.getElementById("report-artisan")) {
    document.getElementById("report-artisan").value = artisanName;
  }

  if (artisanPhone && document.getElementById("report-phone")) {
    document.getElementById("report-phone").value = artisanPhone;
  }

  // =================================
  // 3. SAVE DEMONSTRATION REPORTS
  // =================================

  if (reportForm) {
    reportForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("report-artisan").value.trim();

      const phone = document.getElementById("report-phone").value.trim();

      const reason = document.getElementById("report-reason").value;

      const details = document.getElementById("report-details").value.trim();

      if (!name || !reason || !details) {
        reportMessage.textContent = "Please complete all required fields.";
        return;
      }

      const newReport = {
        id: Date.now(),
        artisanName: name,
        artisanPhone: phone,
        reason: reason,
        details: details,
        dateSubmitted: new Date().toISOString(),
      };

      const saved = read(KEYS.reports, []);
      const reports = Array.isArray(saved) ? saved : [];

      reports.push(newReport);

      if (write(KEYS.reports, reports)) {
        reportMessage.textContent =
          "Demonstration report saved in this browser. It has not been sent to LocalEase staff.";

        reportForm.reset();
      } else {
        reportMessage.textContent =
          "Unable to save the report in this browser.";
      }
    });
  }

  // =================================
  // 4. PHONE CALL SAFETY WARNING
  // =================================

  document.addEventListener("click", (event) => {
    const phoneButton = event.target.closest("[data-safety-phone]");

    if (!phoneButton) {
      return;
    }

    const phoneLink = phoneButton.getAttribute("href");

    if (!phoneLink || !phoneLink.startsWith("tel:")) {
      return;
    }

    event.preventDefault();

    showCallSafetyWarning(phoneLink);
  });

  // =================================
  // 5. DISPLAY THE SAFETY DIALOG
  // =================================

  function showCallSafetyWarning(phoneLink) {
    if (document.querySelector(".safety-dialog-overlay")) {
      return;
    }

    const previouslyFocused = document.activeElement;

    const overlay = document.createElement("div");

    overlay.className = "safety-dialog-overlay";

    overlay.innerHTML = `
            <div
                class="safety-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="safety-dialog-title"
            >

                <h2 id="safety-dialog-title">
                    Before you call
                </h2>

                <p>
                    Your safety matters. Check the artisan's
                    profile and verification status before
                    hiring them.
                </p>

                <p>
                    Do not arrange your first meeting in an
                    isolated or unfamiliar private location.
                    If an artisan visits your home, consider
                    having someone you trust present.
                </p>

                <div class="safety-dialog-actions">

                    <button
                        type="button"
                        class="safety-cancel"
                        id="cancel-safety-call"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="safety-confirm"
                        id="confirm-safety-call"
                    >
                        Continue to call
                    </button>

                </div>

            </div>
        `;

    document.body.appendChild(overlay);

    document.body.classList.add("modal-open");

    const dialog = overlay.querySelector(".safety-dialog");

    const cancelButton = document.getElementById("cancel-safety-call");

    const confirmButton = document.getElementById("confirm-safety-call");

    function closeDialog() {
      overlay.remove();

      document.body.classList.remove("modal-open");

      document.removeEventListener("keydown", handleKeydown);

      // Send focus back to the button that opened the dialog.
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    }

    function handleKeydown(event) {
      if (event.key === "Escape") {
        closeDialog();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialog.querySelectorAll("button");

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    cancelButton.addEventListener("click", closeDialog);

    confirmButton.addEventListener("click", () => {
      // Continue to the phone call only after confirmation.
      closeDialog();
      window.location.href = phoneLink;
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeDialog();
      }
    });

    document.addEventListener("keydown", handleKeydown);

    cancelButton.focus();
  }
});
